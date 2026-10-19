import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { updateQuoteAction } from "@/server/actions/quotes";
import { getQuoteDetail } from "@/server/services/quotes";
import { customerOptions } from "@/server/services/customers";
import { PageHeader } from "@/components/ui/page-header";
import { QuoteForm } from "../../quote-form";

export const metadata: Metadata = { title: "Teklifi düzenle" };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const q = await getQuoteDetail(id);
  if (!q) notFound();
  const customers = await customerOptions(q.customerId);
  return (
    <>
      <PageHeader title="Teklifi düzenle" description={q.companyName} back={{ href: `/admin/quotes/${id}`, label: q.companyName }} />
      <QuoteForm action={updateQuoteAction} customers={customers} defaults={q} cancelHref={`/admin/quotes/${id}`} />
    </>
  );
}
