import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/session";
import { createPortfolioAction } from "@/server/actions/portfolio";
import { PageHeader } from "@/components/ui/page-header";
import { PortfolioForm } from "../portfolio-form";

export const metadata: Metadata = { title: "Yeni portfolyo kaydı" };

export default async function NewPortfolioPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Yeni portfolyo kaydı" back={{ href: "/admin/portfolio", label: "Portfolyo" }} />
      <PortfolioForm action={createPortfolioAction} defaults={{}} cancelHref="/admin/portfolio" />
    </>
  );
}
