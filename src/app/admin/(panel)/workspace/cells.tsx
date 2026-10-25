"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updateWorkspaceCellAction, type WorkspaceField } from "@/server/actions/workspace";
import { idleState } from "@/lib/action-state";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

export const STATUS_OPTIONS = [
  { value: "active", label: "Aktif" },
  { value: "passive", label: "Pasif" },
  { value: "lead", label: "Potansiyel" },
  { value: "archived", label: "Arşiv" },
] as const;

/* ------------------------------------------------------------------------------------------------ */
/*                                       Editable cell                                              */
/* ------------------------------------------------------------------------------------------------ */

export function useSaveCell(customerId: string) {
  const { push } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  function save(field: WorkspaceField, value: string, onDone: (ok: boolean, normalised: string) => void) {
    const fd = new FormData();
    fd.set("id", customerId);
    fd.set("field", field);
    fd.set("value", value);
    start(async () => {
      try {
        const res = await updateWorkspaceCellAction(idleState, fd);
        if (res.status === "success") {
          onDone(true, res.data?.value ?? value);
          router.refresh();
        } else {
          if (res.status === "error") push("error", res.message);
          onDone(false, value);
        }
      } catch {
        push("error", "Kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.");
        onDone(false, value);
      }
    });
  }
  return { save, pending };
}

/**
 * Spreadsheet-like text cell: click (or Enter/F2 when focused) to edit, Enter or leaving the cell
 * saves, Esc cancels. Multiline cells save on blur or Ctrl/Cmd+Enter.
 */
export function EditableText({
  customerId,
  field,
  value,
  placeholder,
  label,
  multiline = false,
  type = "text",
  className,
  displayClassName,
}: {
  customerId: string;
  field: WorkspaceField;
  value: string | null;
  placeholder: string;
  label: string;
  multiline?: boolean;
  type?: "text" | "email" | "tel" | "url";
  className?: string;
  displayClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(value ?? "");
  const [draft, setDraft] = useState(value ?? "");
  const { save, pending } = useSaveCell(customerId);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Accept fresh server values when not editing (e.g. after another cell's save refreshes the page).
  const [lastServer, setLastServer] = useState(value ?? "");
  if ((value ?? "") !== lastServer) {
    setLastServer(value ?? "");
    if (!editing) {
      setCurrent(value ?? "");
      setDraft(value ?? "");
    }
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() === current.trim()) {
      setDraft(current);
      return;
    }
    const previous = current;
    setCurrent(draft);
    save(field, draft, (ok, normalised) => {
      if (ok) {
        setCurrent(normalised);
        setDraft(normalised);
      } else {
        setCurrent(previous);
        setDraft(previous);
      }
    });
  }
  function cancel() {
    setDraft(current);
    setEditing(false);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    }
  }

  const base = "w-full rounded-md border border-brand-500 bg-white px-2 py-1 text-xs text-navy-900 outline-none ring-3 ring-brand-100";
  if (editing) {
    return multiline ? (
      <textarea ref={inputRef} aria-label={label} rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} className={cn(base, "resize-y", className)} />
    ) : (
      <input ref={inputRef} aria-label={label} type={type} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={onKey} className={cn(base, className)} />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={current ? `${current}\n(Düzenlemek için tıklayın)` : "Düzenlemek için tıklayın"}
      aria-label={`${label}: ${current || "boş"}. Düzenle`}
      className={cn(
        "group/cell flex w-full min-w-0 items-center gap-1 rounded-md px-2 py-1 text-left text-xs hover:bg-navy-50 focus-visible:bg-navy-50",
        !current && "text-navy-300",
        className,
      )}
    >
      <span className={cn("min-w-0 flex-1", multiline ? "line-clamp-2 whitespace-pre-line" : "truncate", displayClassName)}>{current || placeholder}</span>
      {pending ? <Loader2 className="size-3 shrink-0 animate-spin text-navy-400" aria-hidden /> : null}
    </button>
  );
}
