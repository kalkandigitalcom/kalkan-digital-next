"use client";

import { ActionForm, SubmitButton, TextField } from "@/components/ui/form";
import { setupAction } from "@/server/actions/auth";

export function SetupForm({ policy }: { policy: string }) {
  return (
    <ActionForm action={setupAction} className="space-y-4" silent>
      <TextField name="token" type="password" label="Kurulum anahtarı (ADMIN_SETUP_TOKEN)" autoComplete="off" required />
      <TextField name="name" label="Ad Soyad" autoComplete="name" required />
      <TextField name="email" type="email" label="E-posta" autoComplete="username" required />
      <TextField name="password" type="password" label="Parola" hint={policy} autoComplete="new-password" required />
      <TextField name="passwordConfirm" type="password" label="Parola (tekrar)" autoComplete="new-password" required />
      <SubmitButton className="w-full" size="lg">
        Hesabı oluştur
      </SubmitButton>
    </ActionForm>
  );
}
