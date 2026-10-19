import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "navy",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "navy" | "blue" | "green" | "red" | "amber";
  href?: string;
}) {
  const tones = {
    navy: "bg-navy-50 text-navy-700",
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
  };
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-navy-500">{label}</p>
        {Icon ? (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", tones[tone])}>
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="tabular mt-2 font-display text-xl font-bold text-navy-900 sm:text-[22px]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-navy-400">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-xl border border-navy-100 bg-white p-4 shadow-card";
  return href ? (
    <a href={href} className={cn(cls, "transition-shadow hover:shadow-lift")}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-navy-100">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-3 gap-3 py-2.5 text-sm">
          <dt className="text-navy-500">{i.label}</dt>
          <dd className="col-span-2 min-w-0 break-words text-navy-900">{i.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
