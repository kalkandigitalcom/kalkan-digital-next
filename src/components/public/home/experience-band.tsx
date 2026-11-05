import { CalendarCheck, Home, Layers } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Home, label: "Villa Kiralama" },
  { icon: CalendarCheck, label: "Rezervasyon Sistemleri" },
  { icon: Layers, label: "Sektörel Dijital Deneyim" },
] as const;

/**
 * Full-width band right below the hero: experience in the villa rental sector since 2018.
 * Backed by no client or project counts. Server component; the only motion is a slow
 * ambient glow (CSS, off with reduced motion).
 */
export function ExperienceBand() {
  return (
    <section aria-labelledby="deneyim-baslik" className="experience-band relative isolate overflow-hidden bg-navy-900 py-16 text-white sm:py-20">
      <div aria-hidden className="experience-glow absolute -right-32 -top-40 -z-10 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(34,195,206,0.22),transparent)]" />
      <div aria-hidden className="absolute -bottom-48 -left-40 -z-10 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgba(58,99,247,0.18),transparent)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-aqua-300/40 to-transparent" />

      <div className="container-page grid items-center gap-10 lg:grid-cols-[auto_1fr] lg:gap-20">
        <div data-reveal aria-hidden className="flex items-end gap-3 lg:flex-col lg:items-start lg:gap-1">
          <span className="experience-year font-display text-[5.5rem] font-extrabold leading-[0.85] tracking-tight sm:text-[7rem] lg:text-[9rem]">2018</span>
          <span className="pb-2 font-display text-xl font-bold text-navy-200 lg:pb-0 lg:pl-1.5">&apos;den beri</span>
        </div>

        <div data-reveal="story">
          <p className="rv-eyebrow text-xs font-bold tracking-[0.18em] text-aqua-300">2018&apos;DEN BERİ VİLLA KİRALAMA SEKTÖRÜNDE</p>
          <h2 id="deneyim-baslik" className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-[2.6rem]">
            Villa kiralama sektörünün içinden gelen deneyim.
          </h2>
          <p className="rv-text mt-5 max-w-2xl text-base leading-relaxed text-navy-200 sm:text-lg">
            Villa kiralama sektöründe edindiğimiz deneyimi, işletmelere özel web siteleri, rezervasyon sistemleri ve dijital çözümlere dönüştürüyoruz.
          </p>
          <ul className="rv-late mt-8 grid gap-3 sm:grid-cols-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-aqua-400/15 text-aqua-300">
                  <Icon className="size-[1.125rem]" aria-hidden />
                </span>
                <span className="text-sm font-bold text-white">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
