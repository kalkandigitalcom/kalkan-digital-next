import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Archive, ArchiveRestore, ExternalLink, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getProjectDetail } from "@/server/services/projects";
import { deleteProjectAction, setProjectArchivedAction } from "@/server/actions/projects";
import { paymentStatusOf } from "@/server/finance/core";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { DetailList, StatCard } from "@/components/admin/stat";
import { Money } from "@/components/admin/money";
import { paymentStatuses, projectStatuses, serviceTypes, taskStatuses, transactionStatusLabel } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/dates";
import { subMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Proje detayı" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const data = await getProjectDetail(id);
  if (!data) notFound();
  const { project: p, customer, cash, base } = data;
  const payStatus = paymentStatusOf(p.agreedAmount, data.collectedInProjectCurrency);
  const estimatedProfit = p.agreedAmount ? subMoney(p.agreedAmount, p.estimatedCost) : null;
  const cashResult = subMoney(cash.collected, cash.paidExpense);
  const remaining = p.agreedAmount ? subMoney(p.agreedAmount, data.collectedInProjectCurrency) : null;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/projects", label: "Projeler" }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {p.name}
            <OptionBadge value={p.status} options={projectStatuses} />
            {p.archivedAt ? <Badge>Arşivlendi</Badge> : null}
          </span>
        }
        description={serviceTypes.label(p.projectType)}
        actions={
          <>
            <LinkButton href={`/admin/projects/${p.id}/edit`} variant="outline" size="sm"><Pencil className="size-3.5" /> Düzenle</LinkButton>
            <ConfirmAction
              action={setProjectArchivedAction}
              fields={{ id: p.id, archive: p.archivedAt ? "0" : "1" }}
              title={p.archivedAt ? "Arşivden çıkarılsın mı?" : "Proje arşivlensin mi?"}
              description="Arşivleme sadece görünürlüğü değiştirir; finansal kayıtlar korunur."
              confirmLabel={p.archivedAt ? "Arşivden çıkar" : "Arşivle"}
              tone="primary"
              trigger={p.archivedAt ? <><ArchiveRestore className="size-3.5" /> Arşivden çıkar</> : <><Archive className="size-3.5" /> Arşivle</>}
            />
            {data.transactions.length === 0 ? (
              <ConfirmAction
                action={deleteProjectAction}
                fields={{ id: p.id }}
                title="Proje silinsin mi?"
                description="Bu işlem geri alınamaz. Bağlı görevlerin proje bağlantısı kaldırılır."
                confirmLabel="Sil"
                trigger={<><Trash2 className="size-3.5" /> Sil</>}
                redirectTo="/admin/projects?flash=deleted"
              />
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Anlaşılan tutar" value={<Money value={p.agreedAmount} currency={p.currency} />} />
        <StatCard
          label="Tahsil edilen"
          value={<Money value={data.collectedInProjectCurrency} currency={p.currency} />}
          tone="green"
          hint={<span className="inline-flex items-center gap-1.5"><OptionBadge value={payStatus} options={paymentStatuses} />{remaining && Number(remaining) > 0 ? <>Kalan: <Money value={remaining} currency={p.currency} /></> : null}</span>}
        />
        <StatCard label="Bekleyen tahsilat" value={<Money value={cash.receivable} currency={base} />} tone="amber" hint="Projeye bağlı bekleyen gelir kayıtları" />
        <StatCard label="Gerçekleşen proje gideri" value={<Money value={cash.paidExpense} currency={base} />} tone="red" hint={Number(cash.pendingExpense) > 0 ? <>Bekleyen gider: <Money value={cash.pendingExpense} currency={base} /></> : "Bekleyen gider yok"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-navy-500">Tahmini proje kârlılığı</p>
            <p className="tabular mt-1 font-display text-lg font-bold text-navy-900"><Money value={estimatedProfit} currency={p.currency} /></p>
            <p className="mt-1 text-[11px] text-navy-400">Anlaşılan tutar − tahmini maliyet ({p.estimatedCost ? <Money value={p.estimatedCost} currency={p.currency} /> : "girilmedi"}). Bir tahmindir, nakit sonucu değildir.</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-navy-500">Gerçekleşen nakit sonucu</p>
            <p className={`tabular mt-1 font-display text-lg font-bold ${Number(cashResult) < 0 ? "text-red-600" : "text-navy-900"}`}><Money value={cashResult} currency={base} /></p>
            <p className="mt-1 text-[11px] text-navy-400">Projeye bağlı tahsil edilen gelir − ödenen gider ({base} karşılığı).{cash.missingRateCount ? ` ${cash.missingRateCount} işlemde kur girilmediği için hesaba katılmadı.` : ""}</p>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Proje bilgileri" />
            <CardBody className="py-2">
              <DetailList
                items={[
                  { label: "Müşteri", value: customer ? <Link href={`/admin/customers/${customer.id}`} className="text-brand-600 hover:underline">{customer.companyName}</Link> : "—" },
                  { label: "Yetkili", value: customer?.contactName },
                  { label: "Telefon", value: customer?.phone },
                  { label: "Başlangıç", value: formatDate(p.startDate) },
                  { label: "Gerçek teslim", value: formatDate(p.deliveredDate) },
                  { label: "Bağlantı", value: p.projectUrl ? <a href={p.projectUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-brand-600 hover:underline">{p.projectUrl.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" /></a> : null },
                  { label: "Oluşturulma", value: formatDateTime(p.createdAt) },
                ]}
              />
            </CardBody>
          </Card>
          {p.description || p.internalNotes ? (
            <Card>
              <CardHeader title="Açıklama ve notlar" />
              <CardBody className="space-y-4 text-sm">
                {p.description ? <p className="whitespace-pre-line text-navy-700">{p.description}</p> : null}
                {p.internalNotes ? <div className="rounded-lg bg-amber-50 p-3 text-amber-900"><p className="mb-1 text-xs font-semibold">Dahili not</p><p className="whitespace-pre-line">{p.internalNotes}</p></div> : null}
              </CardBody>
            </Card>
          ) : null}
        </div>
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              title="Tahsilatlar ve giderler"
              action={
                <div className="flex gap-2">
                  <LinkButton href={`/admin/transactions/new?type=income&projectId=${p.id}`} size="sm" variant="secondary"><Plus className="size-3.5" /> Gelir</LinkButton>
                  <LinkButton href={`/admin/transactions/new?type=expense&projectId=${p.id}`} size="sm" variant="outline"><Plus className="size-3.5" /> Gider</LinkButton>
                </div>
              }
            />
            {data.transactions.length === 0 ? (
              <EmptyState icon={Wallet} title="Bu projeye bağlı işlem yok" description="Tahsilat ve giderleri projeye bağlayarak kârlılığı takip edin." />
            ) : (
              <Table>
                <THead><tr><TH>Tarih</TH><TH>Açıklama</TH><TH>Durum</TH><TH className="text-right">Tutar</TH></tr></THead>
                <TBody>
                  {data.transactions.map((t) => (
                    <TR key={t.id}>
                      <TD className="tabular text-xs">{t.status === "completed" ? formatDate(t.settledDate) : t.status === "pending" ? (t.dueDate ? `Vade ${formatDate(t.dueDate)}` : "Vadesiz") : "—"}</TD>
                      <TD><Link href={`/admin/transactions/${t.id}/edit`} className="font-medium text-navy-900 hover:text-brand-600">{t.description}</Link><div className="text-xs text-navy-400">{t.category}</div></TD>
                      <TD><Badge tone={t.status === "completed" ? "green" : t.status === "pending" ? "amber" : "gray"}>{transactionStatusLabel(t.type, t.status)}</Badge></TD>
                      <TD className="text-right"><Money value={t.amount} currency={t.currency} signed type={t.type} /></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
          <Card>
            <CardHeader title="Görevler" action={<LinkButton href={`/admin/tasks/new?projectId=${p.id}`} size="sm" variant="secondary"><Plus className="size-3.5" /> Görev</LinkButton>} />
            {data.tasks.length === 0 ? (
              <EmptyState title="Görev yok" />
            ) : (
              <ul className="divide-y divide-navy-100">
                {data.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`/admin/tasks/${t.id}/edit`} className="font-medium text-navy-900 hover:text-brand-600">{t.title}</Link>
                    <span className="flex items-center gap-2 text-xs"><OptionBadge value={t.status} options={taskStatuses} /><span className="tabular text-navy-500">{formatDateTime(t.dueAt)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
