"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { idleState } from "@/lib/action-state";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";
import { toggleTaskDoneAction } from "@/server/actions/tasks";

export function DoneToggle({ id, done, title }: { id: string; done: boolean; title: string }) {
  const [pending, startTransition] = useTransition();
  const { push } = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={done}
      aria-label={done ? `${title}: yeniden aç` : `${title}: tamamlandı olarak işaretle`}
      onClick={() => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("done", done ? "0" : "1");
        startTransition(async () => {
          const res = await toggleTaskDoneAction(idleState, fd);
          if (res.status !== "idle") push(res.status === "success" ? "success" : "error", res.message);
          router.refresh();
        });
      }}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
        done ? "border-emerald-600 bg-emerald-600 text-white" : "border-navy-300 bg-white hover:border-brand-500",
        pending && "opacity-50",
      )}
    >
      {done ? <Check className="size-3.5" /> : null}
    </button>
  );
}
