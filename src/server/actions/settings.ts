"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { adminUsers, currency, sessions } from "@/server/db/schema";
import { requireAdmin, destroyOtherSessions } from "@/server/auth/session";
import { hashPassword, passwordPolicy, verifyPassword } from "@/server/auth/password";
import { logActivity } from "@/server/activity";
import { setSetting } from "@/server/settings";
import { errorState, parseForm, successState, v, dbErrorMessage } from "@/server/validation";
import type { ActionState } from "@/lib/action-state";

const companySchema = z.object({
  companyName: v.requiredText(200),
  email: v.optionalEmail(),
  phone: v.optionalPhone(),
  whatsapp: v.optionalPhone(),
  address: v.optionalText(500),
  taxInfo: v.optionalText(300),
  renewalWarningDays: z.coerce.number().int().min(1, "En az 1 gün.").max(180, "En fazla 180 gün."),
});

export async function updateCompanyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(companySchema, formData);
  if (!parsed.ok) return parsed.state;
  const value = Object.fromEntries(Object.entries(parsed.data).map(([k, val]) => [k, val ?? ""]));
  await setSetting("company", value);
  await logActivity({ userId: admin.id, action: "settings.company", entityType: "settings", summary: "Firma bilgileri güncellendi" });
  revalidatePath("/", "layout");
  return successState("Firma bilgileri kaydedildi.");
}

/** The base currency can only be changed while no financial transaction exists. */
export async function setBaseCurrencyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") return errorState("Bu işlem yalnızca hesap sahibi tarafından yapılabilir.");
  const parsed = parseForm(z.object({ baseCurrency: v.enumOf(currency.enumValues) }), formData);
  if (!parsed.ok) return parsed.state;
  const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from financial_transactions`)) as unknown as [{ n: number }];
  if (n > 0) return errorState("Finansal işlem kaydı olduğu için baz para birimi değiştirilemez.");
  await setSetting("base_currency", parsed.data.baseCurrency);
  await logActivity({ userId: admin.id, action: "settings.base_currency", entityType: "settings", summary: `Baz para birimi: ${parsed.data.baseCurrency}` });
  revalidatePath("/admin", "layout");
  return successState("Baz para birimi güncellendi.");
}

const passwordSchema = z
  .object({ current: z.string().min(1, "Mevcut parolayı girin.").max(256), next: z.string().max(128), confirm: z.string() })
  .superRefine((d, ctx) => {
    const err = passwordPolicy.check(d.next);
    if (err) ctx.addIssue({ code: "custom", path: ["next"], message: err });
    if (d.next !== d.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Parolalar eşleşmiyor." });
    if (d.current === d.next) ctx.addIssue({ code: "custom", path: ["next"], message: "Yeni parola mevcut paroladan farklı olmalı." });
  });

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(passwordSchema, formData);
  if (!parsed.ok) return parsed.state;
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    await logActivity({ userId: admin.id, action: "auth.password_change_failed", entityType: "admin_user", entityId: admin.id });
    return errorState("Mevcut parola hatalı.", { current: "Mevcut parola hatalı." });
  }
  await db.update(adminUsers).set({ passwordHash: await hashPassword(parsed.data.next), passwordChangedAt: new Date() }).where(eq(adminUsers.id, admin.id));
  await destroyOtherSessions(admin.id, admin.sessionId);
  await logActivity({ userId: admin.id, action: "auth.password_changed", entityType: "admin_user", entityId: admin.id, summary: "Parola değiştirildi; diğer oturumlar kapatıldı" });
  return successState("Parolanız değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.");
}

export async function logoutOtherSessionsAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  await destroyOtherSessions(admin.id, admin.sessionId);
  await logActivity({ userId: admin.id, action: "auth.logout_others", entityType: "admin_user", entityId: admin.id });
  revalidatePath("/admin/settings");
  return successState("Diğer tüm oturumlar kapatıldı.");
}

const newAdminSchema = z
  .object({
    name: v.requiredText(120, "Ad soyad girin."),
    email: z.string().trim().toLowerCase().max(255).email("Geçerli bir e-posta girin."),
    password: z.string().max(128),
  })
  .superRefine((d, ctx) => {
    const err = passwordPolicy.check(d.password);
    if (err) ctx.addIssue({ code: "custom", path: ["password"], message: err });
  });

export async function createAdminUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const owner = await requireAdmin();
  if (owner.role !== "owner") return errorState("Bu işlem yalnızca hesap sahibi tarafından yapılabilir.");
  const parsed = parseForm(newAdminSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const [row] = await db
      .insert(adminUsers)
      .values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password), role: "admin" })
      .returning({ id: adminUsers.id });
    await logActivity({ userId: owner.id, action: "admin.create", entityType: "admin_user", entityId: row!.id, summary: parsed.data.email });
  } catch (e) {
    const code = (e as { code?: string; cause?: { code?: string } }).code ?? (e as { cause?: { code?: string } }).cause?.code;
    return errorState(code === "23505" ? "Bu e-posta ile bir yönetici zaten var." : dbErrorMessage(e), code === "23505" ? { email: "Kullanımda." } : undefined);
  }
  revalidatePath("/admin/settings");
  return successState("Yönetici hesabı oluşturuldu.");
}

export async function setAdminActiveAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const owner = await requireAdmin();
  if (owner.role !== "owner") return errorState("Bu işlem yalnızca hesap sahibi tarafından yapılabilir.");
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  if (id.data === owner.id) return errorState("Kendi hesabınızı devre dışı bırakamazsınız.");
  const active = formData.get("active") === "1";
  const res = await db.update(adminUsers).set({ isActive: active }).where(and(eq(adminUsers.id, id.data), ne(adminUsers.role, "owner"))).returning({ email: adminUsers.email });
  if (!res.length) return errorState("Yönetici bulunamadı veya sahip hesabı değiştirilemez.");
  if (!active) await db.delete(sessions).where(eq(sessions.userId, id.data));
  await logActivity({ userId: owner.id, action: active ? "admin.activate" : "admin.deactivate", entityType: "admin_user", entityId: id.data, summary: res[0]!.email });
  revalidatePath("/admin/settings");
  return successState(active ? "Hesap etkinleştirildi." : "Hesap devre dışı bırakıldı ve oturumları kapatıldı.");
}
