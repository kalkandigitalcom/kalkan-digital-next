import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { createCustomerAction } from "@/server/actions/customers";
import { PageHeader } from "@/components/ui/page-header";
import { CustomerForm } from "../customer-form";

export const metadata: Metadata = { title: "Yeni müşteri" };

export default async function NewCustomerPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Yeni müşteri" back={{ href: "/admin/customers", label: "Müşteriler" }} />
      <CustomerForm action={createCustomerAction} cancelHref="/admin/customers" />
    </>
  );
}
