"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { idleState, type ActionState } from "@/lib/action-state";
import { buttonClass } from "./button";
import { useToast } from "./toast";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** A button that asks for confirmation in a modal dialog before running a server action. */
export function ConfirmAction({
  action,
  fields,
  title,
  description,
  confirmLabel = "Onayla",
  trigger,
  triggerVariant = "outline",
  triggerSize = "sm",
  tone = "danger",
  redirectTo,
}: {
  action: Action;
  fields: Record<string, string>;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  trigger: ReactNode;
  triggerVariant?: Parameters<typeof buttonClass>[0];
  triggerSize?: Parameters<typeof buttonClass>[1];
  tone?: "danger" | "primary";
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  function confirm() {
    const fd = new FormData();
    for (const [k, val] of Object.entries(fields)) fd.set(k, val);
    startTransition(async () => {
      try {
        const res = await action(idleState, fd);
        if (res.status === "success") {
          push("success", res.message);
          setOpen(false);
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        } else if (res.status === "error") push("error", res.message);
      } catch {
        push("error", "İşlem tamamlanamadı. Lütfen tekrar deneyin.");
      }
    });
  }

  return (
    <>
      <button type="button" className={buttonClass(triggerVariant, triggerSize)} onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-navy-100 p-0 shadow-lift backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-6">
          <div className="flex gap-4">
            <div className={`grid size-10 shrink-0 place-items-center rounded-full ${tone === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"}`}>
              <AlertTriangle className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-navy-900">{title}</h2>
              {description ? <div className="mt-1.5 text-sm text-navy-600">{description}</div> : null}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)} disabled={pending}>
              Vazgeç
            </button>
            <button type="button" className={buttonClass(tone === "danger" ? "danger" : "primary")} onClick={confirm} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
