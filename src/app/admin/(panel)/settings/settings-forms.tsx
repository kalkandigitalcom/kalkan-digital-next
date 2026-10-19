"use client";

import { ActionForm, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { changePasswordAction, createAdminUserAction, logoutOtherSessionsAction, setBaseCurrencyAction, updateCompanyAction } from "@/server/actions/settings";
import { currencies } from "@/lib/labels";
import type { CompanySettings } from "@/server/settings";

export function CompanyForm({ c }: { c: CompanySettings }) {
  return (
    <ActionForm action={updateCompanyAction} className="grid gap-4 sm:grid-cols-2">
      <TextField name="companyName" label="Firma adı" required defaultValue={c.companyName} />
      <TextField name="email" type="email" label="İletişim e-postası" defaultValue={c.email} hint="Web sitesinde gösterilir." />
      <TextField name="phone" type="tel" label="Telefon" defaultValue={c.phone} hint="Web sitesinde gösterilir." />
      <TextField name="whatsapp" type="tel" label="WhatsApp numarası" defaultValue={c.whatsapp} hint="Uluslararası format, örn. +90 5xx xxx xx xx" />
      <TextareaField name="address" label="Adres" rows={2} defaultValue={c.address} className="sm:col-span-2" />
      <TextField name="taxInfo" label="Vergi bilgileri" defaultValue={c.taxInfo} />
      <TextField name="renewalWarningDays" type="number" min={1} max={180} label="Yenileme uyarı süresi (gün)" defaultValue={String(c.renewalWarningDays)} />
      <div className="sm:col-span-2 flex justify-end"><SubmitButton>Kaydet</SubmitButton></div>
    </ActionForm>
  );
}

export function BaseCurrencyForm({ base, locked }: { base: string; locked: boolean }) {
  return (
    <ActionForm action={setBaseCurrencyAction} className="flex flex-wrap items-end gap-3">
      <SelectField name="baseCurrency" label="Baz para birimi" options={currencies.list} defaultValue={base} disabled={locked} className="min-w-56" />
      <SubmitButton variant="secondary" disabled={locked}>Değiştir</SubmitButton>
      <p className="w-full text-xs text-navy-500">
        {locked
          ? "Finansal kayıt bulunduğu için kilitli. Tüm raporlar ve dashboard bu para biriminde hesaplanır; diğer para birimleri işlem anındaki kur ile çevrilir."
          : "Tüm raporlar bu para biriminde hesaplanır. İlk finansal işlem eklendikten sonra değiştirilemez."}
      </p>
    </ActionForm>
  );
}

export function PasswordForm({ policy }: { policy: string }) {
  return (
    <ActionForm action={changePasswordAction} resetOnSuccess className="grid gap-4 sm:grid-cols-3">
      <TextField name="current" type="password" label="Mevcut parola" autoComplete="current-password" required />
      <TextField name="next" type="password" label="Yeni parola" autoComplete="new-password" hint={policy} required />
      <TextField name="confirm" type="password" label="Yeni parola (tekrar)" autoComplete="new-password" required />
      <div className="sm:col-span-3 flex justify-end"><SubmitButton>Parolayı değiştir</SubmitButton></div>
    </ActionForm>
  );
}

export function LogoutOthersForm() {
  return (
    <ActionForm action={logoutOtherSessionsAction}>
      <SubmitButton variant="outline" size="sm">Diğer oturumları kapat</SubmitButton>
    </ActionForm>
  );
}

export function NewAdminForm({ policy }: { policy: string }) {
  return (
    <ActionForm action={createAdminUserAction} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <TextField name="name" label="Ad soyad" required />
      <TextField name="email" type="email" label="E-posta" required autoComplete="off" />
      <TextField name="password" type="password" label="Geçici parola" hint={policy} required autoComplete="new-password" />
      <SubmitButton variant="secondary">Ekle</SubmitButton>
    </ActionForm>
  );
}
