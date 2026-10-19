import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { getProject } from "@/server/services/projects";
import { customerOptions } from "@/server/services/customers";
import { updateProjectAction } from "@/server/actions/projects";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "../../project-form";

export const metadata: Metadata = { title: "Projeyi düzenle" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const p = await getProject(id);
  if (!p) notFound();
  const customers = await customerOptions(p.customerId);
  return (
    <>
      <PageHeader title="Projeyi düzenle" description={p.name} back={{ href: `/admin/projects/${id}`, label: p.name }} />
      <ProjectForm action={updateProjectAction} defaults={p} customers={customers} cancelHref={`/admin/projects/${id}`} />
    </>
  );
}
