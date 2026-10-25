import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth/session";
import { getYearReport } from "@/server/services/reports";
import { flatParams, type SearchParams } from "@/server/list";
import { paymentStatusOf } from "@/server/finance/core";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { OptionBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat";
import { Money } from "@/components/admin/money";
import { MonthlyChart } from "@/components/admin/charts";
import { inputClassStatic } from "@/components/admin/input-class";
import { AutoSubmitSelect } from "@/components/ui/auto-submit";
import { monthName, todayIso, yearOf } from "@/lib/dates";
import { subMoney } from "@/lib/money";
import { paymentStatuses, projectStatuses } from "@/lib/labels";

export const metadata: Metadata = { title: "Raporlar" };

function change(cur: string, prev: string) {
  const c = Number(cur);
  const p = Number(prev);
  if (p === 0) return c === 0 ? "—" : "yeni";
  const pct = ((c - p) / Math.abs(p)) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`;
}

function CategoryCompare({ title, cur, prev, base, year, compareYear }: { title: string; cur: { name: string; total: string }[]; prev: { name: string; total: string }[]; base: "TRY" | "EUR" | "USD" | "GBP"; year: number; compareYear: number }) {
  const names = Array.from(new Set([...cur.map((c) => c.name), ...prev.map((c) => c.name)]));
  return (
    <Card>
      <CardHeader title={title} />
      {names.length === 0 ? (
        <CardBody><p className="text-center text-xs text-navy-400">Kayıt yok.</p></CardBody>
      ) : (
        <Table className="[&_table]:min-w-0">
          <THead><tr><TH>Kategori</TH><TH className="text-right">{year}</TH><TH className="text-right">{compareYear}</TH><TH className="text-right">Değişim</TH></tr></THead>
          <TBody>
            {names.map((n) => {
              const a = cur.find((c) => c.name === n)?.total ?? "0";
              const b = prev.find((c) => c.name === n)?.total ?? "0";
              return (
                <TR key={n}>
                  <TD className="font-medium">{n}</TD>
                  <TD className="text-right"><Money value={a} currency={base} /></TD>
                  <TD className="text-right text-navy-500"><Money value={b} currency={base} /></TD>
                  <TD className="tabular text-right text-xs">{change(a, b)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </Card>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = flatParams(await searchParams);
  const thisYear = yearOf(todayIso());
  const yearNum = Number(p.year);
  const year = Number.isInteger(yearNum) && yearNum >= 2000 && yearNum <= thisYear + 1 ? yearNum : thisYear;
  const cmpNum = Number(p.compare);
  const compareYear = Number.isInteger(cmpNum) && cmpNum >= 2000 && cmpNum <= thisYear + 1 && cmpNum !== year ? cmpNum : year - 1;
  const r = await getYearReport(year, compareYear);
  const firstYear = Math.min(r.firstYear ?? thisYear, 2018);
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i);

  return (
    <>
      <PageHeader
        title="Raporlar"
        description={`Nakit esaslı yıllık rapor (${r.base} karşılıkları). Gelir, tahsilat tarihine; gider, ödeme tarihine göre sayılır.`}
        actions={
          <form method="get" className="flex items-center gap-2 text-xs text-navy-500">
            <label className="flex items-center gap-1.5">Yıl
              <AutoSubmitSelect name="year" defaultValue={String(year)} className={`${inputClassStatic} h-9 w-auto`}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </AutoSubmitSelect>
            </label>
            <label className="flex items-center gap-1.5">Karşılaştır
              <AutoSubmitSelect name="compare" defaultValue={String(compareYear)} className={`${inputClassStatic} h-9 w-auto`}>
                {years.filter((y) => y !== year).map((y) => <option key={y} value={y}>{y}</option>)}
              </AutoSubmitSelect>
            </label>
          </form>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={`Tahsil edilen gelir · ${year}`} value={<Money value={r.totals.collectedIncome} currency={r.base} />} tone="green" hint={<>{compareYear}: <Money value={r.totalsCmp.collectedIncome} currency={r.base} /> ({change(r.totals.collectedIncome, r.totalsCmp.collectedIncome)})</>} />
        <StatCard label={`Gerçekleşen gider · ${year}`} value={<Money value={r.totals.paidExpense} currency={r.base} />} tone="red" hint={<>{compareYear}: <Money value={r.totalsCmp.paidExpense} currency={r.base} /> ({change(r.totals.paidExpense, r.totalsCmp.paidExpense)})</>} />
        <StatCard label={`Net nakit hareketi · ${year}`} value={<Money value={r.totals.net} currency={r.base} />} tone="navy" hint={<>{compareYear}: <Money value={r.totalsCmp.net} currency={r.base} /></>} />
      </div>
      {r.totals.missingRateCount > 0 ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">{year} yılında kur girilmemiş {r.totals.missingRateCount} işlem baz para birimi toplamlarına dahil edilmedi; aşağıdaki para birimi tablosunda orijinal tutarlarıyla görünür.</p>
      ) : null}

      <Card className="mt-6">
        <CardHeader title={`Aylık gelir ve gider · ${year}`} />
        <CardBody><MonthlyChart data={r.monthly} currency={r.base} /></CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Aylık karşılaştırma tablosu" description={`${year} ve ${compareYear}`} />
        <Table>
          <THead>
            <tr>
              <TH>Ay</TH>
              <TH className="text-right">Gelir {year}</TH>
              <TH className="text-right">Gelir {compareYear}</TH>
              <TH className="text-right">Gider {year}</TH>
              <TH className="text-right">Gider {compareYear}</TH>
              <TH className="text-right">Net {year}</TH>
              <TH className="text-right">Net {compareYear}</TH>
            </tr>
          </THead>
          <TBody>
            {r.monthly.map((m, i) => {
              const c = r.monthlyCmp[i]!;
              return (
                <TR key={m.month}>
                  <TD className="font-medium">{monthName(m.month)}</TD>
                  <TD className="text-right"><Money value={m.income} currency={r.base} /></TD>
                  <TD className="text-right text-navy-400"><Money value={c.income} currency={r.base} /></TD>
                  <TD className="text-right"><Money value={m.expense} currency={r.base} /></TD>
                  <TD className="text-right text-navy-400"><Money value={c.expense} currency={r.base} /></TD>
                  <TD className={`text-right font-semibold ${Number(m.net) < 0 ? "text-red-600" : ""}`}><Money value={m.net} currency={r.base} /></TD>
                  <TD className="text-right text-navy-400"><Money value={c.net} currency={r.base} /></TD>
                </TR>
              );
            })}
            <TR className="bg-navy-50/60 font-semibold">
              <TD>Toplam</TD>
              <TD className="text-right"><Money value={r.totals.collectedIncome} currency={r.base} /></TD>
              <TD className="text-right"><Money value={r.totalsCmp.collectedIncome} currency={r.base} /></TD>
              <TD className="text-right"><Money value={r.totals.paidExpense} currency={r.base} /></TD>
              <TD className="text-right"><Money value={r.totalsCmp.paidExpense} currency={r.base} /></TD>
              <TD className="text-right"><Money value={r.totals.net} currency={r.base} /></TD>
              <TD className="text-right"><Money value={r.totalsCmp.net} currency={r.base} /></TD>
            </TR>
          </TBody>
        </Table>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CategoryCompare title="Gelir kategorileri" cur={r.incomeCats} prev={r.incomeCatsCmp} base={r.base} year={year} compareYear={compareYear} />
        <CategoryCompare title="Gider kategorileri" cur={r.expenseCats} prev={r.expenseCatsCmp} base={r.base} year={year} compareYear={compareYear} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Açık alacak ve borçlar" description="Bugün itibarıyla, tahsil/ödeme bekleyen kayıtlar" />
          <CardBody className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-navy-500">Tahsil edilmeyi bekleyen alacak</p>
                <p className="mt-1 font-display text-lg font-bold"><Money value={r.receivables.total} currency={r.base} /></p>
                <p className="text-xs text-red-600">Gecikmiş: <Money value={r.receivables.overdueTotal} currency={r.base} /></p>
              </div>
              <div>
                <p className="text-xs text-navy-500">Ödenmeyi bekleyen gider</p>
                <p className="mt-1 font-display text-lg font-bold"><Money value={r.payables.total} currency={r.base} /></p>
                <p className="text-xs text-red-600">Gecikmiş: <Money value={r.payables.overdueTotal} currency={r.base} /></p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-navy-600">Alacak yaşlandırma (vade tarihine göre)</p>
              <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {[
                  ["Vadesi gelmemiş / vadesiz", r.ageing.notDue],
                  ["0–30 gün", r.ageing.d0_30],
                  ["31–90 gün", r.ageing.d31_90],
                  ["90+ gün", r.ageing.d90p],
                ].map(([l, val]) => (
                  <div key={l} className="rounded-lg bg-navy-50 p-2.5">
                    <dt className="text-navy-500">{l}</dt>
                    <dd className="mt-0.5 font-semibold text-navy-900"><Money value={val} currency={r.base} /></dd>
                  </div>
                ))}
              </dl>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={`Para birimlerine göre · ${year}`} description="Orijinal tutarlar; para birimleri birbirine eklenmez" />
          {r.byCurrency.length === 0 ? (
            <CardBody><p className="text-center text-xs text-navy-400">Kayıt yok.</p></CardBody>
          ) : (
            <Table className="[&_table]:min-w-0">
              <THead><tr><TH>Tip</TH><TH>Birim</TH><TH className="text-right">Orijinal toplam</TH><TH className="text-right">{r.base} karşılığı</TH></tr></THead>
              <TBody>
                {r.byCurrency.map((c) => (
                  <TR key={`${c.type}-${c.currency}`}>
                    <TD>{c.type === "income" ? "Gelir" : "Gider"}</TD>
                    <TD>{c.currency}</TD>
                    <TD className="text-right"><Money value={c.amount} currency={c.currency} /></TD>
                    <TD className="text-right">
                      <Money value={c.baseAmount} currency={r.base} />
                      {c.missingRateCount ? <div className="text-[11px] text-amber-700">{c.missingRateCount} işlemde kur yok</div> : null}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Proje kârlılığı" description="Tahmini kâr = anlaşılan tutar − tahmini maliyet (proje para birimi). Nakit sonucu = tahsil edilen − ödenen gider (baz para birimi, tüm zamanlar). Son 50 proje." />
        {r.projects.length === 0 ? (
          <CardBody><p className="text-center text-xs text-navy-400">Proje yok.</p></CardBody>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Proje</TH>
                <TH>Durum</TH>
                <TH className="text-right">Anlaşılan</TH>
                <TH className="text-right">Tahmini kâr</TH>
                <TH>Ödeme</TH>
                <TH className="text-right">Tahsil ({r.base})</TH>
                <TH className="text-right">Bekleyen ({r.base})</TH>
                <TH className="text-right">Gider ({r.base})</TH>
                <TH className="text-right">Nakit sonucu</TH>
              </tr>
            </THead>
            <TBody>
              {r.projects.map((p) => {
                const cash = subMoney(p.collectedBase, p.expenseBase);
                return (
                  <TR key={p.id}>
                    <TD><Link href={`/admin/projects/${p.id}`} className="font-medium text-navy-900 hover:text-brand-600">{p.name}</Link><div className="text-xs text-navy-400">{p.customerName ?? "—"}</div></TD>
                    <TD><OptionBadge value={p.status} options={projectStatuses} /></TD>
                    <TD className="text-right"><Money value={p.agreedAmount} currency={p.currency} /></TD>
                    <TD className="text-right">{p.agreedAmount ? <Money value={subMoney(p.agreedAmount, p.estimatedCost)} currency={p.currency} /> : "—"}</TD>
                    <TD><OptionBadge value={paymentStatusOf(p.agreedAmount, p.collected)} options={paymentStatuses} /></TD>
                    <TD className="text-right"><Money value={p.collectedBase} currency={r.base} /></TD>
                    <TD className="text-right text-amber-700"><Money value={p.receivableBase} currency={r.base} /></TD>
                    <TD className="text-right"><Money value={p.expenseBase} currency={r.base} /></TD>
                    <TD className={`text-right font-semibold ${Number(cash) < 0 ? "text-red-600" : ""}`}><Money value={cash} currency={r.base} /></TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}
