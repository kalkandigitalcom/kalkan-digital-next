"use client";

import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { RANGE_PRESETS, type RangePreset } from "@/lib/dates";
import { inputClassStatic } from "./input-class";
import { buttonClass } from "@/components/ui/button";

export function RangeFilter({ preset, from, to, action }: { preset: RangePreset; from: string; to: string; action: string }) {
  const [p, setP] = useState<RangePreset>(preset);
  return (
    <form method="get" action={action} className="flex flex-wrap items-center gap-2">
      <CalendarRange className="size-4 text-navy-400" aria-hidden />
      <select
        name="range"
        value={p}
        aria-label="Tarih aralığı"
        onChange={(e) => {
          const val = e.target.value as RangePreset;
          setP(val);
          if (val !== "custom") e.currentTarget.form?.requestSubmit();
        }}
        className={`${inputClassStatic} h-9 w-auto`}
      >
        {RANGE_PRESETS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      {p === "custom" ? (
        <>
          <input type="date" name="from" defaultValue={from} aria-label="Başlangıç" className={`${inputClassStatic} h-9 w-auto`} required />
          <span className="text-navy-400">–</span>
          <input type="date" name="to" defaultValue={to} aria-label="Bitiş" className={`${inputClassStatic} h-9 w-auto`} required />
          <button type="submit" className={buttonClass("primary", "sm", "h-9")}>Uygula</button>
        </>
      ) : null}
      <noscript>
        <button type="submit" className={buttonClass("secondary", "sm", "h-9")}>Uygula</button>
      </noscript>
    </form>
  );
}
