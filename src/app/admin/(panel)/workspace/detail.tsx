import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { getWorkspaceCustomer } from "@/server/services/workspace";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { Money } from "@/components/admin/money";
import {
  acquisitionSources,
  customerStatuses,
  customerTypes,
  noteKinds,
  paymentStatuses,
  projectStatuses,
  recurringPeriods,
  recurringStatuses,
  serviceTypes,
  taskPriorities,
  transactionStatusLabel,
} from "@/lib/labels";
import { diffDays, formatDate, formatDateTime } from "@/lib/dates";

type Detail = NonNullable<Awaited<ReturnType<typeof getWorkspaceCustomer>>>;

function Section({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="border-b border-navy-100 px-5 py-5 last:border-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-500">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5 text-sm">
      <dt className="text-navy-500">{label}</dt>
      <dd className="col-span-2 min-w-0 break-words text-navy-900">{children ?? "—"}</dd>
    </div>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-navy-400">{children}</p>;

export function CustomerDetail({ d }: { d: Detail }) {
  const c = d.customer;
  const t = d.totals;
  return (
    <>
      <Section id="genel" title="Genel bilgiler" action={<Link href={`/admin/customers/${c.id}`} className="text-xs font-semibold text-brand-600 hover:underline">Müşteri sayfası</Link>}>
        <div className="mb-3 flex flex-wrap gap-2">
          <OptionBadge value={c.status} options={customerStatuses} />
          {c.archivedAt ? <Badge>Arşiv</Badge> : null}
        </div>
        <dl>
          <Row label="Firma">{c.companyName}</Row>
          <Row label="Yetkili">{c.contactName}</Row>
          <Row label="Tür">{customerTypes.label(c.customerType)}</Row>
          <Row label="Telefon">{c.phone ? <a className="text-brand-600 hover:underline" href={`tel:${c.phone.replace(/\s/g, "")}`}>{c.phone}</a> : null}</Row>
          <Row label="WhatsApp">{c.whatsapp}</Row>
          <Row label="E-posta">{c.email ? <a className="text-brand-600 hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : null}</Row>
          <Row label="Web sitesi">{c.website ? <a className="text-brand-600 hover:underline" href={c.website} target="_blank" rel="noopener noreferrer nofollow">{c.website.replace(/^https?:\/\//, "")}</a> : null}</Row>
          <Row label="Kaynak">{c.source ? acquisitionSources.label(c.source) : null}</Row>
          <Row label="Son güncelleme">{formatDateTime(c.updatedAt)}</Row>
        </dl>
      </Section>

      <Section id="projeler" title={`Projeler (${d.projects.length})`}>
        {d.projects.length === 0 ? (
          <Empty>Bu müşteriye bağlı proje yok.</Empty>
        ) : (
          <ul className="space-y-3">
            {d.projects.map((p) => (
              <li key={p.id} className="rounded-lg border border-navy-100 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/projects/${p.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{p.name}</Link>
                    <p className="text-xs text-navy-500">{serviceTypes.label(p.projectType)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <OptionBadge value={p.status} options={projectStatuses} />
                    {p.archivedAt ? <Badge>Arşiv</Badge> : null}
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><dt className="inline text-navy-500">Anlaşılan: </dt><dd className="inline"><Money value={p.agreedAmount} currency={p.currency} /> <span className="text-navy-400">({p.currency})</span></dd></div>
                  <div><dt className="inline text-navy-500">Tahsil: </dt><dd className="inline"><Money value={p.collected} currency={p.currency} /></dd></div>
                  <div><dt className="inline text-navy-500">Hedef teslim: </dt><dd className="inline">{formatDate(p.targetDate)}</dd></div>
                  <div><dt className="inline text-navy-500">Gerçek teslim: </dt><dd className="inline">{formatDate(p.deliveredDate)}</dd></div>
                  <div className="col-span-2 flex items-center gap-2"><dt className="text-navy-500">Ödeme durumu:</dt><dd><OptionBadge value={p.paymentStatus} options={paymentStatuses} /></dd></div>
                  {p.projectUrl ? (
                    <div className="col-span-2"><dt className="inline text-navy-500">URL: </dt><dd className="inline"><a href={p.projectUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-brand-600 hover:underline">{p.projectUrl.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" /></a></dd></div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="yenilemeler" title="Hizmetler ve yenilemeler">
        {d.services.length === 0 ? (
          <Empty>Tekrarlayan hizmet yok.</Empty>
        ) : (
          <ul className="divide-y divide-navy-100">
            {d.services.map((s) => {
              const days = diffDays(s.nextRenewalDate, d.today);
              return (
                <li key={s.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/admin/recurring/${s.id}`} className="text-sm font-medium text-navy-900 hover:text-brand-600">{s.name}</Link>
                    <p className="text-xs text-navy-500">{recurringPeriods.label(s.period)} · <Money value={s.amount} currency={s.currency} /></p>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <OptionBadge value={s.status} options={recurringStatuses} />
                    {s.status === "active" ? (
                      <p className={`tabular mt-1 ${days < 0 ? "font-semibold text-red-600" : "text-navy-600"}`}>
                        {formatDate(s.nextRenewalDate)} {days < 0 ? `(${-days} gün geçti)` : ""}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {d.billedUnpaid.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-navy-600">Faturalanmış, ödenmemiş dönemler</p>
            <ul className="space-y-1.5 text-xs">
              {d.billedUnpaid.map((b) => (
                <li key={b.transactionId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">{b.serviceName} · {formatDate(b.periodStart)} – {formatDate(b.periodEnd)}</span>
                  <span className={`shrink-0 tabular ${b.due < d.today ? "font-semibold text-red-600" : "text-navy-600"}`}>
                    <Money value={b.amount} currency={b.currency} /> · vade {formatDate(b.due)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section id="finans" title={`Finans (${d.base})`} action={<Link href={`/admin/transactions?customerId=${c.id}`} className="text-xs font-semibold text-brand-600 hover:underline">Tüm işlemler</Link>}>
        <dl className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-navy-50 p-3"><dt className="text-xs text-navy-500">Tahsil edilen</dt><dd className="mt-1 font-semibold"><Money value={t.collected} currency={d.base} /></dd></div>
          <div className="rounded-lg bg-navy-50 p-3"><dt className="text-xs text-navy-500">Bekleyen alacak</dt><dd className="mt-1 font-semibold"><Money value={t.receivable} currency={d.base} /></dd><dd className="text-[11px] text-navy-400">{t.receivableCount} kayıt</dd></div>
          <div className="rounded-lg bg-navy-50 p-3"><dt className="text-xs text-navy-500">Gecikmiş alacak</dt><dd className={`mt-1 font-semibold ${t.overdueCount ? "text-red-600" : ""}`}><Money value={t.overdue} currency={d.base} /></dd><dd className="text-[11px] text-navy-400">{t.overdueCount} kayıt</dd></div>
        </dl>
        {t.missingRateCount > 0 ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>Kur bilgisi girilmemiş {t.missingRateCount} yabancı para gelir işlemi {d.base} toplamlarına dahil edilmedi. Orijinal tutarlarını <Link href={`/admin/transactions?customerId=${c.id}`} className="font-semibold underline">işlem listesinde</Link> görebilir, kur girerek toplamlara katabilirsiniz.</span>
          </p>
        ) : null}
        <p className="mb-2 mt-4 text-xs font-semibold text-navy-600">Açık alacaklar</p>
        {d.openReceivables.length === 0 ? (
          <Empty>Açık alacak yok.</Empty>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {d.openReceivables.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <Link href={`/admin/transactions/${r.id}/edit`} className="min-w-0 truncate text-navy-800 hover:text-brand-600">{r.description}{r.projectName ? <span className="text-navy-400"> · {r.projectName}</span> : null}</Link>
                <span className={`shrink-0 tabular ${r.due < d.today ? "font-semibold text-red-600" : "text-navy-600"}`}>
                  <Money value={r.amount} currency={r.currency} />
                  {r.baseAmount === null ? <span className="text-amber-700"> (kur yok)</span> : null} · vade {formatDate(r.due)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mb-2 mt-4 text-xs font-semibold text-navy-600">Son işlemler</p>
        {d.recentTx.length === 0 ? (
          <Empty>Bu müşteriye bağlı finansal işlem yok.</Empty>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {d.recentTx.map((x) => (
              <li key={x.id} className={`flex items-center justify-between gap-3 ${x.status === "cancelled" ? "opacity-50" : ""}`}>
                <span className="min-w-0 truncate">
                  <span className="tabular text-navy-400">{formatDate(x.date)}</span>{" "}
                  <Link href={`/admin/transactions/${x.id}/edit`} className="text-navy-800 hover:text-brand-600">{x.description}</Link>
                </span>
                <span className="shrink-0 text-right">
                  <Money value={x.amount} currency={x.currency} signed type={x.type} /> <span className="text-navy-400">· {transactionStatusLabel(x.type, x.status)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="takip" title="Takip">
        <p className="mb-2 text-xs font-semibold text-navy-600">Son görüşme notları</p>
        {d.notes.length === 0 ? (
          <Empty>Görüşme notu yok.</Empty>
        ) : (
          <ul className="space-y-2">
            {d.notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-navy-100 p-2.5 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-navy-500">
                  <OptionBadge value={n.kind} options={noteKinds} /> {formatDate(n.contactDate)}
                  {n.nextFollowUpDate ? <span className={n.nextFollowUpDate < d.today ? "font-semibold text-red-600" : ""}>· sonraki takip {formatDate(n.nextFollowUpDate)}</span> : null}
                </div>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-navy-800">{n.content}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mb-2 mt-4 text-xs font-semibold text-navy-600">Açık görevler</p>
        {d.openTasks.length === 0 ? (
          <Empty>Açık görev yok.</Empty>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {d.openTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3">
                <Link href={`/admin/tasks/${task.id}/edit`} className="min-w-0 truncate text-navy-800 hover:text-brand-600">{task.title}</Link>
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  <OptionBadge value={task.priority} options={taskPriorities} />
                  <span className={`tabular ${task.dueAt && task.dueAt < d.now ? "font-semibold text-red-600" : "text-navy-500"}`}>{task.dueAt ? formatDateTime(task.dueAt) : "Tarihsiz"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
