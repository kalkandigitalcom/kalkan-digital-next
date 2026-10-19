"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { timingSafeEqual, createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/server/db";
import { adminUsers } from "@/server/db/schema";
import { env } from "@/server/env";
import { getDummyHash, hashPassword, passwordPolicy, verifyPassword } from "@/server/auth/password";
import { createSession, destroyCurrentSession, getCurrentAdmin } from "@/server/auth/session";
import { clearRateLimit, isRateLimited, recordRateLimitEvent } from "@/server/rate-limit";
import { getClientIp, getUserAgent } from "@/server/request";
import { logActivity } from "@/server/activity";
import { errorState, parseForm } from "@/server/validation";
import type { ActionState } from "@/lib/action-state";

const WINDOW = 15 * 60_000;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(255).email("Geçerli bir e-posta adresi girin."),
  password: z.string().min(1, "Parola zorunludur.").max(256),
  next: z.string().optional(),
});

function safeNext(next: string | undefined) {
  if (next && next.startsWith("/admin/") && !next.startsWith("//") && !next.startsWith("/admin/login")) return next;
  return "/admin/dashboard";
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(loginSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { email, password, next } = parsed.data;
  const ip = await getClientIp();

  const limited =
    (await isRateLimited({ bucket: "login_email", key: email, max: MAX_PER_EMAIL, windowMs: WINDOW })) ||
    (await isRateLimited({ bucket: "login_ip", key: ip, max: MAX_PER_IP, windowMs: WINDOW }));
  if (limited) {
    await logActivity({ userId: null, action: "auth.login_rate_limited", summary: `Çok fazla deneme: ${email}` });
    return errorState("Çok fazla başarısız deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.");
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(sql`lower(${adminUsers.email})`, email))
    .limit(1);

  const ok = user ? await verifyPassword(password, user.passwordHash) : (await verifyPassword(password, await getDummyHash()), false);

  if (!user || !ok || !user.isActive) {
    await recordRateLimitEvent("login_email", email);
    await recordRateLimitEvent("login_ip", ip);
    await logActivity({ userId: user?.id ?? null, action: "auth.login_failed", summary: `Başarısız giriş: ${email}` });
    return errorState("E-posta veya parola hatalı.");
  }

  await clearRateLimit("login_email", email);
  await createSession(user.id, { ip, userAgent: await getUserAgent() });
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await logActivity({ userId: user.id, action: "auth.login", entityType: "admin_user", entityId: user.id, summary: "Giriş yapıldı" });
  redirect(safeNext(next));
}

export async function logoutAction(): Promise<void> {
  const admin = await getCurrentAdmin();
  await destroyCurrentSession();
  if (admin) await logActivity({ userId: admin.id, action: "auth.logout", entityType: "admin_user", entityId: admin.id, summary: "Çıkış yapıldı" });
  redirect("/admin/login");
}

const setupSchema = z
  .object({
    token: z.string().min(1, "Kurulum anahtarı zorunludur."),
    name: z.string().trim().min(2, "Ad soyad girin.").max(120),
    email: z.string().trim().toLowerCase().max(255).email("Geçerli bir e-posta adresi girin."),
    password: z.string().max(128),
    passwordConfirm: z.string(),
  })
  .superRefine((d, ctx) => {
    const err = passwordPolicy.check(d.password);
    if (err) ctx.addIssue({ code: "custom", path: ["password"], message: err });
    if (d.password !== d.passwordConfirm) ctx.addIssue({ code: "custom", path: ["passwordConfirm"], message: "Parolalar eşleşmiyor." });
  });

function tokenMatches(given: string, expected: string) {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function setupAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const expected = env().ADMIN_SETUP_TOKEN;
  if (!expected) return errorState("Kurulum sayfası devre dışı.");
  const parsed = parseForm(setupSchema, formData);
  if (!parsed.ok) return parsed.state;
  const ip = await getClientIp();
  if (await isRateLimited({ bucket: "setup_ip", key: ip, max: 10, windowMs: WINDOW })) {
    return errorState("Çok fazla deneme. Lütfen daha sonra tekrar deneyin.");
  }
  if (!tokenMatches(parsed.data.token, expected)) {
    await recordRateLimitEvent("setup_ip", ip);
    return errorState("Kurulum anahtarı hatalı.", { token: "Kurulum anahtarı hatalı." });
  }
  const hash = await hashPassword(parsed.data.password);
  const created = await db.transaction(async (tx) => {
    // Serialise concurrent setup attempts.
    await tx.execute(sql`select pg_advisory_xact_lock(724001)`);
    const [{ n }] = (await tx.select({ n: sql<number>`count(*)::int` }).from(adminUsers)) as [{ n: number }];
    if (n > 0) return null;
    const [u] = await tx
      .insert(adminUsers)
      .values({ email: parsed.data.email, name: parsed.data.name, passwordHash: hash, role: "owner" })
      .returning({ id: adminUsers.id });
    await logActivity({ userId: u!.id, action: "admin.created_setup", entityType: "admin_user", entityId: u!.id, summary: "İlk yönetici kurulum sayfasından oluşturuldu" }, tx);
    return u!;
  });
  if (!created) return errorState("Kurulum zaten tamamlanmış. Giriş sayfasını kullanın.");
  await createSession(created.id, { ip, userAgent: await getUserAgent() });
  redirect("/admin/dashboard");
}
