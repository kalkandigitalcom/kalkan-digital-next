"use client";

import { ActionForm, FormSection, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { acquisitionSources, customerStatuses, customerTypes } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";

export interface CustomerDefaults {
  id?: string;
  companyName?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: string | null;
  customerType?: string;
  status?: string;
  source?: string | null;
  notes?: string | null;
}

export function CustomerForm({
  action,
  defaults = {},
  cancelHref,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  defaults?: CustomerDefaults;
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <FormSection title="Temel bilgiler" description="Müşterinin firma ve yetkili bilgileri.">
        <TextField name="companyName" label="Firma / müşteri adı" required defaultValue={defaults.companyName ?? ""} className="sm:col-span-2" />
        <TextField name="contactName" label="Yetkili kişi" defaultValue={defaults.contactName ?? ""} />
        <SelectField name="customerType" label="Müşteri türü" options={customerTypes.list} defaultValue={defaults.customerType ?? "company"} />
        <SelectField name="status" label="Durum" options={customerStatuses.list} defaultValue={defaults.status ?? "lead"} />
        <SelectField name="source" label="Nasıl kazanıldı?" options={acquisitionSources.list} placeholder="Seçiniz" defaultValue={defaults.source ?? ""} />
      </FormSection>
      <FormSection title="İletişim" description="Telefon numaralarını uluslararası formatta girebilirsiniz (örn. +90 5xx).">
        <TextField name="phone" type="tel" label="Telefon" defaultValue={defaults.phone ?? ""} autoComplete="off" />
        <TextField name="whatsapp" type="tel" label="WhatsApp" defaultValue={defaults.whatsapp ?? ""} autoComplete="off" />
        <TextField name="email" type="email" label="E-posta" defaultValue={defaults.email ?? ""} autoComplete="off" />
        <TextField name="website" label="Web sitesi" placeholder="ornek.com" defaultValue={defaults.website ?? ""} />
        <TextareaField name="address" label="Adres" rows={2} defaultValue={defaults.address ?? ""} className="sm:col-span-2" />
      </FormSection>
      <FormSection title="Notlar" description="Genel notlar. Görüşme kayıtları için müşteri detayındaki takip notlarını kullanın.">
        <TextareaField name="notes" label="Genel notlar" rows={4} defaultValue={defaults.notes ?? ""} className="sm:col-span-2" />
      </FormSection>
      <div className="flex justify-end gap-2 pt-2">
        <LinkButton href={cancelHref} variant="outline">Vazgeç</LinkButton>
        <SubmitButton>{defaults.id ? "Değişiklikleri kaydet" : "Müşteriyi oluştur"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
