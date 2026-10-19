import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Images, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listPortfolioAdmin } from "@/server/services/portfolio";
import { deletePortfolioAction } from "@/server/actions/portfolio";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { serviceTypes } from "@/lib/labels";

export const metadata: Metadata = { title: "Portfolyo" };

export default async function PortfolioAdminPage() {
  await requireAdmin();
  const items = await listPortfolioAdmin();
  return (
    <>
      <PageHeader title="Portfolyo" description="Web sitesindeki “Öne çıkan projeler” bölümünü buradan yönetin." actions={<LinkButton href="/admin/portfolio/new"><Plus className="size-4" /> Yeni kayıt</LinkButton>} />
      {items.length === 0 ? (
        <Card><EmptyState icon={Images} title="Portfolyo kaydı yok" description="Kayıt yayınlanana kadar web sitesinde bu bölüm, sahte referans göstermek yerine bir teklif çağrısı gösterir." action={<LinkButton href="/admin/portfolio/new" size="sm">İlk kaydı ekle</LinkButton>} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-[16/10] bg-navy-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.imagePath ? <img src={`/media/${p.imagePath}`} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-xs text-navy-400">Görsel yok</div>}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {p.isPublished ? <Badge tone="green">Yayında</Badge> : <Badge>Taslak</Badge>}
                  {p.isFeatured ? <Badge tone="blue">Öne çıkan</Badge> : null}
                  <span className="text-xs text-navy-400">Sıra {p.sortOrder}</span>
                </div>
                <h2 className="mt-2 font-display text-sm font-semibold text-navy-900">{p.title}</h2>
                <p className="text-xs text-navy-500">{serviceTypes.label(p.category)}{p.year ? ` · ${p.year}` : ""}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <LinkButton href={`/admin/portfolio/${p.id}/edit`} size="sm" variant="outline"><Pencil className="size-3.5" /> Düzenle</LinkButton>
                  {p.isPublished ? <Link href={`/projeler/${p.slug}`} target="_blank" className="inline-flex h-8 items-center gap-1 px-2 text-xs font-semibold text-brand-600 hover:underline">Sitede gör <ExternalLink className="size-3" /></Link> : null}
                  <ConfirmAction action={deletePortfolioAction} fields={{ id: p.id }} title="Kayıt silinsin mi?" description="Kayıt ve görseli kalıcı olarak silinir." confirmLabel="Sil" triggerVariant="ghost" trigger={<><Trash2 className="size-3.5" aria-hidden /><span className="sr-only">Sil</span></>} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
