"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronRight, ExternalLink, Loader2, Plus } from "lucide-react";
import { createWorkspaceCustomerAction } from "@/server/actions/workspace";
import type { WsRow } from "@/server/services/workspace";
import { idleState } from "@/lib/action-state";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { diffDays, formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { RowDetail } from "./detail";
import { EditableText, STATUS_OPTIONS, useSaveCell } from "./cells";

function StatusCell({ row }: { row: WsRow }) {
  const serverValue = row.archived ? "archived" : row.status;
  const [value, setValue] = useState<string>(serverValue);
  const [lastServer, setLastServer] = useState(serverValue);
  if (serverValue !== lastServer) {
    setLastServer(serverValue);
    setValue(serverValue);
  }
  const { save, pending } = useSaveCell(row.id);
  return (
    <div className="flex items-center gap-1">
      <select
        aria-label={`${row.companyName} durumu`}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          save("status", next, (ok) => {
            if (!ok) setValue(prev);
          });
        }}
        className={cn(
          "h-7 w-full rounded-md border border-transparent bg-transparent px-1.5 text-xs font-medium hover:border-navy-200 focus:border-brand-500 focus:outline-none",
          value === "active" && "text-emerald-700",
          value === "archived" && "text-navy-400",
          value === "lead" && "text-amber-700",
        )}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending ? <Loader2 className="size-3 shrink-0 animate-spin text-navy-400" aria-hidden /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/*                                            Grid                                                  */
/* ------------------------------------------------------------------------------------------------ */

function short(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function MoneyLine({ value, currency, className }: { value: string; currency: string; className?: string }) {
  return <span className={cn("tabular whitespace-nowrap", className)}>{formatMoney(value, currency as CurrencyCode)}</span>;
}

const TH = "sticky top-0 z-20 border-b border-navy-200 bg-navy-50 px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-navy-500";
const TD = "border-b border-navy-100 px-2 py-1.5 align-top text-xs text-navy-800 group-hover:bg-navy-50";

export function WorkspaceGrid({ rows, base, today }: { rows: WsRow[]; base: string; today: string }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  // Width of the visible scroll area, so an expanded row stays in view while the table scrolls sideways.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewWidth, setViewWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div ref={scrollRef} className="max-h-[calc(100dvh-13rem)] min-h-64 overflow-auto rounded-xl border border-navy-200 bg-white">
      <table className="w-full min-w-[1560px] table-fixed border-separate border-spacing-0">
        <colgroup>
          <col className="w-[240px]" />
          <col className="w-[200px]" />
          <col className="w-[240px]" />
          <col className="w-[130px]" />
          <col className="w-[120px]" />
          <col className="w-[130px]" />
          <col className="w-[110px]" />
          <col className="w-[124px]" />
          <col className="w-[266px]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className={cn(TH, "left-0 z-30 border-r")}>Müşteri / Firma</th>
            <th scope="col" className={TH}>İletişim</th>
            <th scope="col" className={TH}>Projeler</th>
            <th scope="col" className={cn(TH, "text-right")}>Yıllık hizmet ücreti</th>
            <th scope="col" className={cn(TH, "text-right")}>Alınan ödeme</th>
            <th scope="col" className={cn(TH, "text-right")}>Kalan alacak</th>
            <th scope="col" className={TH}>Sonraki yenileme</th>
            <th scope="col" className={TH}>Durum</th>
            <th scope="col" className={TH}>Not</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isOpen = open.has(r.id);
            const days = r.nextRenewal ? diffDays(r.nextRenewal, today) : null;
            return (
              <Fragment key={r.id}>
                <tr className={cn("group", r.archived && "text-navy-400")}>
                  <td className={cn(TD, "sticky left-0 z-10 border-r", isOpen ? "bg-navy-50" : "bg-white")}>
                    <div className="flex items-start gap-0.5">
                      <button
                        type="button"
                        onClick={() => toggle(r.id)}
                        aria-expanded={isOpen}
                        aria-label={`${r.companyName} ayrıntılarını ${isOpen ? "gizle" : "göster"}`}
                        className="mt-0.5 rounded p-0.5 text-navy-400 hover:bg-navy-100 hover:text-navy-800"
                      >
                        {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <EditableText customerId={r.id} field="companyName" value={r.companyName} placeholder="Firma adı" label="Firma adı" displayClassName="text-[13px] font-semibold text-navy-900" />
                        {r.contactName ? <p className="truncate px-2 text-[11px] text-navy-500">{r.contactName}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className={TD}>
                    <EditableText customerId={r.id} field="phone" type="tel" value={r.phone} placeholder="Telefon ekle" label="Telefon" />
                    <EditableText customerId={r.id} field="email" type="email" value={r.email} placeholder="E-posta ekle" label="E-posta" />
                  </td>
                  <td className={TD}>
                    {r.projects.length === 0 ? (
                      <span className="px-2 text-navy-300">—</span>
                    ) : (
                      <ul className="space-y-0.5 px-2 py-1">
                        {r.projects.slice(0, 2).map((p) => (
                          <li key={p.id} className="min-w-0">
                            <span className={cn("block truncate", p.archived || p.status === "cancelled" ? "text-navy-400" : "text-navy-800")} title={p.name}>{p.name}</span>
                            {p.url ? (
                              <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-1 truncate text-[11px] text-brand-600 hover:underline">
                                <span className="truncate">{short(p.url)}</span> <ExternalLink className="size-3 shrink-0" aria-hidden />
                              </a>
                            ) : null}
                          </li>
                        ))}
                        {r.projects.length > 2 ? (
                          <li>
                            <button type="button" onClick={() => toggle(r.id)} className="text-[11px] font-semibold text-brand-600 hover:underline">
                              +{r.projects.length - 2} proje daha
                            </button>
                          </li>
                        ) : null}
                      </ul>
                    )}
                  </td>
                  <td className={cn(TD, "px-3 py-2.5 text-right")}>
                    {r.annualFees.length === 0 ? <span className="text-navy-300">—</span> : r.annualFees.map((f) => <MoneyLine key={f.currency} value={f.amount} currency={f.currency} className="block" />)}
                  </td>
                  <td className={cn(TD, "px-3 py-2.5 text-right")}>
                    <MoneyLine value={r.finance.collected} currency={base} />
                    {r.finance.collectedMissingRate ? <NoRate n={r.finance.collectedMissingRate} /> : null}
                  </td>
                  <td className={cn(TD, "px-3 py-2.5 text-right")}>
                    {r.finance.receivableCount === 0 && !r.finance.receivableMissingRate ? (
                      <span className="text-navy-300">—</span>
                    ) : (
                      <>
                        <MoneyLine value={r.finance.receivable} currency={base} className="font-semibold" />
                        {r.finance.overdueCount ? (
                          <span className="block text-[11px] text-red-600">
                            Gecikmiş: <MoneyLine value={r.finance.overdue} currency={base} />
                          </span>
                        ) : null}
                        {r.finance.receivableMissingRate ? <NoRate n={r.finance.receivableMissingRate} /> : null}
                      </>
                    )}
                  </td>
                  <td className={cn(TD, "px-3 py-2.5")}>
                    {r.nextRenewal && days !== null ? (
                      <>
                        <span className={cn("tabular block", days < 0 && "font-semibold text-red-600")}>{formatDate(r.nextRenewal)}</span>
                        <span className={cn("text-[11px]", days < 0 ? "text-red-600" : "text-navy-400")}>{days < 0 ? `${-days} gün geçti` : days === 0 ? "bugün" : `${days} gün sonra`}</span>
                      </>
                    ) : (
                      <span className="text-navy-300">—</span>
                    )}
                  </td>
                  <td className={cn(TD, "py-2")}>
                    <StatusCell row={r} />
                  </td>
                  <td className={TD}>
                    <EditableText customerId={r.id} field="notes" value={r.notes} placeholder="Not ekle" label="Not" multiline />
                    {r.followUpDate ? (
                      <p className={cn("px-2 text-[11px]", r.followUpDate < today ? "text-red-600" : "text-navy-400")}>Takip: {formatDate(r.followUpDate)}</p>
                    ) : null}
                  </td>
                </tr>
                {isOpen ? (
                  <tr>
                    <td colSpan={9} className="border-b border-navy-200 bg-navy-50/50 p-0">
                      <div className="sticky left-0" style={{ width: viewWidth }}>
                        <RowDetail row={r} base={base} today={today} />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NoRate({ n }: { n: number }) {
  return (
    <span className="mt-0.5 flex items-center justify-end gap-1 whitespace-nowrap text-[11px] text-amber-700" title={`Kur bilgisi girilmemiş ${n} yabancı para işlemi bu toplama dahil edilmedi`}>
      <AlertTriangle className="size-3 shrink-0" aria-hidden /> {n} işlemde kur yok
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/*                                         Quick add                                                */
/* ------------------------------------------------------------------------------------------------ */

export function QuickAdd() {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const { push } = useToast();
  const router = useRouter();
  function submit() {
    const fd = new FormData();
    fd.set("companyName", name);
    start(async () => {
      const res = await createWorkspaceCustomerAction(idleState, fd);
      if (res.status === "success") {
        push("success", res.message);
        setName("");
        router.refresh();
      } else if (res.status === "error") push("error", res.message);
    });
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Yeni müşteri adı"
        aria-label="Yeni müşteri adı"
        maxLength={200}
        className="h-9 w-56 rounded-lg border border-navy-200 bg-white px-3 text-sm placeholder:text-navy-300 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-100"
      />
      <button type="submit" disabled={pending || !name.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />} Ekle
      </button>
    </form>
  );
}

