import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listCategories } from "@/server/services/transactions";
import { deleteCategoryAction } from "@/server/actions/transactions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EditCategoryRow, NewCategoryForm } from "./category-forms";

export const metadata: Metadata = { title: "Kategoriler" };

export default async function CategoriesPage() {
  await requireAdmin();
  const cats = await listCategories();
  return (
    <>
      <PageHeader title="Gelir ve gider kategorileri" description="Kullanımdaki kategoriler silinemez; pasif yapıldığında yeni kayıtlarda listelenmez, geçmiş raporlar korunur." back={{ href: "/admin/settings", label: "Ayarlar" }} />
      <Card className="mb-6">
        <CardHeader title="Yeni kategori" />
        <CardBody><NewCategoryForm /></CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {(["income", "expense"] as const).map((type) => (
          <Card key={type}>
            <CardHeader title={type === "income" ? "Gelir kategorileri" : "Gider kategorileri"} />
            <ul className="divide-y divide-navy-100">
              {cats.filter((c) => c.type === type).map((c) => (
                <li key={c.id} className="flex items-end gap-2 px-4 py-3">
                  <div className="flex-1"><EditCategoryRow c={c} /></div>
                  <div className="pb-1 text-right">
                    <p className="mb-1 text-[11px] text-navy-400">{c.usage} kayıt</p>
                    {c.usage === 0 ? (
                      <ConfirmAction action={deleteCategoryAction} fields={{ id: c.id }} title={`“${c.name}” silinsin mi?`} confirmLabel="Sil" triggerVariant="ghost" trigger={<><Trash2 className="size-3.5" aria-hidden /><span className="sr-only">Sil</span></>} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
