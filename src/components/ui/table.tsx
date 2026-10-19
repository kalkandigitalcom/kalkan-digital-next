import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}
export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-navy-100 bg-navy-50/60 text-[11px] uppercase tracking-wide text-navy-500">{children}</thead>;
}
export function TH({ children, className }: { children?: ReactNode; className?: string }) {
  return <th scope="col" className={cn("px-4 py-2.5 font-semibold", className)}>{children}</th>;
}
export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-navy-100">{children}</tbody>;
}
export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("transition-colors hover:bg-navy-50/50", className)}>{children}</tr>;
}
export function TD({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle text-navy-700", className)}>{children}</td>;
}

/** Sortable column header that toggles ?sort=&dir= while preserving other params. */
export function SortTH({
  label,
  field,
  params,
  basePath,
  className,
}: {
  label: string;
  field: string;
  params: Record<string, string | undefined>;
  basePath: string;
  className?: string;
}) {
  const active = params.sort === field;
  const nextDir = active && params.dir === "asc" ? "desc" : "asc";
  const sp = new URLSearchParams();
  for (const [k, val] of Object.entries(params)) if (val && k !== "page") sp.set(k, val);
  sp.set("sort", field);
  sp.set("dir", nextDir);
  const Icon = !active ? ArrowUpDown : params.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className={cn("px-4 py-2.5 font-semibold", className)} aria-sort={active ? (params.dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={`${basePath}?${sp.toString()}`} className={cn("inline-flex items-center gap-1 hover:text-navy-900", active && "text-navy-900")}>
        {label}
        <Icon className="size-3" aria-hidden />
      </Link>
    </th>
  );
}
