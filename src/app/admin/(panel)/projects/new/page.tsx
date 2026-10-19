import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { createProjectAction } from "@/server/actions/projects";
import { customerOptions } from "@/server/services/customers";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = { title: "Yeni proje" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  await requireAdmin();
  const { customerId } = await searchParams;
  const customers = await customerOptions();
  const pre = customers.some((c) => c.value === customerId) ? customerId : undefined;
  return (
    <>
      <PageHeader title="Yeni proje" back={{ href: "/admin/projects", label: "Projeler" }} />
      <ProjectForm action={createProjectAction} customers={customers} defaults={{ customerId: pre, startDate: undefined }} cancelHref={pre ? `/admin/customers/${pre}` : "/admin/projects"} />
    </>
  );
}
