"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { WsProject, WsRow } from "@/server/services/workspace";
import { createProjectAction, updateProjectAction } from "@/server/actions/projects";
import { createTransactionAction } from "@/server/actions/transactions";
import { createRecurringAction } from "@/server/actions/recurring";
import { ActionForm, SubmitButton } from "@/components/ui/form";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { addDays, addMonths, diffDays, formatDate } from "@/lib/dates";
import { currencies, customerTypes, paymentMethods, paymentStatuses, projectStatuses, recurringPeriods, serviceTypes } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { EditableText, MiniInput, MiniSelect, useSaveCell } from "./cells";
import { SettleButton } from "../transactions/settle-button";
import { BillButton } from "../recurring/bill-button";

export type DetailFocus = "project" | "payment" | "service" | null;
type Opt = { value: string; label: string };

const CUR = currencies.list.map((c) => ({ value: c.value, label: c.value }));
const PERIOD_MONTHS = { monthly: 1, quarterly: 3, semiannual: 6, yearly: 12 } as const;
const H = "mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500";
const ADD = "mt-3 rounded-lg border border-dashed border-navy-200 bg-white p-2.5";
const money = (v: string | null, c: string) => (v === null ? "—" : formatMoney(v, c as CurrencyCode));
/** numeric(14,2) string → input text ("1250.50" → "1250,50"). */
const dec = (v: string | null) => (v ? v.replace(".", ",") : "");

function Panel({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0", className)}>
      <h3 className={H}>{title}</h3>
      {children}
    </section>
  );
}

/* --------------------------------------------- Customer -------------------------------------------- */

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
      className="h-7 rounded-md border border-transparent bg-transparent px-1.5 text-xs hover:border-navy-200 focus:border-brand-500 focus:outline-none"
    >
      {customerTypes.list.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function CustomerBar({ row: r }: { row: WsRow }) {
  const item = "flex min-w-0 items-center gap-1 text-xs";
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-navy-100 px-4 py-2">
      <span className={item}><span className="text-navy-500">Yetkili</span><span className="w-40"><EditableText customerId={r.id} field="contactName" value={r.contactName} placeholder="Ekle" label="Yetkili" /></span></span>
      <span className={item}><span className="text-navy-500">WhatsApp</span><span className="w-40"><EditableText customerId={r.id} field="whatsapp" type="tel" value={r.whatsapp} placeholder="Ekle" label="WhatsApp" /></span></span>
      <span className={item}><span className="text-navy-500">Web</span><span className="w-48"><EditableText customerId={r.id} field="website" type="url" value={r.website} placeholder="Ekle" label="Web sitesi" /></span></span>
      <span className={item}><span className="text-navy-500">Adres</span><span className="w-56"><EditableText customerId={r.id} field="address" value={r.address} placeholder="Ekle" label="Adres" /></span></span>
      <span className={item}><span className="text-navy-500">Tür</span><TypeSelect row={r} /></span>
      <Link href={`/admin/customers/${r.id}`} className="ml-auto text-[11px] font-semibold text-brand-600 hover:underline">Görüşme notları ve tam kayıt</Link>
    </div>
  );
}

/* --------------------------------------------- Projects -------------------------------------------- */

/** One project as an editable row. Unshown fields are sent back unchanged (same validation as the project form). */
function ProjectRow({ p, customerId }: { p: WsProject; customerId: string }) {
  const [dirty, setDirty] = useState(false);
  return (
    <ActionForm action={updateProjectAction} silent={false} onSuccess={() => setDirty(false)} className="border-b border-navy-100 py-2 last:border-0">
      <div onChange={() => setDirty(true)} className="grid grid-cols-6 items-end gap-2">
        <input type="hidden" name="_inline" value="1" />
        <input type="hidden" name="id" value={p.id} />
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="projectType" value={p.projectType} />
        <input type="hidden" name="description" value={p.description ?? ""} />
        <input type="hidden" name="startDate" value={p.startDate ?? ""} />
        <input type="hidden" name="targetDate" value={p.targetDate ?? ""} />
        <input type="hidden" name="deliveredDate" value={p.deliveredDate ?? ""} />
        <input type="hidden" name="quotedAmount" value={dec(p.quotedAmount)} />
        <input type="hidden" name="estimatedCost" value={dec(p.estimatedCost)} />
        <input type="hidden" name="internalNotes" value={p.internalNotes ?? ""} />
        <MiniInput name="name" label="Proje" defaultValue={p.name} required className="col-span-3" />
        <MiniInput name="projectUrl" label="Web adresi" defaultValue={p.url ?? ""} placeholder="https://" className="col-span-3" />
        <MiniInput name="agreedAmount" label="Ücret" defaultValue={dec(p.agreedAmount)} inputMode="decimal" placeholder="0,00" className="col-span-2" />
        <MiniSelect name="currency" label="Birim" options={CUR} defaultValue={p.currency} />
        <MiniSelect name="status" label="Durum" options={projectStatuses.list} defaultValue={p.status} className="col-span-2" />
        <SubmitButton size="sm" variant={dirty ? "primary" : "secondary"} className="h-8" disabled={!dirty}>Kaydet</SubmitButton>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-navy-500">
        <span>Tahsil: <span className="tabular text-navy-800">{money(p.collected, p.currency)}</span></span>
        <span>{p.status === "cancelled" ? "İptal edildi" : paymentStatuses.label(p.paymentStatus)}</span>
        {p.archived ? <span>Arşivde</span> : null}
        {p.url ? (
          <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
            Siteyi aç <ExternalLink className="size-3" aria-hidden />
          </a>
        ) : null}
        <Link href={`/admin/projects/${p.id}`} className="text-brand-600 hover:underline">Ayrıntı</Link>
      </p>
    </ActionForm>
  );
}

function AddProject({ customerId, autoFocus }: { customerId: string; autoFocus: boolean }) {
  return (
    <ActionForm action={createProjectAction} resetOnSuccess className={ADD}>
      <input type="hidden" name="_inline" value="1" />
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-6 items-end gap-2">
        <MiniInput name="name" label="Yeni proje" placeholder="Proje / site adı" required autoFocus={autoFocus} className="col-span-3" />
        <MiniInput name="projectUrl" label="Web adresi" placeholder="https://" className="col-span-3" />
        <MiniInput name="agreedAmount" label="Ücret" inputMode="decimal" placeholder="0,00" className="col-span-2" />
        <MiniSelect name="currency" label="Birim" options={CUR} defaultValue="TRY" />
        <MiniSelect name="projectType" label="Tür" options={serviceTypes.list} defaultValue="web_design" className="col-span-2" />
        <input type="hidden" name="status" value="in_progress" />
        <SubmitButton size="sm" className="h-8">Ekle</SubmitButton>
      </div>
    </ActionForm>
  );
}

/* --------------------------------------------- Payments -------------------------------------------- */

function AddPayment({ row, base, today, categories, autoFocus }: { row: WsRow; base: string; today: string; categories: Opt[]; autoFocus: boolean }) {
  const [currency, setCurrency] = useState(base);
  const [status, setStatus] = useState<"completed" | "pending">("completed");
  const projects = row.projects.filter((p) => p.status !== "cancelled").map((p) => ({ value: p.id, label: p.name }));
  const defaultCat = categories.find((c) => c.label === "Web tasarım")?.value ?? categories[0]?.value ?? "";
  return (
    <ActionForm action={createTransactionAction} resetOnSuccess className={ADD}>
      <input type="hidden" name="_inline" value="1" />
      <input type="hidden" name="type" value="income" />
      <input type="hidden" name="customerId" value={row.id} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniInput name="amount" label="Tutar" inputMode="decimal" placeholder="0,00" required autoFocus={autoFocus} />
        <MiniSelect name="currency" label="Birim" options={CUR} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <MiniSelect
          name="status"
          label="Durum"
          options={[
            { value: "completed", label: "Tahsil edildi" },
            { value: "pending", label: "Bekleyen alacak" },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value as "completed" | "pending")}
        />
        {currency !== base ? <MiniInput name="exchangeRate" label={`Kur (1 ${currency} = ? ${base})`} inputMode="decimal" placeholder="Boşsa toplamlara katılmaz" /> : null}
        <MiniInput name="transactionDate" label={status === "completed" ? "Tahsilat tarihi" : "Fatura tarihi"} type="date" defaultValue={today} max={status === "completed" ? today : undefined} required />
        {status === "pending" ? <MiniInput name="dueDate" label="Vade" type="date" /> : null}
        <MiniSelect name="projectId" label="Proje" options={projects} placeholder="—" />
        <MiniSelect name="categoryId" label="Kategori" options={categories} defaultValue={defaultCat} />
        <MiniSelect name="paymentMethod" label="Yöntem" options={paymentMethods.list} placeholder="—" />
        <MiniInput name="description" label="Açıklama" defaultValue={`${row.companyName} ödemesi`} required className="col-span-2" />
        <div className="flex items-end"><SubmitButton size="sm" className="h-8 w-full">Kaydet</SubmitButton></div>
      </div>
    </ActionForm>
  );
}

function Payments({ row: r, base, today, categories, focus }: { row: WsRow; base: string; today: string; categories: Opt[]; focus: boolean }) {
  return (
    <Panel title={`Alacaklar ve ödemeler`}>
      {r.openReceivables.length === 0 ? (
        <p className="text-xs text-navy-400">Bekleyen alacak yok.</p>
      ) : (
        <ul className="divide-y divide-navy-100 text-xs">
          {r.openReceivables.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 py-1.5">
              <span className="min-w-0">
                <span className="block truncate">{t.description}{t.projectName ? <span className="text-navy-400"> · {t.projectName}</span> : null}</span>
                <span className={cn("text-[11px]", t.date < today ? "font-semibold text-red-600" : "text-navy-500")}>
                  Vade {formatDate(t.date)}{t.baseAmount === null ? " · kur girilmemiş" : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular font-semibold">{money(t.amount, t.currency)}</span>
                <SettleButton id={t.id} type="income" today={today} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {r.recentPayments.length ? (
        <>
          <p className="mb-1 mt-3 text-[11px] font-semibold text-navy-500">Son tahsilatlar</p>
          <ul className="space-y-0.5 text-xs">
            {r.recentPayments.map((t) => (
              <li key={t.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-navy-600"><span className="tabular text-navy-400">{formatDate(t.date)}</span> {t.description}</span>
                <span className="tabular shrink-0">{money(t.amount, t.currency)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <AddPayment row={r} base={base} today={today} categories={categories} autoFocus={focus} />
      <p className="mt-1 text-[10px] text-navy-400">Tutarlar mevcut finans kurallarıyla {base} karşılığına çevrilir; kur girilmeyen yabancı para kayıtları toplamlara katılmaz.</p>
    </Panel>
  );
}

/* --------------------------------------------- Services -------------------------------------------- */

function periodLabel(start: string, period: keyof typeof PERIOD_MONTHS, anchorStart: string) {
  const end = addDays(addMonths(start, PERIOD_MONTHS[period], Number(anchorStart.slice(8, 10))), -1);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function AddService({ row, today, categories, autoFocus }: { row: WsRow; today: string; categories: Opt[]; autoFocus: boolean }) {
  const [date, setDate] = useState(today);
  const projects = row.projects.filter((p) => p.status !== "cancelled").map((p) => ({ value: p.id, label: p.name }));
  const defaultCat = categories.find((c) => c.label === "Hosting")?.value ?? categories[0]?.value ?? "";
  return (
    <ActionForm action={createRecurringAction} resetOnSuccess className={ADD}>
      <input type="hidden" name="_inline" value="1" />
      <input type="hidden" name="customerId" value={row.id} />
      <input type="hidden" name="status" value="active" />
      <input type="hidden" name="paymentTermDays" value="0" />
      <input type="hidden" name="startDate" value={date} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniInput name="name" label="Yeni hizmet" placeholder="örn. Hosting + domain" required autoFocus={autoFocus} className="col-span-2 sm:col-span-3" />
        <MiniInput name="amount" label="Dönem ücreti" inputMode="decimal" placeholder="0,00" required />
        <MiniSelect name="currency" label="Birim" options={CUR} defaultValue="TRY" />
        <MiniSelect name="period" label="Periyot" options={recurringPeriods.list} defaultValue="yearly" />
        <MiniInput name="nextRenewalDate" label="Yenileme tarihi" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <MiniSelect name="categoryId" label="Kategori" options={categories} defaultValue={defaultCat} />
        <MiniSelect name="projectId" label="Proje" options={projects} placeholder="—" />
        <div className="col-span-2 flex items-end sm:col-span-3"><SubmitButton size="sm" className="h-8 w-full">Hizmeti ekle</SubmitButton></div>
      </div>
    </ActionForm>
  );
}

function Services({ row: r, today, categories, focus }: { row: WsRow; today: string; categories: Opt[]; focus: boolean }) {
  return (
    <Panel title="Hizmetler ve yenilemeler">
      {r.services.length === 0 ? (
        <p className="text-xs text-navy-400">Tekrarlayan hizmet yok.</p>
      ) : (
        <ul className="divide-y divide-navy-100 text-xs">
          {r.services.map((s) => {
            const d = diffDays(s.nextRenewalDate, today);
            return (
              <li key={s.id} className={cn("flex items-center justify-between gap-2 py-1.5", s.status !== "active" && "text-navy-400")}>
                <span className="min-w-0">
                  <Link href={`/admin/recurring/${s.id}`} className="block truncate font-medium hover:text-brand-600">{s.name}</Link>
                  <span className="text-[11px] text-navy-500">
                    {recurringPeriods.label(s.period)} · {formatMoney(s.amount, s.currency)} ·{" "}
                    <span className={cn(s.status === "active" && d < 0 && "font-semibold text-red-600")}>{formatDate(s.nextRenewalDate)}</span>
                    {s.status !== "active" ? " · durduruldu" : ""}
                  </span>
                </span>
                {s.status === "active" ? <BillButton id={s.id} periodStart={s.nextRenewalDate} periodLabel={periodLabel(s.nextRenewalDate, s.period, s.startDate)} /> : null}
              </li>
            );
          })}
        </ul>
      )}
      <AddService row={r} today={today} categories={categories} autoFocus={focus} />
      <p className="mt-1 text-[10px] text-navy-400">“Tahsilat kaydı” dönemi bekleyen alacak olarak ekler ve yenileme tarihini ilerletir; aynı dönem iki kez eklenemez.</p>
    </Panel>
  );
}

/* --------------------------------------------- Layout ---------------------------------------------- */

/** Expanded row = the customer's work area: projects, receivables/payments and services, all editable here. */
export function RowDetail({ row, base, today, categories, focus }: { row: WsRow; base: string; today: string; categories: Opt[]; focus: DetailFocus }) {
  return (
    <div>
      <CustomerBar row={row} />
      <div className="grid gap-6 px-4 py-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={`Projeler (${row.projects.length})`}>
          {row.projects.length === 0 ? <p className="text-xs text-navy-400">Proje yok.</p> : row.projects.map((p) => <ProjectRow key={p.id} p={p} customerId={row.id} />)}
          <AddProject customerId={row.id} autoFocus={focus === "project"} />
        </Panel>
        <Payments row={row} base={base} today={today} categories={categories} focus={focus === "payment"} />
        <Services row={row} today={today} categories={categories} focus={focus === "service"} />
      </div>
    </div>
  );
}
