/**
 * Recurring services: period maths and atomic, duplicate-proof billing of a period.
 * Billing a period creates a *pending* income transaction (an expected collection),
 * never a collected one.
 */
import { and, eq, sql } from "drizzle-orm";
import type { Database, Tx } from "@/server/db";
import { financialTransactions, recurringOccurrences, recurringServices, type Currency, type RecurringPeriod } from "@/server/db/schema";
import { addDays, addMonths, formatDate } from "@/lib/dates";
import { computeBaseValues } from "./core";

export const PERIOD_MONTHS: Record<RecurringPeriod, number> = { monthly: 1, quarterly: 3, semiannual: 6, yearly: 12 };

/** Start of the period after the one beginning at `periodStart`, anchored to the service start day. */
export function nextPeriodStart(periodStart: string, period: RecurringPeriod, anchorDay: number) {
  return addMonths(periodStart, PERIOD_MONTHS[period], anchorDay);
}

export function periodEnd(periodStart: string, period: RecurringPeriod, anchorDay: number) {
  return addDays(nextPeriodStart(periodStart, period, anchorDay), -1);
}

export function anchorDayOf(startDate: string) {
  return Number(startDate.slice(8, 10));
}

export class RecurringError extends Error {}

/**
 * Bills the service's current period (next_renewal_date) inside a DB transaction:
 *  1. locks the service row,
 *  2. inserts a pending income transaction,
 *  3. inserts the occurrence (unique per service+period — a second attempt fails),
 *  4. advances next_renewal_date by one period.
 */
export async function billNextPeriod(
  db: Database,
  args: { serviceId: string; baseCurrency: Currency; userId: string | null; expectedPeriodStart?: string },
): Promise<{ transactionId: string; periodStart: string; periodEnd: string }> {
  return db.transaction(async (tx: Tx) => {
    const [svc] = await tx
      .select()
      .from(recurringServices)
      .where(eq(recurringServices.id, args.serviceId))
      .for("update")
      .limit(1);
    if (!svc) throw new RecurringError("Hizmet bulunamadı.");
    if (svc.status !== "active") throw new RecurringError("Yalnızca aktif hizmetler için tahsilat kaydı oluşturulabilir.");
    if (args.expectedPeriodStart && args.expectedPeriodStart !== svc.nextRenewalDate) {
      throw new RecurringError("Bu dönem zaten işlenmiş. Sayfayı yenileyip tekrar kontrol edin.");
    }

    const start = svc.nextRenewalDate;
    const anchor = anchorDayOf(svc.startDate);
    const end = periodEnd(start, svc.period, anchor);

    const existing = await tx
      .select({ id: recurringOccurrences.id })
      .from(recurringOccurrences)
      .where(and(eq(recurringOccurrences.recurringServiceId, svc.id), eq(recurringOccurrences.periodStart, start)))
      .limit(1);
    if (existing.length > 0) throw new RecurringError("Bu dönem için tahsilat kaydı zaten oluşturulmuş.");

    const base = computeBaseValues({ amount: svc.amount, currency: svc.currency, baseCurrency: args.baseCurrency, exchangeRate: null });
    const [trx] = await tx
      .insert(financialTransactions)
      .values({
        type: "income",
        description: `${svc.name} (${formatDate(start)} – ${formatDate(end)})`.slice(0, 300),
        amount: svc.amount,
        currency: svc.currency,
        baseCurrency: args.baseCurrency,
        exchangeRate: base.exchangeRate,
        baseAmount: base.baseAmount,
        transactionDate: start,
        dueDate: addDays(start, svc.paymentTermDays),
        status: "pending",
        customerId: svc.customerId,
        projectId: svc.projectId,
        categoryId: svc.categoryId,
        notes: "Tekrarlayan hizmet yenilemesi ile otomatik oluşturuldu (beklenen tahsilat).",
        createdBy: args.userId,
      })
      .returning({ id: financialTransactions.id });

    await tx.insert(recurringOccurrences).values({
      recurringServiceId: svc.id,
      periodStart: start,
      periodEnd: end,
      transactionId: trx!.id,
    });

    await tx
      .update(recurringServices)
      .set({ nextRenewalDate: nextPeriodStart(start, svc.period, anchor), updatedAt: sql`now()` })
      .where(eq(recurringServices.id, svc.id));

    return { transactionId: trx!.id, periodStart: start, periodEnd: end };
  });
}
