import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { createTransactionAction } from "@/server/actions/transactions";
import { categoryOptions } from "@/server/services/transactions";
import { customerOptions } from "@/server/services/customers";
import { projectOptions } from "@/server/services/projects";
import { getBaseCurrency } from "@/server/settings";
import { PageHeader } from "@/components/ui/page-header";
import { todayIso } from "@/lib/dates";
import { TransactionForm } from "../transaction-form";

export const metadata: Metadata = { title: "Yeni işlem" };

export default async function NewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string; customerId?: string; projectId?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [categories, customers, projects, base] = await Promise.all([categoryOptions(), customerOptions(), projectOptions(), getBaseCurrency()]);
  const project = projects.find((p) => p.value === sp.projectId);
  const customerId = customers.some((c) => c.value === sp.customerId) ? sp.customerId : (project?.customerId ?? undefined);
  const returnTo = project ? `/admin/projects/${project.value}` : customerId && sp.customerId ? `/admin/customers/${customerId}` : undefined;
  return (
    <>
      <PageHeader title="Yeni gelir / gider" back={{ href: returnTo ?? "/admin/transactions", label: "Geri" }} />
      <TransactionForm
        action={createTransactionAction}
        defaults={{ type: sp.type === "expense" ? "expense" : "income", customerId, projectId: project?.value }}
        categories={categories}
        customers={customers}
        projects={projects}
        baseCurrency={base}
        today={todayIso()}
        cancelHref={returnTo ?? "/admin/transactions"}
        returnTo={returnTo}
      />
    </>
  );
}
