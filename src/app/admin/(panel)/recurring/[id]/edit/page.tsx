import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { updateRecurringAction } from "@/server/actions/recurring";
import { getRecurringDetail } from "@/server/services/recurring";
import { customerOptions } from "@/server/services/customers";
import { projectOptions } from "@/server/services/projects";
import { categoryOptions } from "@/server/services/transactions";
import { PageHeader } from "@/components/ui/page-header";
import { RecurringForm } from "../../recurring-form";

export const metadata: Metadata = { title: "Hizmeti düzenle" };

export default async function EditRecurringPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const s = await getRecurringDetail(id);
  if (!s) notFound();
  const [customers, projects, cats] = await Promise.all([customerOptions(s.customerId), projectOptions(null, s.projectId), categoryOptions(s.categoryId)]);
  return (
    <>
      <PageHeader title="Hizmeti düzenle" description={s.name} back={{ href: `/admin/recurring/${id}`, label: s.name }} />
      <RecurringForm
        action={updateRecurringAction}
        defaults={s}
        customers={customers}
        projects={projects}
        categories={cats.filter((c) => c.type === "income")}
        cancelHref={`/admin/recurring/${id}`}
        billed={s.occurrences.length > 0}
      />
    </>
  );
}
