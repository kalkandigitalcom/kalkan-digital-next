import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { updateTaskAction } from "@/server/actions/tasks";
import { getTask } from "@/server/services/tasks";
import { customerOptions } from "@/server/services/customers";
import { projectOptions } from "@/server/services/projects";
import { PageHeader } from "@/components/ui/page-header";
import { dateToIstanbulLocal, formatDateTime } from "@/lib/dates";
import { TaskForm } from "../../task-form";

export const metadata: Metadata = { title: "Görevi düzenle" };

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTask(id);
  if (!t) notFound();
  const [customers, projects] = await Promise.all([customerOptions(t.customerId), projectOptions(null, t.projectId)]);
  return (
    <>
      <PageHeader title="Görevi düzenle" description={`Oluşturulma: ${formatDateTime(t.createdAt)}${t.completedAt ? ` · Tamamlanma: ${formatDateTime(t.completedAt)}` : ""}`} back={{ href: "/admin/tasks", label: "Görevler" }} />
      <TaskForm
        action={updateTaskAction}
        defaults={{ ...t, dueAt: dateToIstanbulLocal(t.dueAt), remindAt: dateToIstanbulLocal(t.remindAt) }}
        customers={customers}
        projects={projects}
        cancelHref="/admin/tasks"
      />
    </>
  );
}
