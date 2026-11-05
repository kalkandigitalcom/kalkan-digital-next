import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronRight } from "lucide-react";
import type { Block } from "@/lib/service-pages";
import { villaProjectNotes } from "@/lib/service-pages";
import { SplitWords } from "@/components/public/split-words";
import { SyncDiagram } from "@/components/public/home/sync-diagram";
import { ServiceIcon } from "./icons";

type Tone = "light" | "surface" | "dark";

const TONE: Record<Tone, string> = {
  light: "bg-white",
  surface: "bg-surface",
  dark: "bg-navy-950 text-white",
};

export interface BlockProject {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  category: string;
  logoPath: string | null;
  imagePath: string | null;
}

function Heading({ eyebrow, title, text, dark, center }: { eyebrow: string; title: string; text?: string; dark?: boolean; center?: boolean }) {
  return (
    <div data-reveal="story" className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`rv-eyebrow text-xs font-bold uppercase tracking-[0.18em] ${dark ? "text-aqua-300" : "text-brand-600"}`}>{eyebrow}</p>
      <h2 className={`mt-4 font-display text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-[2.4rem] ${dark ? "text-white" : "text-navy-900"}`}>
        <SplitWords text={title} />
      </h2>
      {text ? <p className={`rv-text mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-navy-200" : "text-navy-500"}`}>{text}</p> : null}
    </div>
  );
}

function Section({ id, tone = "light", children }: { id: string; tone?: Tone; children: React.ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-24 py-16 sm:py-24 ${TONE[tone]}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}

function IconBadge({ name, dark, accent }: { name: string; dark?: boolean; accent?: boolean }) {
  const cls = dark ? "bg-aqua-400/15 text-aqua-300" : accent ? "bg-aqua-50 text-aqua-700" : "bg-navy-50 text-navy-900";
  return (
    <span className={`rv-icon grid size-11 shrink-0 place-items-center rounded-xl ${cls}`}>
      <ServiceIcon name={name} className="size-5" />
    </span>
  );
}

const COLS: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };

export function ServiceBlock({ block, villa, projects }: { block: Block; villa: boolean; projects: BlockProject[] }) {
  switch (block.type) {
    case "features": {
      const dark = block.tone === "dark";
      return (
        <Section id={block.id} tone={block.tone}>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} dark={dark} />
          <ul data-reveal-group className={`mt-10 grid gap-4 ${COLS[block.columns ?? 3]}`}>
            {block.items.map((it) => (
              <li key={it.title} className={`group rounded-2xl border p-6 transition-[border-color,box-shadow,translate] duration-500 ${dark ? "border-white/10 bg-white/[0.04] hover:border-aqua-300/30" : "border-navy-100 bg-white hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-lift"}`}>
                <IconBadge name={it.icon} dark={dark} accent={villa} />
                <h3 className={`mt-5 font-display text-base font-bold leading-snug ${dark ? "text-white" : "text-navy-900"}`}>{it.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-navy-300" : "text-navy-500"}`}>{it.text}</p>
                {it.href ? (
                  <Link href={it.href} className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${dark ? "text-aqua-300 hover:text-aqua-200" : "text-brand-600 hover:text-brand-700"}`}>
                    İnceleyin<span className="sr-only">: {it.title}</span> <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      );
    }

    case "split": {
      const dark = block.tone === "dark";
      return (
        <Section id={block.id} tone={block.tone}>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <Heading eyebrow={block.eyebrow} title={block.title} dark={dark} />
            <div data-reveal className="space-y-5">
              {block.paragraphs.map((p) => (
                <p key={p.slice(0, 32)} className={`text-base leading-relaxed sm:text-lg ${dark ? "text-navy-200" : "text-navy-600"}`}>{p}</p>
              ))}
              {block.bullets ? (
                <ul className="grid gap-3 pt-2 sm:grid-cols-2">
                  {block.bullets.map((b) => (
                    <li key={b} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${dark ? "border-white/10 bg-white/[0.04] text-white" : "border-navy-100 bg-white text-navy-800"}`}>
                      <Check className={`mt-0.5 size-4 shrink-0 ${dark ? "text-aqua-300" : "text-aqua-600"}`} aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
              {block.link ? (
                <Link href={block.link.href} className={`group inline-flex items-center gap-2 pt-2 text-sm font-bold ${dark ? "text-aqua-300 hover:text-aqua-200" : "text-brand-600 hover:text-brand-700"}`}>
                  {block.link.label} <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </Section>
      );
    }

    case "steps":
      return (
        <Section id={block.id} tone={block.tone}>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <ol data-reveal-group className={`mt-12 grid gap-4 sm:grid-cols-2 ${block.items.length >= 6 ? "lg:grid-cols-3" : "lg:grid-cols-5"}`}>
            {block.items.map((s, i) => (
              <li key={s.title} className="process-card group relative rounded-2xl border border-navy-100 bg-white p-5 pt-6 transition-[translate,box-shadow,border-color] duration-500">
                <span className="process-dot rv-num grid size-10 place-items-center rounded-full font-display text-sm font-extrabold text-white">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-base font-bold text-navy-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>
      );

    case "flow": {
      const dark = block.tone === "dark";
      return (
        <Section id={block.id} tone={block.tone}>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} dark={dark} />
          <ol data-reveal-group className="mt-12 flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0">
            {block.items.map((it, i) => (
              <li key={it.title} className="flex flex-col items-stretch lg:flex-1 lg:flex-row lg:items-center">
                <div className={`flex flex-1 items-center gap-4 rounded-2xl border p-4 lg:h-full lg:flex-col lg:items-start lg:p-5 ${dark ? "border-white/10 bg-white/[0.04]" : "border-navy-100 bg-white shadow-card"}`}>
                  <IconBadge name={it.icon} dark={dark} accent={villa} />
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${dark ? "text-aqua-300" : "text-navy-400"}`}>{String(i + 1).padStart(2, "0")}</p>
                    <h3 className={`font-display text-base font-bold ${dark ? "text-white" : "text-navy-900"}`}>{it.title}</h3>
                    <p className={`mt-0.5 text-sm ${dark ? "text-navy-300" : "text-navy-500"}`}>{it.text}</p>
                  </div>
                </div>
                {i < block.items.length - 1 ? (
                  <span aria-hidden className={`grid place-items-center py-1 lg:px-1.5 lg:py-0 ${dark ? "text-aqua-300" : "text-aqua-500"}`}>
                    <ChevronRight className="size-5 rotate-90 lg:rotate-0" />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      );
    }

    case "compare":
      return (
        <Section id={block.id} tone={block.tone}>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <div data-reveal-group="scale" className="mt-10 grid gap-5 md:grid-cols-2">
            {block.columns.map((c, i) => (
              <div key={c.title} className={`flex flex-col rounded-3xl p-7 sm:p-8 ${i === 0 ? "bg-navy-900 text-white" : "border border-navy-100 bg-white"}`}>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${i === 0 ? "bg-aqua-400/15 text-aqua-300" : "bg-aqua-50 text-aqua-700"}`}>{c.tag}</span>
                <h3 className={`mt-5 font-display text-2xl font-extrabold tracking-tight ${i === 0 ? "text-white" : "text-navy-900"}`}>{c.title}</h3>
                <ul className="mt-5 space-y-3">
                  {c.points.map((p) => (
                    <li key={p} className={`flex items-start gap-3 text-sm leading-relaxed ${i === 0 ? "text-navy-100" : "text-navy-600"}`}>
                      <Check className={`mt-0.5 size-4 shrink-0 ${i === 0 ? "text-aqua-300" : "text-aqua-600"}`} aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                {c.example ? <p className={`mt-auto pt-6 text-sm font-semibold ${i === 0 ? "text-aqua-300" : "text-aqua-700"}`}>{c.example}</p> : null}
              </div>
            ))}
          </div>
          {block.note ? <p data-reveal className="mt-6 text-sm text-navy-500">{block.note}</p> : null}
        </Section>
      );

    case "checklist":
      return (
        <Section id={block.id} tone={block.tone}>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
            <div data-reveal className="rounded-3xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
              <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {block.items.map((it) => (
                  <li key={it} className="flex items-start gap-3 text-sm font-semibold leading-relaxed text-navy-800">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-aqua-500 text-white">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
              {block.note ? <p className="mt-6 border-t border-navy-100 pt-4 text-sm text-navy-500">{block.note}</p> : null}
            </div>
          </div>
        </Section>
      );

    case "scenarios":
      return (
        <Section id={block.id} tone={block.tone}>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <ul data-reveal-group className={`mt-10 grid gap-4 sm:grid-cols-2 ${block.items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
            {block.items.map((it) => (
              <li key={it.title} className="flex flex-col rounded-2xl border border-navy-100 bg-white p-6">
                <span className="h-1 w-10 rounded-full bg-gradient-to-r from-navy-900 via-brand-600 to-aqua-400" aria-hidden />
                <h3 className="mt-5 font-display text-base font-bold leading-snug text-navy-900">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{it.text}</p>
                {it.href ? (
                  <Link href={it.href} className="group mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-bold text-brand-600 hover:text-brand-700">
                    {it.linkLabel} <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      );

    case "services":
      return (
        <Section id={block.id}>
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <ul data-reveal-group className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((it, i) => (
              <li key={it.href} className={i === 0 ? "lg:col-span-2" : undefined}>
                <Link href={it.href} className={`group flex h-full flex-col rounded-3xl p-7 outline-none transition-[translate,box-shadow,border-color] duration-500 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-brand-500 ${i === 0 ? "bg-navy-900 text-white hover:shadow-[0_30px_60px_-30px_rgba(11,31,58,0.8)]" : "border border-navy-100 bg-white hover:border-navy-200 hover:shadow-lift"}`}>
                  <IconBadge name={it.icon} dark={i === 0} />
                  <h3 className={`mt-6 font-display text-xl font-extrabold tracking-tight ${i === 0 ? "text-white" : "text-navy-900"}`}>{it.title}</h3>
                  <p className={`mt-2 text-sm leading-relaxed ${i === 0 ? "text-navy-200" : "text-navy-500"}`}>{it.text}</p>
                  <span className={`mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-bold ${i === 0 ? "text-aqua-300" : "text-brand-600"}`}>
                    İnceleyin <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      );

    case "sync":
      return (
        <Section id={block.id} tone="dark">
          <div className="grid items-end gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <Heading eyebrow={block.eyebrow} title={block.title} dark />
            <p data-reveal className="text-base leading-relaxed text-navy-200 sm:text-lg">{block.text}</p>
          </div>
          <div data-reveal className="mt-10">
            <SyncDiagram />
          </div>
        </Section>
      );

    case "statuses": {
      const toneCls: Record<string, string> = {
        free: "bg-white border-navy-200 text-navy-700",
        busy: "bg-navy-900 border-navy-900 text-white",
        pending: "bg-amber-100 border-amber-200 text-amber-900",
        ok: "bg-aqua-500 border-aqua-500 text-white",
        pay: "bg-brand-100 border-brand-200 text-brand-800",
      };
      // Illustrative week strip (labelled as an example; not real data).
      const days = ["free", "free", "pending", "pending", "pay", "ok", "ok", "ok", "free", "busy", "busy", "busy", "busy", "free"] as const;
      return (
        <Section id={block.id}>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
              <ul data-reveal className="mt-8 space-y-3">
                {block.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm font-semibold text-navy-800">
                    <Check className="mt-0.5 size-4 shrink-0 text-aqua-600" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <figure data-reveal className="rounded-3xl border border-navy-100 bg-surface p-6 sm:p-8">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2" aria-hidden>
                {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                  <span key={d} className="pb-1 text-center text-[11px] font-bold text-navy-400">{d}</span>
                ))}
                {days.map((d, i) => (
                  <span key={i} className={`grid aspect-square place-items-center rounded-lg border text-xs font-bold ${toneCls[d]}`}>{i + 8}</span>
                ))}
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {block.statuses.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 rounded-full border border-navy-100 bg-white px-3 py-1.5 text-xs font-bold text-navy-700">
                    <span className={`size-3 rounded-full border ${toneCls[s.tone]}`} aria-hidden /> {s.label}
                  </li>
                ))}
              </ul>
              <figcaption className="mt-4 text-xs text-navy-400">Örnek görünüm · Temsilî veriler</figcaption>
            </figure>
          </div>
        </Section>
      );
    }

    case "optional":
      return (
        <Section id={block.id} tone="surface">
          <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} />
          <ul data-reveal-group className="mt-10 grid gap-4 md:grid-cols-3">
            {block.items.map((it) => (
              <li key={it.title} className="rounded-2xl border border-dashed border-navy-300 bg-white/60 p-6">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy-400">İsteğe bağlı geliştirme</span>
                <h3 className="mt-3 font-display text-base font-bold text-navy-900">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{it.text}</p>
              </li>
            ))}
          </ul>
        </Section>
      );

    case "projects": {
      const items = projects.filter((p) => (block.categories as string[]).includes(p.category));
      if (items.length === 0) return null;
      const dark = block.tone === "dark";
      return (
        <Section id={block.id} tone={block.tone}>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <Heading eyebrow={block.eyebrow} title={block.title} text={block.text} dark={dark} />
            <Link data-reveal href="/projeler" className={`group inline-flex shrink-0 items-center gap-2 text-sm font-bold ${dark ? "text-aqua-300 hover:text-aqua-200" : "text-brand-600 hover:text-brand-700"}`}>
              Tüm projeler <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
          <ul data-reveal-group className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.slice(0, 6).map((p) => {
              const name = p.clientName ?? p.title;
              const note = villaProjectNotes[p.slug];
              return (
                <li key={p.id}>
                  <Link href={`/projeler/${p.slug}`} className={`group flex h-full items-center gap-4 rounded-2xl border p-4 transition-[border-color,background-color,box-shadow] duration-500 ${dark ? "border-white/10 bg-white/[0.04] hover:border-aqua-300/40 hover:bg-white/[0.07]" : "border-navy-100 bg-white hover:border-navy-200 hover:shadow-lift"}`}>
                    <span className={`grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2 ${dark ? "" : "border border-navy-100"}`}>
                      {p.logoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/media/${p.logoPath}`} alt={`${name} logosu`} loading="lazy" decoding="async" className="max-h-full w-auto max-w-full object-contain" />
                      ) : (
                        <span className="font-display text-sm font-extrabold text-navy-900" aria-hidden>{name.slice(0, 2).toLocaleUpperCase("tr")}</span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate font-display text-base font-bold ${dark ? "text-white" : "text-navy-900"}`}>{name}</span>
                      {note ? <span className={`mt-0.5 line-clamp-2 block text-sm ${dark ? "text-navy-300" : "text-navy-500"}`}>{note}</span> : null}
                    </span>
                    <ArrowUpRight className={`ml-auto size-5 shrink-0 transition-[translate,color] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${dark ? "text-navy-400 group-hover:text-aqua-300" : "text-navy-400 group-hover:text-navy-900"}`} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      );
    }
  }
}
