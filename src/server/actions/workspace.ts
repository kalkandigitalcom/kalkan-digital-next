"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { customers, customerType } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { dbErrorMessage, errorState, successState, v } from "@/server/validation";
import { todayIso } from "@/lib/dates";
import type { ActionState } from "@/lib/action-state";

/*
 * Çalışma ekranındaki hücre bazlı düzenleme. Yalnızca müşteri kaydının kendi alanları
 * düzenlenebilir; finansal tutarlar (ücret, ödeme, alacak) işlem kayıtlarından hesaplanır ve
 * buradan değiştirilemez.
 */

const STATUS_VALUES = ["lead", "active", "passive", "archived"] as const;

const FIELD_SCHEMAS = {
  companyName: v.requiredText(200, "Firma / müşteri adı boş olamaz."),
  contactName: v.optionalText(150),
  phone: v.optionalPhone(),
  whatsapp: v.optionalPhone(),
  email: v.optionalEmail(),
  website: v.optionalUrl(),
  address: v.optionalText(1000),
  notes: v.optionalText(5000),
  customerType: v.enumOf(customerType.enumValues),
  status: v.enumOf(STATUS_VALUES),
} as const;

export type WorkspaceField = keyof typeof FIELD_SCHEMAS;
const FIELDS = Object.keys(FIELD_SCHEMAS) as [WorkspaceField, ...WorkspaceField[]];

const LABELS: Record<WorkspaceField, string> = {
  companyName: "Firma adı",
  contactName: "Yetkili",
  phone: "Telefon",
  whatsapp: "WhatsApp",
  email: "E-posta",
  website: "Web sitesi",
  address: "Adres",
  notes: "Not",
  customerType: "Müşteri türü",
  status: "Durum",
};

const cellSchema = z.object({ id: v.uuid(), field: z.enum(FIELDS, { error: "Bu alan düzenlenemez." }), value: z.string().max(10_000).optional() });

/** Updates a single customer field. Returns the normalised value in `data.value`. */
export async function updateWorkspaceCellAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const base = cellSchema.safeParse({ id: formData.get("id"), field: formData.get("field"), value: formData.get("value") ?? "" });
  if (!base.success) return errorState(base.error.issues[0]?.message ?? "Geçersiz istek.");
  const { id, field } = base.data;
  const parsed = FIELD_SCHEMAS[field].safeParse(base.data.value ?? "");
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Geçersiz değer.");
  const value = parsed.data as string | null;

  // Same duplicate rules as the customer form (company name / e-mail, case-insensitive).
  if ((field === "companyName" || field === "email") && value) {
    const col = field === "companyName" ? customers.companyName : customers.email;
    const [dup] = await db
      .select({ name: customers.companyName })
      .from(customers)
      .where(and(sql`lower(${col}) = lower(${value})`, ne(customers.id, id)))
      .limit(1);
    if (dup) return errorState(`Bu ${field === "email" ? "e-posta" : "isim"} başka bir müşteride kayıtlı: ${dup.name}`);
  }

  let set: Partial<typeof customers.$inferInsert>;
  if (field === "status") {
    // "Arşiv" = mevcut arşivleme kuralı (arşivlenen müşteri pasif olur); diğer durumlar arşivden çıkarır.
    set = value === "archived" ? { archivedAt: new Date(), status: "passive" } : { archivedAt: null, status: value as "lead" | "active" | "passive" };
  } else {
    set = { [field]: value } as Partial<typeof customers.$inferInsert>;
  }

  try {
    const [before] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!before) return errorState("Müşteri bulunamadı.");
    await db.update(customers).set(set).where(eq(customers.id, id));
    const from = field === "status" ? (before.archivedAt ? "archived" : before.status) : (before as Record<string, unknown>)[field];
    await logActivity({
      userId: admin.id,
      action: field === "status" && value === "archived" ? "customer.archive" : "customer.update",
      entityType: "customer",
      entityId: id,
      summary: `${before.companyName}: ${LABELS[field]} güncellendi (çalışma ekranı)`,
      details: { field, from: from ?? null, to: value },
    });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin", "layout");
  return successState(`${LABELS[field]} kaydedildi.`, { value: value ?? "" });
}

const createSchema = z.object({ companyName: v.requiredText(200, "Firma / müşteri adı girin.") });

/** Quick add from the workspace: creates an active customer with only a name; the rest is edited in the grid. */
export async function createWorkspaceCustomerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = createSchema.safeParse({ companyName: formData.get("companyName") ?? "" });
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? "Geçersiz değer.");
  const { companyName } = parsed.data;
  const [dup] = await db.select({ id: customers.id }).from(customers).where(sql`lower(${customers.companyName}) = lower(${companyName})`).limit(1);
  if (dup) return errorState(`“${companyName}” adıyla kayıtlı bir müşteri zaten var.`);
  try {
    const [row] = await db
      .insert(customers)
      .values({ companyName, status: "active", firstContactDate: todayIso() })
      .returning({ id: customers.id });
    await logActivity({ userId: admin.id, action: "customer.create", entityType: "customer", entityId: row!.id, summary: `${companyName} (çalışma ekranı)` });
    revalidatePath("/admin", "layout");
    return successState("Müşteri eklendi.", { id: row!.id });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
}
