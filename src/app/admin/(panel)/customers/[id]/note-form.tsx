"use client";

import { ActionForm, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { addCustomerNoteAction } from "@/server/actions/customers";
import { noteKinds } from "@/lib/labels";

export function NoteForm({ customerId, today }: { customerId: string; today: string }) {
  return (
    <ActionForm action={addCustomerNoteAction} resetOnSuccess className="space-y-3">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <SelectField name="kind" label="Tür" options={noteKinds.list} defaultValue="call" />
        <TextField name="contactDate" type="date" label="Görüşme tarihi" defaultValue={today} required />
        <TextField name="nextFollowUpDate" type="date" label="Sonraki takip" />
      </div>
      <TextareaField name="content" label="Not" rows={3} required placeholder="Görüşme özeti, talepler, sonraki adımlar…" />
      <div className="flex justify-end">
        <SubmitButton size="sm">Notu ekle</SubmitButton>
      </div>
    </ActionForm>
  );
}
