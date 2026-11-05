import Link from "next/link";
import type { CSSProperties } from "react";

export interface MarqueeProject {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  logoPath: string | null;
}

/** A row's loop segment has at least this many logos, so it is always wider than the viewport. */
const MIN_PER_SEGMENT = 10;
/** Seconds per logo: keeps the speed the same whatever the number of logos. */
const SECONDS_PER_LOGO = 3.2;

/**
 * Two endless logo rows moving in opposite directions (server component, CSS-only motion; see
 * `.marquee-*` in globals.css). Each row repeats the real project list until one segment is wide
 * enough, then renders that segment twice and slides it by exactly one segment width, so the loop
 * has no jump or gap. Only the first copy of each project in the top row is exposed to assistive
 * tech and keyboard focus; every other copy is decorative (`aria-hidden`, not focusable) but still
 * clickable with a mouse or by touch. Logos are shown unchanged, only filtered to grayscale until
 * hover or focus.
 */
export function PortfolioMarquee({ projects }: { projects: MarqueeProject[] }) {
  if (projects.length === 0) return null;
  const reversed = [...projects].reverse();
  return (
    <div className="space-y-6 sm:space-y-8">
      <MarqueeRow projects={projects} direction="left" accessible />
      <MarqueeRow projects={reversed} direction="right" />
    </div>
  );
}

function MarqueeRow({ projects, direction, accessible }: { projects: MarqueeProject[]; direction: "left" | "right"; accessible?: boolean }) {
  const segment: MarqueeProject[] = [];
  while (segment.length < MIN_PER_SEGMENT) segment.push(...projects);
  const style = { "--marquee-duration": `${segment.length * SECONDS_PER_LOGO}s` } as CSSProperties;

  return (
    <div className="marquee" data-direction={direction}>
      <ul className="marquee-track" style={style}>
        {[0, 1].flatMap((copy) =>
          segment.map((p, i) => {
            const exposed = accessible && copy === 0 && i < projects.length;
            return <Logo key={`${copy}-${i}-${p.id}`} p={p} exposed={exposed} clone={copy === 1} />;
          }),
        )}
      </ul>
    </div>
  );
}

function Logo({ p, exposed, clone }: { p: MarqueeProject; exposed?: boolean; clone: boolean }) {
  const name = p.clientName ?? p.title;
  return (
    <li className={`marquee-item${clone ? " marquee-clone" : ""}`} aria-hidden={exposed ? undefined : true}>
      <Link href={`/projeler/${p.slug}`} tabIndex={exposed ? undefined : -1} draggable={false} className="marquee-link" aria-label={exposed ? `${name} projesi` : undefined}>
        {p.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/${p.logoPath}`} alt="" loading="lazy" decoding="async" draggable={false} className="marquee-logo" />
        ) : (
          <span className="marquee-logo marquee-name">{name}</span>
        )}
      </Link>
    </li>
  );
}
