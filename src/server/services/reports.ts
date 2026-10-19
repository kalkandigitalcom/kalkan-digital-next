import "server-only";
import { desc, ne, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { customers, projects } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency } from "@/server/settings";
import { monthlySeries, openItems, periodTotals, receivablesAgeing, totalsByCategory, totalsByCurrency, projectCollectedExpr } from "@/server/finance/core";
import { makeIso, todayIso } from "@/lib/dates";
import { eq } from "drizzle-orm";

export async function getYearReport(year: number, compareYear: number) {
  await requireAdmin();
  const base = await getBaseCurrency();
  const today = todayIso();
  const y = (yy: number) => [makeIso(yy, 1, 1), makeIso(yy, 12, 31)] as const;
  const [
    totals,
    totalsCmp,
    monthly,
    monthlyCmp,
    incomeCats,
    incomeCatsCmp,
    expenseCats,
    expenseCatsCmp,
    byCurrency,
    receivables,
    payables,
    ageing,
    projectRows,
    yearsRow,
  ] = await Promise.all([
    periodTotals(db, base, ...y(year)),
    periodTotals(db, base, ...y(compareYear)),
    monthlySeries(db, base, year),
    monthlySeries(db, base, compareYear),
    totalsByCategory(db, base, "income", ...y(year)),
    totalsByCategory(db, base, "income", ...y(compareYear)),
    totalsByCategory(db, base, "expense", ...y(year)),
    totalsByCategory(db, base, "expense", ...y(compareYear)),
    totalsByCurrency(db, base, ...y(year)),
    openItems(db, base, "income", today),
    openItems(db, base, "expense", today),
    receivablesAgeing(db, base, today),
    db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        currency: projects.currency,
        agreedAmount: projects.agreedAmount,
        estimatedCost: projects.estimatedCost,
        customerName: customers.companyName,
        collected: projectCollectedExpr(base),
        collectedBase: sql<string>`(select coalesce(sum(t.base_amount),0)::text from financial_transactions t where t.project_id = ${projects.id} and t.type='income' and t.status='completed')`,
        expenseBase: sql<string>`(select coalesce(sum(t.base_amount),0)::text from financial_transactions t where t.project_id = ${projects.id} and t.type='expense' and t.status='completed')`,
        receivableBase: sql<string>`(select coalesce(sum(t.base_amount),0)::text from financial_transactions t where t.project_id = ${projects.id} and t.type='income' and t.status='pending')`,
      })
      .from(projects)
      .leftJoin(customers, eq(customers.id, projects.customerId))
      .where(ne(projects.status, "cancelled"))
      .orderBy(desc(projects.createdAt))
      .limit(50),
    db.execute<{ min: number | null }>(sql`select min(extract(year from settled_date))::int as min from financial_transactions where status = 'completed'`),
  ]);
  return {
    base,
    today,
    year,
    compareYear,
    totals,
    totalsCmp,
    monthly,
    monthlyCmp,
    incomeCats,
    incomeCatsCmp,
    expenseCats,
    expenseCatsCmp,
    byCurrency,
    receivables,
    payables,
    ageing,
    projects: projectRows,
    firstYear: yearsRow[0]?.min ?? null,
  };
}
