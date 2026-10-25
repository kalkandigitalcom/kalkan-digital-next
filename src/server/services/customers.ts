import "server-only";
import { and, asc, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import {
  customerNotes,
  customers,
  financialCategories,
  financialTransactions,
  projects,
  quotes,
  recurringServices,
  tasks,
  customerStatus,
  customerType,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency } from "@/server/settings";
import { customerCashSummary, projectCollectedExpr } from "@/server/finance/core";
import { PAGE_SIZE, cleanQuery, likePattern, pageOf, pick, pickOptional } from "@/server/list";

const SORTS = ["company", "created", "status"] as const;

export async function listCustomers(p: Record<string, string | undefined>) {
  await requireAdmin();
  const q = cleanQuery(p.q);
  const status = pickOptional(p.status, customerStatus.enumValues);
  const type = pickOptional(p.type, customerType.enumValues);
  const view = pick(p.view, ["active", "archived", "all"] as const, "active");
  const sort = pick(p.sort, SORTS, "created");
  const dir = p.dir === "asc" ? "asc" : "desc";
  const page = pageOf(p);

  const where: SQL[] = [];
  if (q) {
    const pat = likePattern(q);
    where.push(
      or(
        ilike(customers.companyName, pat),
        ilike(customers.contactName, pat),
        ilike(customers.email, pat),
        ilike(customers.phone, pat),
        ilike(customers.whatsapp, pat),
      )!,
    );
  }
  if (status) where.push(eq(customers.status, status));
  if (type) where.push(eq(customers.customerType, type));
  if (view === "active") where.push(isNull(customers.archivedAt));
  if (view === "archived") where.push(isNotNull(customers.archivedAt));
  const cond = where.length ? and(...where) : undefined;

  const sortCol = {
    company: sql`lower(${customers.companyName})`,
    created: customers.createdAt,
    status: customers.status,
  }[sort];

  const base = await getBaseCurrency();
  const [rows, [count]] = await Promise.all([
    db
      .select({
        id: customers.id,
        companyName: customers.companyName,
        contactName: customers.contactName,
        phone: customers.phone,
        email: customers.email,
        status: customers.status,
        customerType: customers.customerType,
        archivedAt: customers.archivedAt,
        createdAt: customers.createdAt,
        projectCount: sql<number>`(select count(*)::int from projects p where p.customer_id = ${customers.id})`,
        collected: sql<string>`(select coalesce(sum(t.base_amount),0)::text from financial_transactions t where t.customer_id = ${customers.id} and t.type='income' and t.status='completed' and t.base_currency = ${base})`,
        receivable: sql<string>`(select coalesce(sum(t.base_amount),0)::text from financial_transactions t where t.customer_id = ${customers.id} and t.type='income' and t.status='pending' and t.base_currency = ${base})`,
      })
      .from(customers)
      .where(cond)
      .orderBy(dir === "asc" ? sql`${sortCol} asc nulls last` : sql`${sortCol} desc nulls last`, desc(customers.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(customers).where(cond),
  ]);
  return { rows, total: count?.n ?? 0, page, pageSize: PAGE_SIZE, base };
}

export async function getCustomer(id: string) {
  await requireAdmin();
  const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return customer ?? null;
}

export async function getCustomerDetail(id: string) {
  await requireAdmin();
  const customer = await getCustomer(id);
  if (!customer) return null;
  const base = await getBaseCurrency();
  const [projectRows, txRows, recurring, quoteRows, notes, taskRows, cash] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        projectType: projects.projectType,
        agreedAmount: projects.agreedAmount,
        currency: projects.currency,
        collected: projectCollectedExpr(base),
      })
      .from(projects)
      .where(eq(projects.customerId, id))
      .orderBy(desc(projects.createdAt)),
    db
      .select({
        id: financialTransactions.id,
        type: financialTransactions.type,
        description: financialTransactions.description,
        amount: financialTransactions.amount,
        currency: financialTransactions.currency,
        baseAmount: financialTransactions.baseAmount,
        status: financialTransactions.status,
        transactionDate: financialTransactions.transactionDate,
        settledDate: financialTransactions.settledDate,
        dueDate: financialTransactions.dueDate,
        category: financialCategories.name,
      })
      .from(financialTransactions)
      .innerJoin(financialCategories, eq(financialCategories.id, financialTransactions.categoryId))
      .where(eq(financialTransactions.customerId, id))
      .orderBy(desc(financialTransactions.transactionDate), desc(financialTransactions.createdAt))
      .limit(50),
    db.select().from(recurringServices).where(eq(recurringServices.customerId, id)).orderBy(asc(recurringServices.nextRenewalDate)),
    db.select().from(quotes).where(eq(quotes.customerId, id)).orderBy(desc(quotes.createdAt)),
    db.select().from(customerNotes).where(eq(customerNotes.customerId, id)).orderBy(desc(customerNotes.contactDate), desc(customerNotes.createdAt)),
    db.select().from(tasks).where(eq(tasks.customerId, id)).orderBy(asc(tasks.status), asc(tasks.dueAt)).limit(20),
    customerCashSummary(db, base, id),
  ]);
  return { customer, projects: projectRows, transactions: txRows, recurring, quotes: quoteRows, notes, tasks: taskRows, cash, base };
}

/** Lightweight list for <select> inputs. */
export async function customerOptions(includeId?: string | null) {
  await requireAdmin();
  const rows = await db
    .select({ id: customers.id, name: customers.companyName, archivedAt: customers.archivedAt })
    .from(customers)
    .where(includeId ? or(isNull(customers.archivedAt), eq(customers.id, includeId)) : isNull(customers.archivedAt))
    .orderBy(sql`lower(${customers.companyName})`)
    .limit(2000);
  return rows.map((r) => ({ value: r.id, label: r.archivedAt ? `${r.name} (arşiv)` : r.name }));
}

export async function customerDependencyCounts(id: string) {
  await requireAdmin();
  const [row] = await db.execute<{ projects: number; transactions: number; recurring: number }>(sql`
    select
      (select count(*)::int from projects where customer_id = ${id}) as projects,
      (select count(*)::int from financial_transactions where customer_id = ${id}) as transactions,
      (select count(*)::int from recurring_services where customer_id = ${id}) as recurring
  `);
  return row ?? { projects: 0, transactions: 0, recurring: 0 };
}
