import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { closeTestDb, hasTestDb, resetData, setupTestDb } from "./helpers";
import * as s from "@/server/db/schema";
import { computeBaseValues } from "@/server/finance/core";
import { addDays, todayIso } from "@/lib/dates";
import { idleState } from "@/lib/action-state";

// requireAdmin() is simulated with a real admin row (activity_logs references admin_users).
const auth = vi.hoisted(() => ({ adminId: "" }));
vi.mock("@/server/auth/session", () => ({
  requireAdmin: vi.fn(async () => ({ id: auth.adminId, email: "t@t.co", name: "T", role: "owner", sessionId: "x" })),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

type DB = Awaited<ReturnType<typeof setupTestDb>>;

describe.skipIf(!hasTestDb)("customer workspace grid (PostgreSQL)", () => {
  let db: DB;
  let svc: typeof import("@/server/services/workspace");
  let actions: typeof import("@/server/actions/workspace");
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

  async function cell(id: string, field: string, value: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("field", field);
    fd.set("value", value);
    return actions.updateWorkspaceCellAction(idleState, fd);
  }

  beforeAll(async () => {
    db = await setupTestDb();
    svc = await import("@/server/services/workspace");
    actions = await import("@/server/actions/workspace");
  });
  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetData(db);
    const [admin] = await db.insert(s.adminUsers).values({ email: "t@t.co", name: "T", passwordHash: "x" }).returning();
    auth.adminId = admin!.id;
    const cats = await db.select().from(s.financialCategories);
    incomeCat = cats.find((c) => c.type === "income" && c.name === "Hosting")!.id;
    expenseCat = cats.find((c) => c.type === "expense")!.id;
    const cs = await db
      .insert(s.customers)
      .values([
        { companyName: "Alfa Villa", status: "active", phone: "+90 532 000 00 01", email: "a@a.co", notes: "Kısa not" },
        { companyName: "Beta Otel", status: "lead" },
        { companyName: "Arşiv Ltd", status: "passive", archivedAt: new Date() },
      ])
      .returning();
    [A, B, archived] = cs.map((c) => c.id) as [string, string, string];

    const [p1, p2] = await db
      .insert(s.projects)
      .values([
        { customerId: A, name: "Alfa web sitesi", projectUrl: "https://alfa.example", agreedAmount: "1000.00", currency: "TRY", status: "completed" },
        { customerId: A, name: "Alfa rezervasyon", agreedAmount: "2000.00", currency: "TRY", status: "in_progress" },
        { customerId: A, name: "İptal proje", agreedAmount: "500.00", currency: "TRY", status: "cancelled" },
      ])
      .returning();
    await tx({ type: "income", amount: "1000.00", customerId: A, projectId: p1!.id });
    await tx({ type: "income", amount: "500.00", customerId: A, projectId: p2!.id });
    await tx({ type: "income", amount: "100.00", currency: "EUR", exchangeRate: "36.000000", customerId: A }); // 3600.00
    await tx({ type: "income", amount: "250.00", currency: "USD", customerId: A }); // no rate → excluded
    await tx({ type: "income", amount: "999.00", status: "cancelled", customerId: A });
    await tx({ type: "expense", amount: "777.00", customerId: A });
    await tx({ type: "income", amount: "300.00", status: "pending", customerId: A, dueDate: addDays(today, 10) });
    await tx({ type: "income", amount: "450.00", status: "pending", customerId: A, transactionDate: addDays(today, -20) }); // overdue
    await tx({ type: "income", amount: "70.00", status: "pending", transactionDate: addDays(today, -5) }); // no customer

    await db.insert(s.recurringServices).values([
      { customerId: A, categoryId: incomeCat, name: "Hosting", amount: "1200.00", period: "yearly", startDate: addDays(today, -400), nextRenewalDate: addDays(today, 5) },
      { customerId: A, categoryId: incomeCat, name: "Bakım", amount: "250.50", period: "monthly", startDate: addDays(today, -100), nextRenewalDate: addDays(today, 12) },
      { customerId: A, categoryId: incomeCat, name: "Domain (EUR)", amount: "20.00", currency: "EUR", period: "yearly", startDate: addDays(today, -100), nextRenewalDate: addDays(today, 90) },
      { customerId: A, categoryId: incomeCat, name: "Durdurulan", amount: "999.00", period: "quarterly", startDate: addDays(today, -400), nextRenewalDate: addDays(today, 1), status: "paused" },
      { customerId: A, categoryId: incomeCat, name: "İptal", amount: "999.00", period: "monthly", startDate: addDays(today, -400), nextRenewalDate: addDays(today, -60), status: "cancelled" },
    ]);
    await db.insert(s.customerNotes).values([
      { customerId: A, content: "eski", contactDate: addDays(today, -30), nextFollowUpDate: addDays(today, -25) },
      { customerId: A, content: "yeni", contactDate: addDays(today, -2), nextFollowUpDate: addDays(today, 7) },
    ]);

    const bp = await db.insert(s.projects).values(Array.from({ length: 4 }, (_, i) => ({ customerId: B, name: `B${i}` }))).returning();
    for (let i = 0; i < 5; i++) await tx({ type: "income", amount: "10.00", customerId: B, projectId: bp[i % 4]!.id });
    await tx({ type: "income", amount: "5.00", customerId: archived });
  });

  it("computes one row per customer with core finance rules and no duplicates", async () => {
    const { rows } = await svc.listWorkspace({});
    expect(rows.map((r) => r.companyName)).toEqual(["Alfa Villa", "Beta Otel"]); // archived hidden, sorted by name
    const a = rows.find((r) => r.id === A)!;
    expect(a.finance).toMatchObject({ collected: "5100.00", receivable: "750.00", receivableCount: 2, overdue: "450.00", overdueCount: 1, collectedMissingRate: 1 });
    const b = rows.find((r) => r.id === B)!;
    expect(b.finance.collected).toBe("50.00"); // 4 projects × 5 transactions must not multiply
    expect(b.projects).toHaveLength(4);
  });

  it("annualises active recurring fees per currency, exactly", async () => {
    const a = (await svc.listWorkspace({})).rows.find((r) => r.id === A)!;
    // 1200 (yearly) + 250.50 × 12 = 4206.00 TRY; EUR kept separate; paused & cancelled excluded.
    expect(a.annualFees).toEqual([
      { currency: "TRY", amount: "4206.00" }, // ordered by the currency enum (TRY, EUR, USD, GBP)
      { currency: "EUR", amount: "20.00" },
    ]);
    expect(a.nextRenewal).toBe(addDays(today, 5)); // paused service (+1 day) ignored
    expect(a.services.map((x) => x.name)).not.toContain("İptal");
  });

  it("returns projects with url and payment status, plus the latest follow-up", async () => {
    const a = (await svc.listWorkspace({})).rows.find((r) => r.id === A)!;
    const web = a.projects.find((p) => p.name === "Alfa web sitesi")!;
    expect(web).toMatchObject({ url: "https://alfa.example", collected: "1000.00", paymentStatus: "paid" });
    expect(a.projects.find((p) => p.name === "Alfa rezervasyon")!.paymentStatus).toBe("partial");
    expect(a.followUpDate).toBe(addDays(today, 7));
    expect(a.notes).toBe("Kısa not");
  });

  it("searches by customer, contact data and project, and switches archive views", async () => {
    expect((await svc.listWorkspace({ q: "rezervasyon" })).rows.map((r) => r.id)).toEqual([A]);
    expect((await svc.listWorkspace({ q: "alfa.example" })).rows.map((r) => r.id)).toEqual([A]);
    expect((await svc.listWorkspace({ q: "532 000" })).rows.map((r) => r.id)).toEqual([A]);
    expect((await svc.listWorkspace({ view: "archived" })).rows.map((r) => r.id)).toEqual([archived]);
    expect((await svc.listWorkspace({ view: "all" })).total).toBe(3);
    expect((await svc.listWorkspace({ view: "bogus" })).total).toBe(2);
  });

  it("edits a single field with validation and logs it", async () => {
    expect(await cell(A, "phone", "+90 555 111 22 33")).toMatchObject({ status: "success" });
    expect(await cell(A, "email", "YENI@Alfa.co")).toMatchObject({ status: "success", data: { value: "yeni@alfa.co" } });
    expect(await cell(A, "email", "geçersiz")).toMatchObject({ status: "error" });
    expect(await cell(A, "website", "alfa.com")).toMatchObject({ status: "success", data: { value: "https://alfa.com" } });
    expect(await cell(A, "companyName", "   ")).toMatchObject({ status: "error" });
    expect(await cell(A, "notes", "")).toMatchObject({ status: "success" });
    const [c] = await db.select().from(s.customers).where(eq(s.customers.id, A));
    expect(c).toMatchObject({ phone: "+90 555 111 22 33", email: "yeni@alfa.co", website: "https://alfa.com", notes: null, companyName: "Alfa Villa" });
    const logs = await db.select().from(s.activityLogs).where(eq(s.activityLogs.entityId, A));
    expect(logs.length).toBe(4);
  });

  it("refuses non-editable fields, financial columns and duplicates", async () => {
    expect(await cell(A, "archivedAt", "x")).toMatchObject({ status: "error" });
    expect(await cell(A, "collected", "1")).toMatchObject({ status: "error" });
    expect(await cell(A, "companyName", "beta otel")).toMatchObject({ status: "error" });
    expect(await cell("not-a-uuid", "notes", "x")).toMatchObject({ status: "error" });
    expect(await cell("00000000-0000-0000-0000-000000000009", "notes", "x")).toMatchObject({ status: "error" });
  });

  it("archives and restores through the status cell using the existing archive rule", async () => {
    expect(await cell(A, "status", "archived")).toMatchObject({ status: "success" });
    let [c] = await db.select().from(s.customers).where(eq(s.customers.id, A));
    expect(c!.archivedAt).not.toBeNull();
    expect(c!.status).toBe("passive");
    expect(await cell(A, "status", "active")).toMatchObject({ status: "success" });
    [c] = await db.select().from(s.customers).where(eq(s.customers.id, A));
    expect(c!.archivedAt).toBeNull();
    expect(c!.status).toBe("active");
    expect(await cell(A, "status", "deleted")).toMatchObject({ status: "error" });
  });

  it("quick-adds a customer and blocks duplicate names", async () => {
    const add = (name: string) => {
      const fd = new FormData();
      fd.set("companyName", name);
      return actions.createWorkspaceCustomerAction(idleState, fd);
    };
    const res = await add("Gamma Pansiyon");
    expect(res.status).toBe("success");
    expect(await add("gamma pansiyon")).toMatchObject({ status: "error" });
    expect(await add("  ")).toMatchObject({ status: "error" });
    const rows = (await svc.listWorkspace({})).rows;
    expect(rows.find((r) => r.companyName === "Gamma Pansiyon")?.status).toBe("active");
  });
});
