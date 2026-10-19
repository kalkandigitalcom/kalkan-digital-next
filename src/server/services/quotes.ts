import "server-only";
import { and, asc, desc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { customers, projects, quoteItems, quotes, quoteSource, quoteStatus, serviceType } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { PAGE_SIZE, cleanQuery, likePattern, pageOf, pick, pickOptional } from "@/server/list";
import { todayIso } from "@/lib/dates";

const itemsTotal = sql<string | null>`(select round(sum(i.quantity * i.unit_price), 2)::text from ${quoteItems} i where i.quote_id = ${quotes.id})`;

export async function listQuotes(p: Record<string, string | undefined>) {
  await requireAdmin();
  const q = cleanQuery(p.q);
  const status = pickOptional(p.status, [...quoteStatus.enumValues, "open"] as const);
  const source = pickOptional(p.source, quoteSource.enumValues);
  const service = pickOptional(p.service, serviceType.enumValues);
  const follow = pickOptional(p.follow, ["overdue", "today"] as const);
  const sort = pick(p.sort, ["created", "follow", "amount", "company"] as const, "created");
  const dir = p.dir === "asc" ? "asc" : "desc";
  const page = pageOf(p);
  const today = todayIso();

  const where: SQL[] = [isNull(quotes.archivedAt)];
  if (q) where.push(or(ilike(quotes.companyName, likePattern(q)), ilike(quotes.contactName, likePattern(q)), ilike(quotes.email, likePattern(q)), ilike(quotes.title, likePattern(q)), ilike(quotes.phone, likePattern(q)))!);
  if (status === "open") where.push(sql`${quotes.status} not in ('won','lost')`);
  else if (status) where.push(eq(quotes.status, status));
  if (source) where.push(eq(quotes.source, source));
  if (service) where.push(eq(quotes.requestedService, service));
  if (follow === "overdue") where.push(sql`${quotes.nextFollowUpDate} < ${today} and ${quotes.status} not in ('won','lost')`);
  if (follow === "today") where.push(sql`${quotes.nextFollowUpDate} <= ${today} and ${quotes.status} not in ('won','lost')`);
  const cond = and(...where);
  const sortCol = { created: quotes.createdAt, follow: quotes.nextFollowUpDate, amount: quotes.estimatedAmount, company: sql`lower(${quotes.companyName})` }[sort];

  const [rows, [count], pipeline] = await Promise.all([
    db
      .select({
        id: quotes.id,
        companyName: quotes.companyName,
        contactName: quotes.contactName,
        email: quotes.email,
        phone: quotes.phone,
        title: quotes.title,
        requestedService: quotes.requestedService,
        estimatedAmount: quotes.estimatedAmount,
        currency: quotes.currency,
        quoteDate: quotes.quoteDate,
        nextFollowUpDate: quotes.nextFollowUpDate,
        status: quotes.status,
        source: quotes.source,
        customerId: quotes.customerId,
        createdAt: quotes.createdAt,
        itemsTotal,
      })
      .from(quotes)
      .where(cond)
      .orderBy(dir === "asc" ? sql`${sortCol} asc nulls last` : sql`${sortCol} desc nulls last`, desc(quotes.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(quotes).where(cond),
    db
      .select({ status: quotes.status, n: sql<number>`count(*)::int` })
      .from(quotes)
      .where(isNull(quotes.archivedAt))
      .groupBy(quotes.status),
  ]);
  return { rows, total: count?.n ?? 0, page, pageSize: PAGE_SIZE, today, pipeline };
}

export async function getQuoteDetail(id: string) {
  await requireAdmin();
  const [quote] = await db.select({ q: quotes, itemsTotal }).from(quotes).where(eq(quotes.id, id)).limit(1);
  if (!quote) return null;
  const [items, customer, project] = await Promise.all([
    db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(asc(quoteItems.sortOrder), asc(quoteItems.createdAt)),
    quote.q.customerId ? db.select().from(customers).where(eq(customers.id, quote.q.customerId)).then((r) => r[0] ?? null) : Promise.resolve(null),
    quote.q.convertedProjectId ? db.select().from(projects).where(eq(projects.id, quote.q.convertedProjectId)).then((r) => r[0] ?? null) : Promise.resolve(null),
  ]);
  return { ...quote.q, itemsTotal: quote.itemsTotal, items, customer, project };
}

/** Existing customers that look like the quote's company (to avoid duplicate customers). */
export async function findCustomerMatches(input: { companyName: string; email: string | null; phone: string | null }) {
  await requireAdmin();
  const conds: SQL[] = [sql`lower(${customers.companyName}) = lower(${input.companyName})`];
  if (input.email) conds.push(sql`lower(${customers.email}) = lower(${input.email})`);
  const digits = input.phone?.replace(/\D/g, "") ?? "";
  if (digits.length >= 7) {
    const tail = digits.slice(-10);
    conds.push(sql`right(regexp_replace(coalesce(${customers.phone}, ''), '\\D', '', 'g'), 10) = ${tail}`);
    conds.push(sql`right(regexp_replace(coalesce(${customers.whatsapp}, ''), '\\D', '', 'g'), 10) = ${tail}`);
  }
  return db
    .select({ id: customers.id, companyName: customers.companyName, email: customers.email, phone: customers.phone, archivedAt: customers.archivedAt })
    .from(customers)
    .where(or(...conds))
    .limit(5);
}

