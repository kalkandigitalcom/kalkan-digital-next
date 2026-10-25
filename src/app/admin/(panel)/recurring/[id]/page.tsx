import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getRecurringDetail } from "@/server/services/recurring";
import { deleteRecurringAction } from "@/server/actions/recurring";
import { anchorDayOf, periodEnd } from "@/server/finance/recurring";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { DetailList } from "@/components/admin/stat";
import { Money } from "@/components/admin/money";
import { recurringPeriods, recurringStatuses, transactionStatusLabel } from "@/lib/labels";
import { diffDays, formatDate, formatDateTime, todayIso } from "@/lib/dates";
import { BillButton } from "../bill-button";
import { SettleButton } from "../../transactions/settle-button";

export const metadata: Metadata = { title: "Tekrarlayan hizmet" };

export default async function RecurringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const s = await getRecurringDetail(id);
  if (!s) notFound();
  const today = todayIso();
  const days = diffDays(s.nextRenewalDate, today);
  const end = periodEnd(s.nextRenewalDate, s.period, anchorDayOf(s.startDate));
  const lastPaid = s.occurrences.find((o) => o.status === "completed")?.settledDate ?? null;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/recurring", label: "Yenilemeler" }}
        title={<span className="flex flex-wrap items-center gap-2">{s.name} <OptionBadge value={s.status} options={recurringStatuses} /></span>}
        description={<><Link href={`/admin/customers/${s.customerId}`} className="hover:text-brand-600">{s.customerName}</Link> · {recurringPeriods.label(s.period)} · <Money value={s.amount} currency={s.currency} /></>}
        actions={
          <>
            {s.status === "active" ? <BillButton id={s.id} periodStart={s.nextRenewalDate} periodLabel={`${formatDate(s.nextRenewalDate)} – ${formatDate(end)}`} /> : null}
            <LinkButton href={`/admin/recurring/${s.id}/edit`} variant="outline" size="sm"><Pencil className="size-3.5" /> Düzenle</LinkButton>
            {s.occurrences.length === 0 ? (
              <ConfirmAction action={deleteRecurringAction} fields={{ id: s.id }} title="Hizmet silinsin mi?" confirmLabel="Sil" trigger={<><Trash2 className="size-3.5" /> Sil</>} redirectTo="/admin/recurring?flash=deleted" />
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Hizmet bilgileri" />
          <CardBody className="py-2">
            <DetailList
              items={[
                { label: "Müşteri", value: <Link className="text-brand-600 hover:underline" href={`/admin/customers/${s.customerId}`}>{s.customerName}</Link> },
                { label: "Proje", value: s.projectId ? <Link className="text-brand-600 hover:underline" href={`/admin/projects/${s.projectId}`}>{s.projectName}</Link> : null },
                { label: "Kategori", value: s.categoryName },
                { label: "Ücret", value: <Money value={s.amount} currency={s.currency} /> },
                { label: "Periyot", value: recurringPeriods.label(s.period) },
                { label: "Başlangıç", value: formatDate(s.startDate) },
                {
                  label: "Sonraki yenileme",
                  value: (
                    <span className="flex flex-wrap items-center gap-2">
                      {formatDate(s.nextRenewalDate)}
                      {s.status === "active" ? <Badge tone={days < 0 ? "red" : days <= 30 ? "amber" : "gray"}>{days < 0 ? `${-days} gün geçti` : `${days} gün`}</Badge> : null}
                    </span>
                  ),
                },
                { label: "Son tahsilat", value: formatDate(lastPaid) },
                { label: "Otomatik yenileme", value: s.autoRenew ? "Açık" : "Kapalı" },
                { label: "Oluşturulma", value: formatDateTime(s.createdAt) },
              ]}
            />
            {s.notes ? <p className="whitespace-pre-line border-t border-navy-100 py-3 text-sm text-navy-700">{s.notes}</p> : null}
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Faturalandırılan dönemler" description="Her dönem için tek bir beklenen tahsilat kaydı oluşturulabilir." />
          {s.occurrences.length === 0 ? (
            <EmptyState icon={Receipt} title="Henüz dönem faturalandırılmadı" description="Yenileme zamanı geldiğinde “Tahsilat kaydı” ile beklenen tahsilatı oluşturun." />
          ) : (
            <Table>
              <THead><tr><TH>Dönem</TH><TH>Vade</TH><TH>Durum</TH><TH>Tahsilat</TH><TH className="text-right">Tutar</TH><TH /></tr></THead>
              <TBody>
                {s.occurrences.map((o) => {
                  const overdue = o.status === "pending" && o.dueDate !== null && o.dueDate < today;
                  return (
                    <TR key={o.id}>
                      <TD className="tabular text-xs">{formatDate(o.periodStart)} – {formatDate(o.periodEnd)}</TD>
                      <TD className={`tabular text-xs ${overdue ? "font-semibold text-red-600" : ""}`}>{formatDate(o.dueDate)}</TD>
                      <TD><Badge tone={o.status === "completed" ? "green" : o.status === "cancelled" ? "gray" : overdue ? "red" : "amber"}>{overdue ? "Gecikmiş" : transactionStatusLabel("income", o.status)}</Badge></TD>
                      <TD className="tabular text-xs">{formatDate(o.settledDate)}</TD>
                      <TD className="text-right"><Link href={`/admin/transactions/${o.transactionId}/edit`} className="hover:text-brand-600"><Money value={o.amount} currency={o.currency} /></Link></TD>
                      <TD className="text-right">{o.status === "pending" ? <SettleButton id={o.transactionId} type="income" today={today} /> : null}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
