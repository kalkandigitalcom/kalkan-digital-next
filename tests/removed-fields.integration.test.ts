/**
 * Fields removed from the UI (document date & number, target date, quoted amount, first contact
 * date, payment term days) must not be required anymore, must get sensible values on create and
 * must keep their stored values when a record is edited.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { closeTestDb, hasTestDb, resetData, setupTestDb } from "./helpers";
import * as s from "@/server/db/schema";
import { addDays, todayIso } from "@/lib/dates";
import { idleState } from "@/lib/action-state";

const auth = vi.hoisted(() => ({ adminId: "" }));
vi.mock("@/server/auth/session", () => ({
  requireAdmin: vi.fn(async () => ({ id: auth.adminId, email: "t@t.co", name: "T", role: "owner", sessionId: "x" })),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

type DB = Awaited<ReturnType<typeof setupTestDb>>;
const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  fd.set("_inline", "1");
  return fd;
};

describe.skipIf(!hasTestDb)("fields removed from the UI (PostgreSQL)", () => {
  let db: DB;
  let tx: typeof import("@/server/actions/transactions");
  let pr: typeof import("@/server/actions/projects");
  let cu: typeof import("@/server/actions/customers");
  let rc: typeof import("@/server/actions/recurring");
  const today = todayIso();
  let customerId: string;
  let incomeCat: string;

  beforeAll(async () => {
    db = await setupTestDb();
    tx = await import("@/server/actions/transactions");
    pr = await import("@/server/actions/projects");
    cu = await import("@/server/actions/customers");
    rc = await import("@/server/actions/recurring");
  });
  afterAll(async () => {
    await closeTestDb();
  });
  beforeEach(async () => {
    await resetData(db);
    const [a] = await db.insert(s.adminUsers).values({ email: "t@t.co", name: "T", passwordHash: "x" }).returning();
    auth.adminId = a!.id;
    const [c] = await db.insert(s.customers).values({ companyName: "Alfa", firstContactDate: "2024-03-01" }).returning();
    customerId = c!.id;
    incomeCat = (await db.select().from(s.financialCategories)).find((x) => x.type === "income")!.id;
  });

  it("creates transactions without a document date: cash date for completed, today for pending", async () => {
    await tx.createTransactionAction(idleState, form({ type: "income", description: "Tahsilat", amount: "100", currency: "TRY", status: "completed", settledDate: addDays(today, -5), categoryId: incomeCat, customerId }));
    await tx.createTransactionAction(idleState, form({ type: "income", description: "Alacak", amount: "50", currency: "TRY", status: "pending", dueDate: addDays(today, 10), categoryId: incomeCat, customerId }));
    const rows = await db.select().from(s.financialTransactions);
    expect(rows.find((r) => r.description === "Tahsilat")).toMatchObject({ transactionDate: addDays(today, -5), settledDate: addDays(today, -5), documentNo: null });
    expect(rows.find((r) => r.description === "Alacak")).toMatchObject({ transactionDate: today, dueDate: addDays(today, 10), settledDate: null });
  });

  it("requires the cash date for completed transactions", async () => {
    const res = await tx.createTransactionAction(idleState, form({ type: "income", description: "x", amount: "1", currency: "TRY", status: "completed", categoryId: incomeCat }));
    expect(res).toMatchObject({ status: "error", fieldErrors: { settledDate: "Tahsilat tarihini girin." } });
  });

  it("keeps the stored document date and number when a transaction is edited", async () => {
    const [t] = await db
      .insert(s.financialTransactions)
      .values({ type: "income", description: "Eski", amount: "10.00", currency: "TRY", baseCurrency: "TRY", baseAmount: "10.00", exchangeRate: "1", transactionDate: "2025-01-02", documentNo: "FAT-1", status: "pending", categoryId: incomeCat })
      .returning();
    await expect(
      tx.updateTransactionAction(idleState, form({ id: t!.id, type: "income", description: "Yeni", amount: "12", currency: "TRY", status: "completed", settledDate: today, categoryId: incomeCat })),
    ).rejects.toThrow(); // update redirects to the list on success (existing behaviour)
    const [after] = await db.select().from(s.financialTransactions).where(eq(s.financialTransactions.id, t!.id));
    expect(after).toMatchObject({ description: "Yeni", amount: "12.00", status: "completed", settledDate: today, transactionDate: "2025-01-02", documentNo: "FAT-1" });
  });

  it("keeps target date and quoted amount when a project is edited", async () => {
    const [p] = await db.insert(s.projects).values({ customerId, name: "P", currency: "TRY", targetDate: "2026-12-31", quotedAmount: "900.00", agreedAmount: "800.00" }).returning();
    const res = await pr.updateProjectAction(idleState, form({ id: p!.id, customerId, name: "P2", projectType: "web_design", currency: "TRY", status: "in_progress", agreedAmount: "850" }));
    expect(res.status).toBe("success");
    const [after] = await db.select().from(s.projects).where(eq(s.projects.id, p!.id));
    expect(after).toMatchObject({ name: "P2", agreedAmount: "850.00", targetDate: "2026-12-31", quotedAmount: "900.00" });
  });

  it("keeps the first contact date when a customer is edited; new customers get today", async () => {
    await expect(cu.updateCustomerAction(idleState, form({ id: customerId, companyName: "Alfa 2", customerType: "company", status: "active" }))).rejects.toThrow(); // redirect
    const [after] = await db.select().from(s.customers).where(eq(s.customers.id, customerId));
    expect(after).toMatchObject({ companyName: "Alfa 2", firstContactDate: "2024-03-01" });
    await expect(cu.createCustomerAction(idleState, form({ companyName: "Beta", customerType: "company", status: "lead" }))).rejects.toThrow(); // redirect
    const [beta] = await db.select().from(s.customers).where(eq(s.customers.companyName, "Beta"));
    expect(beta!.firstContactDate).toBe(today);
  });

  it("creates services with the default payment term and keeps an existing term on edit", async () => {
    const res = await rc.createRecurringAction(idleState, form({ customerId, categoryId: incomeCat, name: "Hosting", amount: "100", currency: "TRY", period: "yearly", startDate: today, status: "active" }));
    expect(res.status).toBe("success");
    const [svc] = await db.select().from(s.recurringServices);
    expect(svc!.paymentTermDays).toBe(0);
    await db.update(s.recurringServices).set({ paymentTermDays: 15 }).where(eq(s.recurringServices.id, svc!.id));
    await expect(
      rc.updateRecurringAction(idleState, form({ id: svc!.id, customerId, categoryId: incomeCat, name: "Hosting 2", amount: "120", currency: "TRY", period: "yearly", startDate: today, nextRenewalDate: today, status: "active" })),
    ).rejects.toThrow(); // redirect
    const [after] = await db.select().from(s.recurringServices).where(eq(s.recurringServices.id, svc!.id));
    expect(after).toMatchObject({ name: "Hosting 2", paymentTermDays: 15 });
  });
});
