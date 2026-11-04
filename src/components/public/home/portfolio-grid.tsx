"use client";

import { useId, useState, type CSSProperties } from "react";
import Link from "next/link";

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  category: string;
  imagePath: string | null;
  logoPath: string | null;
}

/** Sector groups for the home portfolio filter, mapped from the portfolio `category` values. */
const SECTORS = [
  { key: "villa", label: "Villa & Turizm", categories: ["villa_rental_software", "hotel_tourism_web"] },
  { key: "corporate", label: "Kurumsal", categories: ["web_design"] },
  { key: "software", label: "Özel Yazılım", categories: ["software"] },
] as const;
type SectorKey = (typeof SECTORS)[number]["key"] | "other";

function sectorOf(category: string): SectorKey {
  return SECTORS.find((s) => (s.categories as readonly string[]).includes(category))?.key ?? "other";
}

/**
 * Filterable portfolio wall. Filters are built from the published projects only: a sector appears
 * when at least one project belongs to it. Cards show the project's screenshot, or its logo on a
 * clean tile when there is no screenshot; nothing is invented. Each card links to the existing
 * project detail page.
 */
export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [active, setActive] = useState<SectorKey | "all">("all");
  const listId = useId();

  const present = new Set(items.map((i) => sectorOf(i.category)));
  const filters: { key: SectorKey | "all"; label: string }[] = [
    { key: "all", label: "Tümü" },
    ...SECTORS.filter((s) => present.has(s.key)).map((s) => ({ key: s.key, label: s.label })),
    ...(present.has("other") ? [{ key: "other" as const, label: "Diğer" }] : []),
  ];
  const shown = active === "all" ? items : items.filter((i) => sectorOf(i.category) === active);

  return (
    <div>
      {filters.length > 2 ? (
        <div role="group" aria-label="Projeleri sektöre göre filtrele" className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-navy-100 bg-white p-1.5 shadow-card">
          {filters.map((f) => {
            const on = f.key === active;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                aria-controls={listId}
                onClick={() => setActive(f.key)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-[background-color,color,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  on ? "bg-navy-900 text-white shadow-[0_8px_20px_-10px_rgba(11,31,58,0.8)]" : "text-navy-500 hover:bg-navy-50 hover:text-navy-900"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul id={listId} key={active} className="portfolio-grid mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {shown.map((p, i) => {
          const name = p.clientName ?? p.title;
          return (
            <li key={p.id} style={{ "--i": Math.min(i, 8) } as CSSProperties}>
              <Link
                href={`/projeler/${p.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-navy-100 bg-white outline-none transition-[border-color,box-shadow,translate] duration-500 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <span className="sr-only">{name}</span>
                {p.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/media/${p.imagePath}`} alt="" loading="lazy" decoding="async" className="size-full object-cover object-top transition-[scale] duration-700 group-hover:scale-[1.03]" />
                ) : p.logoPath ? (
                  <span className="absolute inset-0 grid place-items-center bg-[radial-gradient(80%_70%_at_50%_40%,rgba(34,195,206,0.07),transparent_70%)] p-5 sm:p-10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/${p.logoPath}`} alt="" loading="lazy" decoding="async" className="max-h-14 w-auto max-w-[85%] object-contain transition-[scale] duration-500 group-hover:scale-105 sm:max-h-20" />
                  </span>
                ) : (
                  <span className="absolute inset-0 grid place-items-center p-6 text-center font-display text-lg font-extrabold tracking-tight text-navy-800" aria-hidden>
                    {name}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
