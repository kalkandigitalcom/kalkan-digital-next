import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { closeTestDb, hasTestDb, resetData, setupTestDb } from "./helpers";
import * as s from "@/server/db/schema";
import { computeBaseValues } from "@/server/finance/core";
import { addDays, todayIso } from "@/lib/dates";

// The workspace service authorises via requireAdmin(); in tests a signed-in admin is simulated.
vi.mock("@/server/auth/session", () => ({
  requireAdmin: vi.fn(async () => ({ id: "00000000-0000-0000-0000-000000000000", email: "t@t.co", name: "T", role: "owner", sessionId: "x" })),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() }));

type DB = Awaited<ReturnType<typeof setupTestDb>>;

describe.skipIf(!hasTestDb)("customer workspace (PostgreSQL)", () => {
  let db: DB;
  let svc: typeof import("@/server/services/workspace");
  const today = todayIso();
  let incomeCat: string;
  let expenseCat: string;
  let A: string;
  let B: string;
  let archived: string;

  async function tx(v: Partial<typeof s.financialTransactions.$inferInsert> & { type: "income" | "expense"; amount: string }) {
    const currency = v.currency ?? "TRY";
    const b = computeBaseValues({ amount: v.amount, currency, baseCurrency: "TRY", exchangeRate: v.exchangeRate ?? null });
    const status = v.status ?? "completed";
    const [row] = await db
      .insert(s.financialTransactions)
      .values({
        description: "t",
        currency,
        baseCurrency: "TRY",
        categoryId: v.type === "income" ? incomeCat : expenseCat,
        transactionDate: v.transactionDate ?? addDays(today, -40),
        settledDate: status === "completed" ? addDays(today, -30) : null,
        ...v,
        status,
        exchangeRate: b.exchangeRate,
        baseAmount: b.baseAmount,
      })
      .returning();
    return row!;
  }

  beforeAll(async () => {
    db = await setupTestDb();
    svc = await import("@/server/services/workspace");
  });
  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetData(db);
    const cats = await db.select().from(s.financialCategories);
    incomeCat = cats.find((c) => c.type === "income" && c.name === "Hosting")!.id;
    expenseCat = cats.find((c) => c.type === "expense")!.id;
    const cs = await db
      .insert(s.customers)
      .values([
        { companyName: "Alfa Villa", status: "active", phone: "+90 532 000 00 01", email: "a@a.co" },
        { companyName: "Beta Otel", status: "lead" },
        { companyName: "Arşiv Ltd", status: "passive", archivedAt: new Date() },
      ])
      .returning();
    [A, B, archived] = cs.map((c) => c.id) as [string, string, string];

    // Customer A: 3 projects (one cancelled), several transactions, renewals, notes, tasks.
    const [p1, p2] = await db
      .insert(s.projects)
      .values([
        { customerId: A, name: "Alfa web sitesi", agreedAmount: "1000.00", currency: "TRY", status: "completed" },
        { customerId: A, name: "Alfa rezervasyon", agreedAmount: "2000.00", currency: "TRY", status: "in_progress" },
        { customerId: A, name: "İptal proje", agreedAmount: "500.00", currency: "TRY", status: "cancelled" },
      ])
      .returning();
    await tx({ type: "income", amount: "1000.00", customerId: A, projectId: p1!.id }); // p1 paid
    await tx({ type: "income", amount: "500.00", customerId: A, projectId: p2!.id }); // p2 partial
    await tx({ type: "income", amount: "100.00", currency: "EUR", exchangeRate: "36.000000", customerId: A }); // 3600.00 base
    await tx({ type: "income", amount: "250.00", currency: "USD", customerId: A }); // no rate → excluded
    await tx({ type: "income", amount: "999.00", status: "cancelled", customerId: A }); // ignored
    await tx({ type: "expense", amount: "777.00", customerId: A }); // not income
    await tx({ type: "income", amount: "300.00", status: "pending", customerId: A, dueDate: addDays(today, 10) }); // open, not overdue
    await tx({ type: "income", amount: "450.00", status: "pending", customerId: A, transactionDate: addDays(today, -20) }); // overdue (no due date)
    await tx({ type: "income", amount: "70.00", status: "pending", transactionDate: addDays(today, -5) }); // overdue, NO customer

    const [svc1] = await db
      .insert(s.recurringServices)
      .values([
        { customerId: A, categoryId: incomeCat, name: "Hosting", amount: "1200.00", period: "yearly", startDate: addDays(today, -400), nextRenewalDate: addDays(today, 5) },
        { customerId: A, categoryId: incomeCat, name: "Domain", amount: "300.00", period: "yearly", startDate: addDays(today, -400), nextRenewalDate: addDays(today, 200) },
        { customerId: A, categoryId: incomeCat, name: "Eski bakım", amount: "100.00", period: "monthly", startDate: addDays(today, -400), nextRenewalDate: addDays(today, -60), status: "cancelled" },
      ])
      .returning();
    const billed = await tx({ type: "income", amount: "1200.00", status: "pending", customerId: A, transactionDate: addDays(today, -15), dueDate: addDays(today, -3) });
    await db.insert(s.recurringOccurrences).values({ recurringServiceId: svc1!.id, periodStart: addDays(today, -360), periodEnd: addDays(today, 4), transactionId: billed.id });

    await db.insert(s.customerNotes).values([
      { customerId: A, content: "eski", contactDate: addDays(today, -30), nextFollowUpDate: addDays(today, -25) },
      { customerId: A, content: "yeni", contactDate: addDays(today, -2), nextFollowUpDate: addDays(today, 7) },
    ]);
    await db.insert(s.tasks).values([
      { title: "gecikmiş", customerId: A, dueAt: new Date(Date.now() - 86_400_000) },
      { title: "açık", customerId: A, dueAt: new Date(Date.now() + 86_400_000), status: "in_progress" },
      { title: "bitti", customerId: A, status: "done" },
    ]);

    // Customer B: many projects AND many transactions – totals must not be multiplied by joins.
    const bp = await db.insert(s.projects).values(Array.from({ length: 4 }, (_, i) => ({ customerId: B, name: `B${i}` }))).returning();
    for (let i = 0; i < 5; i++) await tx({ type: "income", amount: "10.00", customerId: B, projectId: bp[i % 4]!.id });
    await db.insert(s.recurringServices).values([
      { customerId: B, categoryId: incomeCat, name: "B1", amount: "1.00", period: "monthly", startDate: addDays(today, -10), nextRenewalDate: addDays(today, -1) },
      { customerId: B, categoryId: incomeCat, name: "B2", amount: "1.00", period: "monthly", startDate: addDays(today, -10), nextRenewalDate: addDays(today, 20) },
    ]);
    await tx({ type: "income", amount: "5.00", customerId: archived });
  });

  it("computes per-customer finance with core rules and without duplicates", async () => {
    const res = await svc.listWorkspace({});
    const a = res.rows.find((r) => r.id === A)!;
    expect(a.finance).toEqual({
      collected: "5100.00", // 1000 + 500 + 3600 (EUR at its own rate); USD without rate & cancelled excluded
      receivable: "1950.00", // 300 + 450 + 1200
      receivableCount: 3,
      overdue: "1650.00", // 450 + 1200
      overdueCount: 2,
      missingRateCount: 1,
      collectedMissingRate: 1,
      receivableMissingRate: 0,
      overdueMissingRate: 0,
    });
    const b = res.rows.find((r) => r.id === B)!;
    expect(b.finance.collected).toBe("50.00");
    expect(b.projects).toHaveLength(4);
    expect(b.renewals).toMatchObject({ activeCount: 2, nextDate: addDays(today, -1), billedUnpaid: 0 });
  });

  it("keeps project payment status separate from customer receivables", async () => {
    const a = (await svc.listWorkspace({})).rows.find((r) => r.id === A)!;
    expect(a.projects.map((p) => p.name)).toHaveLength(3);
    expect(a.paymentMix).toEqual({ paid: 1, partial: 1 }); // cancelled project left out
  });

  it("summarises renewals, follow-ups and tasks", async () => {
    const a = (await svc.listWorkspace({})).rows.find((r) => r.id === A)!;
    expect(a.renewals).toEqual({ activeCount: 2, nextDate: addDays(today, 5), billedUnpaid: 1, billedOverdue: 1 });
    expect(a.followUp).toEqual({ lastNoteDate: addDays(today, -2), nextFollowUpDate: addDays(today, 7), openTasks: 2, overdueTasks: 1 });
  });

  it("builds summary figures from existing definitions", async () => {
    const { summary } = await svc.listWorkspace({});
    expect(summary.totalCustomers).toBe(2); // archived excluded
    expect(summary.activeCustomers).toBe(1);
    expect(summary.upcomingRenewals).toBe(3); // A Hosting (+5d), B1 (overdue), B2 (+20d); Domain (+200d) is beyond 30 days
    expect(summary.overdueRenewals).toBe(1);
    expect(summary.overdueReceivable).toBe("1720.00"); // 1650 linked + 70 unlinked
    expect(summary.unlinkedOverdue).toBe("70.00");
  });

  it("never attributes unlinked transactions to a customer", async () => {
    const rows = (await svc.listWorkspace({ view: "all" })).rows;
    const sumOverdue = rows.reduce((acc, r) => acc + Number(r.finance.overdue), 0);
    expect(sumOverdue).toBe(1650);
  });

  it("filters by view, status, search and focus", async () => {
    expect((await svc.listWorkspace({})).rows.map((r) => r.id)).not.toContain(archived);
    expect((await svc.listWorkspace({ view: "archived" })).rows.map((r) => r.id)).toEqual([archived]);
    expect((await svc.listWorkspace({ status: "lead" })).rows.map((r) => r.id)).toEqual([B]);
    expect((await svc.listWorkspace({ q: "rezervasyon" })).rows.map((r) => r.id)).toEqual([A]);
    expect((await svc.listWorkspace({ focus: "overdue_receivable" })).rows.map((r) => r.id)).toEqual([A]);
    expect((await svc.listWorkspace({ focus: "billed_unpaid" })).rows.map((r) => r.id)).toEqual([A]);
    expect((await svc.listWorkspace({ focus: "missing_rate" })).rows.map((r) => r.id)).toEqual([A]);
    expect((await svc.listWorkspace({ focus: "upcoming_renewal" })).rows.map((r) => r.id).sort()).toEqual([A, B].sort());
    expect((await svc.listWorkspace({ focus: "bogus", sort: "x; drop" })).total).toBe(2);
    expect((await svc.listWorkspace({ sort: "overdue", dir: "desc" })).rows[0]!.id).toBe(A);
  });

  it("sorts by overdue receivable using each customer's own transactions", async () => {
    await tx({ type: "income", amount: "9000.00", status: "pending", customerId: B, transactionDate: addDays(today, -9) });
    const ids = (await svc.listWorkspace({ sort: "overdue", dir: "desc" })).rows.map((r) => r.id);
    expect(ids).toEqual([B, A]);
  });

  it("loads the detail panel with the same totals", async () => {
    const d = (await svc.getWorkspaceCustomer(A))!;
    expect(d.totals.collected).toBe("5100.00");
    expect(d.totals.overdue).toBe("1650.00");
    expect(d.projects.find((p) => p.name === "Alfa rezervasyon")!.paymentStatus).toBe("partial");
    expect(d.billedUnpaid).toHaveLength(1);
    expect(d.openReceivables).toHaveLength(3);
    expect(d.openReceivables.every((r) => r.description)).toBe(true);
    expect(d.notes[0]!.content).toBe("yeni");
    expect(d.openTasks).toHaveLength(2);
    expect(await svc.getWorkspaceCustomer("00000000-0000-0000-0000-000000000001")).toBeNull();
  });
});
