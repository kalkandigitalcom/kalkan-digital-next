import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Trash2 } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { deleteTransactionAction, updateTransactionAction } from "@/server/actions/transactions";
import { categoryOptions, getTransaction } from "@/server/services/transactions";
import { customerOptions } from "@/server/services/customers";
import { projectOptions } from "@/server/services/projects";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { formatDateTime, todayIso } from "@/lib/dates";
import { TransactionForm } from "../../transaction-form";

export const metadata: Metadata = { title: "İşlemi düzenle" };

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTransaction(id);
  if (!t) notFound();
  const [categories, customers, projects] = await Promise.all([categoryOptions(t.categoryId), customerOptions(t.customerId), projectOptions(null, t.projectId)]);
  return (
    <>
      <PageHeader
        title="İşlemi düzenle"
        description={`Oluşturulma: ${formatDateTime(t.createdAt)} · Son güncelleme: ${formatDateTime(t.updatedAt)}`}
        back={{ href: "/admin/transactions", label: "Gelir & gider" }}
        actions={
          !t.occurrenceId ? (
            <ConfirmAction
              action={deleteTransactionAction}
              fields={{ id: t.id }}
              title="İşlem silinsin mi?"
              description="Kayıt kalıcı olarak silinir (denetim kaydında bir kopyası tutulur). Kaydı korumak istiyorsanız durumunu “İptal” yapabilirsiniz."
              confirmLabel="Sil"
              trigger={<><Trash2 className="size-3.5" /> Sil</>}
              redirectTo="/admin/transactions?flash=deleted"
            />
          ) : null
        }
      />
      {t.recurringServiceId ? (
        <p className="mb-4 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-xs text-brand-800">
          Bu kayıt bir <Link href={`/admin/recurring/${t.recurringServiceId}`} className="font-semibold underline">tekrarlayan hizmet</Link> yenilemesinden oluşturuldu. Silinemez; gerekirse durumunu “İptal” yapın.
        </p>
      ) : null}
      <TransactionForm
        action={updateTransactionAction}
        defaults={t}
        categories={categories}
        customers={customers}
        projects={projects}
        baseCurrency={t.baseCurrency}
        today={todayIso()}
        cancelHref="/admin/transactions"
        lockedType={Boolean(t.occurrenceId)}
      />
    </>
  );
}
