import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listCustomers } from "@/server/services/customers";
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
import { customerStatuses, customerTypes } from "@/lib/labels";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Müşteriler" };
const BASE = "/admin/customers";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const { rows, total, page, pageSize, base } = await listCustomers(params);

  return (
    <>
      <PageHeader
        title="Müşteriler"
        description="Müşteri kayıtları, iletişim bilgileri ve finansal özetleri."
        actions={<LinkButton href={`${BASE}/new`}><Plus className="size-4" /> Yeni müşteri</LinkButton>}
      />
      <Card>
        <FilterBar basePath={BASE} params={params} searchPlaceholder="Firma, yetkili, e-posta, telefon…">
          <FilterSelect name="status" label="Durum" value={params.status} options={customerStatuses.list} />
          <FilterSelect name="type" label="Tür" value={params.type} options={customerTypes.list} />
          <FilterSelect
            name="view"
            label="Görünüm"
            value={params.view}
            allLabel={null}
            options={[
              { value: "active", label: "Arşivlenmemiş" },
              { value: "archived", label: "Arşiv" },
              { value: "all", label: "Tümü" },
            ]}
          />
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={total === 0 && !params.q ? "Henüz müşteri yok" : "Sonuç bulunamadı"}
            description="Filtreleri değiştirin veya yeni bir müşteri ekleyin."
            action={<LinkButton href={`${BASE}/new`} size="sm"><Plus className="size-4" /> Yeni müşteri</LinkButton>}
          />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <SortTH label="Firma" field="company" params={params} basePath={BASE} />
                  <TH>İletişim</TH>
                  <SortTH label="Durum" field="status" params={params} basePath={BASE} />
                  <TH className="text-right">Proje</TH>
                  <TH className="text-right">Tahsil edilen</TH>
                  <TH className="text-right">Bekleyen alacak</TH>
                  <SortTH label="Kayıt" field="created" params={params} basePath={BASE} />
                </tr>
              </THead>
              <TBody>
                {rows.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link href={`${BASE}/${c.id}`} className="font-semibold text-navy-900 hover:text-brand-600">
                        {c.companyName}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-navy-400">
                        {customerTypes.label(c.customerType)}
                        {c.archivedAt ? <Badge>Arşiv</Badge> : null}
                      </div>
                    </TD>
                    <TD className="text-xs">
                      <div className="text-navy-700">{c.contactName ?? "—"}</div>
                      <div className="text-navy-400">{c.email ?? c.phone ?? ""}</div>
                    </TD>
                    <TD><OptionBadge value={c.status} options={customerStatuses} /></TD>
                    <TD className="tabular text-right">{c.projectCount}</TD>
                    <TD className="text-right"><Money value={c.collected} currency={base} /></TD>
                    <TD className="text-right">{Number(c.receivable) > 0 ? <Money value={c.receivable} currency={base} className="text-amber-700" /> : <span className="text-navy-300">—</span>}</TD>
                    <TD className="tabular text-xs text-navy-500">{formatDate(c.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={pageSize} total={total} params={params} basePath={BASE} />
          </>
        )}
      </Card>
    </>
  );
}
