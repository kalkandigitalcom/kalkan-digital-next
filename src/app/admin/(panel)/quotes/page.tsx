import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listQuotes } from "@/server/services/quotes";
import { flatParams, type SearchParams } from "@/server/list";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, SortTH } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { FilterBar, FilterSelect } from "@/components/admin/filter-bar";
import { Money } from "@/components/admin/money";
import { quoteSources, quoteStatuses, serviceTypes } from "@/lib/labels";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Teklifler" };
const BASE = "/admin/quotes";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const { rows, total, page, pageSize, today, pipeline } = await listQuotes(params);
  return (
    <>
      <PageHeader title="Teklifler ve potansiyel müşteriler" description="Web sitesi formundan gelen talepler ve manuel takip edilen teklifler." actions={<LinkButton href={`${BASE}/new`}><Plus className="size-4" /> Yeni teklif</LinkButton>} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {quoteStatuses.list.map((s) => {
          const n = pipeline.find((p) => p.status === s.value)?.n ?? 0;
          const active = params.status === s.value;
          return (
            <Link key={s.value} href={active ? BASE : `${BASE}?status=${s.value}`} className={cn("flex min-w-32 shrink-0 flex-col rounded-xl border bg-white px-4 py-3 shadow-card transition-colors", active ? "border-brand-500 ring-2 ring-brand-100" : "border-navy-100 hover:border-navy-200")}>
              <span className="text-xs font-medium text-navy-500">{s.label}</span>
              <span className="tabular font-display text-lg font-bold text-navy-900">{n}</span>
            </Link>
          );
        })}
      </div>
      <Card>
        <FilterBar basePath={BASE} params={params} searchPlaceholder="Firma, yetkili, e-posta…">
          <FilterSelect name="status" label="Durum" value={params.status} options={[{ value: "open", label: "Açık (kazanılmamış/kaybedilmemiş)" }, ...quoteStatuses.list]} />
          <FilterSelect name="follow" label="Takip" value={params.follow} options={[{ value: "today", label: "Bugün / geçmiş" }, { value: "overdue", label: "Gecikmiş" }]} />
          <FilterSelect name="source" label="Kaynak" value={params.source} options={quoteSources.list} />
          <FilterSelect name="service" label="Hizmet" value={params.service} options={serviceTypes.list} />
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="Teklif bulunamadı" />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <SortTH label="Firma" field="company" params={params} basePath={BASE} />
                  <TH>Hizmet</TH>
                  <SortTH label="Tutar" field="amount" params={params} basePath={BASE} className="text-right" />
                  <TH>Durum</TH>
                  <SortTH label="Sonraki takip" field="follow" params={params} basePath={BASE} />
                  <SortTH label="Kayıt" field="created" params={params} basePath={BASE} />
                </tr>
              </THead>
              <TBody>
                {rows.map((q) => {
                  const open = !["won", "lost"].includes(q.status);
                  const late = open && q.nextFollowUpDate && q.nextFollowUpDate < today;
                  return (
                    <TR key={q.id}>
                      <TD>
                        <Link href={`${BASE}/${q.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{q.companyName}</Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-navy-400">
                          {q.contactName ?? q.email ?? q.phone ?? ""}
                          {q.source === "website_form" ? <Badge tone="blue">Web formu</Badge> : null}
                          {q.customerId ? <Badge tone="green">Müşteri</Badge> : null}
                        </div>
                      </TD>
                      <TD className="text-xs">{q.title ?? serviceTypes.label(q.requestedService)}</TD>
                      <TD className="text-right"><Money value={q.estimatedAmount} currency={q.currency} /></TD>
                      <TD><OptionBadge value={q.status} options={quoteStatuses} /></TD>
                      <TD className={`tabular text-xs ${late ? "font-semibold text-red-600" : ""}`}>{formatDate(q.nextFollowUpDate)}</TD>
                      <TD className="tabular text-xs text-navy-500">{formatDate(q.createdAt)}</TD>
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
