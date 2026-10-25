import "server-only";
import { and, asc, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { customers, financialCategories, financialTransactions as ft, projects, recurringServices, tasks } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency, getCompanySettings } from "@/server/settings";
import { monthlySeries, openItems, periodTotals, totalsByCategory, yearlySeries } from "@/server/finance/core";
import { addDays, makeIso, todayIso, yearOf, type DateRange } from "@/lib/dates";

export async function getDashboard(range: DateRange) {
  await requireAdmin();
  const base = await getBaseCurrency();
  const company = await getCompanySettings();
  const today = todayIso();
  const year = yearOf(range.to);
  const renewalHorizon = addDays(today, company.renewalWarningDays);

  const [
    counts,
    period,
    yearTotals,
    receivables,
    payables,
    monthly,
    yearly,
    byCategory,
    recentTx,
    renewals,
    awaiting,
    upcomingTasks,
    recentCustomers,
  ] = await Promise.all([
    db.execute<{ total: number; active: number; ongoing: number; waiting: number }>(sql`
      select
        (select count(*)::int from customers where archived_at is null) as total,
        (select count(*)::int from customers where archived_at is null and status = 'active') as active,
        (select count(*)::int from projects where archived_at is null and status = 'in_progress') as ongoing,
        (select count(*)::int from projects where archived_at is null and status = 'waiting_client') as waiting
    `),
    periodTotals(db, base, range.from, range.to),
    periodTotals(db, base, makeIso(year, 1, 1), makeIso(year, 12, 31)),
    openItems(db, base, "income", today),
    openItems(db, base, "expense", today),
    monthlySeries(db, base, year),
    yearlySeries(db, base, year - 4, year),
    totalsByCategory(db, base, "income", range.from, range.to),
    db
      .select({
        id: ft.id,
        type: ft.type,
        description: ft.description,
        amount: ft.amount,
        currency: ft.currency,
        status: ft.status,
        // Completed: cash date; pending: due date (null = no due date); cancelled: none.
        date: sql<string | null>`case ${ft.status} when 'completed' then ${ft.settledDate} when 'pending' then ${ft.dueDate} end`,
        customerName: customers.companyName,
        category: financialCategories.name,
      })
      .from(ft)
      .innerJoin(financialCategories, eq(financialCategories.id, ft.categoryId))
      .leftJoin(customers, eq(customers.id, ft.customerId))
      .orderBy(desc(ft.createdAt))
      .limit(8),
    db
      .select({
        id: recurringServices.id,
        name: recurringServices.name,
        amount: recurringServices.amount,
        currency: recurringServices.currency,
        nextRenewalDate: recurringServices.nextRenewalDate,
        period: recurringServices.period,
        customerId: customers.id,
        customerName: customers.companyName,
      })
      .from(recurringServices)
      .innerJoin(customers, eq(customers.id, recurringServices.customerId))
      .where(and(eq(recurringServices.status, "active"), lte(recurringServices.nextRenewalDate, renewalHorizon)))
      .orderBy(asc(recurringServices.nextRenewalDate))
      .limit(8),
    db
      .select({
        customerId: customers.id,
        customerName: customers.companyName,
        total: sql<string>`coalesce(sum(${ft.baseAmount}), 0)::text`,
        count: sql<number>`count(*)::int`,
        /** Earliest due date; null when none of the open items has a due date. */
        oldestDue: sql<string | null>`min(${ft.dueDate})::text`,
        missing: sql<number>`count(*) filter (where ${ft.baseAmount} is null)::int`,
      })
      .from(ft)
      .innerJoin(customers, eq(customers.id, ft.customerId))
      .where(and(eq(ft.type, "income"), eq(ft.status, "pending"), eq(ft.baseCurrency, base)))
      .groupBy(customers.id, customers.companyName)
      .orderBy(sql`min(${ft.dueDate}) asc nulls last`, customers.companyName)
      .limit(6),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueAt: tasks.dueAt,
        priority: tasks.priority,
        status: tasks.status,
        customerName: customers.companyName,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(customers, eq(customers.id, tasks.customerId))
      .leftJoin(projects, eq(projects.id, tasks.projectId))
      .where(and(inArray(tasks.status, ["todo", "in_progress"]), sql`${tasks.dueAt} is not null`, lte(tasks.dueAt, new Date(Date.now() + 7 * 86_400_000))))
      .orderBy(asc(tasks.dueAt))
      .limit(8),
    db
      .select({ id: customers.id, companyName: customers.companyName, status: customers.status, createdAt: customers.createdAt, contactName: customers.contactName })
      .from(customers)
      .where(isNull(customers.archivedAt))
      .orderBy(desc(customers.createdAt))
      .limit(5),
  ]);

  return {
    base,
    today,
    now: new Date(),
    year,
    counts: counts[0] ?? { total: 0, active: 0, ongoing: 0, waiting: 0 },
    period,
    yearTotals,
    receivables,
    payables,
    monthly,
    yearly,
    byCategory,
    recentTx,
    renewals,
    awaiting,
    upcomingTasks,
    recentCustomers,
    renewalWarningDays: company.renewalWarningDays,
  };
}
