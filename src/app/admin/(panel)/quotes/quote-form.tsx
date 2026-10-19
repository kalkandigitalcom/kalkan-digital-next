"use client";

import { ActionForm, FormSection, MoneyField, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { currencies, quoteStatuses, serviceTypes } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";

export interface QuoteDefaults {
  id?: string;
  customerId?: string | null;
  companyName?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  requestedService?: string | null;
  title?: string | null;
  estimatedAmount?: string | null;
  currency?: string;
  quoteDate?: string | null;
  nextFollowUpDate?: string | null;
  status?: string;
  lostReason?: string | null;
  notes?: string | null;
}

export function QuoteForm({
  action,
  defaults,
  customers,
  cancelHref,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  defaults: QuoteDefaults;
  customers: { value: string; label: string }[];
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <FormSection title="Potansiyel müşteri" description="Mevcut bir müşteri için teklif hazırlıyorsanız müşteriyi seçin; böylece mükerrer kayıt oluşmaz.">
        <SelectField name="customerId" label="Mevcut müşteri" options={customers} placeholder="Yeni / henüz müşteri değil" defaultValue={defaults.customerId ?? ""} className="sm:col-span-2" />
        <TextField name="companyName" label="Firma / kişi" required defaultValue={defaults.companyName ?? ""} />
        <TextField name="contactName" label="Yetkili" defaultValue={defaults.contactName ?? ""} />
        <TextField name="phone" type="tel" label="Telefon" defaultValue={defaults.phone ?? ""} />
        <TextField name="email" type="email" label="E-posta" defaultValue={defaults.email ?? ""} />
      </FormSection>
      <FormSection title="Teklif">
        <TextField name="title" label="Teklif başlığı" placeholder="örn. Villa kiralama sitesi + rezervasyon sistemi" defaultValue={defaults.title ?? ""} className="sm:col-span-2" />
        <SelectField name="requestedService" label="İstenen hizmet" options={serviceTypes.list} placeholder="Seçiniz" defaultValue={defaults.requestedService ?? ""} />
        <SelectField name="status" label="Durum" options={quoteStatuses.list} defaultValue={defaults.status ?? "new"} />
        <MoneyField name="estimatedAmount" label="Tahmini teklif tutarı" hint="Kalem eklenirse otomatik hesaplanır." defaultValue={defaults.estimatedAmount?.replace(".", ",") ?? ""} />
        <SelectField name="currency" label="Para birimi" options={currencies.list} defaultValue={defaults.currency ?? "TRY"} />
        <TextField name="quoteDate" type="date" label="Teklif tarihi" defaultValue={defaults.quoteDate ?? ""} />
        <TextField name="nextFollowUpDate" type="date" label="Sonraki takip" defaultValue={defaults.nextFollowUpDate ?? ""} />
      </FormSection>
      <FormSection title="Notlar">
        <TextareaField name="notes" label="Notlar" rows={4} defaultValue={defaults.notes ?? ""} className="sm:col-span-2" />
        <TextareaField name="lostReason" label="Kaybedilme nedeni" rows={2} defaultValue={defaults.lostReason ?? ""} className="sm:col-span-2" hint="Sadece kaybedilen teklifler için." />
      </FormSection>
      <div className="flex justify-end gap-2 pt-2">
        <LinkButton href={cancelHref} variant="outline">Vazgeç</LinkButton>
        <SubmitButton>{defaults.id ? "Değişiklikleri kaydet" : "Teklifi oluştur"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
