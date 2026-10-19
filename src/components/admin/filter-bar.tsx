import type { ReactNode } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { AutoSubmitSelect } from "@/components/ui/auto-submit";
import { buttonClass } from "@/components/ui/button";
import { inputClassStatic } from "@/components/admin/input-class";

/** GET-based filter form: works without JavaScript; selects auto-submit when JS is available. */
export function FilterBar({
  basePath,
  params,
  searchPlaceholder = "Ara…",
  children,
  keep = ["sort", "dir"],
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  searchPlaceholder?: string;
  children?: ReactNode;
  keep?: string[];
}) {
  const hasFilters = Object.entries(params).some(([k, val]) => val && !["sort", "dir", "page"].includes(k));
  return (
    <form method="get" action={basePath} className="flex flex-col gap-2 border-b border-navy-100 p-3 md:flex-row md:flex-wrap md:items-center">
      {keep.map((k) => (params[k] ? <input key={k} type="hidden" name={k} value={params[k]} /> : null))}
      <div className="relative min-w-0 flex-1 md:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-navy-300" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder={searchPlaceholder}
          aria-label="Ara"
          className={`${inputClassStatic} h-9 pl-9`}
        />
      </div>
      {children}
      <div className="flex gap-2">
        <button type="submit" className={buttonClass("secondary", "sm", "h-9")}>
          Filtrele
        </button>
        {hasFilters ? (
          <Link href={basePath} className={buttonClass("ghost", "sm", "h-9")}>
            <X className="size-3.5" aria-hidden /> Temizle
          </Link>
        ) : null}
      </div>
    </form>
  );
}

export function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel = "Tümü",
}: {
  name: string;
  label: string;
  value: string | undefined;
  options: readonly { value: string; label: string }[];
  allLabel?: string | null;
}) {
  return (
    <AutoSubmitSelect name={name} defaultValue={value ?? ""} aria-label={label} className={`${inputClassStatic} h-9 w-full md:w-auto`}>
      {allLabel !== null ? <option value="">{`${label}: ${allLabel}`}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </AutoSubmitSelect>
  );
}

export function FilterDate({ name, label, value }: { name: string; label: string; value: string | undefined }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-navy-500">
      <span className="shrink-0">{label}</span>
      <input type="date" name={name} defaultValue={value ?? ""} className={`${inputClassStatic} h-9 w-auto`} />
    </label>
  );
}
