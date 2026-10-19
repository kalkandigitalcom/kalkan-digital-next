import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { updatePortfolioAction } from "@/server/actions/portfolio";
import { getPortfolioItem } from "@/server/services/portfolio";
import { PageHeader } from "@/components/ui/page-header";
import { PortfolioForm } from "../../portfolio-form";

export const metadata: Metadata = { title: "Portfolyo kaydını düzenle" };

export default async function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const p = await getPortfolioItem(id);
  if (!p) notFound();
  return (
    <>
      <PageHeader title="Portfolyo kaydını düzenle" description={p.title} back={{ href: "/admin/portfolio", label: "Portfolyo" }} />
      <PortfolioForm action={updatePortfolioAction} defaults={p} cancelHref="/admin/portfolio" />
    </>
  );
}
