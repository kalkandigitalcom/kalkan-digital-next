import "server-only";
import { and, desc, eq, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { customers, financialCategories, financialTransactions, projects, projectStatus, serviceType, tasks } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency } from "@/server/settings";
import { projectCashSummary, projectCollectedExpr } from "@/server/finance/core";
import { PAGE_SIZE, cleanQuery, likePattern, pageOf, pick, pickOptional } from "@/server/list";

const SORTS = ["name", "created", "agreed", "status"] as const;

export async function listProjects(p: Record<string, string | undefined>) {
  await requireAdmin();
  const base = await getBaseCurrency();
  const q = cleanQuery(p.q);
  const status = pickOptional(p.status, projectStatus.enumValues);
  const type = pickOptional(p.type, serviceType.enumValues);
  const payment = pickOptional(p.payment, ["not_set", "unpaid", "partial", "paid"] as const);
  const view = pick(p.view, ["active", "archived", "all"] as const, "active");
  const customerId = p.customerId && /^[0-9a-f-]{36}$/i.test(p.customerId) ? p.customerId : undefined;
  const sort = pick(p.sort, SORTS, "created");
  const dir = p.dir === "asc" ? "asc" : "desc";
  const page = pageOf(p);
  const collected = projectCollectedExpr(base);

  const where: SQL[] = [];
  if (q) where.push(or(ilike(projects.name, likePattern(q)), ilike(customers.companyName, likePattern(q)))!);
  if (status) where.push(eq(projects.status, status));
  if (type) where.push(eq(projects.projectType, type));
  if (customerId) where.push(eq(projects.customerId, customerId));
  if (view === "active") where.push(isNull(projects.archivedAt));
  if (view === "archived") where.push(isNotNull(projects.archivedAt));
  if (payment) {
    const agreedPositive = sql`coalesce(${projects.agreedAmount}, 0) > 0`;
    const c = sql`${collected}::numeric`;
    where.push(
      {
        not_set: sql`not (${agreedPositive})`,
        unpaid: sql`${agreedPositive} and ${c} <= 0`,
        partial: sql`${agreedPositive} and ${c} > 0 and ${c} < ${projects.agreedAmount}`,
        paid: sql`${agreedPositive} and ${c} >= ${projects.agreedAmount}`,
      }[payment],
    );
  }
  const cond = where.length ? and(...where) : undefined;
  const sortCol = {
    name: sql`lower(${projects.name})`,
    created: projects.createdAt,
    agreed: projects.agreedAmount,
    status: projects.status,
  }[sort];

  const [rows, [count]] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        projectType: projects.projectType,
        currency: projects.currency,
        agreedAmount: projects.agreedAmount,
        archivedAt: projects.archivedAt,
        customerId: projects.customerId,
        customerName: customers.companyName,
        collected,
      })
      .from(projects)
      .leftJoin(customers, eq(customers.id, projects.customerId))
      .where(cond)
      .orderBy(dir === "asc" ? sql`${sortCol} asc nulls last` : sql`${sortCol} desc nulls last`, desc(projects.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(projects).leftJoin(customers, eq(customers.id, projects.customerId)).where(cond),
  ]);
  return { rows, total: count?.n ?? 0, page, pageSize: PAGE_SIZE, base };
}

export async function getProject(id: string) {
  await requireAdmin();
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return row ?? null;
}

export async function getProjectDetail(id: string) {
  await requireAdmin();
  const project = await getProject(id);
  if (!project) return null;
  const base = await getBaseCurrency();
  const [customer, txRows, taskRows, cash, collectedRow] = await Promise.all([
    project.customerId ? db.select().from(customers).where(eq(customers.id, project.customerId)).limit(1).then((r) => r[0] ?? null) : Promise.resolve(null),
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
      .where(eq(financialTransactions.projectId, id))
      .orderBy(desc(financialTransactions.transactionDate)),
    db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(tasks.status, tasks.dueAt),
    projectCashSummary(db, base, id),
    db.select({ collected: projectCollectedExpr(base) }).from(projects).where(eq(projects.id, id)),
  ]);
  return { project, customer, transactions: txRows, tasks: taskRows, cash, base, collectedInProjectCurrency: collectedRow[0]?.collected ?? "0" };
}

export async function projectOptions(customerId?: string | null, includeId?: string | null) {
  await requireAdmin();
  const conds: SQL[] = [];
  if (customerId) conds.push(eq(projects.customerId, customerId));
  const active = isNull(projects.archivedAt);
  const rows = await db
    .select({ id: projects.id, name: projects.name, customerId: projects.customerId, customerName: customers.companyName })
    .from(projects)
    .leftJoin(customers, eq(customers.id, projects.customerId))
    .where(and(...conds, includeId ? or(active, eq(projects.id, includeId)) : active))
    .orderBy(desc(projects.createdAt))
    .limit(2000);
  return rows.map((r) => ({ value: r.id, label: r.customerName ? `${r.name} — ${r.customerName}` : r.name, customerId: r.customerId }));
}
