import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeTestDb, hasTestDb, resetData, setupTestDb } from "./helpers";
import * as s from "@/server/db/schema";
import { computeBaseValues, monthlySeries, openItems, periodTotals, totalsByCategory, totalsByCurrency, paymentStatusOf, projectCashSummary } from "@/server/finance/core";
import { billNextPeriod, RecurringError } from "@/server/finance/recurring";

type DB = Awaited<ReturnType<typeof setupTestDb>>;
let db: DB;
let incomeCat: string;
let expenseCat: string;
let customerId: string;

async function tx(values: Partial<typeof s.financialTransactions.$inferInsert> & { amount: string; type: "income" | "expense" }) {
  const currency = values.currency ?? "TRY";
  const base = computeBaseValues({ amount: values.amount, currency, baseCurrency: "TRY", exchangeRate: values.exchangeRate ?? null });
  const [row] = await db
    .insert(s.financialTransactions)
    .values({
      description: "test",
      currency,
      baseCurrency: "TRY",
      categoryId: values.type === "income" ? incomeCat : expenseCat,
      transactionDate: values.transactionDate ?? "2026-10-05",
      status: values.status ?? "completed",
      settledDate: values.status === "pending" || values.status === "cancelled" ? (values.settledDate ?? null) : (values.settledDate ?? values.transactionDate ?? "2026-10-05"),
      ...values,
      exchangeRate: base.exchangeRate,
      baseAmount: base.baseAmount,
    })
    .returning();
  return row!;
}

describe.skipIf(!hasTestDb)("finance core (PostgreSQL)", () => {
  beforeAll(async () => {
    db = await setupTestDb();
  });
  afterAll(async () => {
    await closeTestDb();
  });
  beforeEach(async () => {
    await resetData(db);
    const cats = await db.select().from(s.financialCategories);
    incomeCat = cats.find((c) => c.type === "income" && c.name === "Web tasarım")!.id;
    expenseCat = cats.find((c) => c.type === "expense" && c.name === "Sunucu ve hosting")!.id;
    const [c] = await db.insert(s.customers).values({ companyName: "Test Firma", status: "active" }).returning();
    customerId = c!.id;
  });

  it("separates collected income, receivables, expenses and net cash", async () => {
    await tx({ type: "income", amount: "1000.10", settledDate: "2026-10-03" });
    await tx({ type: "income", amount: "0.20", settledDate: "2026-10-31" });
    await tx({ type: "income", amount: "5000.00", status: "pending", transactionDate: "2026-10-01", dueDate: "2026-10-10" });
    await tx({ type: "income", amount: "700.00", status: "cancelled" });
    await tx({ type: "income", amount: "999.00", settledDate: "2026-11-01" }); // outside range
    await tx({ type: "expense", amount: "300.05", settledDate: "2026-10-15" });
    await tx({ type: "expense", amount: "50.00", status: "pending", transactionDate: "2026-10-20" });

    const t = await periodTotals(db, "TRY", "2026-10-01", "2026-10-31");
    expect(t.collectedIncome).toBe("1000.30");
    expect(t.paidExpense).toBe("300.05");
    expect(t.net).toBe("700.25");
    expect(t.incomeCount).toBe(2);

    const recv = await openItems(db, "TRY", "income", "2026-10-19");
    expect(recv.total).toBe("5000.00");
    expect(recv.overdueCount).toBe(1);
    const pay = await openItems(db, "TRY", "expense", "2026-10-19");
    expect(pay.total).toBe("50.00");
    expect(pay.overdueCount).toBe(0);
  });

  it("uses the settled (cash) date, not the document date", async () => {
    await tx({ type: "income", amount: "100.00", transactionDate: "2026-09-25", settledDate: "2026-10-02" });
    const sep = await periodTotals(db, "TRY", "2026-09-01", "2026-09-30");
    const oct = await periodTotals(db, "TRY", "2026-10-01", "2026-10-31");
    expect(sep.collectedIncome).toBe("0");
    expect(oct.collectedIncome).toBe("100.00");
  });

  it("never adds currencies together; excludes foreign amounts without a rate", async () => {
    await tx({ type: "income", amount: "100.00", currency: "EUR", exchangeRate: "36.500000" });
    await tx({ type: "income", amount: "200.00", currency: "USD" }); // no rate → excluded
    await tx({ type: "income", amount: "50.00" });
    const t = await periodTotals(db, "TRY", "2026-10-01", "2026-10-31");
    expect(t.collectedIncome).toBe("3700.00");
    expect(t.missingRateCount).toBe(1);
    const byCur = await totalsByCurrency(db, "TRY", "2026-10-01", "2026-10-31");
    expect(byCur.find((r) => r.currency === "USD")).toMatchObject({ amount: "200.00", baseAmount: "0", missingRateCount: 1 });
    expect(byCur.find((r) => r.currency === "EUR")).toMatchObject({ amount: "100.00", baseAmount: "3650.00" });
  });

  it("enforces DB constraints for financial integrity", async () => {
    await expect(tx({ type: "income", amount: "0" })).rejects.toThrow();
    await expect(
      db.insert(s.financialTransactions).values({
        type: "income", description: "x", amount: "10.00", currency: "TRY", baseCurrency: "TRY", baseAmount: "10.00", exchangeRate: "1",
        categoryId: incomeCat, transactionDate: "2026-10-01", status: "completed", settledDate: null,
      }),
    ).rejects.toThrow();
    await expect(
      db.insert(s.financialTransactions).values({
        type: "income", description: "x", amount: "10.00", currency: "TRY", baseCurrency: "TRY", baseAmount: "11.00", exchangeRate: "1",
        categoryId: incomeCat, transactionDate: "2026-10-01", status: "pending",
      }),
    ).rejects.toThrow();
  });

  it("restricts deleting customers that have financial records", async () => {
    await tx({ type: "income", amount: "10.00", customerId });
    await expect(db.delete(s.customers).where(eq(s.customers.id, customerId))).rejects.toThrow();
  });

  it("builds monthly series and category totals", async () => {
    await tx({ type: "income", amount: "10.00", settledDate: "2026-01-15" });
    await tx({ type: "income", amount: "20.00", settledDate: "2026-03-15" });
    await tx({ type: "expense", amount: "5.00", settledDate: "2026-03-20" });
    const m = await monthlySeries(db, "TRY", 2026);
    expect(m).toHaveLength(12);
    expect(m[0]).toMatchObject({ income: "10.00", expense: "0" });
    expect(m[2]).toMatchObject({ income: "20.00", expense: "5.00", net: "15.00" });
    const cats = await totalsByCategory(db, "TRY", "income", "2026-01-01", "2026-12-31");
    expect(cats[0]).toMatchObject({ name: "Web tasarım", total: "30.00", count: 2 });
  });

  it("computes project payment status from linked collected income only", async () => {
    const [p] = await db.insert(s.projects).values({ name: "Site", customerId, agreedAmount: "1000.00", currency: "TRY", status: "completed" }).returning();
    // Completing a project does not create or collect anything.
    expect((await projectCashSummary(db, "TRY", p!.id)).collected).toBe("0");
    await tx({ type: "income", amount: "400.00", projectId: p!.id });
    await tx({ type: "income", amount: "600.00", projectId: p!.id, status: "pending" });
    const sum = await projectCashSummary(db, "TRY", p!.id);
    expect(sum.collected).toBe("400.00");
    expect(sum.receivable).toBe("600.00");
    expect(paymentStatusOf("1000.00", sum.collected)).toBe("partial");
    expect(paymentStatusOf("1000.00", "1000.00")).toBe("paid");
    expect(paymentStatusOf(null, "0")).toBe("not_set");
  });

  it("bills recurring periods as pending income and prevents double billing", async () => {
    const [svc] = await db
      .insert(s.recurringServices)
      .values({ customerId, categoryId: incomeCat, name: "Hosting", amount: "1200.00", currency: "TRY", period: "yearly", startDate: "2025-11-01", nextRenewalDate: "2026-11-01", paymentTermDays: 15 })
      .returning();

    const [a, b] = await Promise.allSettled([
      billNextPeriod(db, { serviceId: svc!.id, baseCurrency: "TRY", userId: null, expectedPeriodStart: "2026-11-01" }),
      billNextPeriod(db, { serviceId: svc!.id, baseCurrency: "TRY", userId: null, expectedPeriodStart: "2026-11-01" }),
    ]);
    const ok = [a, b].filter((r) => r.status === "fulfilled");
    const failed = [a, b].filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed[0]!.reason).toBeInstanceOf(RecurringError);

    const trxs = await db.select().from(s.financialTransactions);
    expect(trxs).toHaveLength(1);
    expect(trxs[0]).toMatchObject({ status: "pending", type: "income", amount: "1200.00", dueDate: "2026-11-16", settledDate: null });
    const [updated] = await db.select().from(s.recurringServices).where(eq(s.recurringServices.id, svc!.id));
    expect(updated!.nextRenewalDate).toBe("2027-11-01");

    // Expected renewal is NOT collected income.
    const t = await periodTotals(db, "TRY", "2026-01-01", "2027-12-31");
    expect(t.collectedIncome).toBe("0");

    // Unique (service, period_start) at the DB level as a last line of defence.
    await expect(
      db.insert(s.recurringOccurrences).values({ recurringServiceId: svc!.id, periodStart: "2026-11-01", periodEnd: "2027-10-31", transactionId: trxs[0]!.id }),
    ).rejects.toThrow();
  });

  it("refuses to bill paused services", async () => {
    const [svc] = await db
      .insert(s.recurringServices)
      .values({ customerId, categoryId: incomeCat, name: "Bakım", amount: "100.00", period: "monthly", startDate: "2026-01-01", nextRenewalDate: "2026-11-01", status: "paused" })
      .returning();
    await expect(billNextPeriod(db, { serviceId: svc!.id, baseCurrency: "TRY", userId: null })).rejects.toBeInstanceOf(RecurringError);
  });
});
