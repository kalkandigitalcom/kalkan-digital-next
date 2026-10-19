import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { createRecurringAction } from "@/server/actions/recurring";
import { customerOptions } from "@/server/services/customers";
import { projectOptions } from "@/server/services/projects";
import { categoryOptions } from "@/server/services/transactions";
import { PageHeader } from "@/components/ui/page-header";
import { todayIso } from "@/lib/dates";
import { RecurringForm } from "../recurring-form";

export const metadata: Metadata = { title: "Yeni tekrarlayan hizmet" };

export default async function NewRecurringPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  await requireAdmin();
  const { customerId } = await searchParams;
  const [customers, projects, cats] = await Promise.all([customerOptions(), projectOptions(), categoryOptions()]);
  const income = cats.filter((c) => c.type === "income");
  const hosting = income.find((c) => c.label === "Hosting");
  return (
    <>
      <PageHeader title="Yeni tekrarlayan hizmet" back={{ href: "/admin/recurring", label: "Yenilemeler" }} />
      <RecurringForm
        action={createRecurringAction}
        defaults={{ customerId: customers.some((c) => c.value === customerId) ? customerId : "", startDate: todayIso(), categoryId: hosting?.value }}
        customers={customers}
        projects={projects}
        categories={income}
        cancelHref="/admin/recurring"
      />
    </>
  );
}
