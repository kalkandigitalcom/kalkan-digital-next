"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const TARGETS = "[data-reveal]:not([data-revealed]), [data-reveal-group]:not([data-revealed])";

/**
 * Reveals `[data-reveal]` / `[data-reveal-group]` elements once, the first time they scroll into
 * view. All visual work is done in CSS (globals.css); this only toggles attributes.
 *
 * Nothing is ever hidden before this runs: the server HTML is fully visible, so slow or missing
 * JavaScript never hides content. On mount, elements already on screen are marked
 * `data-revealed="static"` (shown as they are, no animation); only after that is
 * `html[data-reveal-on]` set, which hides the remaining (off-screen) elements until they scroll
 * into view and get `data-revealed="anim"`. Revealed elements are unobserved immediately, so
 * scrolling back never replays the animation. After a client-side navigation the hiding styles
 * are already active, so on-screen elements of the new page rise in instead of popping in.
 */
export function ScrollReveal() {
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll(TARGETS));

    // Already on screen (or scrolled past): shown as is on first load, animated after navigation.
    const onScreen = firstRun.current ? "static" : "anim";
    firstRun.current = false;
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.setAttribute("data-revealed", r.bottom > 0 ? onScreen : "static");
    }
    root.setAttribute("data-reveal-on", "");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            entry.target.setAttribute("data-revealed", entry.isIntersecting ? "anim" : "static");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of targets) if (!el.hasAttribute("data-revealed")) io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
