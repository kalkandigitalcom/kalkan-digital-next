"use client";

import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import type { WsRow } from "@/server/services/workspace";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { diffDays, formatDate } from "@/lib/dates";
import { customerTypes, paymentStatuses, projectStatuses, recurringPeriods } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { EditableText, useSaveCell } from "./cells";

const H = "mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500";
const SMALL_LINK = "inline-flex items-center gap-1 text-[11px] font-semibold normal-case tracking-normal text-brand-600 hover:underline";

function TypeSelect({ row }: { row: WsRow }) {
  const [value, setValue] = useState<string>(row.customerType);
  const { save, pending } = useSaveCell(row.id);
  return (
    <select
      aria-label="Müşteri türü"
      value={value}
      disabled={pending}
      onChange={(e) => {
        const prev = value;
        setValue(e.target.value);
        save("customerType", e.target.value, (ok) => !ok && setValue(prev));
      }}
      className="h-7 w-full rounded-md border border-transparent bg-transparent px-1.5 text-xs hover:border-navy-200 focus:border-brand-500 focus:outline-none"
    >
      {customerTypes.list.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Expanded row: editable secondary customer fields, all projects with fees, and recurring services. */
export function RowDetail({ row: r, base, today }: { row: WsRow; base: string; today: string }) {
  const money = (v: string | null, c: string) => (v === null ? "—" : formatMoney(v, c as CurrencyCode));
  return (
    <div className="grid gap-6 px-4 py-4 md:grid-cols-2 2xl:grid-cols-[260px_minmax(0,1.3fr)_minmax(0,1fr)]">
      <section>
        <h3 className={H}>
          Müşteri bilgileri
          <Link href={`/admin/customers/${r.id}`} className={SMALL_LINK}>Tam kayıt</Link>
        </h3>
        <dl className="grid grid-cols-[84px_1fr] items-center gap-y-0.5 text-xs">
          <dt className="text-navy-500">Yetkili</dt>
          <dd><EditableText customerId={r.id} field="contactName" value={r.contactName} placeholder="Ekle" label="Yetkili" /></dd>
          <dt className="text-navy-500">WhatsApp</dt>
          <dd><EditableText customerId={r.id} field="whatsapp" type="tel" value={r.whatsapp} placeholder="Ekle" label="WhatsApp" /></dd>
          <dt className="text-navy-500">Web sitesi</dt>
          <dd><EditableText customerId={r.id} field="website" type="url" value={r.website} placeholder="Ekle" label="Web sitesi" /></dd>
          <dt className="text-navy-500">Adres</dt>
          <dd><EditableText customerId={r.id} field="address" value={r.address} placeholder="Ekle" label="Adres" multiline /></dd>
          <dt className="text-navy-500">Tür</dt>
          <dd><TypeSelect row={r} /></dd>
        </dl>
      </section>

      <section className="min-w-0">
        <h3 className={H}>
          Projeler ve ücretler ({r.projects.length})
          <Link href={`/admin/projects/new?customerId=${r.id}`} className={SMALL_LINK}><Plus className="size-3" /> Proje ekle</Link>
        </h3>
        {r.projects.length === 0 ? (
          <p className="text-xs text-navy-400">Proje yok.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-left text-[11px] text-navy-500">
              <tr>
                <th className="py-1 pr-2 font-medium">Proje</th>
                <th className="py-1 pr-2 text-right font-medium">Anlaşılan</th>
                <th className="py-1 pr-2 text-right font-medium">Tahsil</th>
                <th className="py-1 font-medium">Ödeme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {r.projects.map((p) => (
                <tr key={p.id} className={cn((p.archived || p.status === "cancelled") && "text-navy-400")}>
                  <td className="py-1.5 pr-2 align-top">
                    <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-brand-600">{p.name}</Link>
                    <span className="ml-1.5 text-[11px] text-navy-400">{projectStatuses.label(p.status)}{p.archived ? " · arşiv" : ""}</span>
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-[11px] text-brand-600 hover:underline">
                        {p.url.replace(/^https?:\/\/(www\.)?/, "")} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ) : null}
                  </td>
                  <td className="tabular py-1.5 pr-2 text-right align-top">{money(p.agreedAmount, p.currency)}</td>
                  <td className="tabular py-1.5 pr-2 text-right align-top">{money(p.collected, p.currency)}</td>
                  <td className="py-1.5 align-top">{p.status === "cancelled" ? "—" : paymentStatuses.label(p.paymentStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="min-w-0">
        <h3 className={H}>
          Yıllık hizmetler ve yenilemeler
          <span className="flex gap-3">
            <Link href={`/admin/recurring/new?customerId=${r.id}`} className={SMALL_LINK}><Plus className="size-3" /> Hizmet</Link>
            <Link href={`/admin/transactions/new?type=income&customerId=${r.id}`} className={SMALL_LINK}><Plus className="size-3" /> Ödeme</Link>
          </span>
        </h3>
        {r.services.length === 0 ? (
          <p className="text-xs text-navy-400">Tekrarlayan hizmet yok.</p>
        ) : (
          <ul className="divide-y divide-navy-100 text-xs">
            {r.services.map((s) => {
              const d = diffDays(s.nextRenewalDate, today);
              return (
                <li key={s.id} className={cn("flex items-start justify-between gap-3 py-1.5", s.status !== "active" && "text-navy-400")}>
                  <div className="min-w-0">
                    <Link href={`/admin/recurring/${s.id}`} className="font-medium hover:text-brand-600">{s.name}</Link>
                    <p className="text-[11px] text-navy-500">
                      {recurringPeriods.label(s.period)} · {formatMoney(s.amount, s.currency)}
                      {s.status !== "active" ? " · durduruldu" : ""}
                    </p>
                  </div>
                  <span className={cn("tabular shrink-0", s.status === "active" && d < 0 && "font-semibold text-red-600")}>{formatDate(s.nextRenewalDate)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-navy-400">
          Alınan ödeme ve kalan alacak, müşteriye bağlı gelir kayıtlarından {base} karşılığı olarak hesaplanır. Ödeme eklemek veya bir alacağı tahsil edildi olarak işaretlemek için Gelir &amp; gider ekranını kullanın.
        </p>
      </section>
    </div>
  );
}
