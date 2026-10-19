import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Plus, Repeat, Wallet } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { categoryOptions, listTransactions } from "@/server/services/transactions";
import { customerOptions } from "@/server/services/customers";
import { flatParams, type SearchParams } from "@/server/list";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Table, THead, TH, TBody, TR, TD, SortTH } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { FilterBar, FilterDate, FilterSelect } from "@/components/admin/filter-bar";
import { StatCard } from "@/components/admin/stat";
import { Money } from "@/components/admin/money";
import { currencies, paymentMethods, transactionStatusLabel } from "@/lib/labels";
import { formatDate, todayIso } from "@/lib/dates";
import { SettleButton } from "./settle-button";

export const metadata: Metadata = { title: "Gelir & gider" };
const BASE = "/admin/transactions";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const [data, categories, customers] = await Promise.all([listTransactions(params), categoryOptions(), customerOptions()]);
  const { rows, total, page, pageSize, base, summary } = data;
  const today = todayIso();
  const catOpts = categories
    .filter((c) => !params.type || c.type === params.type)
    .map((c) => ({ value: c.value, label: `${c.type === "income" ? "Gelir" : "Gider"} · ${c.label}` }));

  return (
    <>
      <PageHeader
        title="Gelir & gider"
        description="Tüm finansal hareketler. Özetler, uygulanan filtrelere göre hesaplanır."
        actions={
          <>
            <LinkButton href={`${BASE}/new?type=expense`} variant="outline"><Plus className="size-4" /> Gider</LinkButton>
            <LinkButton href={`${BASE}/new?type=income`}><Plus className="size-4" /> Gelir</LinkButton>
          </>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tahsil edilen gelir" value={<Money value={summary.collected} currency={base} />} tone="green" />
        <StatCard label="Tahsilat bekleyen alacak" value={<Money value={summary.receivable} currency={base} />} tone="amber" />
        <StatCard label="Gerçekleşen gider" value={<Money value={summary.paid} currency={base} />} tone="red" />
        <StatCard label="Ödenmeyi bekleyen gider" value={<Money value={summary.payable} currency={base} />} tone="navy" />
      </div>
      {summary.missingRate > 0 ? (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {summary.missingRate} yabancı para birimli işlemde kur girilmemiş; bu işlemler {base} toplamlarına dahil edilmedi.
        </p>
      ) : null}
      <Card>
        <FilterBar basePath={BASE} params={params} searchPlaceholder="Açıklama, belge no, not…">
          <FilterSelect name="type" label="Tip" value={params.type} options={[{ value: "income", label: "Gelir" }, { value: "expense", label: "Gider" }]} />
          <FilterSelect
            name="status"
            label="Durum"
            value={params.status}
            options={[
              { value: "completed", label: "Gerçekleşti" },
              { value: "pending", label: "Bekliyor" },
              { value: "overdue", label: "Gecikmiş (bekleyen)" },
              { value: "cancelled", label: "İptal" },
            ]}
          />
          <FilterSelect name="categoryId" label="Kategori" value={params.categoryId} options={catOpts} />
          <FilterSelect name="customerId" label="Müşteri" value={params.customerId} options={customers} />
          <FilterSelect name="currency" label="Para birimi" value={params.currency} options={currencies.list.map((c) => ({ value: c.value, label: c.value }))} />
          <FilterSelect name="method" label="Yöntem" value={params.method} options={paymentMethods.list} />
          <FilterSelect
            name="dateField"
            label="Tarih alanı"
            value={params.dateField}
            allLabel={null}
            options={[
              { value: "transaction", label: "İşlem tarihi" },
              { value: "settled", label: "Tahsilat/ödeme tarihi" },
              { value: "due", label: "Vade tarihi" },
            ]}
          />
          <FilterDate name="from" label="Başlangıç" value={params.from} />
          <FilterDate name="to" label="Bitiş" value={params.to} />
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState icon={Wallet} title="İşlem bulunamadı" description="Filtreleri değiştirin veya yeni bir gelir/gider ekleyin." />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <SortTH label="Tarih" field="date" params={params} basePath={BASE} />
                  <TH>Açıklama</TH>
                  <TH>Müşteri / proje</TH>
                  <TH>Durum</TH>
                  <SortTH label="Tutar" field="amount" params={params} basePath={BASE} className="text-right" />
                  <TH className="text-right">{base} karşılığı</TH>
                  <TH><span className="sr-only">İşlemler</span></TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((t) => {
                  const dueRef = t.dueDate ?? t.transactionDate;
                  const overdue = t.status === "pending" && dueRef < today;
                  return (
                    <TR key={t.id}>
                      <TD className="tabular whitespace-nowrap text-xs">
                        {formatDate(t.settledDate ?? t.transactionDate)}
                        {t.status === "pending" ? <div className={overdue ? "font-semibold text-red-600" : "text-navy-400"}>Vade {formatDate(dueRef)}</div> : null}
                      </TD>
                      <TD>
                        <Link href={`${BASE}/${t.id}/edit`} className="font-medium text-navy-900 hover:text-brand-600">{t.description}</Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-navy-400">
                          <span>{t.categoryName}</span>
                          {t.documentNo ? <span>· {t.documentNo}</span> : null}
                          {t.isRecurring ? <span className="inline-flex items-center gap-0.5 text-brand-600"><Repeat className="size-3" /> Yenileme</span> : null}
                        </div>
                      </TD>
                      <TD className="text-xs">
                        {t.customerId ? <Link href={`/admin/customers/${t.customerId}`} className="block text-navy-700 hover:text-brand-600">{t.customerName}</Link> : <span className="text-navy-300">—</span>}
                        {t.projectId ? <Link href={`/admin/projects/${t.projectId}`} className="block text-navy-400 hover:text-brand-600">{t.projectName}</Link> : null}
                      </TD>
                      <TD>
                        <Badge tone={t.status === "completed" ? "green" : t.status === "cancelled" ? "gray" : overdue ? "red" : "amber"}>
                          {overdue ? "Gecikmiş" : transactionStatusLabel(t.type, t.status)}
                        </Badge>
                      </TD>
                      <TD className={`text-right ${t.status === "cancelled" ? "line-through opacity-50" : ""}`}><Money value={t.amount} currency={t.currency} signed type={t.type} /></TD>
                      <TD className="text-right text-xs text-navy-500">
                        {t.currency === base ? "—" : t.baseAmount ? <Money value={t.baseAmount} currency={base} /> : <span className="text-amber-700">Kur yok</span>}
                      </TD>
                      <TD className="text-right">{t.status === "pending" ? <SettleButton id={t.id} type={t.type} today={today} /> : null}</TD>
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
