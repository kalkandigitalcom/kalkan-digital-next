"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { acquisitionSource, customerNotes, customers, customerStatus, customerType, noteKind } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { dbErrorMessage, errorState, parseForm, successState, v } from "@/server/validation";
import { customerDependencyCounts } from "@/server/services/customers";
import { todayIso } from "@/lib/dates";
import type { ActionState } from "@/lib/action-state";

const customerSchema = z.object({
  companyName: v.requiredText(200, "Firma / müşteri adı zorunludur."),
  contactName: v.optionalText(150),
  phone: v.optionalPhone(),
  email: v.optionalEmail(),
  whatsapp: v.optionalPhone(),
  website: v.optionalUrl(),
  address: v.optionalText(1000),
  customerType: v.enumOf(customerType.enumValues),
  status: v.enumOf(customerStatus.enumValues),
  source: v.optionalEnumOf(acquisitionSource.enumValues),
  firstContactDate: v.optionalIsoDate(),
  notes: v.optionalText(5000),
});

async function findDuplicate(data: { companyName: string; email: string | null }, excludeId?: string) {
  const conds = [sql`lower(${customers.companyName}) = lower(${data.companyName})`];
  if (data.email) conds.push(sql`lower(${customers.email}) = lower(${data.email})`);
  const [dup] = await db
    .select({ id: customers.id, companyName: customers.companyName, email: customers.email })
    .from(customers)
    .where(and(sql`(${sql.join(conds, sql` or `)})`, excludeId ? ne(customers.id, excludeId) : undefined))
    .limit(1);
  return dup ?? null;
}

export async function createCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(customerSchema, formData);
  if (!parsed.ok) return parsed.state;
  const data = parsed.data;
  const dup = await findDuplicate(data);
  if (dup) {
    const field = dup.email && data.email && dup.email.toLowerCase() === data.email ? "email" : "companyName";
    return errorState("Bu bilgilerle kayıtlı bir müşteri zaten var.", { [field]: `Mevcut kayıt: ${dup.companyName}` });
  }
  let id: string;
  try {
    const [row] = await db
      .insert(customers)
      .values({ ...data, firstContactDate: data.firstContactDate ?? todayIso() })
      .returning({ id: customers.id });
    id = row!.id;
    await logActivity({ userId: admin.id, action: "customer.create", entityType: "customer", entityId: id, summary: data.companyName });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${id}?flash=created`);
}

export async function updateCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(customerSchema, formData);
  if (!parsed.ok) return parsed.state;
  const dup = await findDuplicate(parsed.data, id.data);
  if (dup) return errorState("Bu bilgilerle kayıtlı başka bir müşteri var.", { companyName: `Mevcut kayıt: ${dup.companyName}` });
  try {
    const res = await db.update(customers).set(parsed.data).where(eq(customers.id, id.data)).returning({ id: customers.id });
    if (!res.length) return errorState("Müşteri bulunamadı.");
    await logActivity({ userId: admin.id, action: "customer.update", entityType: "customer", entityId: id.data, summary: parsed.data.companyName });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath(`/admin/customers/${id.data}`);
  redirect(`/admin/customers/${id.data}?flash=updated`);
}

export async function setCustomerArchivedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const archive = formData.get("archive") === "1";
  const res = await db
    .update(customers)
    .set({ archivedAt: archive ? new Date() : null, ...(archive ? { status: "passive" as const } : {}) })
    .where(eq(customers.id, id.data))
    .returning({ name: customers.companyName });
  if (!res.length) return errorState("Müşteri bulunamadı.");
  await logActivity({ userId: admin.id, action: archive ? "customer.archive" : "customer.unarchive", entityType: "customer", entityId: id.data, summary: res[0]!.name });
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${id.data}`);
  return successState(archive ? "Müşteri arşivlendi." : "Müşteri arşivden çıkarıldı.");
}

/**
 * Deletion policy: a customer can only be permanently deleted when it has no projects,
 * financial transactions or recurring services. Otherwise it must be archived, so that
 * financial history is never lost. Notes are deleted with the customer; quotes and tasks
 * keep existing but lose the link.
 */
export async function deleteCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const deps = await customerDependencyCounts(id.data);
  if (deps.projects || deps.transactions || deps.recurring) {
    return errorState(
      `Bu müşteriye bağlı ${deps.projects} proje, ${deps.transactions} finansal işlem ve ${deps.recurring} tekrarlayan hizmet var. Finansal geçmişi korumak için silmek yerine arşivleyin.`,
    );
  }
  try {
    const res = await db.delete(customers).where(eq(customers.id, id.data)).returning();
    if (!res.length) return errorState("Müşteri bulunamadı.");
    await logActivity({ userId: admin.id, action: "customer.delete", entityType: "customer", entityId: id.data, summary: res[0]!.companyName, details: { snapshot: res[0] } });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/customers");
  return successState("Müşteri kalıcı olarak silindi.");
}

const noteSchema = z.object({
  customerId: v.uuid(),
  kind: v.enumOf(noteKind.enumValues),
  content: v.requiredText(5000, "Not içeriği zorunludur."),
  contactDate: v.isoDate(),
  nextFollowUpDate: v.optionalIsoDate(),
});

export async function addCustomerNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(noteSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const [row] = await db.insert(customerNotes).values({ ...parsed.data, createdBy: admin.id }).returning({ id: customerNotes.id });
    await logActivity({ userId: admin.id, action: "customer.note_add", entityType: "customer", entityId: parsed.data.customerId, details: { noteId: row!.id } });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath(`/admin/customers/${parsed.data.customerId}`);
  return successState("Not eklendi.");
}

export async function deleteCustomerNoteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const res = await db.delete(customerNotes).where(eq(customerNotes.id, id.data)).returning();
  if (!res.length) return errorState("Not bulunamadı.");
  await logActivity({ userId: admin.id, action: "customer.note_delete", entityType: "customer", entityId: res[0]!.customerId, details: { snapshot: res[0] } });
  revalidatePath(`/admin/customers/${res[0]!.customerId}`);
  return successState("Not silindi.");
}
