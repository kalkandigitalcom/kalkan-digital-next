import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { requireAdmin } from "@/server/auth/session";
import { listWorkspace } from "@/server/services/workspace";
import { flatParams, type SearchParams } from "@/server/list";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/cn";
import { QuickAdd, WorkspaceGrid } from "./workspace-client";

export const metadata: Metadata = { title: "Ana ekran" };
const BASE = "/admin/workspace";

const VIEWS = [
  { value: "current", label: "Güncel" },
  { value: "archived", label: "Arşiv" },
  { value: "all", label: "Tümü" },
] as const;

export default async function WorkspacePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const params = flatParams(await searchParams);
  const { rows, total, page, pageSize, filters, base, today, incomeCategories } = await listWorkspace(params);
  const viewHref = (v: string) => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (v !== "current") sp.set("view", v);
    const q = sp.toString();
    return q ? `${BASE}?${q}` : BASE;
  };

  return (
    <div data-wide className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-navy-900">Müşteriler ve işler</h1>
          <p className="text-xs text-navy-500">
            Hücreye tıklayıp düzenleyin (Enter kaydeder, Esc vazgeçer) · Proje, ödeme ve hizmet eklemek için satırdaki + bağlantılarını veya oku kullanın · Tutarlar {base} karşılığıdır.
          </p>
        </div>
        <QuickAdd />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form method="get" action={BASE} className="relative">
          {filters.view !== "current" ? <input type="hidden" name="view" value={filters.view} /> : null}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-300" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Müşteri, telefon, e-posta, proje ara…"
            aria-label="Ara"
            className="h-9 w-72 rounded-lg border border-navy-200 bg-white pl-9 pr-3 text-sm placeholder:text-navy-300 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
          />
        </form>
        <nav aria-label="Görünüm" className="inline-flex rounded-lg border border-navy-200 bg-white p-0.5">
          {VIEWS.map((v) => (
            <Link
              key={v.value}
              href={viewHref(v.value)}
              aria-current={filters.view === v.value ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold",
                filters.view === v.value ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-50",
              )}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto text-xs text-navy-500">{total.toLocaleString("tr-TR")} müşteri</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-navy-200 bg-white">
          <EmptyState icon={Users} title={filters.q ? "Sonuç bulunamadı" : "Henüz müşteri yok"} description={filters.q ? "Aramayı değiştirin." : "Yukarıdan ilk müşteriyi ekleyin."} />
        </div>
      ) : (
        <WorkspaceGrid rows={rows} base={base} today={today} categories={incomeCategories} />
      )}

      {total > pageSize ? (
        <div className="rounded-xl border border-navy-200 bg-white">
          <Pagination page={page} pageSize={pageSize} total={total} params={params} basePath={BASE} />
        </div>
      ) : null}

      <p className="text-[11px] text-navy-400">
        Yıllık hizmet ücreti: aktif tekrarlayan hizmetlerin yıllığa çevrilmiş tutarı (aylık ×12, 3 aylık ×4, 6 aylık ×2), para birimi başına ayrı. Alınan ödeme: tahsil edilmiş gelir. Kalan alacak: tahsilatı bekleyen gelir; kur bilgisi olmayan yabancı para kayıtları dahil edilmez.
      </p>
    </div>
  );
}
