import "server-only";
import { and, asc, desc, eq, exists, ilike, inArray, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { customerNotes, customers, projects, recurringServices as rs } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { getBaseCurrency } from "@/server/settings";
import { customerIncomeTotals, paymentStatusOf, projectCollectedExpr, type CustomerIncomeTotals, type PaymentStatus } from "@/server/finance/core";
import { cleanQuery, likePattern, pageOf, pick } from "@/server/list";
import { todayIso } from "@/lib/dates";
import type { CurrencyCode } from "@/lib/money";

/*
 * Müşteri çalışma ekranı (/admin/workspace) – tablo görünümü veri katmanı.
 *
 * Her veri kümesi (gelir toplamları, projeler, yinelenen hizmetler, son not) müşteri bazında AYRI
 * sorgularla okunur ve JS'te birleştirilir; ilişkiler join edilip toplamlar çoğaltılmaz.
 * Finansal tanımlar src/server/finance/core.ts'ten gelir.
 */

export const WORKSPACE_PAGE_SIZE = 50;
const VIEWS = ["current", "archived", "all"] as const;

/** Periyot → yıllık çarpan. Yıllık hizmet ücreti = aktif hizmetlerin dönem ücreti × çarpan. */
export const ANNUAL_FACTOR = { monthly: 12, quarterly: 4, semiannual: 2, yearly: 1 } as const;

export interface WsProject {
  id: string;
  name: string;
  url: string | null;
  status: (typeof projects.$inferSelect)["status"];
  archived: boolean;
  currency: CurrencyCode;
  agreedAmount: string | null;
  collected: string;
  paymentStatus: PaymentStatus;
}

export interface WsService {
  id: string;
  name: string;
  amount: string;
  currency: CurrencyCode;
  period: (typeof rs.$inferSelect)["period"];
  status: (typeof rs.$inferSelect)["status"];
  nextRenewalDate: string;
}

export interface WsRow {
  id: string;
  companyName: string;
  contactName: string | null;
  customerType: (typeof customers.$inferSelect)["customerType"];
  status: (typeof customers.$inferSelect)["status"];
  archived: boolean;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  updatedAt: string;
  projects: WsProject[];
  services: WsService[];
  /** Yıllık hizmet ücreti, para birimi başına ayrı (farklı para birimleri toplanmaz). */
  annualFees: { currency: CurrencyCode; amount: string }[];
  /** En yakın yenileme (aktif hizmetler). */
  nextRenewal: string | null;
  finance: CustomerIncomeTotals;
  /** En son görüşme notunun sonraki takip tarihi. */
  followUpDate: string | null;
}

export function workspaceFilters(p: Record<string, string | undefined>) {
  return { q: cleanQuery(p.q), view: pick(p.view, VIEWS, "current"), page: pageOf(p) };
}

export async function listWorkspace(p: Record<string, string | undefined>) {
  await requireAdmin();
  const f = workspaceFilters(p);
  const base = await getBaseCurrency();
  const today = todayIso();

  const where: SQL[] = [];
  if (f.view === "current") where.push(isNull(customers.archivedAt));
  if (f.view === "archived") where.push(isNotNull(customers.archivedAt));
  if (f.q) {
    const pat = likePattern(f.q);
    where.push(
      or(
        ilike(customers.companyName, pat),
        ilike(customers.contactName, pat),
        ilike(customers.email, pat),
        ilike(customers.phone, pat),
        ilike(customers.whatsapp, pat),
        exists(db.select({ x: sql`1` }).from(projects).where(and(eq(projects.customerId, customers.id), or(ilike(projects.name, pat), ilike(projects.projectUrl, pat))))),
      )!,
    );
  }
  const cond = where.length ? and(...where) : undefined;

  const [pageRows, [count]] = await Promise.all([
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
        website: customers.website,
        address: customers.address,
        notes: customers.notes,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(cond)
      .orderBy(sql`lower(${customers.companyName}) asc`, asc(customers.id))
      .limit(WORKSPACE_PAGE_SIZE)
      .offset((f.page - 1) * WORKSPACE_PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(customers).where(cond),
  ]);

  const ids = pageRows.map((r) => r.id);
  const [finance, projectRows, serviceRows, feeRows, noteRows] = ids.length
    ? await Promise.all([
        customerIncomeTotals(db, base, today, ids),
        db
          .select({
            id: projects.id,
            customerId: projects.customerId,
            name: projects.name,
            url: projects.projectUrl,
            status: projects.status,
            archivedAt: projects.archivedAt,
            currency: projects.currency,
            agreedAmount: projects.agreedAmount,
            collected: projectCollectedExpr(base),
          })
          .from(projects)
          .where(inArray(projects.customerId, ids))
          .orderBy(asc(projects.archivedAt), desc(projects.createdAt)),
        db
          .select({
            id: rs.id,
            customerId: rs.customerId,
            name: rs.name,
            amount: rs.amount,
            currency: rs.currency,
            period: rs.period,
            status: rs.status,
            nextRenewalDate: rs.nextRenewalDate,
          })
          .from(rs)
          .where(and(inArray(rs.customerId, ids), inArray(rs.status, ["active", "paused"])))
          .orderBy(sql`case ${rs.status} when 'active' then 0 else 1 end`, asc(rs.nextRenewalDate)),
        // Exact numeric arithmetic in PostgreSQL; grouped per currency (never summed across currencies).
        db
          .select({
            customerId: rs.customerId,
            currency: rs.currency,
            amount: sql<string>`sum(${rs.amount} * case ${rs.period} when 'monthly' then 12 when 'quarterly' then 4 when 'semiannual' then 2 else 1 end)::numeric(14,2)::text`,
          })
          .from(rs)
          .where(and(inArray(rs.customerId, ids), eq(rs.status, "active")))
          .groupBy(rs.customerId, rs.currency)
          .orderBy(rs.currency),
        db
          .selectDistinctOn([customerNotes.customerId], { customerId: customerNotes.customerId, followUpDate: customerNotes.nextFollowUpDate })
          .from(customerNotes)
          .where(inArray(customerNotes.customerId, ids))
          .orderBy(customerNotes.customerId, desc(customerNotes.contactDate), desc(customerNotes.createdAt)),
      ])
    : [new Map<string, CustomerIncomeTotals>(), [], [], [], []];

  const group = <T extends { customerId: string | null }>(list: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of list) if (x.customerId) m.set(x.customerId, [...(m.get(x.customerId) ?? []), x]);
    return m;
  };
  const pj = group(projectRows);
  const sv = group(serviceRows);
  const fees = group(feeRows);
  const notes = new Map(noteRows.map((n) => [n.customerId, n.followUpDate]));

  const rows: WsRow[] = pageRows.map((c) => {
    const services = (sv.get(c.id) ?? []).map(({ customerId: _c, ...s }) => s);
    const active = services.filter((s) => s.status === "active").map((s) => s.nextRenewalDate).sort();
    return {
      id: c.id,
      companyName: c.companyName,
      contactName: c.contactName,
      customerType: c.customerType,
      status: c.status,
      archived: c.archivedAt !== null,
      phone: c.phone,
      whatsapp: c.whatsapp,
      email: c.email,
      website: c.website,
      address: c.address,
      notes: c.notes,
      updatedAt: c.updatedAt.toISOString(),
      projects: (pj.get(c.id) ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        status: p.status,
        archived: p.archivedAt !== null,
        currency: p.currency,
        agreedAmount: p.agreedAmount,
        collected: p.collected,
        paymentStatus: paymentStatusOf(p.agreedAmount, p.collected),
      })),
      services,
      annualFees: (fees.get(c.id) ?? []).map((x) => ({ currency: x.currency, amount: x.amount })),
      nextRenewal: active[0] ?? null,
      finance: (finance as Map<string, CustomerIncomeTotals>).get(c.id)!,
      followUpDate: notes.get(c.id) ?? null,
    };
  });

  return { rows, total: count?.n ?? 0, page: f.page, pageSize: WORKSPACE_PAGE_SIZE, filters: f, base, today };
}
