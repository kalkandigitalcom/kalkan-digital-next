"use client";

import { useState } from "react";
import { ActionForm, MoneyField, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { addQuoteItemAction, convertQuoteAction, setQuoteStatusAction } from "@/server/actions/quotes";
import { customerTypes, quoteStatuses, serviceTypes } from "@/lib/labels";

export function StatusForm({ id, status, nextFollowUpDate }: { id: string; status: string; nextFollowUpDate: string | null }) {
  return (
    <ActionForm action={setQuoteStatusAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="id" value={id} />
      <SelectField name="status" label="Durum" options={quoteStatuses.list.filter((s) => s.value !== "won")} defaultValue={status === "won" ? "negotiation" : status} />
      <TextField name="nextFollowUpDate" type="date" label="Sonraki takip" defaultValue={nextFollowUpDate ?? ""} />
      <SubmitButton variant="secondary">Güncelle</SubmitButton>
    </ActionForm>
  );
}

export function ItemForm({ quoteId }: { quoteId: string }) {
  return (
    <ActionForm action={addQuoteItemAction} resetOnSuccess className="grid gap-3 sm:grid-cols-[2fr_0.7fr_1fr_auto] sm:items-end">
      <input type="hidden" name="quoteId" value={quoteId} />
      <TextField name="description" label="Kalem" required placeholder="örn. Kurumsal web sitesi tasarımı" />
      <TextField name="quantity" label="Miktar" inputMode="decimal" defaultValue="1" required />
      <MoneyField name="unitPrice" label="Birim fiyat" required />
      <SubmitButton variant="secondary">Ekle</SubmitButton>
    </ActionForm>
  );
}

export function ConvertForm({
  quoteId,
  customers,
  matches,
  preselectedCustomerId,
  defaults,
}: {
  quoteId: string;
  customers: { value: string; label: string }[];
  matches: { id: string; companyName: string; email: string | null; phone: string | null }[];
  preselectedCustomerId: string | null;
  defaults: { projectName: string; projectType: string; agreedAmount: string; currency: string };
}) {
  const initial = preselectedCustomerId ?? matches[0]?.id ?? "";
  const [mode, setMode] = useState<"existing" | "new">(initial ? "existing" : "new");
  return (
    <ActionForm action={convertQuoteAction} className="space-y-4">
      <input type="hidden" name="quoteId" value={quoteId} />
      {matches.length > 0 && !preselectedCustomerId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Benzer müşteri kayıtları bulundu — mükerrer kayıt oluşturmamak için mevcut müşteriyi seçin:</p>
          <ul className="mt-1 list-disc pl-4">
            {matches.map((m) => <li key={m.id}>{m.companyName} {m.email ? `· ${m.email}` : ""} {m.phone ? `· ${m.phone}` : ""}</li>)}
          </ul>
        </div>
      ) : null}
      <fieldset className="flex flex-wrap gap-4 text-sm">
        <legend className="mb-2 text-xs font-semibold text-navy-700">Müşteri</legend>
        <label className="flex items-center gap-2"><input type="radio" name="customerMode" value="existing" checked={mode === "existing"} onChange={() => setMode("existing")} className="accent-brand-600" /> Mevcut müşteri</label>
        <label className="flex items-center gap-2"><input type="radio" name="customerMode" value="new" checked={mode === "new"} onChange={() => setMode("new")} className="accent-brand-600" /> Tekliften yeni müşteri oluştur</label>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        {mode === "existing" ? (
          <SelectField name="existingCustomerId" label="Müşteri seçin" options={customers} placeholder="Seçiniz" defaultValue={initial} className="sm:col-span-2" />
        ) : (
          <SelectField name="customerType" label="Müşteri türü" options={customerTypes.list} defaultValue="company" />
        )}
        {mode === "existing" ? <input type="hidden" name="customerType" value="company" /> : null}
        <TextField name="projectName" label="Proje adı" required defaultValue={defaults.projectName} className={mode === "new" ? "" : "sm:col-span-2"} />
        <SelectField name="projectType" label="Proje türü" options={serviceTypes.list} defaultValue={defaults.projectType} />
        <MoneyField name="agreedAmount" label={`Anlaşılan tutar (${defaults.currency})`} defaultValue={defaults.agreedAmount} />
        <TextField name="startDate" type="date" label="Başlangıç" />
        <TextField name="targetDate" type="date" label="Hedef teslim" />
      </div>
      <p className="text-xs text-navy-500">Proje “planlandı” durumunda oluşturulur. Hiçbir tahsilat kaydı otomatik oluşturulmaz.</p>
      <div className="flex justify-end">
        <SubmitButton>Kazanıldı olarak işaretle ve projeyi oluştur</SubmitButton>
      </div>
    </ActionForm>
  );
}
