import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function Pagination({
  page,
  pageSize,
  total,
  params,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, val] of Object.entries(params)) if (val && k !== "page") sp.set(k, val);
    if (p > 1) sp.set("page", String(p));
    const q = sp.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-navy-200 px-2 text-xs font-medium";
  const windowPages = Array.from({ length: pages }, (_, i) => i + 1).filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1);
  return (
    <nav aria-label="Sayfalama" className="flex flex-col items-center justify-between gap-3 border-t border-navy-100 px-4 py-3 text-xs text-navy-500 sm:flex-row">
      <p className="tabular">
        {total.toLocaleString("tr-TR")} kayıttan {from.toLocaleString("tr-TR")}–{to.toLocaleString("tr-TR")} arası
      </p>
      {pages > 1 ? (
        <div className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} className={cn(btn, "hover:bg-navy-50")} aria-label="Önceki sayfa"><ChevronLeft className="size-3.5" /></Link>
          ) : (
            <span className={cn(btn, "opacity-40")}><ChevronLeft className="size-3.5" /></span>
          )}
          {windowPages.map((p, i) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - windowPages[i - 1]! > 1 ? <span className="px-1">…</span> : null}
              <Link
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(btn, p === page ? "border-brand-600 bg-brand-600 text-white" : "hover:bg-navy-50")}
              >
                {p}
              </Link>
            </span>
          ))}
          {page < pages ? (
            <Link href={href(page + 1)} className={cn(btn, "hover:bg-navy-50")} aria-label="Sonraki sayfa"><ChevronRight className="size-3.5" /></Link>
          ) : (
            <span className={cn(btn, "opacity-40")}><ChevronRight className="size-3.5" /></span>
          )}
        </div>
      ) : null}
    </nav>
  );
}
