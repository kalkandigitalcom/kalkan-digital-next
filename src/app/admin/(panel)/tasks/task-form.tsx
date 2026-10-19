"use client";

import { useMemo, useState } from "react";
import { ActionForm, FormSection, SelectField, SubmitButton, TextField, TextareaField } from "@/components/ui/form";
import { LinkButton } from "@/components/ui/button";
import { taskPriorities, taskStatuses } from "@/lib/labels";
import type { ActionState } from "@/lib/action-state";

type Opt = { value: string; label: string };
export interface TaskDefaults {
  id?: string;
  title?: string;
  description?: string | null;
  customerId?: string | null;
  projectId?: string | null;
  dueAt?: string;
  remindAt?: string;
  priority?: string;
  status?: string;
}

export function TaskForm({
  action,
  defaults,
  customers,
  projects,
  cancelHref,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  defaults: TaskDefaults;
  customers: Opt[];
  projects: (Opt & { customerId: string | null })[];
  cancelHref: string;
}) {
  const [customerId, setCustomerId] = useState(defaults.customerId ?? "");
  const projs = useMemo(() => projects.filter((p) => !customerId || p.customerId === customerId), [projects, customerId]);
  return (
    <ActionForm action={action} className="rounded-xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      {defaults.id ? <input type="hidden" name="id" value={defaults.id} /> : null}
      <FormSection title="Görev">
        <TextField name="title" label="Başlık" required defaultValue={defaults.title ?? ""} className="sm:col-span-2" />
        <TextareaField name="description" label="Açıklama" rows={3} defaultValue={defaults.description ?? ""} className="sm:col-span-2" />
        <SelectField name="priority" label="Öncelik" options={taskPriorities.list} defaultValue={defaults.priority ?? "medium"} />
        <SelectField name="status" label="Durum" options={taskStatuses.list} defaultValue={defaults.status ?? "todo"} />
      </FormSection>
      <FormSection title="Zamanlama" description="Saatler Türkiye saatidir. Hatırlatma zamanı geldiğinde görev panelde vurgulanır; e-posta veya anlık bildirim gönderimi yapılandırılmamıştır.">
        <TextField name="dueAt" type="datetime-local" label="Son tarih" defaultValue={defaults.dueAt ?? ""} />
        <TextField name="remindAt" type="datetime-local" label="Hatırlatma zamanı" defaultValue={defaults.remindAt ?? ""} />
      </FormSection>
      <FormSection title="İlişkiler">
        <SelectField name="customerId" label="İlgili müşteri" options={customers} placeholder="Yok" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
        <SelectField name="projectId" label="İlgili proje" options={projs} placeholder="Yok" defaultValue={defaults.projectId ?? ""} key={customerId} />
      </FormSection>
      <div className="flex justify-end gap-2 pt-2">
        <LinkButton href={cancelHref} variant="outline">Vazgeç</LinkButton>
        <SubmitButton>{defaults.id ? "Değişiklikleri kaydet" : "Görevi oluştur"}</SubmitButton>
      </div>
    </ActionForm>
  );
}
