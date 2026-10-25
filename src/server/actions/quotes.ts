"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { currency, customers, customerType, projects, quoteItems, quotes, quoteStatus, serviceType } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { dbErrorMessage, errorState, parseForm, successState, v } from "@/server/validation";
import { todayIso } from "@/lib/dates";
import type { ActionState } from "@/lib/action-state";

const quoteSchema = z.object({
  customerId: v.optionalUuid(),
  companyName: v.requiredText(200, "Firma / kişi adı zorunludur."),
  contactName: v.optionalText(150),
  phone: v.optionalPhone(),
  email: v.optionalEmail(),
  requestedService: v.optionalEnumOf(serviceType.enumValues),
  title: v.optionalText(200),
  estimatedAmount: v.optionalMoney(),
  currency: v.enumOf(currency.enumValues),
  quoteDate: v.optionalIsoDate(),
  nextFollowUpDate: v.optionalIsoDate(),
  status: v.enumOf(quoteStatus.enumValues),
  lostReason: v.optionalText(2000),
  notes: v.optionalText(10000),
});

export async function createQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(quoteSchema, formData);
  if (!parsed.ok) return parsed.state;
  let id: string;
  try {
    const [row] = await db.insert(quotes).values({ ...parsed.data, source: "manual" }).returning({ id: quotes.id });
    id = row!.id;
    await logActivity({ userId: admin.id, action: "quote.create", entityType: "quote", entityId: id, summary: parsed.data.companyName });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/quotes");
  redirect(`/admin/quotes/${id}?flash=created`);
}

export async function updateQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(quoteSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const res = await db.update(quotes).set(parsed.data).where(eq(quotes.id, id.data)).returning({ id: quotes.id });
    if (!res.length) return errorState("Teklif bulunamadı.");
    await logActivity({ userId: admin.id, action: "quote.update", entityType: "quote", entityId: id.data, summary: parsed.data.companyName });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath(`/admin/quotes/${id.data}`);
  redirect(`/admin/quotes/${id.data}?flash=updated`);
}

export async function setQuoteStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(z.object({ id: v.uuid(), status: v.enumOf(quoteStatus.enumValues), nextFollowUpDate: v.optionalIsoDate() }), formData);
  if (!parsed.ok) return parsed.state;
  const res = await db
    .update(quotes)
    .set({ status: parsed.data.status, ...(formData.has("nextFollowUpDate") ? { nextFollowUpDate: parsed.data.nextFollowUpDate } : {}) })
    .where(eq(quotes.id, parsed.data.id))
    .returning({ name: quotes.companyName });
  if (!res.length) return errorState("Teklif bulunamadı.");
  await logActivity({ userId: admin.id, action: "quote.status", entityType: "quote", entityId: parsed.data.id, summary: `${res[0]!.name}: ${parsed.data.status}` });
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${parsed.data.id}`);
  return successState("Teklif güncellendi.");
}

export async function deleteQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const res = await db.delete(quotes).where(eq(quotes.id, id.data)).returning();
  if (!res.length) return errorState("Teklif bulunamadı.");
  await logActivity({ userId: admin.id, action: "quote.delete", entityType: "quote", entityId: id.data, summary: res[0]!.companyName, details: { snapshot: res[0] } });
  revalidatePath("/admin/quotes");
  return successState("Teklif silindi.");
}

const itemSchema = z.object({
  quoteId: v.uuid(),
  description: v.requiredText(300, "Kalem açıklaması zorunludur."),
  quantity: v.positiveMoney("Geçerli bir miktar girin."),
  unitPrice: v.money("Geçerli bir birim fiyat girin."),
});

export async function addQuoteItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(itemSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const [{ n }] = (await db.execute<{ n: number }>(sql`select coalesce(max(sort_order), 0)::int + 1 as n from quote_items where quote_id = ${parsed.data.quoteId}`)) as unknown as [{ n: number }];
    await db.insert(quoteItems).values({ ...parsed.data, sortOrder: n });
    // Keep the estimated amount in sync with line items.
    await db.execute(sql`update quotes set estimated_amount = (select round(sum(quantity * unit_price), 2) from quote_items where quote_id = ${parsed.data.quoteId}), updated_at = now() where id = ${parsed.data.quoteId}`);
    await logActivity({ userId: admin.id, action: "quote.item_add", entityType: "quote", entityId: parsed.data.quoteId, summary: parsed.data.description });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath(`/admin/quotes/${parsed.data.quoteId}`);
  return successState("Kalem eklendi.");
}

export async function deleteQuoteItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const res = await db.delete(quoteItems).where(eq(quoteItems.id, id.data)).returning({ quoteId: quoteItems.quoteId });
  if (!res.length) return errorState("Kalem bulunamadı.");
  const quoteId = res[0]!.quoteId;
  await db.execute(sql`update quotes set estimated_amount = (select round(sum(quantity * unit_price), 2) from quote_items where quote_id = ${quoteId}), updated_at = now() where id = ${quoteId}`);
  await logActivity({ userId: admin.id, action: "quote.item_delete", entityType: "quote", entityId: quoteId });
  revalidatePath(`/admin/quotes/${quoteId}`);
  return successState("Kalem silindi.");
}

const convertSchema = z
  .object({
    quoteId: v.uuid(),
    customerMode: z.enum(["existing", "new"], { error: "Müşteri seçeneği seçin." }),
    existingCustomerId: v.optionalUuid(),
    customerType: v.enumOf(customerType.enumValues),
    projectName: v.requiredText(200, "Proje adı zorunludur."),
    projectType: v.enumOf(serviceType.enumValues),
    agreedAmount: v.optionalMoney(),
    startDate: v.optionalIsoDate(),
  })
  .superRefine((d, ctx) => {
    if (d.customerMode === "existing" && !d.existingCustomerId)
      ctx.addIssue({ code: "custom", path: ["existingCustomerId"], message: "Mevcut müşteriyi seçin." });
  });

/**
 * Accepts a quote: creates (or reuses) the customer and creates the project in a single
 * DB transaction, then marks the quote as won. No financial transaction is created.
 */
export async function convertQuoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(convertSchema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  let projectId: string;
  try {
    projectId = await db.transaction(async (tx) => {
      const [quote] = await tx.select().from(quotes).where(eq(quotes.id, d.quoteId)).for("update").limit(1);
      if (!quote) throw new Error("NOT_FOUND");
      if (quote.convertedProjectId) throw new Error("ALREADY");
      let customerId: string;
      if (d.customerMode === "existing") {
        const [c] = await tx.select({ id: customers.id }).from(customers).where(eq(customers.id, d.existingCustomerId!)).limit(1);
        if (!c) throw new Error("NO_CUSTOMER");
        customerId = c.id;
        await tx.update(customers).set({ status: "active", archivedAt: null }).where(and(eq(customers.id, customerId)));
      } else {
        const [c] = await tx
          .insert(customers)
          .values({
            companyName: quote.companyName,
            contactName: quote.contactName,
            phone: quote.phone,
            email: quote.email,
            customerType: d.customerType,
            status: "active",
            source: quote.source === "website_form" ? "website" : null,
            firstContactDate: quote.createdAt.toISOString().slice(0, 10),
            notes: quote.message ? `Web formu mesajı:\n${quote.message}` : null,
          })
          .returning({ id: customers.id });
        customerId = c!.id;
      }
      const [p] = await tx
        .insert(projects)
        .values({
          customerId,
          name: d.projectName,
          projectType: d.projectType,
          currency: quote.currency,
          quotedAmount: quote.estimatedAmount,
          agreedAmount: d.agreedAmount ?? quote.estimatedAmount,
          startDate: d.startDate ?? todayIso(),
          status: "planned",
          description: quote.title ?? null,
        })
        .returning({ id: projects.id });
      await tx.update(quotes).set({ status: "won", customerId, convertedProjectId: p!.id }).where(eq(quotes.id, quote.id));
      await logActivity(
        { userId: admin.id, action: "quote.convert", entityType: "quote", entityId: quote.id, summary: `${quote.companyName} → proje`, details: { customerId, projectId: p!.id, customerMode: d.customerMode } },
        tx,
      );
      return p!.id;
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "NOT_FOUND") return errorState("Teklif bulunamadı.");
    if (msg === "ALREADY") return errorState("Bu teklif zaten projeye dönüştürülmüş.");
    if (msg === "NO_CUSTOMER") return errorState("Seçilen müşteri bulunamadı.");
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/projects/${projectId}?flash=converted`);
}
