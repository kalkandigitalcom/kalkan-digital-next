/**
 * Financial calculation core.
 *
 * Definitions (all amounts in the base currency, from stored base_amount values):
 *  - Collected income   = income,  status=completed, by settled_date (cash basis)
 *  - Receivables        = income,  status=pending   (not yet collected; never counted as income)
 *  - Paid expense       = expense, status=completed, by settled_date
 *  - Payables           = expense, status=pending
 *  - Net cash movement  = collected income − paid expense (same period)
 *  - Project profitability (estimate) = agreed amount − estimated cost  (project currency)
 *  - Project cash result               = collected − paid expenses linked to the project (base)
 * Cancelled transactions are ignored everywhere.
 * Transactions in a foreign currency without an exchange rate have base_amount NULL; they are
 * excluded from base totals and reported separately (`missingRate`), never guessed.
 *
 * This module has no auth checks; callers (services) must authorise first.
 */
import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import type { Database, Tx } from "@/server/db";
import { financialCategories, financialTransactions as ft, projects, type Currency } from "@/server/db/schema";
import { compareMoney, convertAmount, isZero, subMoney } from "@/lib/money";
import { addDays, makeIso } from "@/lib/dates";

type Q = Database | Tx;

export function computeBaseValues(input: {
  amount: string;
  currency: Currency;
  baseCurrency: Currency;
  exchangeRate: string | null;
}): { exchangeRate: string | null; baseAmount: string | null } {
  if (input.currency === input.baseCurrency) return { exchangeRate: "1", baseAmount: input.amount };
  if (!input.exchangeRate) return { exchangeRate: null, baseAmount: null };
  return { exchangeRate: input.exchangeRate, baseAmount: convertAmount(input.amount, input.exchangeRate) };
}

const sumBase = sql<string>`coalesce(sum(${ft.baseAmount}), 0)::text`;
const countAll = sql<number>`count(*)::int`;
const countMissing = sql<number>`count(*) filter (where ${ft.baseAmount} is null)::int`;

function settledBetween(from: string, to: string) {
  return and(gte(ft.settledDate, from), lte(ft.settledDate, to));
}

export interface PeriodTotals {
  collectedIncome: string;
  paidExpense: string;
  net: string;
  incomeCount: number;
  expenseCount: number;
  missingRateCount: number;
}

export async function periodTotals(q: Q, base: Currency, from: string, to: string): Promise<PeriodTotals> {
  const rows = await q
    .select({ type: ft.type, total: sumBase, n: countAll, missing: countMissing })
    .from(ft)
    .where(and(eq(ft.status, "completed"), eq(ft.baseCurrency, base), settledBetween(from, to)))
    .groupBy(ft.type);
  const inc = rows.find((r) => r.type === "income");
  const exp = rows.find((r) => r.type === "expense");
  const collectedIncome = inc?.total ?? "0";
  const paidExpense = exp?.total ?? "0";
  return {
    collectedIncome,
    paidExpense,
    net: subMoney(collectedIncome, paidExpense),
    incomeCount: inc?.n ?? 0,
    expenseCount: exp?.n ?? 0,
    missingRateCount: (inc?.missing ?? 0) + (exp?.missing ?? 0),
  };
}

export interface OpenItems {
  total: string;
  count: number;
  overdueTotal: string;
  overdueCount: number;
  missingRateCount: number;
}

/** Pending (uncollected / unpaid) items as of `today`. Due date falls back to transaction date. */
export async function openItems(q: Q, base: Currency, type: "income" | "expense", today: string, extra?: SQL): Promise<OpenItems> {
  const due = sql`coalesce(${ft.dueDate}, ${ft.transactionDate})`;
  const [row] = await q
    .select({
      total: sumBase,
      count: countAll,
      overdueTotal: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${due} < ${today}), 0)::text`,
      overdueCount: sql<number>`count(*) filter (where ${due} < ${today})::int`,
      missing: countMissing,
    })
    .from(ft)
    .where(and(eq(ft.type, type), eq(ft.status, "pending"), eq(ft.baseCurrency, base), extra));
  return {
    total: row?.total ?? "0",
    count: row?.count ?? 0,
    overdueTotal: row?.overdueTotal ?? "0",
    overdueCount: row?.overdueCount ?? 0,
    missingRateCount: row?.missing ?? 0,
  };
}

export interface MonthPoint {
  month: number; // 1..12
  income: string;
  expense: string;
  net: string;
}

/** Collected income / paid expense per month for a calendar year (cash basis). */
export async function monthlySeries(q: Q, base: Currency, year: number): Promise<MonthPoint[]> {
  const rows = await q
    .select({
      month: sql<number>`extract(month from ${ft.settledDate})::int`,
      income: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'income'), 0)::text`,
      expense: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'expense'), 0)::text`,
      net: sql<string>`(coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'income'), 0) - coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'expense'), 0))::text`,
    })
    .from(ft)
    .where(and(eq(ft.status, "completed"), eq(ft.baseCurrency, base), settledBetween(makeIso(year, 1, 1), makeIso(year, 12, 31))))
    .groupBy(sql`1`);
  return Array.from({ length: 12 }, (_, i) => {
    const r = rows.find((x) => x.month === i + 1);
    return { month: i + 1, income: r?.income ?? "0", expense: r?.expense ?? "0", net: r?.net ?? "0" };
  });
}

export interface YearPoint {
  year: number;
  income: string;
  expense: string;
  net: string;
}

export async function yearlySeries(q: Q, base: Currency, fromYear: number, toYear: number): Promise<YearPoint[]> {
  const rows = await q
    .select({
      year: sql<number>`extract(year from ${ft.settledDate})::int`,
      income: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'income'), 0)::text`,
      expense: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'expense'), 0)::text`,
      net: sql<string>`(coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'income'), 0) - coalesce(sum(${ft.baseAmount}) filter (where ${ft.type} = 'expense'), 0))::text`,
    })
    .from(ft)
    .where(and(eq(ft.status, "completed"), eq(ft.baseCurrency, base), settledBetween(makeIso(fromYear, 1, 1), makeIso(toYear, 12, 31))))
    .groupBy(sql`1`);
  const out: YearPoint[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    const r = rows.find((x) => x.year === y);
    out.push({ year: y, income: r?.income ?? "0", expense: r?.expense ?? "0", net: r?.net ?? "0" });
  }
  return out;
}

export interface CategoryPoint {
  categoryId: string;
  name: string;
  total: string;
  count: number;
}

export async function totalsByCategory(q: Q, base: Currency, type: "income" | "expense", from: string, to: string): Promise<CategoryPoint[]> {
  return q
    .select({ categoryId: financialCategories.id, name: financialCategories.name, total: sumBase, count: countAll })
    .from(ft)
    .innerJoin(financialCategories, eq(financialCategories.id, ft.categoryId))
    .where(and(eq(ft.type, type), eq(ft.status, "completed"), eq(ft.baseCurrency, base), settledBetween(from, to)))
    .groupBy(financialCategories.id, financialCategories.name)
    .orderBy(sql`sum(${ft.baseAmount}) desc nulls last`);
}

export interface CurrencyPoint {
  type: "income" | "expense";
  currency: Currency;
  amount: string;
  baseAmount: string;
  count: number;
  missingRateCount: number;
}

/** Original-currency totals (never summed across currencies). */
export async function totalsByCurrency(q: Q, base: Currency, from: string, to: string): Promise<CurrencyPoint[]> {
  return q
    .select({
      type: ft.type,
      currency: ft.currency,
      amount: sql<string>`coalesce(sum(${ft.amount}), 0)::text`,
      baseAmount: sumBase,
      count: countAll,
      missingRateCount: countMissing,
    })
    .from(ft)
    .where(and(eq(ft.status, "completed"), eq(ft.baseCurrency, base), settledBetween(from, to)))
    .groupBy(ft.type, ft.currency)
    .orderBy(ft.type, ft.currency);
}

/** Receivables ageing buckets based on due date (fallback: transaction date). */
export async function receivablesAgeing(q: Q, base: Currency, today: string) {
  const due = sql`coalesce(${ft.dueDate}, ${ft.transactionDate})`;
  const [row] = await q
    .select({
      notDue: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${due} >= ${today}), 0)::text`,
      d0_30: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${due} < ${today} and ${due} >= ${addDays(today, -30)}), 0)::text`,
      d31_90: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${due} < ${addDays(today, -30)} and ${due} >= ${addDays(today, -90)}), 0)::text`,
      d90p: sql<string>`coalesce(sum(${ft.baseAmount}) filter (where ${due} < ${addDays(today, -90)}), 0)::text`,
    })
    .from(ft)
    .where(and(eq(ft.type, "income"), eq(ft.status, "pending"), eq(ft.baseCurrency, base)));
  return row ?? { notDue: "0", d0_30: "0", d31_90: "0", d90p: "0" };
}

/**
 * SQL expression: amount collected for a project, comparable with the project's agreed amount.
 * If the project currency equals the base currency, base amounts of all linked income are used;
 * otherwise only income recorded in the project's own currency is counted.
 */
export function projectCollectedExpr(base: Currency) {
  return sql<string>`(
    select coalesce(sum(case when ${projects.currency} = ${base} then t.base_amount else t.amount end), 0)::text
    from financial_transactions t
    where t.project_id = ${projects.id} and t.type = 'income' and t.status = 'completed'
      and (${projects.currency} = ${base} or t.currency = ${projects.currency})
  )`;
}

export type PaymentStatus = "not_set" | "unpaid" | "partial" | "paid";
export function paymentStatusOf(agreed: string | null, collected: string): PaymentStatus {
  if (!agreed || isZero(agreed)) return "not_set";
  if (compareMoney(collected, "0") <= 0) return "unpaid";
  if (compareMoney(collected, agreed) >= 0) return "paid";
  return "partial";
}

/** Linked cash figures for one project (base currency). */
export async function projectCashSummary(q: Q, base: Currency, projectId: string) {
  const rows = await q
    .select({ type: ft.type, status: ft.status, total: sumBase, n: countAll, missing: countMissing })
    .from(ft)
    .where(and(eq(ft.projectId, projectId), eq(ft.baseCurrency, base)))
    .groupBy(ft.type, ft.status);
  const get = (type: string, status: string) => rows.find((r) => r.type === type && r.status === status);
  return {
    collected: get("income", "completed")?.total ?? "0",
    receivable: get("income", "pending")?.total ?? "0",
    paidExpense: get("expense", "completed")?.total ?? "0",
    pendingExpense: get("expense", "pending")?.total ?? "0",
    missingRateCount: rows.reduce((a, r) => a + (r.status !== "cancelled" ? r.missing : 0), 0),
  };
}

export async function customerCashSummary(q: Q, base: Currency, customerId: string) {
  const rows = await q
    .select({ type: ft.type, status: ft.status, total: sumBase })
    .from(ft)
    .where(and(eq(ft.customerId, customerId), eq(ft.baseCurrency, base)))
    .groupBy(ft.type, ft.status);
  const get = (type: string, status: string) => rows.find((r) => r.type === type && r.status === status)?.total ?? "0";
  return { collected: get("income", "completed"), receivable: get("income", "pending"), expense: get("expense", "completed") };
}

