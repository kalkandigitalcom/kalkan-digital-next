import { formatMoney, type CurrencyCode } from "@/lib/money";
import { cn } from "@/lib/cn";

export function Money({
  value,
  currency = "TRY",
  className,
  signed,
  type,
}: {
  value: string | null | undefined;
  currency?: CurrencyCode;
  className?: string;
  signed?: boolean;
  type?: "income" | "expense";
}) {
  if (value === null || value === undefined) return <span className="text-navy-300">—</span>;
  const prefix = signed && type ? (type === "income" ? "+" : "−") : "";
  return (
    <span
      className={cn(
        "tabular whitespace-nowrap",
        type === "income" && signed && "text-emerald-700",
        type === "expense" && signed && "text-red-600",
        className,
      )}
    >
      {prefix}
      {formatMoney(value, currency)}
    </span>
  );
}
