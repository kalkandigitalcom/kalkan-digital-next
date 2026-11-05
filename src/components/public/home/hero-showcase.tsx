import type { ReactNode } from "react";
import Link from "next/link";
import { Home, MonitorSmartphone } from "lucide-react";

export interface ShowcaseShot {
  title: string;
  imagePath: string;
  label: string;
}

/**
 * Hero visual. Uses real project screenshots from the published portfolio only (strategy report 3.2:
 * no representational "fake" screens): a general web project in front, a villa project behind.
 * Without screenshots it falls back to a plain two-category panel that makes no product claims.
 */
export function HeroShowcase({ front, back }: { front: ShowcaseShot | null; back: ShowcaseShot | null }) {
  const shots = [front, back].filter((s): s is ShowcaseShot => s !== null);

  if (shots.length === 0) {
    return (
      // Hidden on small screens: the category doors follow right below the hero there.
      <div className="intro-visual relative hidden lg:block">
        <div className="par-slow grid gap-4">
          <CategoryTile href="/hizmetler" icon={<MonitorSmartphone className="size-5" aria-hidden />} title="Web Tasarım ve Dijital Çözümler" items={["Kurumsal web tasarım", "Özel web yazılım", "E-ticaret", "Sunucu ve hosting", "Kurumsal e-posta", "Dijital reklam"]} />
          <CategoryTile href="/villa-kiralama-yazilimi" accent icon={<Home className="size-5" aria-hidden />} title="Villa Kiralama Yazılımları" items={["Villa kiralama sitesi", "Rezervasyon sistemi", "Airbnb ve Booking çift yönlü eşitleme", "Çoklu dil ve para birimi"]} />
        </div>
      </div>
    );
  }

  const [main, second] = shots;
  return (
    <div className="intro-visual relative pb-10 sm:pb-14">
      <Shot shot={main!} className="par-slow relative z-10" />
      {second ? (
        <div className="intro-float par-fast absolute -bottom-2 right-0 z-20 w-[58%] sm:-right-4">
          <Shot shot={second} compact />
        </div>
      ) : null}
    </div>
  );
}

function Shot({ shot, className = "", compact }: { shot: ShowcaseShot; className?: string; compact?: boolean }) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-[0_30px_60px_-30px_rgba(11,31,58,0.45)] ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-navy-100 px-3 py-2" aria-hidden>
        <span className="size-2 rounded-full bg-navy-200" />
        <span className="size-2 rounded-full bg-navy-200" />
        <span className="size-2 rounded-full bg-navy-200" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/media/${shot.imagePath}`}
        alt={`${shot.title} web sitesi ekran görüntüsü`}
        className={`block w-full object-cover object-top ${compact ? "aspect-[4/3]" : "aspect-[16/11]"}`}
        fetchPriority={compact ? "auto" : "high"}
        decoding="async"
      />
      <figcaption className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
        <span className="truncate font-semibold text-navy-800">{shot.title}</span>
        <span className={`shrink-0 rounded-full bg-navy-50 px-2 py-0.5 font-semibold text-navy-500 ${compact ? "hidden sm:inline" : ""}`}>{shot.label}</span>
      </figcaption>
    </figure>
  );
}

function CategoryTile({ href, icon, title, items, accent }: { href: string; icon: ReactNode; title: string; items: string[]; accent?: boolean }) {
  return (
    <Link href={href} className={`block rounded-2xl border p-6 shadow-card outline-none transition-[translate,box-shadow] duration-500 hover:-translate-y-0.5 hover:shadow-lift focus-visible:ring-2 focus-visible:ring-brand-500 ${accent ? "border-aqua-200 bg-aqua-50/60" : "border-navy-100 bg-white"}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${accent ? "bg-aqua-500 text-white" : "bg-navy-900 text-white"}`}>{icon}</span>
        <p className="font-display text-base font-bold text-navy-900">{title}</p>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i} className="rounded-full border border-navy-100 bg-white px-3 py-1 text-xs font-semibold text-navy-600">{i}</li>
        ))}
      </ul>
    </Link>
  );
}
