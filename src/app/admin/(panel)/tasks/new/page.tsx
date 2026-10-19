import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { createTaskAction } from "@/server/actions/tasks";
import { customerOptions } from "@/server/services/customers";
import { projectOptions } from "@/server/services/projects";
import { PageHeader } from "@/components/ui/page-header";
import { TaskForm } from "../task-form";

export const metadata: Metadata = { title: "Yeni görev" };

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ customerId?: string; projectId?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [customers, projects] = await Promise.all([customerOptions(), projectOptions()]);
  const project = projects.find((p) => p.value === sp.projectId);
  const customerId = customers.some((c) => c.value === sp.customerId) ? sp.customerId : (project?.customerId ?? undefined);
  return (
    <>
      <PageHeader title="Yeni görev" back={{ href: "/admin/tasks", label: "Görevler" }} />
      <TaskForm action={createTaskAction} defaults={{ customerId, projectId: project?.value }} customers={customers} projects={projects} cancelHref="/admin/tasks" />
    </>
  );
}
