import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { createQuoteAction } from "@/server/actions/quotes";
import { customerOptions, getCustomer } from "@/server/services/customers";
import { PageHeader } from "@/components/ui/page-header";
import { todayIso } from "@/lib/dates";
import { QuoteForm } from "../quote-form";

export const metadata: Metadata = { title: "Yeni teklif" };

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  await requireAdmin();
  const { customerId } = await searchParams;
  const customers = await customerOptions();
  const c = customerId && customers.some((x) => x.value === customerId) ? await getCustomer(customerId) : null;
  return (
    <>
      <PageHeader title="Yeni teklif" back={{ href: "/admin/quotes", label: "Teklifler" }} />
      <QuoteForm
        action={createQuoteAction}
        customers={customers}
        defaults={{ customerId: c?.id, companyName: c?.companyName, contactName: c?.contactName, phone: c?.phone, email: c?.email, quoteDate: todayIso() }}
        cancelHref="/admin/quotes"
      />
    </>
  );
}
