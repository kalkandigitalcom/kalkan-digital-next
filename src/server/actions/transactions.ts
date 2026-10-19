"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import {
  currency,
  financialCategories,
  financialTransactions,
  paymentMethod,
  projects,
  recurringOccurrences,
  transactionStatus,
  transactionType,
} from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { getBaseCurrency } from "@/server/settings";
import { computeBaseValues } from "@/server/finance/core";
import { dbErrorMessage, errorState, parseForm, successState, v } from "@/server/validation";
import { isIsoDate, todayIso } from "@/lib/dates";
import type { ActionState } from "@/lib/action-state";

const txSchema = z
  .object({
    type: v.enumOf(transactionType.enumValues),
    description: v.requiredText(300, "Açıklama zorunludur."),
    amount: v.positiveMoney(),
    currency: v.enumOf(currency.enumValues),
    exchangeRate: v.optionalRate(),
    exchangeRateSource: v.optionalText(120),
    transactionDate: v.isoDate("İşlem tarihi zorunludur."),
    dueDate: v.optionalIsoDate(),
    settledDate: v.optionalIsoDate(),
    status: v.enumOf(transactionStatus.enumValues),
    customerId: v.optionalUuid(),
    projectId: v.optionalUuid(),
    categoryId: z.string().refine((s) => z.uuid().safeParse(s).success, "Kategori seçin."),
    paymentMethod: v.optionalEnumOf(paymentMethod.enumValues),
    documentNo: v.optionalText(80),
    notes: v.optionalText(5000),
  })
  .transform((d) => ({
    ...d,
    // A completed transaction always has a cash date; default it to the document date.
    settledDate: d.status === "completed" ? (d.settledDate ?? d.transactionDate) : null,
  }));

type TxInput = z.output<typeof txSchema>;

async function validateRelations(d: TxInput): Promise<{ ok: true; customerId: string | null } | { ok: false; state: ActionState }> {
  const [cat] = await db.select().from(financialCategories).where(eq(financialCategories.id, d.categoryId)).limit(1);
  if (!cat) return { ok: false, state: errorState("Kategori bulunamadı.", { categoryId: "Geçersiz kategori." }) };
  if (cat.type !== d.type)
    return { ok: false, state: errorState("Kategori işlem tipiyle uyuşmuyor.", { categoryId: d.type === "income" ? "Bir gelir kategorisi seçin." : "Bir gider kategorisi seçin." }) };
  let customerId = d.customerId;
  if (d.projectId) {
    const [p] = await db.select({ customerId: projects.customerId }).from(projects).where(eq(projects.id, d.projectId)).limit(1);
    if (!p) return { ok: false, state: errorState("Proje bulunamadı.", { projectId: "Geçersiz proje." }) };
    if (customerId && p.customerId && p.customerId !== customerId)
      return { ok: false, state: errorState("Seçilen proje bu müşteriye ait değil.", { projectId: "Proje farklı bir müşteriye ait." }) };
    customerId = customerId ?? p.customerId;
  }
  if (d.settledDate && d.settledDate > todayIso() && d.status === "completed")
    return { ok: false, state: errorState("Gerçekleşmiş bir işlemin tarihi gelecekte olamaz.", { settledDate: "Gelecek tarih girilemez. Bekleyen olarak kaydedin." }) };
  return { ok: true, customerId };
}

function values(d: TxInput, base: Awaited<ReturnType<typeof getBaseCurrency>>, customerId: string | null) {
  const b = computeBaseValues({ amount: d.amount, currency: d.currency, baseCurrency: base, exchangeRate: d.exchangeRate });
  return {
    type: d.type,
    description: d.description,
    amount: d.amount,
    currency: d.currency,
    baseCurrency: base,
    exchangeRate: b.exchangeRate,
    exchangeRateSource: d.currency === base ? null : d.exchangeRate ? (d.exchangeRateSource ?? "Manuel giriş") : null,
    baseAmount: b.baseAmount,
    transactionDate: d.transactionDate,
    dueDate: d.dueDate,
    settledDate: d.settledDate,
    status: d.status,
    customerId,
    projectId: d.projectId,
    categoryId: d.categoryId,
    paymentMethod: d.paymentMethod,
    documentNo: d.documentNo,
    notes: d.notes,
  };
}

function revalidateFinance() {
  // Financial figures appear on many admin pages (dashboard, customers, projects, renewals).
  revalidatePath("/admin", "layout");
}

export async function createTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(txSchema, formData);
  if (!parsed.ok) return parsed.state;
  const rel = await validateRelations(parsed.data);
  if (!rel.ok) return rel.state;
  const base = await getBaseCurrency();
  let id: string;
  try {
    const [row] = await db
      .insert(financialTransactions)
      .values({ ...values(parsed.data, base, rel.customerId), createdBy: admin.id })
      .returning({ id: financialTransactions.id });
    id = row!.id;
    await logActivity({
      userId: admin.id,
      action: "transaction.create",
      entityType: "transaction",
      entityId: id,
      summary: `${parsed.data.type === "income" ? "Gelir" : "Gider"}: ${parsed.data.description} ${parsed.data.amount} ${parsed.data.currency}`,
    });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidateFinance();
  const back = formData.get("returnTo");
  redirect(typeof back === "string" && /^\/admin\/[\w\-/]*$/.test(back) ? `${back}${back.includes("?") ? "&" : "?"}flash=created` : `/admin/transactions?flash=created`);
}

export async function updateTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(txSchema, formData);
  if (!parsed.ok) return parsed.state;
  const rel = await validateRelations(parsed.data);
  if (!rel.ok) return rel.state;
  const [before] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id.data)).limit(1);
  if (!before) return errorState("İşlem bulunamadı.");
  const [occ] = await db.select({ id: recurringOccurrences.id }).from(recurringOccurrences).where(eq(recurringOccurrences.transactionId, id.data)).limit(1);
  if (occ && parsed.data.type !== "income") return errorState("Tekrarlayan hizmetten oluşan işlemin tipi değiştirilemez.");
  try {
    const next = values(parsed.data, before.baseCurrency, rel.customerId);
    await db.update(financialTransactions).set(next).where(eq(financialTransactions.id, id.data));
    const changed = Object.fromEntries(
      Object.entries(next)
        .filter(([k, val]) => String((before as Record<string, unknown>)[k] ?? "") !== String(val ?? ""))
        .map(([k, val]) => [k, { from: (before as Record<string, unknown>)[k] ?? null, to: val ?? null }]),
    );
    await logActivity({ userId: admin.id, action: "transaction.update", entityType: "transaction", entityId: id.data, summary: parsed.data.description, details: { changed } });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidateFinance();
  redirect(`/admin/transactions?flash=updated`);
}

/** Marks a pending transaction as collected/paid on the given cash date. */
export async function settleTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const raw = String(formData.get("settledDate") ?? "");
  const date = isIsoDate(raw) ? raw : todayIso();
  if (date > todayIso()) return errorState("Tahsilat/ödeme tarihi gelecekte olamaz.");
  const res = await db
    .update(financialTransactions)
    .set({ status: "completed", settledDate: date })
    .where(and(eq(financialTransactions.id, id.data), eq(financialTransactions.status, "pending")))
    .returning({ type: financialTransactions.type, description: financialTransactions.description, baseAmount: financialTransactions.baseAmount });
  if (!res.length) return errorState("İşlem bulunamadı veya zaten bekleyen durumda değil.");
  await logActivity({ userId: admin.id, action: "transaction.settle", entityType: "transaction", entityId: id.data, summary: res[0]!.description, details: { settledDate: date } });
  revalidateFinance();
  return successState(
    `${res[0]!.type === "income" ? "Tahsil edildi" : "Ödendi"} olarak işaretlendi.${res[0]!.baseAmount === null ? " Not: kur bilgisi girilmediği için raporlarda baz para birimine çevrilmez." : ""}`,
  );
}

/**
 * Deletion policy: transactions generated by a recurring service cannot be deleted
 * (cancel them instead, so the billed period stays traceable). Other transactions can be
 * deleted after confirmation; a full snapshot is kept in the activity log.
 */
export async function deleteTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const [occ] = await db.select({ id: recurringOccurrences.id }).from(recurringOccurrences).where(eq(recurringOccurrences.transactionId, id.data)).limit(1);
  if (occ) return errorState("Bu işlem bir yenileme dönemine bağlı. Silmek yerine durumunu “İptal” yapın.");
  try {
    const res = await db.delete(financialTransactions).where(eq(financialTransactions.id, id.data)).returning();
    if (!res.length) return errorState("İşlem bulunamadı.");
    await logActivity({ userId: admin.id, action: "transaction.delete", entityType: "transaction", entityId: id.data, summary: res[0]!.description, details: { snapshot: res[0] } });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidateFinance();
  return successState("İşlem silindi.");
}

/* ------------------------------- Categories -------------------------------- */

const categorySchema = z.object({
  type: v.enumOf(transactionType.enumValues),
  name: v.requiredText(100, "Kategori adı zorunludur."),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(categorySchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const [row] = await db.insert(financialCategories).values(parsed.data).returning({ id: financialCategories.id });
    await logActivity({ userId: admin.id, action: "category.create", entityType: "category", entityId: row!.id, summary: parsed.data.name });
  } catch (e) {
    return errorState((e as { cause?: { code?: string }; code?: string }).cause?.code === "23505" || (e as { code?: string }).code === "23505" ? "Bu isimde bir kategori zaten var." : dbErrorMessage(e));
  }
  revalidatePath("/admin/settings/categories");
  return successState("Kategori eklendi.");
}

export async function updateCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(categorySchema.omit({ type: true }).extend({ isActive: v.checkbox() }), formData);
  if (!parsed.ok) return parsed.state;
  try {
    const res = await db.update(financialCategories).set(parsed.data).where(eq(financialCategories.id, id.data)).returning({ id: financialCategories.id });
    if (!res.length) return errorState("Kategori bulunamadı.");
    await logActivity({ userId: admin.id, action: "category.update", entityType: "category", entityId: id.data, summary: parsed.data.name, details: { isActive: parsed.data.isActive } });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/settings/categories");
  return successState("Kategori güncellendi.");
}

/** Categories in use cannot be deleted — deactivate them instead. */
export async function deleteCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const [usage] = await db.execute<{ n: number }>(
    sql`select ((select count(*) from financial_transactions where category_id = ${id.data}) + (select count(*) from recurring_services where category_id = ${id.data}))::int as n`,
  );
  if ((usage?.n ?? 0) > 0) return errorState("Bu kategori kullanımda. Silmek yerine pasif hale getirin.");
  const res = await db.delete(financialCategories).where(eq(financialCategories.id, id.data)).returning();
  if (!res.length) return errorState("Kategori bulunamadı.");
  await logActivity({ userId: admin.id, action: "category.delete", entityType: "category", entityId: id.data, summary: res[0]!.name });
  revalidatePath("/admin/settings/categories");
  return successState("Kategori silindi.");
}
