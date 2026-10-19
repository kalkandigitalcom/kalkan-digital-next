import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Archive, ArchiveRestore, CalendarClock, FileText, FolderKanban, Mail, MessageCircle, Pencil, Phone, Plus, Trash2, Wallet } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getCustomerDetail } from "@/server/services/customers";
import { deleteCustomerAction, deleteCustomerNoteAction, setCustomerArchivedAction } from "@/server/actions/customers";
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
import {
  acquisitionSources,
  customerStatuses,
  customerTypes,
  noteKinds,
  paymentStatuses,
  projectStatuses,
  quoteStatuses,
  recurringPeriods,
  recurringStatuses,
  taskPriorities,
  taskStatuses,
  transactionStatusLabel,
} from "@/lib/labels";
import { diffDays, formatDate, formatDateTime, todayIso } from "@/lib/dates";
import { NoteForm } from "./note-form";

export const metadata: Metadata = { title: "Müşteri detayı" };

function waLink(n: string) {
  const d = n.replace(/\D/g, "");
  return d ? `https://wa.me/${d.startsWith("0") ? "9" + d : d}` : null;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const data = await getCustomerDetail(id);
  if (!data) notFound();
  const { customer: c, cash, base } = data;
  const today = todayIso();
  const wa = c.whatsapp ? waLink(c.whatsapp) : null;
  const canDelete = data.projects.length === 0 && data.transactions.length === 0 && data.recurring.length === 0;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Müşteriler" }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {c.companyName}
            <OptionBadge value={c.status} options={customerStatuses} />
            {c.archivedAt ? <Badge>Arşivlendi</Badge> : null}
          </span>
        }
        description={`${customerTypes.label(c.customerType)}${c.contactName ? ` · ${c.contactName}` : ""}`}
        actions={
          <>
            <LinkButton href={`/admin/customers/${c.id}/edit`} variant="outline" size="sm"><Pencil className="size-3.5" /> Düzenle</LinkButton>
            <ConfirmAction
              action={setCustomerArchivedAction}
              fields={{ id: c.id, archive: c.archivedAt ? "0" : "1" }}
              title={c.archivedAt ? "Arşivden çıkarılsın mı?" : "Müşteri arşivlensin mi?"}
              description={c.archivedAt ? "Müşteri tekrar listelerde ve seçim kutularında görünür." : "Arşivlenen müşteri listelerde gizlenir, durumu pasif olur. Tüm proje ve finansal kayıtlar korunur."}
              confirmLabel={c.archivedAt ? "Arşivden çıkar" : "Arşivle"}
              tone="primary"
              trigger={c.archivedAt ? <><ArchiveRestore className="size-3.5" /> Arşivden çıkar</> : <><Archive className="size-3.5" /> Arşivle</>}
            />
            {canDelete ? (
              <ConfirmAction
                action={deleteCustomerAction}
                fields={{ id: c.id }}
                title="Müşteri kalıcı olarak silinsin mi?"
                description="Bu işlem geri alınamaz. Müşterinin takip notları da silinir; teklif ve görevlerdeki bağlantısı kaldırılır."
                confirmLabel="Kalıcı olarak sil"
                trigger={<><Trash2 className="size-3.5" /> Sil</>}
                redirectTo="/admin/customers?flash=deleted"
              />
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tahsil edilen gelir (toplam)" value={<Money value={cash.collected} currency={base} />} icon={Wallet} tone="green" />
        <StatCard label="Bekleyen alacak" value={<Money value={cash.receivable} currency={base} />} icon={CalendarClock} tone="amber" hint="Henüz tahsil edilmemiş kayıtlar" />
        <StatCard label="Projeler" value={data.projects.length} icon={FolderKanban} tone="blue" hint={`${data.projects.filter((p) => p.status === "in_progress").length} devam ediyor`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <Card>
            <CardHeader title="İletişim bilgileri" />
            <CardBody className="py-2">
              <DetailList
                items={[
                  { label: "Yetkili", value: c.contactName },
                  { label: "Telefon", value: c.phone ? <a className="text-brand-600 hover:underline" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a> : null },
                  { label: "WhatsApp", value: wa ? <a className="text-brand-600 hover:underline" href={wa} target="_blank" rel="noopener noreferrer">{c.whatsapp}</a> : c.whatsapp },
                  { label: "E-posta", value: c.email ? <a className="text-brand-600 hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : null },
                  { label: "Web sitesi", value: c.website ? <a className="text-brand-600 hover:underline" href={c.website} target="_blank" rel="noopener noreferrer nofollow">{c.website.replace(/^https?:\/\//, "")}</a> : null },
                  { label: "Adres", value: c.address },
                  { label: "Kaynak", value: acquisitionSources.label(c.source) },
                  { label: "İlk iletişim", value: formatDate(c.firstContactDate) },
                  { label: "Kayıt", value: formatDateTime(c.createdAt) },
                  { label: "Güncelleme", value: formatDateTime(c.updatedAt) },
                ]}
              />
              <div className="flex flex-wrap gap-2 py-3">
                {c.phone ? <LinkButton href={`tel:${c.phone.replace(/\s/g, "")}`} variant="secondary" size="sm"><Phone className="size-3.5" /> Ara</LinkButton> : null}
                {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><MessageCircle className="size-3.5" /> WhatsApp</a> : null}
                {c.email ? <LinkButton href={`mailto:${c.email}`} variant="secondary" size="sm"><Mail className="size-3.5" /> E-posta</LinkButton> : null}
              </div>
            </CardBody>
          </Card>
          {c.notes ? (
            <Card>
              <CardHeader title="Genel notlar" />
              <CardBody><p className="whitespace-pre-line text-sm text-navy-700">{c.notes}</p></CardBody>
            </Card>
          ) : null}
          <Card>
            <CardHeader title="Görüşme ve takip notları" />
            <CardBody className="space-y-5">
              <NoteForm customerId={c.id} today={today} />
              {data.notes.length === 0 ? (
                <p className="text-center text-xs text-navy-400">Henüz not eklenmedi.</p>
              ) : (
                <ol className="space-y-3">
                  {data.notes.map((n) => (
                    <li key={n.id} className="rounded-lg border border-navy-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-navy-500">
                          <OptionBadge value={n.kind} options={noteKinds} />
                          {formatDate(n.contactDate)}
                        </div>
                        <ConfirmAction
                          action={deleteCustomerNoteAction}
                          fields={{ id: n.id }}
                          title="Not silinsin mi?"
                          confirmLabel="Sil"
                          triggerVariant="ghost"
                          trigger={<><Trash2 className="size-3.5" aria-hidden /><span className="sr-only">Notu sil</span></>}
                        />
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-navy-800">{n.content}</p>
                      {n.nextFollowUpDate ? (
                        <p className={`mt-2 text-xs font-medium ${n.nextFollowUpDate < today ? "text-red-600" : "text-brand-600"}`}>
                          Sonraki takip: {formatDate(n.nextFollowUpDate)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Projeler" action={<LinkButton href={`/admin/projects/new?customerId=${c.id}`} size="sm" variant="secondary"><Plus className="size-3.5" /> Proje</LinkButton>} />
            {data.projects.length === 0 ? (
              <EmptyState icon={FolderKanban} title="Proje yok" />
            ) : (
              <Table>
                <THead><tr><TH>Proje</TH><TH>Durum</TH><TH className="text-right">Anlaşılan</TH><TH>Ödeme</TH><TH>Hedef teslim</TH></tr></THead>
                <TBody>
                  {data.projects.map((p) => (
                    <TR key={p.id}>
                      <TD><Link href={`/admin/projects/${p.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{p.name}</Link></TD>
                      <TD><OptionBadge value={p.status} options={projectStatuses} /></TD>
                      <TD className="text-right"><Money value={p.agreedAmount} currency={p.currency} /></TD>
                      <TD><OptionBadge value={paymentStatusOf(p.agreedAmount, p.collected)} options={paymentStatuses} /></TD>
                      <TD className="tabular text-xs">{formatDate(p.targetDate)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Gelir ve ödeme geçmişi"
              description="Son 50 işlem"
              action={
                <div className="flex gap-2">
                  <LinkButton href={`/admin/transactions?customerId=${c.id}`} size="sm" variant="ghost">Tümü</LinkButton>
                  <LinkButton href={`/admin/transactions/new?type=income&customerId=${c.id}`} size="sm" variant="secondary"><Plus className="size-3.5" /> İşlem</LinkButton>
                </div>
              }
            />
            {data.transactions.length === 0 ? (
              <EmptyState icon={Wallet} title="Finansal işlem yok" />
            ) : (
              <Table>
                <THead><tr><TH>Tarih</TH><TH>Açıklama</TH><TH>Durum</TH><TH className="text-right">Tutar</TH></tr></THead>
                <TBody>
                  {data.transactions.map((t) => (
                    <TR key={t.id}>
                      <TD className="tabular text-xs">{formatDate(t.settledDate ?? t.transactionDate)}</TD>
                      <TD>
                        <Link href={`/admin/transactions/${t.id}/edit`} className="font-medium text-navy-900 hover:text-brand-600">{t.description}</Link>
                        <div className="text-xs text-navy-400">{t.category}</div>
                      </TD>
                      <TD><Badge tone={t.status === "completed" ? "green" : t.status === "pending" ? "amber" : "gray"}>{transactionStatusLabel(t.type, t.status)}</Badge></TD>
                      <TD className="text-right"><Money value={t.amount} currency={t.currency} signed type={t.type} /></TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Aktif hizmetler ve yenilemeler" action={<LinkButton href={`/admin/recurring/new?customerId=${c.id}`} size="sm" variant="secondary"><Plus className="size-3.5" /></LinkButton>} />
              {data.recurring.length === 0 ? (
                <EmptyState icon={CalendarClock} title="Tekrarlayan hizmet yok" />
              ) : (
                <ul className="divide-y divide-navy-100">
                  {data.recurring.map((r) => {
                    const days = diffDays(r.nextRenewalDate, today);
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <Link href={`/admin/recurring/${r.id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-brand-600">{r.name}</Link>
                          <p className="text-xs text-navy-500">
                            {recurringPeriods.label(r.period)} · <Money value={r.amount} currency={r.currency} />
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <OptionBadge value={r.status} options={recurringStatuses} />
                          {r.status === "active" ? (
                            <p className={`mt-1 tabular ${days < 0 ? "text-red-600" : days <= 30 ? "text-amber-700" : "text-navy-500"}`}>{formatDate(r.nextRenewalDate)}</p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
            <Card>
              <CardHeader title="Teklifler" action={<LinkButton href={`/admin/quotes/new?customerId=${c.id}`} size="sm" variant="secondary"><Plus className="size-3.5" /></LinkButton>} />
              {data.quotes.length === 0 ? (
                <EmptyState icon={FileText} title="Teklif yok" />
              ) : (
                <ul className="divide-y divide-navy-100">
                  {data.quotes.map((q) => (
                    <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <Link href={`/admin/quotes/${q.id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-brand-600">{q.title ?? q.companyName}</Link>
                        <p className="text-xs text-navy-500">{formatDate(q.quoteDate ?? q.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <OptionBadge value={q.status} options={quoteStatuses} />
                        <p className="mt-1 text-xs"><Money value={q.estimatedAmount} currency={q.currency} /></p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Görevler" action={<LinkButton href={`/admin/tasks/new?customerId=${c.id}`} size="sm" variant="secondary"><Plus className="size-3.5" /> Görev</LinkButton>} />
            {data.tasks.length === 0 ? (
              <EmptyState title="Görev yok" />
            ) : (
              <ul className="divide-y divide-navy-100">
                {data.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`/admin/tasks/${t.id}/edit`} className="font-medium text-navy-900 hover:text-brand-600">{t.title}</Link>
                    <div className="flex items-center gap-2 text-xs">
                      <OptionBadge value={t.priority} options={taskPriorities} />
                      <OptionBadge value={t.status} options={taskStatuses} />
                      <span className="tabular text-navy-500">{formatDateTime(t.dueAt)}</span>
                    </div>
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
