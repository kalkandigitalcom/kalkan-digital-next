"use client";

import { useMemo, useState } from "react";
import { ActionForm, CheckboxField, FormSection, MoneyField, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { currencies, recurringPeriods, recurringStatuses } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";

type Opt = { value: string; label: string };
export interface RecurringDefaults {
  id?: string;
  customerId?: string | null;
  projectId?: string | null;
  categoryId?: string;
  name?: string;
  amount?: string;
  currency?: string;
  period?: string;
  startDate?: string;
  nextRenewalDate?: string;
  status?: string;
  autoRenew?: boolean;
  notes?: string | null;
}

export function RecurringForm({
  action,
  defaults,
  customers,
  projects,
  categories,
  cancelHref,
  billed,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  defaults: RecurringDefaults;
  customers: Opt[];
  projects: (Opt & { customerId: string | null })[];
  categories: Opt[];
  cancelHref: string;
  billed?: boolean;
}) {
  const [customerId, setCustomerId] = useState(defaults.customerId ?? "");
  const projs = useMemo(() => projects.filter((p) => !customerId || p.customerId === customerId), [projects, customerId]);
  return (
    <ActionForm action={action} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <FormSection title="Hizmet" description="Hosting, domain, bakım anlaşması gibi periyodik hizmetler.">
        <TextField name="name" label="Hizmet adı" required placeholder="örn. ornek.com hosting + domain" defaultValue={defaults.name ?? ""} className="sm:col-span-2" />
        <SelectField name="customerId" label="Müşteri" required options={customers} placeholder="Müşteri seçin" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <SelectField name="projectId" label="İlgili proje" options={projs} placeholder="Yok" defaultValue={defaults.projectId ?? ""} key={customerId} />
        <SelectField name="categoryId" label="Gelir kategorisi" required options={categories} placeholder="Kategori seçin" defaultValue={defaults.categoryId ?? ""} />
        <SelectField name="status" label="Durum" options={recurringStatuses.list} defaultValue={defaults.status ?? "active"} />
      </FormSection>
      <FormSection title="Ücret ve periyot">
        <MoneyField name="amount" label="Tekrarlanan ücret" required defaultValue={defaults.amount?.replace(".", ",") ?? ""} />
        <SelectField name="currency" label="Para birimi" options={currencies.list} defaultValue={defaults.currency ?? "TRY"} />
        <SelectField name="period" label="Periyot" options={recurringPeriods.list} defaultValue={defaults.period ?? "yearly"} />
      </FormSection>
      <FormSection title="Tarihler" description={billed ? "Faturalandırılmış dönemler olduğu için sonraki yenileme tarihi, son faturalandırılan dönemden sonra olmalıdır." : "Sonraki yenileme boş bırakılırsa başlangıç tarihi kullanılır."}>
        <TextField name="startDate" type="date" label="Başlangıç tarihi" required defaultValue={defaults.startDate ?? ""} />
        <TextField name="nextRenewalDate" type="date" label="Sonraki yenileme" defaultValue={defaults.nextRenewalDate ?? ""} />
        <CheckboxField name="autoRenew" label="Otomatik yenileme" hint="Bilgi amaçlıdır (örn. kayıt firmasında otomatik yenileme açık). Tahsilat kaydı yine sizin onayınızla oluşturulur." defaultChecked={defaults.autoRenew ?? false} className="sm:col-span-2" />
      </FormSection>
      <FormSection title="Notlar">
        <TextareaField name="notes" label="Notlar" rows={3} defaultValue={defaults.notes ?? ""} className="sm:col-span-2" />
      </FormSection>
      <div className="flex justify-end gap-2 pt-2">
        <LinkButton href={cancelHref} variant="outline">Vazgeç</LinkButton>
        <SubmitButton>{defaults.id ? "Değişiklikleri kaydet" : "Hizmeti oluştur"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
