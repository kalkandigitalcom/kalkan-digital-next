import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Plus } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listRecurring } from "@/server/services/recurring";
import { customerOptions } from "@/server/services/customers";
import { anchorDayOf } from "@/server/finance/recurring";
import { flatParams, type SearchParams } from "@/server/list";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, SortTH } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Money } from "@/components/admin/money";
import { recurringPeriods, recurringStatuses } from "@/lib/labels";
import { diffDays, formatDate } from "@/lib/dates";
import { BillAllButton, BillButton } from "./bill-button";
import { SettleButton } from "../transactions/settle-button";
import { periodEnd } from "@/server/finance/recurring";

export const metadata: Metadata = { title: "Tekrarlayan hizmetler" };
const BASE = "/admin/recurring";

export default async function RecurringPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const [{ rows, total, page, pageSize, today, overdueOcc, warningDays }, customers] = await Promise.all([listRecurring(params), customerOptions()]);
  return (
    <>
      <PageHeader
        title="Tekrarlayan hizmetler ve yenilemeler"
        description="Hosting, domain, bakım ve diğer periyodik hizmetler. Beklenen yenilemeler, tahsil edilene kadar gelir sayılmaz."
        actions={<><BillAllButton /><LinkButton href={`${BASE}/new`}><Plus className="size-4" /> Yeni hizmet</LinkButton></>}
      />
      {overdueOcc.length > 0 ? (
        <Card className="mb-6 border-red-200">
          <CardHeader title={<span className="flex items-center gap-2 text-red-700"><AlertTriangle className="size-4" /> Gecikmiş yenileme ödemeleri</span>} description="Faturalandırılmış ancak vadesi geçmiş, tahsil edilmemiş dönemler" />
          <ul className="divide-y divide-navy-100">
            {overdueOcc.map((o) => (
              <li key={o.transactionId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <Link href={`${BASE}/${o.serviceId}`} className="font-semibold text-navy-900 hover:text-brand-600">{o.serviceName}</Link>
                  <p className="text-xs text-navy-500">{o.customerName} · dönem {formatDate(o.periodStart)} · vade {formatDate(o.dueDate)} ({diffDays(today, o.dueDate)} gün gecikti)</p>
                </div>
                <div className="flex items-center gap-3">
                  <Money value={o.amount} currency={o.currency} className="font-semibold" />
                  <SettleButton id={o.transactionId} type="income" today={today} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card>
        <FilterBar basePath={BASE} params={params} searchPlaceholder="Hizmet veya müşteri…">
          <FilterSelect name="due" label="Vade" value={params.due} options={[{ value: "upcoming", label: `Yaklaşan (${warningDays} gün)` }, { value: "overdue", label: "Yenileme tarihi geçmiş" }]} />
          <FilterSelect name="status" label="Durum" value={params.status} options={recurringStatuses.list} />
          <FilterSelect name="period" label="Periyot" value={params.period} options={recurringPeriods.list} />
          <FilterSelect name="customerId" label="Müşteri" value={params.customerId} options={customers} />
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Tekrarlayan hizmet bulunamadı" action={<LinkButton href={`${BASE}/new`} size="sm"><Plus className="size-4" /> Yeni hizmet</LinkButton>} />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <SortTH label="Hizmet" field="name" params={params} basePath={BASE} />
                  <TH>Müşteri</TH>
                  <SortTH label="Ücret" field="amount" params={params} basePath={BASE} className="text-right" />
                  <SortTH label="Sonraki yenileme" field="next" params={params} basePath={BASE} />
                  <TH>Son ödeme</TH>
                  <TH>Durum</TH>
                  <TH><span className="sr-only">İşlem</span></TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((r) => {
                  const days = diffDays(r.nextRenewalDate, today);
                  return (
                    <TR key={r.id}>
                      <TD>
                        <Link href={`${BASE}/${r.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{r.name}</Link>
                        <div className="text-xs text-navy-400">{recurringPeriods.label(r.period)}{r.autoRenew ? " · otomatik yenileme" : ""}</div>
                      </TD>
                      <TD className="text-xs"><Link href={`/admin/customers/${r.customerId}`} className="hover:text-brand-600">{r.customerName}</Link></TD>
                      <TD className="text-right"><Money value={r.amount} currency={r.currency} /></TD>
                      <TD className="text-xs">
                        <span className="tabular">{formatDate(r.nextRenewalDate)}</span>{" "}
                        {r.status === "active" ? <Badge tone={days < 0 ? "red" : days <= warningDays ? "amber" : "gray"}>{days < 0 ? `${-days} gün geçti` : days === 0 ? "bugün" : `${days} gün`}</Badge> : null}
                      </TD>
                      <TD className="text-xs">
                        <span className="tabular">{formatDate(r.lastPaid)}</span>
                        {r.openCount ? <div className="text-amber-700">{r.openCount} açık dönem</div> : null}
                      </TD>
                      <TD><OptionBadge value={r.status} options={recurringStatuses} /></TD>
                      <TD className="text-right">
                        {r.status === "active" && days <= warningDays ? (
                          <BillButton id={r.id} periodStart={r.nextRenewalDate} periodLabel={`${formatDate(r.nextRenewalDate)} – ${formatDate(periodEnd(r.nextRenewalDate, r.period, anchorDayOf(r.startDate)))}`} />
                        ) : null}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} params={params} basePath={BASE} />
          </>
        )}
      </Card>
    </>
  );
}
