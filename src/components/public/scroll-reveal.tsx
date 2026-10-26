"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Inline bootstrap (runs before the page content is parsed): enables the hide-until-revealed
 * styles only when JavaScript runs, and switches them off again if the observer below has not
 * started within 4 s (e.g. the JS bundle failed to load) – content is never left hidden.
 */
export const SCROLL_REVEAL_BOOTSTRAP =
  "(function(){var r=document.documentElement;r.setAttribute('data-reveal-on','');setTimeout(function(){if(!r.hasAttribute('data-reveal-ready'))r.removeAttribute('data-reveal-on')},4000)})();";

/**
 * Reveals `[data-reveal]` / `[data-reveal-group]` elements once, the first time they scroll into
 * view. One shared IntersectionObserver per page; revealed elements are unobserved immediately,
 * so scrolling back never replays the animation. All visual work is done in CSS (globals.css).
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!("IntersectionObserver" in window)) {
      root.removeAttribute("data-reveal-on");
      return;
    }
    root.setAttribute("data-reveal-ready", "");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Reveal when visible, or right away if it is already above the viewport (restored scroll).
          if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
            entry.target.setAttribute("data-revealed", "");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-reveal]:not([data-revealed]), [data-reveal-group]:not([data-revealed])").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
