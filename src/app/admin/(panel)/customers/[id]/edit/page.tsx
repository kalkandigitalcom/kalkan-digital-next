import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { getCustomer } from "@/server/services/customers";
import { updateCustomerAction } from "@/server/actions/customers";
import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "../../customer-form";

export const metadata: Metadata = { title: "Müşteriyi düzenle" };

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const c = await getCustomer(id);
  if (!c) notFound();
  return (
    <>
      <PageHeader title="Müşteriyi düzenle" description={c.companyName} back={{ href: `/admin/customers/${id}`, label: c.companyName }} />
      <CustomerForm action={updateCustomerAction} defaults={c} cancelHref={`/admin/customers/${id}`} />
    </>
  );
}
