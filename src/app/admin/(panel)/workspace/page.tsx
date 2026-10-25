import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Users } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { getWorkspaceCustomer, listWorkspace, type WorkspaceRow as Row } from "@/server/services/workspace";
import { flatParams, type SearchParams } from "@/server/list";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SortTH, TH } from "@/components/ui/table";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Money } from "@/components/admin/money";
import { customerStatuses, customerTypes, paymentStatuses } from "@/lib/labels";
import { diffDays, formatDate, formatDateTime } from "@/lib/dates";
import type { PaymentStatus } from "@/server/finance/core";
import { CustomerDetail } from "./detail";
import { DetailPanel, WorkspaceRow } from "./workspace-client";

export const metadata: Metadata = { title: "Müşteri çalışma ekranı" };
const BASE = "/admin/workspace";

function hrefWith(params: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) sp.set(k, v);
  const q = sp.toString();
  return q ? `${BASE}?${q}` : BASE;
}

const PAYMENT_ORDER: PaymentStatus[] = ["unpaid", "partial", "paid", "not_set"];

function SummaryItem({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-xs text-navy-500">{label}</p>
      <p className="tabular mt-0.5 font-display text-lg font-bold text-navy-900">{value}</p>
      {hint ? <p className="text-[11px] text-navy-400">{hint}</p> : null}
    </div>
  );
}

function NoRate({ n }: { n: number }) {
  if (!n) return null;
  return (
    <p className="mt-1 flex items-center justify-end gap-1 whitespace-nowrap text-amber-700" title={`Kur bilgisi girilmemiş ${n} yabancı para işlemi bu toplama dahil edilmedi`}>
      <AlertTriangle className="size-3 shrink-0" aria-hidden /> {n} kur yok
    </p>
  );
}

function Cells({ r, base, today, warningDays, openHref, selected }: { r: Row; base: string; today: string; warningDays: number; openHref: string; selected: boolean }) {
  const td = "px-3 py-3 text-xs text-navy-700";
  const next = r.renewals.nextDate;
  const days = next ? diffDays(next, today) : null;
  const mix = PAYMENT_ORDER.filter((s) => r.paymentMix[s]);
  const cur = base as "TRY";
  return (
    <>
      <td className={`${td} sticky left-0 z-10 min-w-48 border-r border-navy-100 ${selected ? "bg-brand-50" : "bg-white"}`}>
        <Link href={openHref} scroll={false} className="text-sm font-semibold text-navy-900 hover:text-brand-600">{r.companyName}</Link>
        {r.contactName ? <p className="text-navy-500">{r.contactName}</p> : null}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-navy-400">{customerTypes.label(r.customerType)}</span>
          <OptionBadge value={r.status} options={customerStatuses} />
          {r.archivedAt ? <Badge>Arşiv</Badge> : null}
        </div>
      </td>
      <td className={`${td} min-w-40 max-w-48`}>
        {r.phone || r.whatsapp || r.email ? (
          <div className="space-y-0.5">
            {r.phone ? <p className="tabular">{r.phone}</p> : null}
            {r.whatsapp && r.whatsapp !== r.phone ? <p className="tabular text-navy-500">WA {r.whatsapp}</p> : null}
            {r.email ? <p className="truncate text-navy-500" title={r.email}>{r.email}</p> : null}
          </div>
        ) : <span className="text-navy-300">—</span>}
      </td>
      <td className={`${td} min-w-40 max-w-52`}>
        {r.projects.length === 0 ? (
          <span className="text-navy-300">—</span>
        ) : (
          <>
            <Link href={`${openHref}#projeler`} scroll={false} className="font-semibold text-brand-600 hover:underline">{r.projects.length} proje</Link>
            <ul className="mt-0.5 space-y-0.5">
              {r.projects.slice(0, 2).map((p) => <li key={p.id} className="truncate" title={p.name}>{p.name}</li>)}
            </ul>
            {r.projects.length > 2 ? <p className="text-navy-400">+{r.projects.length - 2} proje daha</p> : null}
          </>
        )}
      </td>
      <td className={`${td} min-w-32`}>
        {mix.length === 0 ? (
          <span className="text-navy-300">—</span>
        ) : (
          <div className="flex flex-col items-start gap-1">
            {mix.map((s) => (
              <Badge key={s} tone={paymentStatuses.map[s].tone}>{r.paymentMix[s]} · {paymentStatuses.label(s)}</Badge>
            ))}
          </div>
        )}
      </td>
      <td className={`${td} min-w-36`}>
        {r.renewals.activeCount === 0 && r.renewals.billedUnpaid === 0 ? (
          <span className="text-navy-300">—</span>
        ) : (
          <div className="space-y-1">
            <p>{r.renewals.activeCount} aktif hizmet</p>
            {next && days !== null ? (
              <p className="flex flex-wrap items-center gap-1">
                <span className="tabular">{formatDate(next)}</span>
                {days < 0 ? <Badge tone="red">{-days} gün geçti</Badge> : days <= warningDays ? <Badge tone="amber">{days === 0 ? "bugün" : `${days} gün`}</Badge> : null}
              </p>
            ) : null}
            {r.renewals.billedUnpaid > 0 ? (
              <p className={r.renewals.billedOverdue ? "font-semibold text-red-600" : "text-amber-700"}>
                {r.renewals.billedUnpaid} ödenmemiş dönem{r.renewals.billedOverdue ? ` (${r.renewals.billedOverdue} gecikmiş)` : ""}
              </p>
            ) : null}
          </div>
        )}
      </td>
      <td className={`${td} text-right`}>
        <Money value={r.finance.collected} currency={cur} />
        <NoRate n={r.finance.collectedMissingRate} />
      </td>
      <td className={`${td} text-right`}>
        {r.finance.receivableCount ? <><Money value={r.finance.receivable} currency={cur} /><p className="text-navy-400">{r.finance.receivableCount} kayıt</p><NoRate n={r.finance.receivableMissingRate} /></> : <span className="text-navy-300">—</span>}
      </td>
      <td className={`${td} text-right`}>
        {r.finance.overdueCount ? <><Money value={r.finance.overdue} currency={cur} className="font-semibold text-red-600" /><p className="text-red-500">{r.finance.overdueCount} kayıt</p><NoRate n={r.finance.overdueMissingRate} /></> : <span className="text-navy-300">—</span>}
      </td>
      <td className={`${td} min-w-36`}>
        {!r.followUp.lastNoteDate && !r.followUp.openTasks ? (
          <span className="text-navy-300">—</span>
        ) : (
          <div className="space-y-0.5">
            {r.followUp.lastNoteDate ? <p>Son not: <span className="tabular">{formatDate(r.followUp.lastNoteDate)}</span></p> : null}
            {r.followUp.nextFollowUpDate ? (
              <p className={r.followUp.nextFollowUpDate < today ? "font-semibold text-red-600" : "text-brand-700"}>Takip: <span className="tabular">{formatDate(r.followUp.nextFollowUpDate)}</span></p>
            ) : null}
            {r.followUp.openTasks ? (
              <p className={r.followUp.overdueTasks ? "text-red-600" : "text-navy-600"}>
                {r.followUp.openTasks} açık görev{r.followUp.overdueTasks ? ` · ${r.followUp.overdueTasks} gecikmiş` : ""}
              </p>
            ) : null}
          </div>
        )}
      </td>
      <td className={`${td} tabular whitespace-nowrap text-navy-500`} title={formatDateTime(r.updatedAt)}>{formatDate(r.updatedAt)}</td>
    </>
  );
}

export default async function WorkspacePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const selectedId = params.c && z.uuid().safeParse(params.c).success ? params.c : undefined;
  const [data, detail] = await Promise.all([listWorkspace(params), selectedId ? getWorkspaceCustomer(selectedId) : Promise.resolve(null)]);
  const { rows, total, page, pageSize, base, today, summary, warningDays } = data;
  const listParams = { ...params, c: undefined };
  const closeHref = hrefWith(listParams, {});

  return (
    <>
      <PageHeader
        title="Müşteri çalışma ekranı"
        description={`Müşteriler, projeler, yenilemeler ve alacaklar tek tabloda. Finansal tutarlar ${base} karşılığıdır ve kayıtlı işlemlerden hesaplanır.`}
      />

      <Card className="mb-4 overflow-hidden">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-t-xl bg-navy-100 lg:grid-cols-4">
          <SummaryItem label="Toplam müşteri" value={summary.totalCustomers} hint="Arşivlenmemiş kayıtlar" />
          <SummaryItem label="Aktif müşteri" value={summary.activeCustomers} />
          <SummaryItem
            label="Yaklaşan yenilemeler"
            value={summary.upcomingRenewals}
            hint={`Önümüzdeki ${warningDays} gün${summary.overdueRenewals ? `, ${summary.overdueRenewals} gecikmiş dahil` : " ve gecikmiş olanlar"}`}
          />
          <SummaryItem
            label="Gecikmiş alacak"
            value={<span className={summary.overdueReceivableCount ? "text-red-600" : ""}><Money value={summary.overdueReceivable} currency={base} /></span>}
            hint={
              summary.unlinkedOverdueCount
                ? <>{summary.overdueReceivableCount} kayıt; müşteriye bağlı olmayan {summary.unlinkedOverdueCount} kayıt (<Money value={summary.unlinkedOverdue} currency={base} />) dahil</>
                : `${summary.overdueReceivableCount} kayıt`
            }
          />
        </div>
        {summary.receivableMissingRate > 0 ? (
          <p className="flex items-center gap-2 border-t border-navy-100 px-4 py-2 text-xs text-amber-800">
            <AlertTriangle className="size-3.5" aria-hidden /> Kur bilgisi girilmemiş {summary.receivableMissingRate} bekleyen alacak {base} toplamlarına dahil edilmedi.
          </p>
        ) : null}
      </Card>

      <Card>
        <FilterBar basePath={BASE} params={listParams} searchPlaceholder="Firma, yetkili, telefon, e-posta, proje…" keep={["sort", "dir"]}>
          <FilterSelect name="status" label="Durum" value={params.status} options={customerStatuses.list} />
          <FilterSelect name="view" label="Görünüm" value={params.view} allLabel={null} options={[{ value: "active", label: "Arşivlenmemiş" }, { value: "archived", label: "Arşiv" }, { value: "all", label: "Tümü" }]} />
          <FilterSelect
            name="focus"
            label="Odak"
            value={params.focus}
            options={[
              { value: "overdue_receivable", label: "Gecikmiş alacağı olanlar" },
              { value: "billed_unpaid", label: "Ödenmemiş yenileme dönemi olanlar" },
              { value: "upcoming_renewal", label: `Yenilemesi yaklaşanlar (${warningDays} gün)` },
              { value: "open_tasks", label: "Açık görevi olanlar" },
              { value: "missing_rate", label: "Kur bilgisi eksik işlemi olanlar" },
            ]}
          />
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState icon={Users} title="Kayıt bulunamadı" description="Filtreleri değiştirin veya temizleyin." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left">
                <thead className="border-b border-navy-100 bg-navy-50/60 text-[11px] uppercase tracking-wide text-navy-500">
                  <tr>
                    <SortTH label="Müşteri" field="company" params={listParams} basePath={BASE} className="sticky left-0 z-10 border-r border-navy-100 bg-navy-50 px-3" />
                    <TH className="px-3">İletişim</TH>
                    <TH className="px-3">Projeler</TH>
                    <TH className="px-3">Proje ödemeleri</TH>
                    <TH className="px-3">Hizmet ve yenileme</TH>
                    <TH className="px-3 text-right">Tahsil edilen</TH>
                    <TH className="px-3 text-right">Bekleyen alacak</TH>
                    <SortTH label="Gecikmiş alacak" field="overdue" params={listParams} basePath={BASE} className="px-3 text-right" />
                    <TH className="px-3">Takip</TH>
                    <SortTH label="Son güncelleme" field="updated" params={listParams} basePath={BASE} className="px-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {rows.map((r) => {
                    const openHref = hrefWith(listParams, { c: r.id });
                    return (
                      <WorkspaceRow key={r.id} href={openHref} selected={r.id === selectedId}>
                        <Cells r={r} base={base} today={today} warningDays={warningDays} openHref={openHref} selected={r.id === selectedId} />
                      </WorkspaceRow>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} params={listParams} basePath={BASE} />
          </>
        )}
      </Card>
      <p className="mt-3 text-[11px] text-navy-400">
        Proje ödemeleri, her projenin anlaşılan tutarı ile o projeye bağlı tahsilatlardan hesaplanır (iptal edilen projeler hariç) ve müşterinin genel alacağından ayrıdır.
        Tahsil edilen, bekleyen ve gecikmiş alacak yalnızca müşteriye bağlanmış gelir kayıtlarını içerir.
      </p>

      {selectedId ? (
        <DetailPanel closeHref={closeHref} title={detail?.customer.companyName ?? "Müşteri bulunamadı"}>
          {detail ? <CustomerDetail d={detail} /> : <p className="p-5 text-sm text-navy-500">Bu müşteri kaydı bulunamadı veya silinmiş.</p>}
        </DetailPanel>
      ) : null}
    </>
  );
}
