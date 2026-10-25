"use client";

import { ActionForm, FormSection, MoneyField, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { currencies, projectStatuses, serviceTypes } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";

export interface ProjectDefaults {
  id?: string;
  name?: string;
  customerId?: string | null;
  projectType?: string;
  description?: string | null;
  startDate?: string | null;
  deliveredDate?: string | null;
  currency?: string;
  agreedAmount?: string | null;
  estimatedCost?: string | null;
  status?: string;
  projectUrl?: string | null;
  internalNotes?: string | null;
}

const m = (s: string | null | undefined) => (s ? s.replace(".", ",") : "");

export function ProjectForm({
  action,
  defaults = {},
  customers,
  cancelHref,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  defaults?: ProjectDefaults;
  customers: { value: string; label: string }[];
  cancelHref: string;
}) {
  return (
    <ActionForm action={action} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <FormSection title="Proje bilgileri">
        <TextField name="name" label="Proje adı" required defaultValue={defaults.name ?? ""} className="sm:col-span-2" />
        <SelectField name="customerId" label="Müşteri" options={customers} placeholder="Müşteri seçin (opsiyonel)" defaultValue={defaults.customerId ?? ""} />
        <SelectField name="projectType" label="Proje türü" options={serviceTypes.list} defaultValue={defaults.projectType ?? "web_design"} />
        <SelectField name="status" label="Durum" options={projectStatuses.list} defaultValue={defaults.status ?? "planned"} />
        <TextField name="projectUrl" label="Proje bağlantısı" placeholder="https://" defaultValue={defaults.projectUrl ?? ""} />
        <TextareaField name="description" label="Açıklama" rows={3} defaultValue={defaults.description ?? ""} className="sm:col-span-2" />
      </FormSection>
      <FormSection title="Tarihler">
        <TextField name="startDate" type="date" label="Başlangıç" defaultValue={defaults.startDate ?? ""} />
        <TextField name="deliveredDate" type="date" label="Gerçek teslim" defaultValue={defaults.deliveredDate ?? ""} />
      </FormSection>
      <FormSection
        title="Tutarlar"
        description="Bu alanlar proje bütçesidir. Tahsilatlar ve giderler, projeye bağlanan finansal işlemlerden hesaplanır; proje tamamlandı olarak işaretlense bile otomatik tahsilat oluşmaz."
      >
        <SelectField name="currency" label="Para birimi" options={currencies.list} defaultValue={defaults.currency ?? "TRY"} />
        <MoneyField name="agreedAmount" label="Anlaşılan toplam tutar" defaultValue={m(defaults.agreedAmount)} />
        <MoneyField name="estimatedCost" label="Tahmini proje maliyeti" defaultValue={m(defaults.estimatedCost)} />
      </FormSection>
      <FormSection title="Dahili notlar" description="Sadece yönetim panelinde görünür.">
        <TextareaField name="internalNotes" label="Notlar" rows={4} defaultValue={defaults.internalNotes ?? ""} className="sm:col-span-2" />
      </FormSection>
      <div className="flex justify-end gap-2 pt-2">
        <LinkButton href={cancelHref} variant="outline">Vazgeç</LinkButton>
        <SubmitButton>{defaults.id ? "Değişiklikleri kaydet" : "Projeyi oluştur"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
