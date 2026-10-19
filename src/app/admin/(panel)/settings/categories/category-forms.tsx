"use client";

import { ActionForm, CheckboxField, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { createCategoryAction, updateCategoryAction } from "@/server/actions/transactions";

export function NewCategoryForm() {
  return (
    <ActionForm action={createCategoryAction} resetOnSuccess className="grid gap-3 sm:grid-cols-[1fr_2fr_0.7fr_auto] sm:items-end">
      <SelectField name="type" label="Tip" options={[{ value: "income", label: "Gelir" }, { value: "expense", label: "Gider" }]} defaultValue="income" />
      <TextField name="name" label="Kategori adı" required />
      <TextField name="sortOrder" type="number" min={0} label="Sıra" defaultValue="100" />
      <SubmitButton>Ekle</SubmitButton>
    </ActionForm>
  );
}

export function EditCategoryRow({ c }: { c: { id: string; name: string; sortOrder: number; isActive: boolean } }) {
  return (
    <ActionForm action={updateCategoryAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={c.id} />
      <TextField name="name" aria-label="Kategori adı" defaultValue={c.name} className="min-w-48 flex-1" />
      <TextField name="sortOrder" aria-label="Sıra" type="number" min={0} defaultValue={String(c.sortOrder)} className="w-20" />
      <CheckboxField name="isActive" label="Aktif" defaultChecked={c.isActive} className="h-10 items-center" />
      <SubmitButton size="sm" variant="secondary" className="h-10">Kaydet</SubmitButton>
    </ActionForm>
  );
}
