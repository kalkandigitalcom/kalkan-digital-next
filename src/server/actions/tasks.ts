"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { projects, taskPriority, tasks, taskStatus } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { dbErrorMessage, errorState, parseForm, successState, v } from "@/server/validation";
import { istanbulLocalToDate } from "@/lib/dates";
import type { ActionState } from "@/lib/action-state";

const localDateTime = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((s, ctx) => {
      if (!s) return null;
      const d = istanbulLocalToDate(s);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "Geçerli bir tarih ve saat seçin." });
        return z.NEVER;
      }
      return d;
    });

const schema = z.object({
  title: v.requiredText(200, "Görev başlığı zorunludur."),
  description: v.optionalText(5000),
  customerId: v.optionalUuid(),
  projectId: v.optionalUuid(),
  dueAt: localDateTime(),
  remindAt: localDateTime(),
  priority: v.enumOf(taskPriority.enumValues),
  status: v.enumOf(taskStatus.enumValues),
});

async function normalize(d: z.output<typeof schema>) {
  let customerId = d.customerId;
  if (d.projectId) {
    const [p] = await db.select({ customerId: projects.customerId }).from(projects).where(eq(projects.id, d.projectId)).limit(1);
    if (!p) return { error: errorState("Proje bulunamadı.", { projectId: "Geçersiz proje." }) };
    customerId = customerId ?? p.customerId;
  }
  return { values: { ...d, customerId, completedAt: d.status === "done" ? new Date() : null } };
}

export async function createTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const n = await normalize(parsed.data);
  if (n.error) return n.error;
  try {
    const [row] = await db.insert(tasks).values({ ...n.values, createdBy: admin.id }).returning({ id: tasks.id });
    await logActivity({ userId: admin.id, action: "task.create", entityType: "task", entityId: row!.id, summary: parsed.data.title });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/tasks?flash=created");
}

export async function updateTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const n = await normalize(parsed.data);
  if (n.error) return n.error;
  try {
    const [before] = await db.select({ status: tasks.status, completedAt: tasks.completedAt }).from(tasks).where(eq(tasks.id, id.data));
    if (!before) return errorState("Görev bulunamadı.");
    const completedAt = parsed.data.status === "done" ? (before.status === "done" ? before.completedAt : new Date()) : null;
    await db.update(tasks).set({ ...n.values, completedAt }).where(eq(tasks.id, id.data));
    await logActivity({ userId: admin.id, action: "task.update", entityType: "task", entityId: id.data, summary: parsed.data.title });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/tasks?flash=updated");
}

export async function toggleTaskDoneAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const done = formData.get("done") === "1";
  const res = await db
    .update(tasks)
    .set({ status: done ? "done" : "todo", completedAt: done ? new Date() : null })
    .where(eq(tasks.id, id.data))
    .returning({ title: tasks.title });
  if (!res.length) return errorState("Görev bulunamadı.");
  await logActivity({ userId: admin.id, action: done ? "task.done" : "task.reopen", entityType: "task", entityId: id.data, summary: res[0]!.title });
  revalidatePath("/admin", "layout");
  return successState(done ? "Görev tamamlandı." : "Görev yeniden açıldı.");
}

export async function deleteTaskAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const res = await db.delete(tasks).where(eq(tasks.id, id.data)).returning();
  if (!res.length) return errorState("Görev bulunamadı.");
  await logActivity({ userId: admin.id, action: "task.delete", entityType: "task", entityId: id.data, summary: res[0]!.title, details: { snapshot: res[0] } });
  revalidatePath("/admin", "layout");
  return successState("Görev silindi.");
}
