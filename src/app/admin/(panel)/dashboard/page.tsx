import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CheckSquare,
  CircleDollarSign,
  FolderKanban,
  Hourglass,
  Scale,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { getDashboard } from "@/server/services/dashboard";
import { flatParams, type SearchParams } from "@/server/list";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Badge, OptionBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/admin/stat";
import { Money } from "@/components/admin/money";
import { RangeFilter } from "@/components/admin/range-filter";
import { CategoryBars, MonthlyChart, YearlyChart } from "@/components/admin/charts";
import { customerStatuses, recurringPeriods, taskPriorities, transactionStatusLabel } from "@/lib/labels";
import { diffDays, formatDate, formatDateTime, resolveRange } from "@/lib/dates";
import { compareMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Genel bakış" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdmin();
  const params = flatParams(await searchParams);
  const range = resolveRange(params);
  const d = await getDashboard(range);
  const netNegative = compareMoney(d.period.net, "0") < 0;
  const hasAnyFinance = d.yearly.some((y) => Number(y.income) || Number(y.expense)) || d.receivables.count > 0;

  return (
    <>
      <PageHeader
        title={`Merhaba, ${admin.name.split(" ")[0]}`}
        description={`Seçili dönem: ${range.label} (${formatDate(range.from)} – ${formatDate(range.to)}). Tüm tutarlar ${d.base} karşılığıdır ve kayıtlı işlemlerden hesaplanır.`}
        actions={<RangeFilter preset={range.preset} from={range.from} to={range.to} action="/admin/dashboard" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam müşteri" value={d.counts.total} icon={Users} href="/admin/customers" hint="Arşivlenmemiş kayıtlar" />
        <StatCard label="Aktif müşteri" value={d.counts.active} icon={UserCheck} tone="green" href="/admin/customers?status=active" />
        <StatCard label="Devam eden proje" value={d.counts.ongoing} icon={FolderKanban} tone="blue" href="/admin/projects?status=in_progress" hint={`${d.counts.waiting} proje müşteri bekliyor`} />
        <StatCard
          label="Bekleyen tahsilatlar"
          value={<Money value={d.receivables.total} currency={d.base} />}
          icon={Hourglass}
          tone="amber"
          href="/admin/transactions?type=income&status=pending"
          hint={d.receivables.overdueCount ? <span className="text-red-600">{d.receivables.overdueCount} kayıt gecikmiş · <Money value={d.receivables.overdueTotal} currency={d.base} /></span> : `${d.receivables.count} açık kayıt`}
        />
        <StatCard
          label={`Tahsil edilen gelir · ${range.label}`}
          value={<Money value={d.period.collectedIncome} currency={d.base} />}
          icon={ArrowUpRight}
          tone="green"
          href={`/admin/transactions?type=income&status=completed&dateField=settled&from=${range.from}&to=${range.to}`}
          hint={`${d.period.incomeCount} tahsilat`}
        />
        <StatCard
          label={`Gider · ${range.label}`}
          value={<Money value={d.period.paidExpense} currency={d.base} />}
          icon={ArrowDownRight}
          tone="red"
          href={`/admin/transactions?type=expense&status=completed&dateField=settled&from=${range.from}&to=${range.to}`}
          hint={d.payables.count ? <>Ödenmeyi bekleyen: <Money value={d.payables.total} currency={d.base} /></> : "Bekleyen ödeme yok"}
        />
        <StatCard
          label={`Net nakit sonucu · ${range.label}`}
          value={<span className={netNegative ? "text-red-600" : ""}><Money value={d.period.net} currency={d.base} /></span>}
          icon={Scale}
          tone={netNegative ? "red" : "navy"}
          hint="Tahsil edilen gelir − gerçekleşen gider"
        />
        <StatCard
          label={`Yıllık tahsil edilen gelir · ${d.year}`}
          value={<Money value={d.yearTotals.collectedIncome} currency={d.base} />}
          icon={TrendingUp}
          tone="blue"
          hint={<>Yıllık net: <Money value={d.yearTotals.net} currency={d.base} /></>}
        />
      </div>

      {d.period.missingRateCount > 0 || d.receivables.missingRateCount > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Kur bilgisi girilmemiş {d.period.missingRateCount + d.receivables.missingRateCount} yabancı para birimli işlem {d.base} toplamlarına dahil edilmedi.
          <Link href="/admin/transactions" className="font-semibold underline">İşlemleri kontrol edin</Link>
        </p>
      ) : null}

      {!hasAnyFinance ? (
        <Card className="mt-6">
          <EmptyState
            icon={CircleDollarSign}
            title="Henüz finansal kayıt yok"
            description="Gelir ve giderlerinizi ekledikçe grafikler ve özetler burada otomatik olarak oluşur."
            action={<LinkButton href="/admin/transactions/new" size="sm">İlk işlemi ekle</LinkButton>}
          />
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title={`Aylık gelir ve gider · ${d.year}`} description="Tahsil edilen gelir ve gerçekleşen gider, tahsilat/ödeme tarihine göre" action={<LinkButton href={`/admin/reports?year=${d.year}`} variant="ghost" size="sm">Rapor</LinkButton>} />
            <CardBody><MonthlyChart data={d.monthly} currency={d.base} /></CardBody>
          </Card>
          <Card>
            <CardHeader title="Hizmet kategorilerine göre gelir" description={range.label} />
            <CardBody>
              {d.byCategory.length === 0 ? <p className="py-10 text-center text-xs text-navy-400">Bu dönemde tahsilat yok.</p> : <CategoryBars data={d.byCategory} currency={d.base} />}
            </CardBody>
          </Card>
          <Card className="xl:col-span-3">
            <CardHeader title="Yıllık gelir trendi" description={`${d.year - 4} – ${d.year} tahsil edilen gelir`} />
            <CardBody><YearlyChart data={d.yearly} currency={d.base} /></CardBody>
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Son işlemler" action={<LinkButton href="/admin/transactions" variant="ghost" size="sm">Tümü</LinkButton>} />
          {d.recentTx.length === 0 ? (
            <EmptyState title="İşlem yok" />
          ) : (
            <ul className="divide-y divide-navy-100">
              {d.recentTx.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/transactions/${t.id}/edit`} className="block truncate text-sm font-medium text-navy-900 hover:text-brand-600">{t.description}</Link>
                    <p className="truncate text-xs text-navy-400">{formatDate(t.date)} · {t.customerName ?? t.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Money value={t.amount} currency={t.currency} signed type={t.type} className="text-sm font-semibold" />
                    <p className="text-[11px] text-navy-400">{transactionStatusLabel(t.type, t.status)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Ödeme beklenen müşteriler" description="Tahsil edilmemiş alacaklar" action={<LinkButton href="/admin/transactions?type=income&status=pending" variant="ghost" size="sm">Tümü</LinkButton>} />
          {d.awaiting.length === 0 ? (
            <EmptyState title="Bekleyen alacak yok" />
          ) : (
            <ul className="divide-y divide-navy-100">
              {d.awaiting.map((a) => {
                const overdue = a.oldestDue < d.today;
                return (
                  <li key={a.customerId} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/transactions?customerId=${a.customerId}&type=income&status=pending`} className="block truncate text-sm font-medium text-navy-900 hover:text-brand-600">{a.customerName}</Link>
                      <p className={`text-xs ${overdue ? "text-red-600" : "text-navy-400"}`}>{a.count} kayıt · en eski vade {formatDate(a.oldestDue)}</p>
                    </div>
                    <Money value={a.total} currency={d.base} className="shrink-0 text-sm font-semibold text-amber-700" />
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Yaklaşan domain ve hosting yenilemeleri" description={`Önümüzdeki ${d.renewalWarningDays} gün ve gecikmiş olanlar`} action={<LinkButton href="/admin/recurring" variant="ghost" size="sm">Tümü</LinkButton>} />
          {d.renewals.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Yaklaşan yenileme yok" />
          ) : (
            <ul className="divide-y divide-navy-100">
              {d.renewals.map((r) => {
                const days = diffDays(r.nextRenewalDate, d.today);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/recurring/${r.id}`} className="block truncate text-sm font-medium text-navy-900 hover:text-brand-600">{r.name}</Link>
                      <p className="truncate text-xs text-navy-400">{r.customerName} · {recurringPeriods.label(r.period)} · <Money value={r.amount} currency={r.currency} /></p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className="tabular font-medium text-navy-700">{formatDate(r.nextRenewalDate)}</p>
                      <Badge tone={days < 0 ? "red" : days <= 7 ? "amber" : "blue"}>{days < 0 ? `${-days} gün gecikti` : days === 0 ? "Bugün" : `${days} gün`}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Yaklaşan ve gecikmiş görevler" description="Önümüzdeki 7 gün" action={<LinkButton href="/admin/tasks" variant="ghost" size="sm">Tümü</LinkButton>} />
          {d.upcomingTasks.length === 0 ? (
            <EmptyState icon={CheckSquare} title="Yaklaşan görev yok" />
          ) : (
            <ul className="divide-y divide-navy-100">
              {d.upcomingTasks.map((t) => {
                const overdue = t.dueAt && t.dueAt < d.now;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/tasks/${t.id}/edit`} className="block truncate text-sm font-medium text-navy-900 hover:text-brand-600">{t.title}</Link>
                      <p className="truncate text-xs text-navy-400">{t.customerName ?? t.projectName ?? "Genel"}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className={`tabular ${overdue ? "font-semibold text-red-600" : "text-navy-600"}`}>{formatDateTime(t.dueAt)}</p>
                      <OptionBadge value={t.priority} options={taskPriorities} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Son eklenen müşteriler" action={<LinkButton href="/admin/customers" variant="ghost" size="sm">Tümü</LinkButton>} />
          {d.recentCustomers.length === 0 ? (
            <EmptyState icon={Users} title="Müşteri yok" action={<LinkButton href="/admin/customers/new" size="sm">Müşteri ekle</LinkButton>} />
          ) : (
            <ul className="grid divide-y divide-navy-100 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
              {d.recentCustomers.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <Link href={`/admin/customers/${c.id}`} className="block truncate text-sm font-semibold text-navy-900 hover:text-brand-600">{c.companyName}</Link>
                  <p className="truncate text-xs text-navy-400">{c.contactName ?? "—"}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-navy-400">
                    <OptionBadge value={c.status} options={customerStatuses} />
                    {formatDate(c.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
