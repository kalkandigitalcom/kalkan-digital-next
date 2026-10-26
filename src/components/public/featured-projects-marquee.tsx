"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { serviceTypes } from "@/lib/labels";

export interface FeaturedProject {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  category: Parameters<typeof serviceTypes.label>[0];
  logoPath: string | null;
  year: number | null;
}

/** Auto-scroll speed in px/s: slow enough to read the cards comfortably. */
const SPEED = 28;
/** Resume auto-scroll this long after the visitor stops touching / scrolling. */
const RESUME_AFTER_MS = 2500;
/** A loop segment has at least this many cards, so it is always wider than the viewport. */
const MIN_CARDS_PER_LOOP = 8;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const m = window.matchMedia(REDUCED_MOTION);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

const reveal =
  "transition-[filter,opacity,color,scale] duration-500 ease-out motion-reduce:transition-none group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0 group-active:opacity-100 group-active:grayscale-0";

function ProjectCard({ p, clone }: { p: FeaturedProject; clone: boolean }) {
  const brand = p.clientName ?? p.title;
  return (
    <Link
      href={`/projeler/${p.slug}`}
      // Repeated copies (only needed for the seamless loop) are hidden from assistive tech and tab order.
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
      draggable={false}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white outline-none transition-[border-color,box-shadow,translate,scale] duration-500 hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className="flex h-32 items-center justify-center border-b border-navy-100/70 px-8">
        {p.logoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/media/${p.logoPath}`}
            alt={clone ? "" : `${brand} logosu`}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={`h-auto max-h-12 w-auto max-w-full object-contain opacity-55 grayscale ${reveal}`}
          />
        ) : (
          <span className={`line-clamp-2 text-center font-display text-lg font-bold tracking-tight text-navy-400 opacity-80 ${reveal} group-hover:text-navy-900 group-focus-visible:text-navy-900 group-active:text-navy-900`}>
            {brand}
          </span>
        )}
      </div>
      <div className="flex flex-1 items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-bold text-navy-900 transition-colors duration-500 group-hover:text-brand-700">{p.title}</h3>
          <p className="mt-1 truncate text-xs text-navy-400">
            {serviceTypes.label(p.category)}
            {p.year ? ` · ${p.year}` : ""}
          </p>
        </div>
        <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-navy-300 transition-[color,translate] duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" aria-hidden />
      </div>
    </Link>
  );
}

/**
 * Featured projects as a horizontal strip that drifts right-to-left in an endless loop.
 *
 * - Native horizontal scrolling: visitors can swipe / scroll it freely on touch devices and
 *   trackpads; auto-scroll pauses while they interact and resumes a moment later.
 * - Seamless loop: the item list is repeated into a loop segment wider than the viewport and that
 *   segment is rendered twice; once the first segment has scrolled out, the position jumps back by
 *   exactly one segment width, which is visually identical.
 * - Pauses on mouse hover, keyboard focus, when off-screen or the tab is hidden, and via the
 *   pause button. With prefers-reduced-motion there is no auto-scroll and no repeated copies.
 */
export function FeaturedProjectsMarquee({ items }: { items: FeaturedProject[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  // Server render assumes motion is allowed; the client value is applied right after hydration.
  const reduced = useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);

  const repeat = Math.max(1, Math.ceil(MIN_CARDS_PER_LOOP / Math.max(items.length, 1)));
  const segment = Array.from({ length: repeat }, (_, r) => items.map((p) => ({ p, key: `${r}-${p.id}`, clone: r > 0 }))).flat();
  const track = [...segment, ...segment.map((c) => ({ ...c, key: `b-${c.key}`, clone: true }))];

  useEffect(() => {
    const el = scroller.current;
    if (!el || reduced) return;

    let hovering = false;
    let focused = false;
    let touching = false;
    let visible = true;
    let resumeAt = 0;
    let pos = el.scrollLeft;
    let last = 0;
    let frame = 0;

    const segmentWidth = () => {
      const first = el.querySelector<HTMLElement>("[data-loop-start='b']");
      return first ? first.offsetLeft - (el.firstElementChild as HTMLElement).offsetLeft : 0;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      const manualPause = el.dataset.paused === "true";
      const active = !manualPause && !hovering && !focused && !touching && visible && !document.hidden && now >= resumeAt;
      if (active) {
        // Pick up any position the visitor scrolled to by hand.
        if (Math.abs(el.scrollLeft - pos) > 2) pos = el.scrollLeft;
        const w = segmentWidth();
        pos += (SPEED * dt) / 1000;
        if (w > 0 && pos >= w) pos -= w;
        el.scrollLeft = pos;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const holdFor = (ms: number) => {
      resumeAt = performance.now() + ms;
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = false;
    };
    const onTouchStart = () => {
      touching = true;
    };
    const onTouchEnd = () => {
      touching = false;
      holdFor(RESUME_AFTER_MS);
    };
    const onWheel = () => holdFor(RESUME_AFTER_MS);
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) focused = false;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    io.observe(el);

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [reduced]);

  return (
    <div>
      <div
        ref={scroller}
        data-paused={paused}
        role="region"
        aria-label="Öne çıkan projeler"
        tabIndex={-1}
        className="-my-4 overflow-x-auto overscroll-x-contain py-6 [mask-image:linear-gradient(to_right,transparent,#000_3%,#000_97%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex w-max gap-4 px-4 sm:gap-5 sm:px-6 lg:px-8">
          {track.map((c, i) => (
            <li
              key={c.key}
              data-loop-start={i === segment.length ? "b" : undefined}
              // Without motion only the real list is shown (no repeated copies).
              className={`w-64 shrink-0 sm:w-72 ${c.clone ? "motion-reduce:hidden" : ""}`}
            >
              <ProjectCard p={c.p} clone={c.clone} />
            </li>
          ))}
        </ul>
      </div>
      {!reduced ? (
        <div className="container-page mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-pressed={paused}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-navy-400 transition-colors hover:bg-white hover:text-navy-700 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
            {paused ? "Akışı başlat" : "Akışı durdur"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
