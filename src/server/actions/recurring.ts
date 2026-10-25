"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { currency, customers, financialCategories, projects, recurringPeriod, recurringServices, recurringStatus } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { getBaseCurrency } from "@/server/settings";
import { billNextPeriod, RecurringError } from "@/server/finance/recurring";
import { dueServiceIds } from "@/server/services/recurring";
import { dbErrorMessage, errorState, parseForm, successState, v } from "@/server/validation";
import { formatDate, todayIso } from "@/lib/dates";
import type { ActionState } from "@/lib/action-state";

/** Inline use from the main work screen (/admin/workspace): return a result instead of redirecting. */
function isInline(formData: FormData) {
  return formData.get("_inline") === "1";
}
const schema = z
  .object({
    customerId: z.string().refine((s) => z.uuid().safeParse(s).success, "Müşteri seçin."),
    projectId: v.optionalUuid(),
    categoryId: z.string().refine((s) => z.uuid().safeParse(s).success, "Gelir kategorisi seçin."),
    name: v.requiredText(200, "Hizmet adı zorunludur."),
    amount: v.positiveMoney(),
    currency: v.enumOf(currency.enumValues),
    period: v.enumOf(recurringPeriod.enumValues),
    startDate: v.isoDate("Başlangıç tarihi zorunludur."),
    nextRenewalDate: v.optionalIsoDate(),
    status: v.enumOf(recurringStatus.enumValues),
    autoRenew: v.checkbox(),
    paymentTermDays: z.coerce.number({ error: "Gün sayısı girin." }).int("Tam sayı girin.").min(0, "0 veya daha büyük olmalı.").max(365, "En fazla 365 gün."),
    notes: v.optionalText(5000),
  })
  .transform((d) => ({ ...d, nextRenewalDate: d.nextRenewalDate ?? d.startDate }))
  .superRefine((d, ctx) => {
    if (d.nextRenewalDate < d.startDate) ctx.addIssue({ code: "custom", path: ["nextRenewalDate"], message: "Sonraki yenileme, başlangıçtan önce olamaz." });
  });

async function checkRelations(d: z.output<typeof schema>): Promise<ActionState | null> {
  const [[c], [cat]] = await Promise.all([
    db.select({ id: customers.id }).from(customers).where(eq(customers.id, d.customerId)).limit(1),
    db.select({ type: financialCategories.type }).from(financialCategories).where(eq(financialCategories.id, d.categoryId)).limit(1),
  ]);
  if (!c) return errorState("Müşteri bulunamadı.", { customerId: "Geçersiz müşteri." });
  if (!cat || cat.type !== "income") return errorState("Bir gelir kategorisi seçin.", { categoryId: "Gelir kategorisi seçin." });
  if (d.projectId) {
    const [p] = await db.select({ customerId: projects.customerId }).from(projects).where(eq(projects.id, d.projectId)).limit(1);
    if (!p || (p.customerId && p.customerId !== d.customerId)) return errorState("Proje bu müşteriye ait değil.", { projectId: "Geçersiz proje." });
  }
  return null;
}

export async function createRecurringAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const err = await checkRelations(parsed.data);
  if (err) return err;
  let id: string;
  try {
    const [row] = await db.insert(recurringServices).values(parsed.data).returning({ id: recurringServices.id });
    id = row!.id;
    await logActivity({ userId: admin.id, action: "recurring.create", entityType: "recurring_service", entityId: id, summary: parsed.data.name });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/recurring");
  if (isInline(formData)) {
    revalidatePath("/admin", "layout");
    return successState("Hizmet eklendi.", { id });
  }
  redirect(`/admin/recurring/${id}?flash=created`);
}

export async function updateRecurringAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const err = await checkRelations(parsed.data);
  if (err) return err;
  // The next renewal date cannot be moved back into an already billed period.
  const [{ maxStart }] = (await db.execute<{ maxStart: string | null }>(
    sql`select max(period_start)::text as "maxStart" from recurring_occurrences where recurring_service_id = ${id.data}`,
  )) as unknown as [{ maxStart: string | null }];
  if (maxStart && parsed.data.nextRenewalDate <= maxStart)
    return errorState("Sonraki yenileme tarihi, faturalandırılmış son dönemden sonra olmalıdır.", {
      nextRenewalDate: `Son faturalandırılan dönem: ${formatDate(maxStart)}`,
    });
  try {
    const res = await db.update(recurringServices).set(parsed.data).where(eq(recurringServices.id, id.data)).returning({ id: recurringServices.id });
    if (!res.length) return errorState("Hizmet bulunamadı.");
    await logActivity({ userId: admin.id, action: "recurring.update", entityType: "recurring_service", entityId: id.data, summary: parsed.data.name });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath(`/admin/recurring/${id.data}`);
  redirect(`/admin/recurring/${id.data}?flash=updated`);
}

/** Creates the expected (pending) collection for the current period. Idempotent per period. */
export async function billRecurringAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const expected = String(formData.get("periodStart") ?? "") || undefined;
  try {
    const res = await billNextPeriod(db, { serviceId: id.data, baseCurrency: await getBaseCurrency(), userId: admin.id, expectedPeriodStart: expected });
    await logActivity({
      userId: admin.id,
      action: "recurring.bill",
      entityType: "recurring_service",
      entityId: id.data,
      summary: `Dönem ${formatDate(res.periodStart)} – ${formatDate(res.periodEnd)} için beklenen tahsilat oluşturuldu`,
      details: { transactionId: res.transactionId },
    });
  } catch (e) {
    if (e instanceof RecurringError) return errorState(e.message);
    const code = (e as { code?: string; cause?: { code?: string } }).code ?? (e as { cause?: { code?: string } }).cause?.code;
    if (code === "23505") return errorState("Bu dönem için tahsilat kaydı zaten oluşturulmuş.");
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/recurring");
  revalidatePath(`/admin/recurring/${id.data}`);
  revalidatePath("/admin/dashboard");
  return successState("Beklenen tahsilat kaydı oluşturuldu (henüz tahsil edilmedi).");
}

/** Bills every active service whose current period has started, one period at a time, up to today. */
export async function billAllDueAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const base = await getBaseCurrency();
  const today = todayIso();
  let created = 0;
  const failures: string[] = [];
  for (const id of await dueServiceIds()) {
    for (let i = 0; i < 36; i++) {
      const [svc] = await db.select({ next: recurringServices.nextRenewalDate, status: recurringServices.status, name: recurringServices.name }).from(recurringServices).where(eq(recurringServices.id, id));
      if (!svc || svc.status !== "active" || svc.next > today) break;
      try {
        const res = await billNextPeriod(db, { serviceId: id, baseCurrency: base, userId: admin.id, expectedPeriodStart: svc.next });
        created++;
        await logActivity({ userId: admin.id, action: "recurring.bill", entityType: "recurring_service", entityId: id, summary: `Toplu: ${formatDate(res.periodStart)} dönemi`, details: { transactionId: res.transactionId } });
      } catch (e) {
        failures.push(`${svc.name}: ${e instanceof Error ? e.message : "hata"}`);
        break;
      }
    }
  }
  revalidatePath("/admin/recurring");
  revalidatePath("/admin/dashboard");
  if (failures.length) return errorState(`${created} kayıt oluşturuldu, ${failures.length} hizmette hata: ${failures.slice(0, 3).join("; ")}`);
  return successState(created ? `${created} beklenen tahsilat kaydı oluşturuldu.` : "Vadesi gelmiş, faturalandırılmamış dönem yok.");
}

export async function deleteRecurringAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from recurring_occurrences where recurring_service_id = ${id.data}`)) as unknown as [{ n: number }];
  if (n > 0) return errorState("Bu hizmet için faturalandırılmış dönemler var. Silmek yerine durumunu “İptal edildi” yapın.");
  const res = await db.delete(recurringServices).where(eq(recurringServices.id, id.data)).returning();
  if (!res.length) return errorState("Hizmet bulunamadı.");
  await logActivity({ userId: admin.id, action: "recurring.delete", entityType: "recurring_service", entityId: id.data, summary: res[0]!.name, details: { snapshot: res[0] } });
  revalidatePath("/admin/recurring");
  return successState("Hizmet silindi.");
}
