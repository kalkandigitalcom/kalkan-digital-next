"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { ActionForm, FormSection, MoneyField, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { currencies, paymentMethods, transactionStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/cn";
import type { ActionState } from "@/lib/action-state";

type Opt = { value: string; label: string };
export interface TxDefaults {
  id?: string;
  type?: "income" | "expense";
  description?: string;
  amount?: string;
  currency?: string;
  exchangeRate?: string | null;
  exchangeRateSource?: string | null;
  transactionDate?: string;
  dueDate?: string | null;
  settledDate?: string | null;
  status?: "completed" | "pending" | "cancelled";
  customerId?: string | null;
  projectId?: string | null;
  categoryId?: string;
  paymentMethod?: string | null;
  documentNo?: string | null;
  notes?: string | null;
}

const dec = (s: string | null | undefined) => (s ? s.replace(".", ",") : "");

export function TransactionForm({
  action,
  defaults,
  categories,
  customers,
  projects,
  baseCurrency,
  today,
  cancelHref,
  returnTo,
  lockedType,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  defaults: TxDefaults;
  categories: (Opt & { type: string })[];
  customers: Opt[];
  projects: (Opt & { customerId: string | null })[];
  baseCurrency: string;
  today: string;
  cancelHref: string;
  returnTo?: string;
  lockedType?: boolean;
}) {
  const [type, setType] = useState<"income" | "expense">(defaults.type ?? "income");
  const [cur, setCur] = useState(defaults.currency ?? baseCurrency);
  const [status, setStatus] = useState(defaults.status ?? "completed");
  const [customerId, setCustomerId] = useState(defaults.customerId ?? "");
  const cats = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const projs = useMemo(() => (customerId ? projects.filter((p) => p.customerId === customerId) : projects), [projects, customerId]);
  const foreign = cur !== baseCurrency;

  return (
    <ActionForm action={action} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <input type="hidden" name="type" value={type} />

      <div className="mb-6 inline-flex rounded-lg bg-navy-50 p-1" role="radiogroup" aria-label="İşlem tipi">
        {(["income", "expense"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            disabled={lockedType && type !== t}
            onClick={() => setType(t)}
            className={cn(
              "rounded-md px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-40",
              type === t ? (t === "income" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-600 text-white shadow-sm") : "text-navy-600 hover:text-navy-900",
            )}
          >
            {t === "income" ? "Gelir" : "Gider"}
          </button>
        ))}
      </div>

      <FormSection title="İşlem" description="Tutarlar ondalık için virgül ile girilebilir (örn. 12.500,00).">
        <TextField name="description" label="Açıklama" required defaultValue={defaults.description ?? ""} className="sm:col-span-2" />
        <MoneyField name="amount" label="Tutar" required defaultValue={dec(defaults.amount)} />
        <SelectField name="currency" label="Para birimi" options={currencies.list} value={cur} onChange={(e) => setCur(e.target.value)} />
        {foreign ? (
          <>
            <TextField
              name="exchangeRate"
              label={`Kur (1 ${cur} = ? ${baseCurrency})`}
              inputMode="decimal"
              placeholder="örn. 36,4500"
              defaultValue={defaults.exchangeRate && defaults.exchangeRate !== "1" ? defaults.exchangeRate.replace(".", ",") : ""}
              hint="İşlem anındaki kur. Boş bırakılırsa işlem baz para birimi raporlarına dahil edilmez."
            />
            <TextField name="exchangeRateSource" label="Kur kaynağı" placeholder="örn. TCMB efektif satış, banka dekontu" defaultValue={defaults.exchangeRateSource ?? ""} />
          </>
        ) : null}
        <SelectField
          name="categoryId"
          label="Kategori"
          required
          options={cats}
          placeholder="Kategori seçin"
          defaultValue={cats.some((c) => c.value === defaults.categoryId) ? defaults.categoryId : ""}
          key={type}
        />
        <SelectField name="paymentMethod" label="Ödeme yöntemi" options={paymentMethods.list} placeholder="Seçiniz" defaultValue={defaults.paymentMethod ?? ""} />
      </FormSection>

      <FormSection
        title="Durum ve tarihler"
        description="Raporlar nakit esaslıdır: gelir yalnızca “tahsil edildi” durumundayken ve tahsilat tarihine göre sayılır. Bekleyen kayıtlar alacak/borç olarak ayrı izlenir."
      >
        <SelectField
          name="status"
          label="Durum"
          options={(["completed", "pending", "cancelled"] as const).map((s) => ({ value: s, label: transactionStatusLabel(type, s) }))}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        />
        <TextField name="transactionDate" type="date" label="İşlem / belge tarihi" required defaultValue={defaults.transactionDate ?? today} />
        {status === "completed" ? (
          <TextField
            name="settledDate"
            type="date"
            label={type === "income" ? "Tahsilat tarihi" : "Ödeme tarihi"}
            max={today}
            defaultValue={defaults.settledDate ?? ""}
            hint="Boş bırakılırsa işlem tarihi kullanılır."
          />
        ) : null}
        {status === "pending" ? (
          <TextField name="dueDate" type="date" label="Vade / beklenen tarih" defaultValue={defaults.dueDate ?? ""} hint="Gecikme takibi bu tarihe göre yapılır." />
        ) : (
          <input type="hidden" name="dueDate" value={defaults.dueDate ?? ""} />
        )}
        <TextField name="documentNo" label="Fatura / belge no" defaultValue={defaults.documentNo ?? ""} />
      </FormSection>

      <FormSection title="İlişkiler">
        <SelectField name="customerId" label="İlgili müşteri" options={customers} placeholder="Yok" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <SelectField
          name="projectId"
          label="İlgili proje"
          options={projs}
          placeholder="Yok"
          defaultValue={projs.some((p) => p.value === defaults.projectId) ? (defaults.projectId ?? "") : ""}
          key={customerId}
          hint={customerId ? "Seçili müşterinin projeleri listelenir." : "Proje seçilirse müşteri otomatik bağlanır."}
        />
        <TextareaField name="notes" label="Not" rows={3} defaultValue={defaults.notes ?? ""} className="sm:col-span-2" />
      </FormSection>

      {foreign ? (
        <p className="mb-4 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Farklı para birimleri birbirine doğrudan eklenmez. Raporlarda {baseCurrency} karşılığı, burada girdiğiniz kur ile hesaplanıp ayrı olarak saklanır.
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <LinkButton href={cancelHref} variant="outline">Vazgeç</LinkButton>
        <SubmitButton>{defaults.id ? "Değişiklikleri kaydet" : "İşlemi kaydet"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
