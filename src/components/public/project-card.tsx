import Link from "next/link";
import { serviceTypes } from "@/lib/labels";

export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  category: Parameters<typeof serviceTypes.label>[0];
  logoPath: string | null;
}

/*
 * Reference logos: muted (grayscale, low opacity) at rest, original colours on hover / keyboard
 * focus with a soft transition. Tailwind v4 applies `hover:` only on devices that can hover, so on
 * touch screens logos stay muted and only light up while pressed (`active:`) – never permanently.
 */
const reveal =
  "transition-[filter,opacity,color,scale] duration-500 ease-out motion-reduce:transition-none group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0 group-active:opacity-100 group-active:grayscale-0";

function ReferenceLogo({ p }: { p: PublicProject }) {
  const brand = p.clientName ?? p.title;
  return (
    <Link
      href={`/projeler/${p.slug}`}
      title={p.clientName && p.clientName !== p.title ? `${p.title} · ${p.clientName}` : p.title}
      className="group flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-navy-100 bg-white px-6 outline-none transition-[border-color,translate,box-shadow,scale] duration-500 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-card active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:h-32 sm:px-8"
    >
      {p.logoPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/media/${p.logoPath}`}
          alt={`${brand} logosu`}
          loading="lazy"
          decoding="async"
          className={`h-auto max-h-10 w-auto max-w-full object-contain opacity-55 grayscale sm:max-h-12 ${reveal}`}
        />
      ) : (
        // No logo uploaded yet: a restrained wordmark of the brand name.
        <span className={`line-clamp-2 text-center font-display text-base font-bold tracking-tight text-navy-400 opacity-80 sm:text-lg ${reveal} group-hover:text-navy-900 group-focus-visible:text-navy-900 group-active:text-navy-900`}>
          {brand}
        </span>
      )}
      <span className="sr-only">{`${brand === p.title ? "" : ` – ${p.title}`}, ${serviceTypes.label(p.category)}`}</span>
    </Link>
  );
}

/** Minimal logo wall for published portfolio items; each logo links to its existing project page. */
export function ReferenceLogos({ items, className = "" }: { items: PublicProject[]; className?: string }) {
  return (
    <ul data-reveal-group="logos" className={`flex flex-wrap justify-center gap-3 sm:gap-4 ${className}`}>
      {items.map((p) => (
        <li key={p.id} className="w-[calc(50%-0.375rem)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]">
          <ReferenceLogo p={p} />
        </li>
      ))}
    </ul>
  );
}
