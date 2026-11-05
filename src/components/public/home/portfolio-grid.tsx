"use client";

import { useId, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  category: string;
  imagePath: string | null;
  logoPath: string | null;
  /** Short verified description (optional) */
  note?: string | null;
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
function sectorLabel(key: SectorKey) {
  return SECTORS.find((s) => s.key === key)?.label ?? "Diğer";
}

/*
 * Editorial layout: a 12-column bento on large screens whose spans depend on how many projects are
 * shown, so every filter fills the grid without holes. Spans are spelled out so Tailwind sees them.
 */
const LG_HEAD = ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5"];
const LG_BY_COUNT: Record<number, string[]> = {
  1: ["lg:col-span-12 lg:row-span-2"],
  2: ["lg:col-span-7 lg:row-span-2", "lg:col-span-5 lg:row-span-2"],
  3: LG_HEAD,
  4: [...LG_HEAD, "lg:col-span-12"],
  5: [...LG_HEAD, "lg:col-span-6", "lg:col-span-6"],
  6: [...LG_HEAD, "lg:col-span-4", "lg:col-span-4", "lg:col-span-4"],
  7: [...LG_HEAD, "lg:col-span-4 lg:row-span-2", "lg:col-span-8", "lg:col-span-4", "lg:col-span-4"],
};
function lgSpans(n: number): string[] {
  const out: string[] = [];
  for (let rest = n; rest > 0; rest -= 7) out.push(...LG_BY_COUNT[Math.min(rest, 7)]!);
  return out;
}

type Tone = "feature" | "light" | "aqua" | "dark";
const TONES: Tone[] = ["light", "aqua", "dark"];

/**
 * Portfolio showcase. Filters are built from the published projects only (a sector appears when it
 * has at least one project). Tiles show the real screenshot when there is one, otherwise the real
 * logo on a white plate; nothing is invented. Every tile links to the existing project detail page.
 * Hover effects are CSS-only (`.showcase-*` in globals.css); on touch screens all details are visible.
 */
export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [active, setActive] = useState<SectorKey | "all">("all");
  const listId = useId();

  const counts = new Map<SectorKey, number>();
  for (const i of items) counts.set(sectorOf(i.category), (counts.get(sectorOf(i.category)) ?? 0) + 1);
  const filters: { key: SectorKey | "all"; label: string; count: number }[] = [
    { key: "all", label: "Tümü", count: items.length },
    ...SECTORS.filter((s) => counts.has(s.key)).map((s) => ({ key: s.key, label: s.label, count: counts.get(s.key)! })),
    ...(counts.has("other") ? [{ key: "other" as const, label: "Diğer", count: counts.get("other")! }] : []),
  ];
  const shown = active === "all" ? items : items.filter((i) => sectorOf(i.category) === active);
  const spans = lgSpans(shown.length);
  const oddTail = (shown.length - 1) % 2 === 1;

  return (
    <div>
      {filters.length > 2 ? (
        <div role="group" aria-label="Projeleri sektöre göre filtrele" className="flex flex-wrap gap-x-8 gap-y-3 border-b border-navy-900/10">
          {filters.map((f) => {
            const on = f.key === active;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                aria-controls={listId}
                onClick={() => setActive(f.key)}
                className={`showcase-tab group relative -mb-px flex items-baseline gap-2 pb-3 font-display text-base font-bold outline-none transition-colors duration-300 focus-visible:text-brand-600 sm:text-lg ${on ? "text-navy-900" : "text-navy-400 hover:text-navy-700"}`}
                data-on={on || undefined}
              >
                {f.label}
                <sup className={`text-xs font-extrabold tabular ${on ? "text-aqua-600" : "text-navy-300"}`}>{String(f.count).padStart(2, "0")}</sup>
              </button>
            );
          })}
        </div>
      ) : null}

      <ul id={listId} key={active} className="portfolio-grid mt-8 grid auto-rows-[13.5rem] grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 md:auto-rows-[14rem] lg:grid-cols-12 lg:auto-rows-[14.5rem]">
        {shown.map((p, i) => {
          const name = p.clientName ?? p.title;
          const sector = sectorLabel(sectorOf(p.category));
          const feature = i % 7 === 0;
          const last = i === shown.length - 1;
          const tone: Tone = feature ? "feature" : TONES[(i - 1) % TONES.length]!;
          const span = [
            feature ? "col-span-2 row-span-2 md:col-span-6" : last && oddTail ? "col-span-2 md:col-span-6" : "col-span-1 md:col-span-3",
            spans[i],
          ].join(" ");
          return (
            <li key={p.id} className={span} style={{ "--i": Math.min(i, 8) } as CSSProperties}>
              <Link href={`/projeler/${p.slug}`} className={`showcase-tile group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 showcase-${tone}`}>
                {feature ? <FeatureTile p={p} name={name} sector={sector} index={i} /> : <CompactTile p={p} name={name} sector={sector} index={i} tone={tone} />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Text placeholder for a project without a logo (no invented artwork). */
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toLocaleUpperCase("tr")).join("");
}

function Visual({ p, name, large }: { p: PortfolioItem; name: string; large?: boolean }) {
  if (p.imagePath) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/media/${p.imagePath}`} alt="" loading="lazy" decoding="async" className="showcase-shot absolute inset-0 size-full object-cover object-top" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-navy-950/10" />
      </>
    );
  }
  return (
    <span className={`showcase-plate relative grid place-items-center rounded-2xl bg-white ${large ? "h-24 w-44 p-4 sm:h-28 sm:w-56 sm:p-5" : "h-14 w-24 p-2.5 sm:h-[4.5rem] sm:w-36 sm:p-3"}`}>
      {p.logoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/media/${p.logoPath}`} alt="" loading="lazy" decoding="async" className="max-h-full w-auto max-w-full object-contain" />
      ) : (
        <span className="font-display text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl" aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}

function FeatureTile({ p, name, sector, index }: { p: PortfolioItem; name: string; sector: string; index: number }) {
  return (
    <>
      <span aria-hidden className="showcase-glow pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(closest-side,rgba(34,195,206,0.35),transparent)]" />
      <span aria-hidden className="pointer-events-none absolute -bottom-6 right-4 select-none font-display text-[9rem] font-extrabold leading-none tracking-tighter text-white/[0.05] sm:text-[12rem]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="relative flex items-center justify-between p-5 sm:p-7">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-aqua-300">Öne çıkan · {sector}</span>
        <span className="showcase-arrow grid size-10 place-items-center rounded-full border border-white/15 text-white">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>
      </span>
      <span className="relative flex flex-1 items-center px-5 sm:px-7">{p.imagePath ? null : <Visual p={p} name={name} large />}</span>
      {p.imagePath ? <Visual p={p} name={name} /> : null}
      <span className="relative p-5 pt-4 sm:p-7 sm:pt-5">
        <span className="block font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-[2.75rem]">{name}</span>
        {p.note ? <span className="mt-2.5 block max-w-md text-sm leading-relaxed text-navy-200">{p.note}</span> : null}
      </span>
    </>
  );
}

function CompactTile({ p, name, sector, index, tone }: { p: PortfolioItem; name: string; sector: string; index: number; tone: Tone }) {
  const dark = tone === "dark";
  return (
    <>
      {p.imagePath ? <Visual p={p} name={name} /> : null}
      <span className="relative flex items-start justify-between gap-2 p-4 sm:p-5">
        <span className={`text-[11px] font-bold tabular tracking-[0.14em] ${dark ? "text-aqua-300" : "text-navy-400"}`}>{String(index + 1).padStart(2, "0")}</span>
        <span className={`showcase-arrow grid size-8 shrink-0 place-items-center rounded-full ${dark ? "bg-white/10 text-white" : "bg-navy-900 text-white"}`}>
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </span>
      {p.imagePath ? <span className="flex-1" /> : (
        <span className="relative flex flex-1 items-center justify-center px-4">
          <Visual p={p} name={name} />
        </span>
      )}
      <span className="relative p-4 pt-3 sm:p-5 sm:pt-3">
        <span className={`block truncate font-display text-sm font-extrabold tracking-tight sm:text-base ${dark ? "text-white" : "text-navy-900"}`}>{name}</span>
        <span className={`block text-xs font-semibold ${dark ? "text-navy-300" : "text-navy-500"}`}>{sector}</span>
        {p.note ? <span className={`showcase-note mt-1.5 hidden text-xs leading-relaxed lg:block ${dark ? "text-navy-200" : "text-navy-600"}`}>{p.note}</span> : null}
      </span>
    </>
  );
}
