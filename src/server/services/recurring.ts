import "server-only";
import { and, asc, desc, eq, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import {
  customers,
  financialCategories,
  financialTransactions as ft,
  projects,
  recurringOccurrences as ro,
  recurringPeriod,
  recurringServices as rs,
  recurringStatus,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { isOverdueSql } from "@/server/finance/core";
import { getCompanySettings } from "@/server/settings";
import { PAGE_SIZE, cleanQuery, likePattern, pageOf, pick, pickOptional } from "@/server/list";
import { addDays, todayIso } from "@/lib/dates";

const lastPaid = sql<string | null>`(select max(t.settled_date)::text from ${ro} o join ${ft} t on t.id = o.transaction_id where o.recurring_service_id = ${rs.id} and t.status = 'completed')`;
const openCount = sql<number>`(select count(*)::int from ${ro} o join ${ft} t on t.id = o.transaction_id where o.recurring_service_id = ${rs.id} and t.status = 'pending')`;

export async function listRecurring(p: Record<string, string | undefined>) {
  await requireAdmin();
  const today = todayIso();
  const company = await getCompanySettings();
  const q = cleanQuery(p.q);
  const status = pickOptional(p.status, recurringStatus.enumValues);
  const period = pickOptional(p.period, recurringPeriod.enumValues);
  const due = pickOptional(p.due, ["overdue", "upcoming"] as const);
  const customerId = p.customerId && /^[0-9a-f-]{36}$/i.test(p.customerId) ? p.customerId : undefined;
  const sort = pick(p.sort, ["next", "name", "amount", "created"] as const, "next");
  const dir = p.dir === "desc" ? "desc" : "asc";
  const page = pageOf(p);

  const where: SQL[] = [];
  if (q) where.push(or(ilike(rs.name, likePattern(q)), ilike(customers.companyName, likePattern(q)))!);
  if (status) where.push(eq(rs.status, status));
  if (period) where.push(eq(rs.period, period));
  if (customerId) where.push(eq(rs.customerId, customerId));
  if (due === "overdue") where.push(eq(rs.status, "active"), sql`${rs.nextRenewalDate} < ${today}`);
  if (due === "upcoming") where.push(eq(rs.status, "active"), lte(rs.nextRenewalDate, addDays(today, company.renewalWarningDays)));
  const cond = where.length ? and(...where) : undefined;
  const sortCol = { next: rs.nextRenewalDate, name: sql`lower(${rs.name})`, amount: rs.amount, created: rs.createdAt }[sort];

  const [rows, [count], overdueOcc] = await Promise.all([
    db
      .select({
        id: rs.id,
        name: rs.name,
        amount: rs.amount,
        currency: rs.currency,
        period: rs.period,
        status: rs.status,
        autoRenew: rs.autoRenew,
        startDate: rs.startDate,
        nextRenewalDate: rs.nextRenewalDate,
        customerId: rs.customerId,
        customerName: customers.companyName,
        lastPaid,
        openCount,
      })
      .from(rs)
      .innerJoin(customers, eq(customers.id, rs.customerId))
      .where(cond)
      .orderBy(dir === "asc" ? sql`${sortCol} asc nulls last` : sql`${sortCol} desc nulls last`, asc(rs.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(rs).innerJoin(customers, eq(customers.id, rs.customerId)).where(cond),
    // Billed periods whose (pending) payment is overdue.
    db
      .select({
        transactionId: ft.id,
        serviceId: rs.id,
        serviceName: rs.name,
        customerName: customers.companyName,
        amount: ft.amount,
        currency: ft.currency,
        dueDate: sql<string>`${ft.dueDate}::text`, // billed periods always have a due date
        periodStart: ro.periodStart,
      })
      .from(ro)
      .innerJoin(ft, eq(ft.id, ro.transactionId))
      .innerJoin(rs, eq(rs.id, ro.recurringServiceId))
      .innerJoin(customers, eq(customers.id, rs.customerId))
      .where(and(eq(ft.status, "pending"), isOverdueSql(today)))
      .orderBy(asc(sql`coalesce(${ft.dueDate}, ${ft.transactionDate})`))
      .limit(20),
  ]);
  return { rows, total: count?.n ?? 0, page, pageSize: PAGE_SIZE, today, overdueOcc, warningDays: company.renewalWarningDays };
}

export async function getRecurring(id: string) {
  await requireAdmin();
  const [row] = await db.select().from(rs).where(eq(rs.id, id)).limit(1);
  return row ?? null;
}

export async function getRecurringDetail(id: string) {
  await requireAdmin();
  const [row] = await db
    .select({ s: rs, customerName: customers.companyName, projectName: projects.name, categoryName: financialCategories.name })
    .from(rs)
    .innerJoin(customers, eq(customers.id, rs.customerId))
    .innerJoin(financialCategories, eq(financialCategories.id, rs.categoryId))
    .leftJoin(projects, eq(projects.id, rs.projectId))
    .where(eq(rs.id, id))
    .limit(1);
  if (!row) return null;
  const occurrences = await db
    .select({
      id: ro.id,
      periodStart: ro.periodStart,
      periodEnd: ro.periodEnd,
      transactionId: ft.id,
      status: ft.status,
      amount: ft.amount,
      currency: ft.currency,
      dueDate: ft.dueDate,
      settledDate: ft.settledDate,
    })
    .from(ro)
    .innerJoin(ft, eq(ft.id, ro.transactionId))
    .where(eq(ro.recurringServiceId, id))
    .orderBy(desc(ro.periodStart));
  return { ...row.s, customerName: row.customerName, projectName: row.projectName, categoryName: row.categoryName, occurrences };
}

/** Active services whose current period has started (due for billing). */
export async function dueServiceIds() {
  await requireAdmin();
  const rows = await db
    .select({ id: rs.id })
    .from(rs)
    .where(and(eq(rs.status, "active"), lte(rs.nextRenewalDate, todayIso())));
  return rows.map((r) => r.id);
}

