import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import {
  currency,
  customers,
  financialCategories,
  financialTransactions as ft,
  paymentMethod,
  projects,
  recurringOccurrences,
  transactionStatus,
  transactionType,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency } from "@/server/settings";
import { PAGE_SIZE, cleanQuery, likePattern, pageOf, pick, pickOptional } from "@/server/list";
import { isIsoDate, todayIso } from "@/lib/dates";

const SORTS = ["date", "amount", "created", "due"] as const;
const isUuid = (s: string | undefined) => (s && /^[0-9a-f-]{36}$/i.test(s) ? s : undefined);

export function transactionFilters(p: Record<string, string | undefined>) {
  return {
    q: cleanQuery(p.q),
    type: pickOptional(p.type, transactionType.enumValues),
    status: pickOptional(p.status, [...transactionStatus.enumValues, "overdue"] as const),
    currency: pickOptional(p.currency, currency.enumValues),
    method: pickOptional(p.method, paymentMethod.enumValues),
    categoryId: isUuid(p.categoryId),
    customerId: isUuid(p.customerId),
    projectId: isUuid(p.projectId),
    /** Which date the from/to range applies to. */
    dateField: pick(p.dateField, ["transaction", "settled", "due"] as const, "transaction"),
    from: isIsoDate(p.from) ? p.from : undefined,
    to: isIsoDate(p.to) ? p.to : undefined,
  };
}

function buildWhere(f: ReturnType<typeof transactionFilters>) {
  const where: SQL[] = [];
  if (f.q) where.push(or(ilike(ft.description, likePattern(f.q)), ilike(ft.documentNo, likePattern(f.q)), ilike(ft.notes, likePattern(f.q)))!);
  if (f.type) where.push(eq(ft.type, f.type));
  if (f.status === "overdue") {
    where.push(eq(ft.status, "pending"), sql`coalesce(${ft.dueDate}, ${ft.transactionDate}) < ${todayIso()}`);
  } else if (f.status) where.push(eq(ft.status, f.status));
  if (f.currency) where.push(eq(ft.currency, f.currency));
  if (f.method) where.push(eq(ft.paymentMethod, f.method));
  if (f.categoryId) where.push(eq(ft.categoryId, f.categoryId));
  if (f.customerId) where.push(eq(ft.customerId, f.customerId));
  if (f.projectId) where.push(eq(ft.projectId, f.projectId));
  const col: SQL = f.dateField === "settled" ? sql`${ft.settledDate}` : f.dateField === "due" ? sql`coalesce(${ft.dueDate}, ${ft.transactionDate})` : sql`${ft.transactionDate}`;
  if (f.from) where.push(sql`${col} >= ${f.from}`);
  if (f.to) where.push(sql`${col} <= ${f.to}`);
  return where.length ? and(...where) : undefined;
}

export async function listTransactions(p: Record<string, string | undefined>) {
  await requireAdmin();
  const base = await getBaseCurrency();
  const f = transactionFilters(p);
  const cond = buildWhere(f);
  const sort = pick(p.sort, SORTS, "date");
  const dir = p.dir === "asc" ? "asc" : "desc";
  const page = pageOf(p);
  const sortCol = {
    date: sql`coalesce(${ft.settledDate}, ${ft.transactionDate})`,
    amount: ft.baseAmount,
    created: ft.createdAt,
    due: sql`coalesce(${ft.dueDate}, ${ft.transactionDate})`,
  }[sort];

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: ft.id,
        type: ft.type,
        description: ft.description,
        amount: ft.amount,
        currency: ft.currency,
        baseAmount: ft.baseAmount,
        exchangeRate: ft.exchangeRate,
        status: ft.status,
        transactionDate: ft.transactionDate,
        settledDate: ft.settledDate,
        dueDate: ft.dueDate,
        documentNo: ft.documentNo,
        paymentMethod: ft.paymentMethod,
        categoryName: financialCategories.name,
        customerId: ft.customerId,
        customerName: customers.companyName,
        projectId: ft.projectId,
        projectName: projects.name,
        isRecurring: sql<boolean>`exists (select 1 from ${recurringOccurrences} ro where ro.transaction_id = ${ft.id})`,
      })
      .from(ft)
      .innerJoin(financialCategories, eq(financialCategories.id, ft.categoryId))
      .leftJoin(customers, eq(customers.id, ft.customerId))
      .leftJoin(projects, eq(projects.id, ft.projectId))
      .where(cond)
      .orderBy(dir === "asc" ? sql`${sortCol} asc nulls last` : sql`${sortCol} desc nulls last`, desc(ft.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({
        type: ft.type,
        status: ft.status,
        total: sql<string>`coalesce(sum(${ft.baseAmount}), 0)::text`,
        n: sql<number>`count(*)::int`,
        missing: sql<number>`count(*) filter (where ${ft.baseAmount} is null)::int`,
      })
      .from(ft)
      .where(and(cond, eq(ft.baseCurrency, base)))
      .groupBy(ft.type, ft.status),
  ]);
  const total = totals.reduce((a, r) => a + r.n, 0);
  const get = (type: string, status: string) => totals.find((r) => r.type === type && r.status === status)?.total ?? "0";
  return {
    rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    base,
    filters: f,
    summary: {
      collected: get("income", "completed"),
      receivable: get("income", "pending"),
      paid: get("expense", "completed"),
      payable: get("expense", "pending"),
      missingRate: totals.filter((r) => r.status !== "cancelled").reduce((a, r) => a + r.missing, 0),
    },
  };
}

export async function getTransaction(id: string) {
  await requireAdmin();
  const [row] = await db
    .select({ t: ft, occurrenceId: recurringOccurrences.id, recurringServiceId: recurringOccurrences.recurringServiceId })
    .from(ft)
    .leftJoin(recurringOccurrences, eq(recurringOccurrences.transactionId, ft.id))
    .where(eq(ft.id, id))
    .limit(1);
  return row ? { ...row.t, occurrenceId: row.occurrenceId, recurringServiceId: row.recurringServiceId } : null;
}

export async function categoryOptions(includeId?: string | null) {
  await requireAdmin();
  const rows = await db
    .select()
    .from(financialCategories)
    .where(includeId ? or(eq(financialCategories.isActive, true), eq(financialCategories.id, includeId)) : eq(financialCategories.isActive, true))
    .orderBy(asc(financialCategories.type), asc(financialCategories.sortOrder), asc(financialCategories.name));
  return rows.map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (pasif)`, type: c.type }));
}

export async function listCategories() {
  await requireAdmin();
  return db
    .select({
      id: financialCategories.id,
      type: financialCategories.type,
      name: financialCategories.name,
      sortOrder: financialCategories.sortOrder,
      isActive: financialCategories.isActive,
      usage: sql<number>`(select count(*)::int from financial_transactions t where t.category_id = ${financialCategories.id}) + (select count(*)::int from recurring_services r where r.category_id = ${financialCategories.id})`,
    })
    .from(financialCategories)
    .orderBy(asc(financialCategories.type), asc(financialCategories.sortOrder), asc(financialCategories.name));
}
