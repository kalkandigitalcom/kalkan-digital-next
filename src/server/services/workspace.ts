import "server-only";
import { and, asc, desc, eq, exists, ilike, inArray, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { qcol } from "@/server/db/qualified";
import {
  customerNotes,
  customers,
  customerStatus,
  financialCategories,
  financialTransactions as ft,
  projects,
  recurringOccurrences as ro,
  recurringServices as rs,
  tasks,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency, getCompanySettings } from "@/server/settings";
import { customerIncomeTotals, openItems, type CustomerIncomeTotals, paymentStatusOf, projectCollectedExpr, type PaymentStatus } from "@/server/finance/core";
import { PAGE_SIZE, cleanQuery, likePattern, pageOf, pick, pickOptional } from "@/server/list";
import { addDays, todayIso } from "@/lib/dates";

/*
 * Müşteri çalışma ekranı (/admin/workspace) veri katmanı.
 *
 * Her veri kümesi müşteri bazında AYRI bir sorguyla hesaplanır ve sonra JS'te birleştirilir.
 * Böylece müşteri → proje → işlem → yenileme ilişkileri join edilip toplamlar çoğaltılmaz.
 * Finansal tanımlar src/server/finance/core.ts'ten gelir; burada yeni finans kuralı yoktur.
 */

const VIEWS = ["active", "archived", "all"] as const;
const FOCUS = ["overdue_receivable", "upcoming_renewal", "billed_unpaid", "open_tasks", "missing_rate"] as const;
const SORTS = ["updated", "company", "overdue"] as const;
const OPEN_TASK = ["todo", "in_progress"] as const;

export type WorkspaceFocus = (typeof FOCUS)[number];

/** Same "due" rule as openItems(): due date, falling back to the transaction date. */
const dueExpr = sql`coalesce(${ft.dueDate}, ${ft.transactionDate})`;

export function workspaceFilters(p: Record<string, string | undefined>) {
  return {
    q: cleanQuery(p.q),
    status: pickOptional(p.status, customerStatus.enumValues),
    view: pick(p.view, VIEWS, "active"),
    focus: pickOptional(p.focus, FOCUS),
    sort: pick(p.sort, SORTS, "updated"),
    dir: p.dir === "asc" ? ("asc" as const) : ("desc" as const),
    page: pageOf(p),
  };
}

export interface ProjectBrief {
  id: string;
  name: string;
  status: (typeof projects.$inferSelect)["status"];
  archived: boolean;
  paymentStatus: PaymentStatus;
}

export interface WorkspaceRow {
  id: string;
  companyName: string;
  contactName: string | null;
  customerType: (typeof customers.$inferSelect)["customerType"];
  status: (typeof customers.$inferSelect)["status"];
  archivedAt: Date | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  updatedAt: Date;
  projects: ProjectBrief[];
  /** Payment status distribution of non-cancelled projects. */
  paymentMix: Partial<Record<PaymentStatus, number>>;
  renewals: { activeCount: number; nextDate: string | null; billedUnpaid: number; billedOverdue: number };
  finance: CustomerIncomeTotals;
  followUp: { lastNoteDate: string | null; nextFollowUpDate: string | null; openTasks: number; overdueTasks: number };
}

/* ------------------------------------------------------------------------------------------------ */

async function projectsByCustomer(ids: string[], base: Awaited<ReturnType<typeof getBaseCurrency>>) {
  const map = new Map<string, ProjectBrief[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({
      id: projects.id,
      customerId: projects.customerId,
      name: projects.name,
      status: projects.status,
      archivedAt: projects.archivedAt,
      agreedAmount: projects.agreedAmount,
      collected: projectCollectedExpr(base),
    })
    .from(projects)
    .where(inArray(projects.customerId, ids))
    .orderBy(asc(projects.archivedAt), desc(projects.createdAt));
  for (const r of rows) {
    const list = map.get(r.customerId!) ?? [];
    list.push({ id: r.id, name: r.name, status: r.status, archived: r.archivedAt !== null, paymentStatus: paymentStatusOf(r.agreedAmount, r.collected) });
    map.set(r.customerId!, list);
  }
  return map;
}

async function renewalsByCustomer(ids: string[], today: string) {
  const map = new Map<string, WorkspaceRow["renewals"]>();
  if (!ids.length) return map;
  const [services, billed] = await Promise.all([
    db
      .select({
        customerId: rs.customerId,
        activeCount: sql<number>`count(*)::int`,
        nextDate: sql<string | null>`min(${rs.nextRenewalDate})::text`,
      })
      .from(rs)
      .where(and(inArray(rs.customerId, ids), eq(rs.status, "active")))
      .groupBy(rs.customerId),
    // Billed periods whose expected collection is still pending (same rule as the renewals screen).
    db
      .select({
        customerId: rs.customerId,
        billedUnpaid: sql<number>`count(*)::int`,
        billedOverdue: sql<number>`count(*) filter (where ${dueExpr} < ${today})::int`,
      })
      .from(ro)
      .innerJoin(ft, eq(ft.id, ro.transactionId))
      .innerJoin(rs, eq(rs.id, ro.recurringServiceId))
      .where(and(inArray(rs.customerId, ids), eq(ft.status, "pending")))
      .groupBy(rs.customerId),
  ]);
  for (const id of ids) map.set(id, { activeCount: 0, nextDate: null, billedUnpaid: 0, billedOverdue: 0 });
  for (const s of services) Object.assign(map.get(s.customerId)!, { activeCount: s.activeCount, nextDate: s.nextDate });
  for (const b of billed) Object.assign(map.get(b.customerId)!, { billedUnpaid: b.billedUnpaid, billedOverdue: b.billedOverdue });
  return map;
}

async function followUpByCustomer(ids: string[], now: Date) {
  const map = new Map<string, WorkspaceRow["followUp"]>();
  if (!ids.length) return map;
  const [latestNotes, taskCounts] = await Promise.all([
    // Most recent note per customer; its "next follow-up" is the customer's current follow-up date.
    db
      .selectDistinctOn([customerNotes.customerId], {
        customerId: customerNotes.customerId,
        lastNoteDate: customerNotes.contactDate,
        nextFollowUpDate: customerNotes.nextFollowUpDate,
      })
      .from(customerNotes)
      .where(inArray(customerNotes.customerId, ids))
      .orderBy(customerNotes.customerId, desc(customerNotes.contactDate), desc(customerNotes.createdAt)),
    db
      .select({
        customerId: tasks.customerId,
        openTasks: sql<number>`count(*)::int`,
        overdueTasks: sql<number>`count(*) filter (where ${tasks.dueAt} < ${now.toISOString()}::timestamptz)::int`,
      })
      .from(tasks)
      .where(and(inArray(tasks.customerId, ids), inArray(tasks.status, [...OPEN_TASK])))
      .groupBy(tasks.customerId),
  ]);
  for (const id of ids) map.set(id, { lastNoteDate: null, nextFollowUpDate: null, openTasks: 0, overdueTasks: 0 });
  for (const n of latestNotes) Object.assign(map.get(n.customerId)!, { lastNoteDate: n.lastNoteDate, nextFollowUpDate: n.nextFollowUpDate });
  for (const t of taskCounts) if (t.customerId) Object.assign(map.get(t.customerId)!, { openTasks: t.openTasks, overdueTasks: t.overdueTasks });
  return map;
}

function paymentMix(list: ProjectBrief[]) {
  const mix: Partial<Record<PaymentStatus, number>> = {};
  // Cancelled projects are left out, as in the project profitability report.
  for (const p of list) if (p.status !== "cancelled") mix[p.paymentStatus] = (mix[p.paymentStatus] ?? 0) + 1;
  return mix;
}

/* ------------------------------------------------------------------------------------------------ */

export async function listWorkspace(p: Record<string, string | undefined>) {
  await requireAdmin();
  const f = workspaceFilters(p);
  const base = await getBaseCurrency();
  const company = await getCompanySettings();
  const today = todayIso();
  const now = new Date();
  const horizon = addDays(today, company.renewalWarningDays);

  const where: SQL[] = [];
  if (f.view === "active") where.push(isNull(customers.archivedAt));
  if (f.view === "archived") where.push(isNotNull(customers.archivedAt));
  if (f.status) where.push(eq(customers.status, f.status));
  if (f.q) {
    const pat = likePattern(f.q);
    where.push(
      or(
        ilike(customers.companyName, pat),
        ilike(customers.contactName, pat),
        ilike(customers.email, pat),
        ilike(customers.phone, pat),
        ilike(customers.whatsapp, pat),
        exists(db.select({ x: sql`1` }).from(projects).where(and(eq(projects.customerId, customers.id), ilike(projects.name, pat)))),
      )!,
    );
  }
  const customerTx = (extra: SQL) =>
    exists(
      db
        .select({ x: sql`1` })
        .from(ft)
        .where(and(eq(ft.customerId, customers.id), eq(ft.type, "income"), eq(ft.baseCurrency, base), extra)),
    );
  switch (f.focus) {
    case "overdue_receivable":
      where.push(customerTx(sql`${ft.status} = 'pending' and ${dueExpr} < ${today}`));
      break;
    case "missing_rate":
      where.push(customerTx(sql`${ft.status} in ('completed','pending') and ${ft.baseAmount} is null`));
      break;
    case "upcoming_renewal":
      where.push(exists(db.select({ x: sql`1` }).from(rs).where(and(eq(rs.customerId, customers.id), eq(rs.status, "active"), sql`${rs.nextRenewalDate} <= ${horizon}`))));
      break;
    case "billed_unpaid":
      where.push(
        exists(
          db
            .select({ x: sql`1` })
            .from(ro)
            .innerJoin(ft, eq(ft.id, ro.transactionId))
            .innerJoin(rs, eq(rs.id, ro.recurringServiceId))
            .where(and(eq(rs.customerId, customers.id), eq(ft.status, "pending"))),
        ),
      );
      break;
    case "open_tasks":
      where.push(exists(db.select({ x: sql`1` }).from(tasks).where(and(eq(tasks.customerId, customers.id), inArray(tasks.status, [...OPEN_TASK])))));
      break;
  }
  const cond = where.length ? and(...where) : undefined;

  const overdueSort = sql`(select coalesce(sum(t.base_amount), 0) from financial_transactions t where t.customer_id = ${qcol(customers.id)} and t.type = 'income' and t.status = 'pending' and t.base_currency = ${base} and coalesce(t.due_date, t.transaction_date) < ${today})`;
  const sortCol = { updated: sql`${customers.updatedAt}`, company: sql`lower(${customers.companyName})`, overdue: overdueSort }[f.sort];

  const [pageRows, [count], summary] = await Promise.all([
    db
      .select({
        id: customers.id,
        companyName: customers.companyName,
        contactName: customers.contactName,
        customerType: customers.customerType,
        status: customers.status,
        archivedAt: customers.archivedAt,
        phone: customers.phone,
        whatsapp: customers.whatsapp,
        email: customers.email,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(cond)
      .orderBy(f.dir === "asc" ? sql`${sortCol} asc nulls last` : sql`${sortCol} desc nulls last`, asc(customers.id))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(customers).where(cond),
    workspaceSummary(base, today, horizon),
  ]);

  const ids = pageRows.map((r) => r.id);
  const [finance, projectMap, renewalMap, followMap] = await Promise.all([
    customerIncomeTotals(db, base, today, ids),
    projectsByCustomer(ids, base),
    renewalsByCustomer(ids, today),
    followUpByCustomer(ids, now),
  ]);

  const rows: WorkspaceRow[] = pageRows.map((c) => {
    const list = projectMap.get(c.id) ?? [];
    return {
      ...c,
      projects: list,
      paymentMix: paymentMix(list),
      renewals: renewalMap.get(c.id)!,
      finance: finance.get(c.id)!,
      followUp: followMap.get(c.id)!,
    };
  });

  return { rows, total: count?.n ?? 0, page: f.page, pageSize: PAGE_SIZE, filters: f, base, today, horizon, warningDays: company.renewalWarningDays, summary };
}

/**
 * Summary figures. Every definition is an existing one:
 *  - total / active customers: the dashboard's counts (non-archived customers).
 *  - upcoming renewals: the dashboard's list = active services whose next renewal date is on or
 *    before today + warning days (overdue renewals included). Counted per service row (no joins).
 *  - overdue receivable: openItems() overdue total – all overdue receivables, including ones not
 *    linked to a customer (reported separately).
 */
async function workspaceSummary(base: Awaited<ReturnType<typeof getBaseCurrency>>, today: string, horizon: string) {
  const [[counts], [renewals], overdue, [unlinked]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${customers.status} = 'active')::int`,
      })
      .from(customers)
      .where(isNull(customers.archivedAt)),
    db
      .select({
        upcoming: sql<number>`count(*)::int`,
        overdue: sql<number>`count(*) filter (where ${rs.nextRenewalDate} < ${today})::int`,
      })
      .from(rs)
      .where(and(eq(rs.status, "active"), sql`${rs.nextRenewalDate} <= ${horizon}`)),
    openItems(db, base, "income", today),
    db
      .select({
        total: sql<string>`coalesce(sum(${ft.baseAmount}), 0)::text`,
        n: sql<number>`count(*)::int`,
      })
      .from(ft)
      .where(and(eq(ft.type, "income"), eq(ft.status, "pending"), eq(ft.baseCurrency, base), isNull(ft.customerId), sql`${dueExpr} < ${today}`)),
  ]);
  return {
    totalCustomers: counts?.total ?? 0,
    activeCustomers: counts?.active ?? 0,
    upcomingRenewals: renewals?.upcoming ?? 0,
    overdueRenewals: renewals?.overdue ?? 0,
    overdueReceivable: overdue.overdueTotal,
    overdueReceivableCount: overdue.overdueCount,
    receivableMissingRate: overdue.missingRateCount,
    unlinkedOverdue: unlinked?.total ?? "0",
    unlinkedOverdueCount: unlinked?.n ?? 0,
  };
}

/* ------------------------------------------------------------------------------------------------ */

/** Everything the right-hand detail panel shows for one customer. */
export async function getWorkspaceCustomer(id: string) {
  await requireAdmin();
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!customer) return null;
  const base = await getBaseCurrency();
  const today = todayIso();
  const now = new Date();

  const [projectRows, services, billed, totals, openReceivables, recentTx, notes, openTasks] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        projectType: projects.projectType,
        status: projects.status,
        projectUrl: projects.projectUrl,
        currency: projects.currency,
        agreedAmount: projects.agreedAmount,
        targetDate: projects.targetDate,
        deliveredDate: projects.deliveredDate,
        archivedAt: projects.archivedAt,
        collected: projectCollectedExpr(base),
      })
      .from(projects)
      .where(eq(projects.customerId, id))
      .orderBy(asc(projects.archivedAt), desc(projects.createdAt)),
    db
      .select({ id: rs.id, name: rs.name, amount: rs.amount, currency: rs.currency, period: rs.period, status: rs.status, nextRenewalDate: rs.nextRenewalDate })
      .from(rs)
      .where(eq(rs.customerId, id))
      .orderBy(sql`case ${rs.status} when 'active' then 0 when 'paused' then 1 else 2 end`, asc(rs.nextRenewalDate)),
    db
      .select({
        transactionId: ft.id,
        serviceId: rs.id,
        serviceName: rs.name,
        periodStart: ro.periodStart,
        periodEnd: ro.periodEnd,
        amount: ft.amount,
        currency: ft.currency,
        due: sql<string>`${dueExpr}::text`,
      })
      .from(ro)
      .innerJoin(ft, eq(ft.id, ro.transactionId))
      .innerJoin(rs, eq(rs.id, ro.recurringServiceId))
      .where(and(eq(rs.customerId, id), eq(ft.status, "pending")))
      .orderBy(asc(dueExpr)),
    customerIncomeTotals(db, base, today, [id]).then((m) => m.get(id)!),
    db
      .select({
        id: ft.id,
        description: ft.description,
        amount: ft.amount,
        currency: ft.currency,
        baseAmount: ft.baseAmount,
        due: sql<string>`${dueExpr}::text`,
        projectName: projects.name,
      })
      .from(ft)
      .leftJoin(projects, eq(projects.id, ft.projectId))
      .where(and(eq(ft.customerId, id), eq(ft.type, "income"), eq(ft.status, "pending")))
      .orderBy(asc(dueExpr))
      .limit(20),
    db
      .select({
        id: ft.id,
        type: ft.type,
        status: ft.status,
        description: ft.description,
        amount: ft.amount,
        currency: ft.currency,
        baseAmount: ft.baseAmount,
        date: sql<string>`coalesce(${ft.settledDate}, ${ft.transactionDate})::text`,
        category: financialCategories.name,
      })
      .from(ft)
      .innerJoin(financialCategories, eq(financialCategories.id, ft.categoryId))
      .where(eq(ft.customerId, id))
      .orderBy(desc(sql`coalesce(${ft.settledDate}, ${ft.transactionDate})`), desc(ft.createdAt))
      .limit(10),
    db.select().from(customerNotes).where(eq(customerNotes.customerId, id)).orderBy(desc(customerNotes.contactDate), desc(customerNotes.createdAt)).limit(3),
    db
      .select({ id: tasks.id, title: tasks.title, dueAt: tasks.dueAt, priority: tasks.priority, status: tasks.status })
      .from(tasks)
      .where(and(eq(tasks.customerId, id), inArray(tasks.status, [...OPEN_TASK])))
      .orderBy(sql`${tasks.dueAt} asc nulls last`)
      .limit(10),
  ]);

  return {
    customer,
    base,
    today,
    now,
    projects: projectRows.map((p) => ({ ...p, paymentStatus: paymentStatusOf(p.agreedAmount, p.collected) })),
    services,
    billedUnpaid: billed,
    totals,
    openReceivables,
    recentTx,
    notes,
    openTasks,
  };
}
