import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { activityLogs, adminUsers, sessions } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency, getCompanySettings } from "@/server/settings";
import { PAGE_SIZE, pageOf } from "@/server/list";

export async function getSettingsPage() {
  const admin = await requireAdmin();
  const [company, base, txCount, admins, mySessions] = await Promise.all([
    getCompanySettings(),
    getBaseCurrency(),
    db.execute<{ n: number }>(sql`select count(*)::int as n from financial_transactions`),
    db.select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email, role: adminUsers.role, isActive: adminUsers.isActive, lastLoginAt: adminUsers.lastLoginAt }).from(adminUsers).orderBy(asc(adminUsers.createdAt)),
    db.select({ id: sessions.id, createdAt: sessions.createdAt, lastSeenAt: sessions.lastSeenAt, ipAddress: sessions.ipAddress, userAgent: sessions.userAgent }).from(sessions).where(eq(sessions.userId, admin.id)).orderBy(desc(sessions.lastSeenAt)),
  ]);
  return { admin, company, base, baseLocked: (txCount[0]?.n ?? 0) > 0, admins, sessions: mySessions };
}

export async function listActivity(p: Record<string, string | undefined>) {
  await requireAdmin();
  const page = pageOf(p);
  const [rows, [count]] = await Promise.all([
    db
      .select({ id: activityLogs.id, action: activityLogs.action, entityType: activityLogs.entityType, entityId: activityLogs.entityId, summary: activityLogs.summary, ipAddress: activityLogs.ipAddress, createdAt: activityLogs.createdAt, userName: adminUsers.name })
      .from(activityLogs)
      .leftJoin(adminUsers, eq(adminUsers.id, activityLogs.userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(PAGE_SIZE * 2)
      .offset((page - 1) * PAGE_SIZE * 2),
    db.select({ n: sql<number>`count(*)::int` }).from(activityLogs),
  ]);
  return { rows, total: count?.n ?? 0, page, pageSize: PAGE_SIZE * 2 };
}
