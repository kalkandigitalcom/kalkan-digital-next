"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { currency, customers, projects, projectStatus, serviceType } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { dbErrorMessage, errorState, parseForm, successState, v } from "@/server/validation";
import type { ActionState } from "@/lib/action-state";

const projectSchema = z
  .object({
    name: v.requiredText(200, "Proje adı zorunludur."),
    customerId: v.optionalUuid(),
    projectType: v.enumOf(serviceType.enumValues),
    description: v.optionalText(5000),
    startDate: v.optionalIsoDate(),
    targetDate: v.optionalIsoDate(),
    deliveredDate: v.optionalIsoDate(),
    currency: v.enumOf(currency.enumValues),
    quotedAmount: v.optionalMoney(),
    agreedAmount: v.optionalMoney(),
    estimatedCost: v.optionalMoney(),
    status: v.enumOf(projectStatus.enumValues),
    projectUrl: v.optionalUrl(),
    internalNotes: v.optionalText(10000),
  })
  .superRefine((d, ctx) => {
    if (d.startDate && d.targetDate && d.targetDate < d.startDate)
      ctx.addIssue({ code: "custom", path: ["targetDate"], message: "Hedef teslim tarihi başlangıçtan önce olamaz." });
    if (d.startDate && d.deliveredDate && d.deliveredDate < d.startDate)
      ctx.addIssue({ code: "custom", path: ["deliveredDate"], message: "Teslim tarihi başlangıçtan önce olamaz." });
  });

async function assertCustomer(id: string | null) {
  if (!id) return true;
  const [c] = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).limit(1);
  return Boolean(c);
}

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(projectSchema, formData);
  if (!parsed.ok) return parsed.state;
  if (!(await assertCustomer(parsed.data.customerId))) return errorState("Seçilen müşteri bulunamadı.", { customerId: "Geçersiz müşteri." });
  let id: string;
  try {
    const [row] = await db.insert(projects).values(parsed.data).returning({ id: projects.id });
    id = row!.id;
    await logActivity({ userId: admin.id, action: "project.create", entityType: "project", entityId: id, summary: parsed.data.name });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/projects");
  redirect(`/admin/projects/${id}?flash=created`);
}

export async function updateProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(projectSchema, formData);
  if (!parsed.ok) return parsed.state;
  if (!(await assertCustomer(parsed.data.customerId))) return errorState("Seçilen müşteri bulunamadı.", { customerId: "Geçersiz müşteri." });
  try {
    const [before] = await db.select({ customerId: projects.customerId, status: projects.status }).from(projects).where(eq(projects.id, id.data));
    if (!before) return errorState("Proje bulunamadı.");
    if (before.customerId && before.customerId !== parsed.data.customerId) {
      const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from financial_transactions where project_id = ${id.data} and customer_id is distinct from ${parsed.data.customerId}`)) as unknown as [{ n: number }];
      if (n > 0) return errorState("Bu projeye bağlı, farklı müşteriye ait finansal işlemler var. Müşteriyi değiştirmeden önce işlemleri güncelleyin.", { customerId: "Bağlı işlemler var." });
    }
    await db.update(projects).set(parsed.data).where(eq(projects.id, id.data));
    // Note: completing a project never changes any financial transaction status.
    await logActivity({
      userId: admin.id,
      action: "project.update",
      entityType: "project",
      entityId: id.data,
      summary: parsed.data.name,
      details: before.status !== parsed.data.status ? { statusFrom: before.status, statusTo: parsed.data.status } : undefined,
    });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath(`/admin/projects/${id.data}`);
  redirect(`/admin/projects/${id.data}?flash=updated`);
}

export async function setProjectArchivedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const archive = formData.get("archive") === "1";
  const res = await db.update(projects).set({ archivedAt: archive ? new Date() : null }).where(eq(projects.id, id.data)).returning({ name: projects.name });
  if (!res.length) return errorState("Proje bulunamadı.");
  await logActivity({ userId: admin.id, action: archive ? "project.archive" : "project.unarchive", entityType: "project", entityId: id.data, summary: res[0]!.name });
  revalidatePath(`/admin/projects/${id.data}`);
  return successState(archive ? "Proje arşivlendi." : "Proje arşivden çıkarıldı.");
}

/** Projects with financial transactions cannot be deleted (archive instead). */
export async function deleteProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from financial_transactions where project_id = ${id.data}`)) as unknown as [{ n: number }];
  if (n > 0) return errorState(`Bu projeye bağlı ${n} finansal işlem var. Finansal geçmişi korumak için silmek yerine arşivleyin.`);
  try {
    const res = await db.delete(projects).where(eq(projects.id, id.data)).returning();
    if (!res.length) return errorState("Proje bulunamadı.");
    await logActivity({ userId: admin.id, action: "project.delete", entityType: "project", entityId: id.data, summary: res[0]!.name, details: { snapshot: res[0] } });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin/projects");
  return successState("Proje silindi.");
}
