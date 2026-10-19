"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TR_MONTHS_SHORT } from "@/lib/dates";

export const SERIES = { income: "#1B4EF5", expense: "#DB6E2C", net: "#0B1F3A" };

function compact(v: number) {
  return new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}
function full(v: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 2 }).format(v);
}

const axis = { fontSize: 11, fill: "#6b7fa3" };

export function MonthlyChart({ data, currency }: { data: { month: number; income: string; expense: string }[]; currency: string }) {
  const rows = data.map((d) => ({ name: TR_MONTHS_SHORT[d.month - 1], Gelir: Number(d.income), Gider: Number(d.expense) }));
  return (
    <div className="h-72 w-full" role="img" aria-label="Aylık tahsil edilen gelir ve gerçekleşen gider grafiği">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} barGap={2} barCategoryGap="22%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e3e9f3" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={48} />
          <Tooltip
            cursor={{ fill: "rgba(11,31,58,0.04)" }}
            formatter={(v) => full(Number(v), currency)}
            contentStyle={{ borderRadius: 10, border: "1px solid #e3e9f3", fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#34476b" }} />
          <Bar dataKey="Gelir" fill={SERIES.income} radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="Gider" fill={SERIES.expense} radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function YearlyChart({ data, currency }: { data: { year: number; income: string; net: string }[]; currency: string }) {
  const rows = data.map((d) => ({ name: String(d.year), "Tahsil edilen gelir": Number(d.income) }));
  return (
    <div className="h-72 w-full" role="img" aria-label="Yıllık tahsil edilen gelir trendi">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e3e9f3" />
          <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={compact} width={48} />
          <Tooltip formatter={(v) => full(Number(v), currency)} contentStyle={{ borderRadius: 10, border: "1px solid #e3e9f3", fontSize: 12 }} />
          <Line type="monotone" dataKey="Tahsil edilen gelir" stroke={SERIES.income} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal magnitude bars (single hue) with value labels; no chart library needed. */
export function CategoryBars({ data, currency }: { data: { name: string; total: string; count: number }[]; currency: string }) {
  const max = Math.max(...data.map((d) => Number(d.total)), 0);
  const sum = data.reduce((a, d) => a + Number(d.total), 0);
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const v = Number(d.total);
        const pct = sum > 0 ? (v / sum) * 100 : 0;
        return (
          <li key={d.name} title={`${d.name}: ${full(v, currency)} (${d.count} işlem)`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate font-medium text-navy-700">{d.name}</span>
              <span className="tabular shrink-0 text-navy-500">
                {full(v, currency)} <span className="text-navy-400">· %{pct.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-navy-50">
              <div className="h-2 rounded-full bg-brand-600" style={{ width: `${max > 0 ? Math.max(2, (v / max) * 100) : 0}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
