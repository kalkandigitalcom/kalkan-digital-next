"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { idleState } from "@/lib/action-state";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { settleTransactionAction } from "@/server/actions/transactions";

export function SettleButton({ id, type, today, label }: { id: string; type: "income" | "expense"; today: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);
  const { push } = useToast();
  const router = useRouter();
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  const verb = type === "income" ? "Tahsil edildi" : "Ödendi";
  function submit() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("settledDate", date);
    startTransition(async () => {
      const res = await settleTransactionAction(idleState, fd);
      if (res.status === "success") {
        push("success", res.message);
        setOpen(false);
        router.refresh();
      } else if (res.status === "error") push("error", res.message);
    });
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "sm", "h-7 px-2 text-[11px]")}>
        <CheckCircle2 className="size-3.5" aria-hidden /> {label ?? verb}
      </button>
      <dialog ref={ref} onClose={() => setOpen(false)} className="m-auto w-[min(92vw,24rem)] rounded-2xl border border-navy-100 p-0 text-left shadow-lift backdrop:bg-navy-950/50">
        <div className="p-6">
          <h2 className="font-display text-base font-semibold text-navy-900">{verb} olarak işaretle</h2>
          <p className="mt-1 text-sm text-navy-500">Gerçek {type === "income" ? "tahsilat" : "ödeme"} tarihini seçin. Raporlarda bu tarih kullanılır.</p>
          <label className="mt-4 block text-xs font-semibold text-navy-700" htmlFor={`settle-${id}`}>Tarih</label>
          <input id={`settle-${id}`} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass(false, "mt-1.5")} />
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setOpen(false)} disabled={pending}>Vazgeç</button>
            <button type="button" className={buttonClass("primary")} disabled={pending} onClick={submit}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null} Onayla
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
