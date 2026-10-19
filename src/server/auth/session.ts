import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { adminUsers, sessions } from "@/server/db/schema";
import { env } from "@/server/env";
import { generateSessionToken, hashSessionToken } from "./tokens";
import { SESSION_COOKIE_DEV, SESSION_COOKIE_SECURE } from "./cookies";

export interface AdminPrincipal {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin";
  sessionId: string;
}

function isSecureCookie() {
  const mode = env().COOKIE_SECURE;
  if (mode === "auto") return env().NODE_ENV === "production";
  return mode === "true";
}
function cookieName() {
  return isSecureCookie() ? SESSION_COOKIE_SECURE : SESSION_COOKIE_DEV;
}

export async function createSession(userId: string, meta: { ip: string; userAgent: string }) {
  const token = generateSessionToken();
  const id = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + env().SESSION_TTL_HOURS * 3600_000);
  await db.insert(sessions).values({ id, userId, expiresAt, ipAddress: meta.ip, userAgent: meta.userAgent });
  const jar = await cookies();
  jar.set(cookieName(), token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  // Opportunistic cleanup of expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/** Validates a raw token against the DB. Exported for tests. */
export async function validateSessionToken(token: string): Promise<AdminPrincipal | null> {
  if (!token || token.length > 100) return null;
  const id = hashSessionToken(token);
  const rows = await db
    .select({
      sessionId: sessions.id,
      lastSeenAt: sessions.lastSeenAt,
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(sessions)
    .innerJoin(adminUsers, eq(adminUsers.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.isActive) return null;
  if (Date.now() - row.lastSeenAt.getTime() > 5 * 60_000) {
    await db.update(sessions).set({ lastSeenAt: sql`now()` }).where(eq(sessions.id, id));
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, sessionId: row.sessionId };
}

/** Returns the signed-in admin for this request (memoised per request), or null. */
export const getCurrentAdmin = cache(async (): Promise<AdminPrincipal | null> => {
  const jar = await cookies();
  const token = jar.get(cookieName())?.value;
  if (!token) return null;
  return validateSessionToken(token);
});

/**
 * Server-side authorisation gate. MUST be called at the top of every admin page,
 * server action and route handler that touches private data.
 */
export async function requireAdmin(): Promise<AdminPrincipal> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireOwner(): Promise<AdminPrincipal> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Bu işlem için yetkiniz yok.");
  return admin;
}

export async function destroyCurrentSession() {
  const jar = await cookies();
  const token = jar.get(cookieName())?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashSessionToken(token)));
  jar.delete(cookieName());
}

export async function destroyOtherSessions(userId: string, keepSessionId: string) {
  await db.delete(sessions).where(and(eq(sessions.userId, userId), sql`${sessions.id} <> ${keepSessionId}`));
}
