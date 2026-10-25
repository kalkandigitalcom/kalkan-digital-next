/**
 * Date logic for pending income / expenses after the document-date field was removed from the UI:
 *  - a pending item without a due date is never overdue (no fallback to the document date),
 *  - with a due date, overdue is decided by that date only (strictly before today),
 *  - collected / paid totals still follow the cash date (settled_date) and are not affected,
 *  - settling or editing keeps the stored document date and document number.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { closeTestDb, hasTestDb, resetData, setupTestDb } from "./helpers";
import * as s from "@/server/db/schema";
import { computeBaseValues, customerIncomeTotals, openItems, periodTotals, receivablesAgeing } from "@/server/finance/core";
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

describe.skipIf(!hasTestDb)("pending income / expense date logic (PostgreSQL)", () => {
  let db: DB;
  let txActions: typeof import("@/server/actions/transactions");
  let txService: typeof import("@/server/services/transactions");
  let workspace: typeof import("@/server/services/workspace");
  const today = todayIso();
  let customerId: string;
  let incomeCat: string;
  let expenseCat: string;

  async function tx(v: Partial<typeof s.financialTransactions.$inferInsert> & { type: "income" | "expense"; amount: string; description: string }) {
    const b = computeBaseValues({ amount: v.amount, currency: "TRY", baseCurrency: "TRY", exchangeRate: null });
    const status = v.status ?? "pending";
    const [row] = await db
      .insert(s.financialTransactions)
      .values({
        currency: "TRY",
        baseCurrency: "TRY",
        ...b,
        categoryId: v.type === "income" ? incomeCat : expenseCat,
        status,
        transactionDate: addDays(today, -60), // old document date: must never make an item overdue
        settledDate: status === "completed" ? addDays(today, -1) : null,
        ...v,
      })
      .returning();
    return row!;
  }

  beforeAll(async () => {
    db = await setupTestDb();
    txActions = await import("@/server/actions/transactions");
    txService = await import("@/server/services/transactions");
    workspace = await import("@/server/services/workspace");
  });
  afterAll(async () => {
    await closeTestDb();
  });
  beforeEach(async () => {
    await resetData(db);
    const [a] = await db.insert(s.adminUsers).values({ email: "t@t.co", name: "T", passwordHash: "x" }).returning();
    auth.adminId = a!.id;
    const [c] = await db.insert(s.customers).values({ companyName: "Alfa" }).returning();
    customerId = c!.id;
    const cats = await db.select().from(s.financialCategories);
    incomeCat = cats.find((x) => x.type === "income")!.id;
    expenseCat = cats.find((x) => x.type === "expense")!.id;

    // Income
    await tx({ type: "income", amount: "100.00", description: "vadesiz alacak", customerId }); // no due date, old doc date
    await tx({ type: "income", amount: "200.00", description: "vadesi geçmiş alacak", customerId, dueDate: addDays(today, -1) });
    await tx({ type: "income", amount: "300.00", description: "bugün vadeli alacak", customerId, dueDate: today }); // due today = not overdue yet
    await tx({ type: "income", amount: "400.00", description: "ileri vadeli alacak", customerId, dueDate: addDays(today, 15) });
    await tx({ type: "income", amount: "1000.00", description: "tahsilat", customerId, status: "completed", dueDate: addDays(today, -40) });
    await tx({ type: "income", amount: "9999.00", description: "iptal", customerId, status: "cancelled", dueDate: addDays(today, -40) });
    // Expense
    await tx({ type: "expense", amount: "50.00", description: "vadesiz borç" });
    await tx({ type: "expense", amount: "70.00", description: "vadesi geçmiş borç", dueDate: addDays(today, -100) });
    await tx({ type: "expense", amount: "500.00", description: "ödeme", status: "completed" });
  });

  it("does not count pending items without a due date as overdue; overdue follows the due date", async () => {
    const inc = await openItems(db, "TRY", "income", today);
    expect(inc).toMatchObject({ total: "1000.00", count: 4, overdueTotal: "200.00", overdueCount: 1 });
    const exp = await openItems(db, "TRY", "expense", today);
    expect(exp).toMatchObject({ total: "120.00", count: 2, overdueTotal: "70.00", overdueCount: 1 });

    // Moving the "today" reference shifts overdue only for dated items.
    const later = await openItems(db, "TRY", "income", addDays(today, 16));
    expect(later).toMatchObject({ overdueTotal: "900.00", overdueCount: 3 }); // 200 + 300 + 400, never the undated 100
  });

  it("applies the same rule per customer and in the receivables ageing", async () => {
    const totals = (await customerIncomeTotals(db, "TRY", today, [customerId])).get(customerId)!;
    expect(totals).toMatchObject({ collected: "1000.00", receivable: "1000.00", receivableCount: 4, overdue: "200.00", overdueCount: 1 });

    const ageing = await receivablesAgeing(db, "TRY", today);
    expect(ageing).toEqual({ notDue: "800.00", d0_30: "200.00", d31_90: "0", d90p: "0" }); // undated → notDue
  });

  it("filters overdue transactions by due date only", async () => {
    const res = await txService.listTransactions({ status: "overdue" });
    expect(res.rows.map((r) => r.description).sort()).toEqual(["vadesi geçmiş alacak", "vadesi geçmiş borç"]);
    expect(res.summary).toMatchObject({ receivable: "200.00", payable: "70.00" });
  });

  it("shows undated receivables in the workspace as not overdue and lists them after dated ones", async () => {
    const row = (await workspace.listWorkspace({})).rows.find((r) => r.id === customerId)!;
    expect(row.finance).toMatchObject({ receivable: "1000.00", overdue: "200.00", overdueCount: 1 });
    expect(row.openReceivables.map((t) => [t.amount, t.date])).toEqual([
      ["200.00", addDays(today, -1)],
      ["300.00", today],
      ["400.00", addDays(today, 15)],
      ["100.00", null],
    ]);
  });

  it("an overdue item stops being overdue once it is settled, and cash totals use the settle date", async () => {
    const [overdue] = await db.select().from(s.financialTransactions).where(eq(s.financialTransactions.description, "vadesi geçmiş alacak"));
    await db.update(s.financialTransactions).set({ documentNo: "FAT-7" }).where(eq(s.financialTransactions.id, overdue!.id));
    const res = await txActions.settleTransactionAction(idleState, form({ id: overdue!.id, settledDate: today }));
    expect(res.status).toBe("success");

    const [after] = await db.select().from(s.financialTransactions).where(eq(s.financialTransactions.id, overdue!.id));
    expect(after).toMatchObject({ status: "completed", settledDate: today, transactionDate: addDays(today, -60), documentNo: "FAT-7", dueDate: addDays(today, -1) });

    expect(await openItems(db, "TRY", "income", today)).toMatchObject({ total: "800.00", overdueTotal: "0", overdueCount: 0 });
    // Collected / paid are by cash date: the old document date (60 days ago) plays no role.
    const todayTotals = await periodTotals(db, "TRY", today, today);
    expect(todayTotals).toMatchObject({ collectedIncome: "200.00", paidExpense: "0", net: "200.00" });
    const lastWeek = await periodTotals(db, "TRY", addDays(today, -7), today);
    expect(lastWeek).toMatchObject({ collectedIncome: "1200.00", paidExpense: "500.00", net: "700.00", incomeCount: 2, expenseCount: 1 });
    const docDateWindow = await periodTotals(db, "TRY", addDays(today, -61), addDays(today, -59));
    expect(docDateWindow).toMatchObject({ collectedIncome: "0", paidExpense: "0" });
  });

  it("a pending item created from the form without a due date is stored without one and is not overdue", async () => {
    await resetData(db);
    const [a] = await db.insert(s.adminUsers).values({ email: "t@t.co", name: "T", passwordHash: "x" }).returning();
    auth.adminId = a!.id;
    const created = await txActions.createTransactionAction(idleState, form({ type: "expense", description: "Kira", amount: "80", currency: "TRY", status: "pending", categoryId: expenseCat }));
    expect(created.status).toBe("success");
    const withDue = await txActions.createTransactionAction(idleState, form({ type: "expense", description: "Elektrik", amount: "20", currency: "TRY", status: "pending", dueDate: addDays(today, -3), categoryId: expenseCat }));
    expect(withDue.status).toBe("success");
    const rows = await db.select().from(s.financialTransactions);
    expect(rows.find((r) => r.description === "Kira")).toMatchObject({ dueDate: null, settledDate: null, transactionDate: today });
    expect(await openItems(db, "TRY", "expense", today)).toMatchObject({ total: "100.00", count: 2, overdueTotal: "20.00", overdueCount: 1 });
  });
});
