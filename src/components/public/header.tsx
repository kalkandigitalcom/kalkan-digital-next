"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/#hizmetler", label: "Hizmetler" },
  { href: "/projeler", label: "Projeler" },
  { href: "/#surec", label: "Süreç" },
  { href: "/#neden-biz", label: "Neden biz?" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const overHero = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile menu on navigation
  useEffect(() => setOpen(false), [pathname]);

  const dark = overHero && !scrolled && !open;
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        dark ? "bg-transparent" : "border-b border-navy-100/80 bg-white/90 shadow-sm backdrop-blur-md",
      )}
    >
      <div className="container-page flex h-18 items-center justify-between">
        <Link href="/" aria-label="Kalkan Digital ana sayfa">
          <Logo variant={dark ? "onDark" : "onLight"} />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                dark ? "text-navy-100 hover:text-white" : "text-navy-600 hover:text-navy-900",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Link href="/iletisim#teklif" className="motion-press inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(27,78,245,0.6)] transition hover:bg-brand-700">
            Teklif Al
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn("rounded-lg p-2 lg:hidden", dark ? "text-white" : "text-navy-800")}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      <div id="mobile-menu" hidden={!open} className="border-t border-navy-100 bg-white motion-safe:animate-menu-in lg:hidden">
        <nav className="container-page flex flex-col py-3" aria-label="Mobil menü">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-lg px-2 py-3 text-base font-semibold text-navy-800 hover:bg-navy-50">
              {n.label}
            </Link>
          ))}
          <Link href="/iletisim#teklif" className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
            Teklif Al
          </Link>
        </nav>
      </div>
    </header>
  );
}
