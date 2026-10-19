"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ActionForm, SelectField, SubmitButton, TextField, TextareaField, useFieldError } from "@/components/ui/form";
import { submitContactAction } from "@/server/actions/public";
import { serviceTypes } from "@/lib/labels";
import { budgetOptions } from "@/lib/content";

function Consent() {
  const error = useFieldError("consent");
  return (
    <div className="sm:col-span-2">
      <label className="flex items-start gap-2.5 text-sm text-navy-600">
        <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-brand-600" required />
        <span>
          Kişisel verilerimin talebime dönüş yapılması amacıyla işlenmesine ilişkin <Link href="/kvkk" className="font-semibold text-brand-600 underline" target="_blank">aydınlatma metnini</Link> okudum.
        </span>
      </label>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function ContactForm({ initialService }: { initialService?: string }) {
  const [done, setDone] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <p className="mt-3 font-display text-lg font-bold text-navy-900">{done}</p>
        <button type="button" onClick={() => setDone(null)} className="mt-4 text-sm font-semibold text-brand-600 hover:underline">Yeni bir talep gönder</button>
      </div>
    );
  }
  return (
    <ActionForm action={submitContactAction} silent onSuccess={(s) => setDone(s.message)} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="t" value={startedAt} />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Web siteniz <input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <TextField name="name" label="Ad soyad" required autoComplete="name" />
      <TextField name="company" label="Firma / işletme" autoComplete="organization" />
      <TextField name="email" type="email" label="E-posta" autoComplete="email" />
      <TextField name="phone" type="tel" label="Telefon" autoComplete="tel" placeholder="+90 5xx xxx xx xx" />
      <SelectField name="service" label="İlgilendiğiniz hizmet" options={serviceTypes.list} placeholder="Seçiniz" defaultValue={initialService ?? ""} />
      <SelectField name="budget" label="Tahmini bütçe" options={budgetOptions.map((b) => ({ value: b, label: b }))} placeholder="Seçiniz" />
      <TextareaField name="message" label="Projeniz hakkında" rows={5} required className="sm:col-span-2" placeholder="İşletmenizi ve ihtiyacınızı kısaca anlatın…" />
      <Consent />
      <div className="sm:col-span-2">
        <SubmitButton size="lg" className="w-full sm:w-auto">Talebi gönder</SubmitButton>
      </div>
    </ActionForm>
  );
}
