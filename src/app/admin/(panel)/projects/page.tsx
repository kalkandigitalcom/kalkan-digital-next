import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listProjects } from "@/server/services/projects";
import { customerOptions } from "@/server/services/customers";
import { paymentStatusOf } from "@/server/finance/core";
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
import { paymentStatuses, projectStatuses, serviceTypes } from "@/lib/labels";
import { formatDate, todayIso } from "@/lib/dates";

export const metadata: Metadata = { title: "Projeler" };
const BASE = "/admin/projects";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const [{ rows, total, page, pageSize }, custs] = await Promise.all([listProjects(params), customerOptions()]);
  const today = todayIso();
  return (
    <>
      <PageHeader title="Projeler" description="Tüm projeler, bütçeler ve ödeme durumları." actions={<LinkButton href={`${BASE}/new`}><Plus className="size-4" /> Yeni proje</LinkButton>} />
      <Card>
        <FilterBar basePath={BASE} params={params} searchPlaceholder="Proje veya müşteri adı…">
          <FilterSelect name="status" label="Durum" value={params.status} options={projectStatuses.list} />
          <FilterSelect name="payment" label="Ödeme" value={params.payment} options={paymentStatuses.list} />
          <FilterSelect name="type" label="Tür" value={params.type} options={serviceTypes.list} />
          <FilterSelect name="customerId" label="Müşteri" value={params.customerId} options={custs} />
          <FilterSelect name="view" label="Görünüm" value={params.view} allLabel={null} options={[{ value: "active", label: "Arşivlenmemiş" }, { value: "archived", label: "Arşiv" }, { value: "all", label: "Tümü" }]} />
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState icon={FolderKanban} title="Proje bulunamadı" description="Filtreleri değiştirin veya yeni proje ekleyin." />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <SortTH label="Proje" field="name" params={params} basePath={BASE} />
                  <TH>Müşteri</TH>
                  <SortTH label="Durum" field="status" params={params} basePath={BASE} />
                  <SortTH label="Anlaşılan" field="agreed" params={params} basePath={BASE} className="text-right" />
                  <TH className="text-right">Tahsil edilen</TH>
                  <TH>Ödeme</TH>
                  <SortTH label="Hedef teslim" field="target" params={params} basePath={BASE} />
                </tr>
              </THead>
              <TBody>
                {rows.map((p) => {
                  const late = p.targetDate && !p.deliveredDate && p.targetDate < today && !["completed", "cancelled"].includes(p.status);
                  return (
                    <TR key={p.id}>
                      <TD>
                        <Link href={`${BASE}/${p.id}`} className="font-semibold text-navy-900 hover:text-brand-600">{p.name}</Link>
                        <div className="mt-0.5 flex gap-2 text-xs text-navy-400">{serviceTypes.label(p.projectType)} {p.archivedAt ? <Badge>Arşiv</Badge> : null}</div>
                      </TD>
                      <TD className="text-xs">{p.customerId ? <Link className="hover:text-brand-600" href={`/admin/customers/${p.customerId}`}>{p.customerName}</Link> : "—"}</TD>
                      <TD><OptionBadge value={p.status} options={projectStatuses} /></TD>
                      <TD className="text-right"><Money value={p.agreedAmount} currency={p.currency} /></TD>
                      <TD className="text-right"><Money value={p.collected} currency={p.currency} /></TD>
                      <TD><OptionBadge value={paymentStatusOf(p.agreedAmount, p.collected)} options={paymentStatuses} /></TD>
                      <TD className={`tabular text-xs ${late ? "font-semibold text-red-600" : ""}`}>{formatDate(p.targetDate)}{late ? " · gecikti" : ""}</TD>
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
