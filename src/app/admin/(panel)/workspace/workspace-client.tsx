"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Table row that opens the customer's detail panel; real links/buttons inside keep working. */
export function WorkspaceRow({ href, selected, children }: { href: string; selected: boolean; children: ReactNode }) {
  const router = useRouter();
  function open(e: MouseEvent<HTMLTableRowElement>) {
    if ((e.target as HTMLElement).closest("a,button,input,select,label")) return;
    router.push(href, { scroll: false });
  }
  function onKey(e: KeyboardEvent<HTMLTableRowElement>) {
    if (e.key === "Enter" && e.target === e.currentTarget) router.push(href, { scroll: false });
  }
  return (
    <tr
      onClick={open}
      onKeyDown={onKey}
      tabIndex={0}
      aria-selected={selected}
      className={cn(
        "cursor-pointer align-top transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600",
        selected ? "bg-brand-50/70" : "hover:bg-navy-50/60",
      )}
    >
      {children}
    </tr>
  );
}

/** Right-hand slide-over panel. Closing navigates back to the list URL (state lives in ?c=). */
export function DetailPanel({ closeHref, title, children }: { closeHref: string; title: string; children: ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") router.push(closeHref, { scroll: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeHref, router]);
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <Link href={closeHref} scroll={false} aria-label="Paneli kapat" className="absolute inset-0 bg-navy-950/30" />
      <div ref={ref} tabIndex={-1} className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-lift outline-none">
        <div className="flex items-center justify-between gap-3 border-b border-navy-100 px-5 py-4">
          <h2 className="truncate font-display text-base font-semibold text-navy-900">{title}</h2>
          <Link href={closeHref} scroll={false} className="rounded-md p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-800" aria-label="Kapat">
            <X className="size-5" />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
