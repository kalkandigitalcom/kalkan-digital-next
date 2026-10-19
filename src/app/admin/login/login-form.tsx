"use client";

import { ActionForm, SubmitButton, TextField } from "@/components/ui/form";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={loginAction} className="space-y-4" silent>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <TextField name="email" type="email" label="E-posta" autoComplete="username" required autoFocus />
      <TextField name="password" type="password" label="Parola" autoComplete="current-password" required />
      <SubmitButton className="w-full" size="lg">
        Giriş yap
      </SubmitButton>
    </ActionForm>
  );
}
