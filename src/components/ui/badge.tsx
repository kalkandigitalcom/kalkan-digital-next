import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  gray: "bg-navy-50 text-navy-600 ring-navy-200",
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  navy: "bg-navy-900 text-white ring-navy-900",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function OptionBadge<T extends string>({
  value,
  options,
}: {
  value: T | null | undefined;
  options: { map: Record<T, { label: string; tone?: Tone }> };
}) {
  if (!value) return <span className="text-navy-400">—</span>;
  const o = options.map[value];
  return <Badge tone={o?.tone ?? "gray"}>{o?.label ?? value}</Badge>;
}
