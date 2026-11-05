import Link from "next/link";
import { ArrowRight, ChevronRight, MessageCircle, Plus } from "lucide-react";
import type { ServicePage } from "@/lib/service-pages";
import { getPublicContact, waHref } from "@/server/public";
import { listPublishedPortfolio } from "@/server/services/portfolio";
import { site } from "@/lib/site";
import { SplitWords } from "@/components/public/split-words";
import { ServiceBlock } from "./blocks";
import { ServiceIcon } from "./icons";

const AREAS = ["Antalya", "Muğla"];

function ld(o: object) {
  return JSON.stringify(o).replace(/</g, "\\u003c");
}

/** Full service / villa software page: hero with breadcrumb, content blocks, links, FAQ, CTA and JSON-LD. */
export async function ServicePageView({ page }: { page: ServicePage }) {
  const [contact, projects] = await Promise.all([getPublicContact(), listPublishedPortfolio(24).catch(() => [])]);
  const villa = page.kind === "villa";
  const wa = waHref(contact.whatsapp, page.cta.whatsapp);
  const quoteHref = `/iletisim?hizmet=${page.cta.hizmet}#teklif`;

  const crumbs = [{ href: "/", label: "Ana sayfa" }, ...(page.parent ? [page.parent] : []), { href: page.path, label: page.label }];
  const url = `${site.url}${page.path}`;

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.schema.name,
    serviceType: page.schema.serviceType,
    description: page.seo.description,
    url,
    provider: { "@type": "ProfessionalService", name: "Kalkan Digital", url: site.url },
    areaServed: AREAS.map((name) => ({ "@type": "AdministrativeArea", name })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${site.url}${c.href === "/" ? "/" : c.href}` })),
  };
  const faqLd = page.faq.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      {faqLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(faqLd) }} /> : null}

      {/* Hero */}
      <section className={`relative isolate overflow-hidden pb-16 pt-32 sm:pb-24 sm:pt-36 ${villa ? "bg-navy-950 text-white" : "bg-gradient-to-b from-surface to-white"}`}>
        <div
          aria-hidden
          className={`absolute inset-0 -z-10 ${villa ? "bg-[radial-gradient(46rem_26rem_at_90%_0%,rgba(34,195,206,0.2),transparent_65%),radial-gradient(36rem_24rem_at_0%_100%,rgba(58,99,247,0.18),transparent_60%)]" : "bg-[radial-gradient(46rem_26rem_at_90%_0%,rgba(34,195,206,0.12),transparent_65%),radial-gradient(36rem_24rem_at_5%_10%,rgba(27,78,245,0.07),transparent_60%)]"}`}
        />
        <div className="container-page">
          <nav aria-label="Breadcrumb" className="intro">
            <ol className={`flex flex-wrap items-center gap-1.5 text-xs font-semibold ${villa ? "text-navy-300" : "text-navy-500"}`}>
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1.5">
                  {i > 0 ? <ChevronRight className="size-3.5 opacity-60" aria-hidden /> : null}
                  {i < crumbs.length - 1 ? (
                    <Link href={c.href} className={villa ? "hover:text-white" : "hover:text-navy-900"}>{c.label}</Link>
                  ) : (
                    <span aria-current="page" className={villa ? "text-aqua-300" : "text-navy-900"}>{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-8 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="intro">
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${villa ? "text-aqua-300" : "text-brand-600"}`}>{page.hero.eyebrow}</p>
              <h1 className={`mt-4 font-display text-[2.4rem] font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.6rem] ${villa ? "text-white" : "text-navy-900"}`}>
                <SplitWords text={page.hero.h1} />
              </h1>
              <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${villa ? "text-navy-200" : "text-navy-500"}`}>{page.hero.lead}</p>
              <div className="intro-cta mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={quoteHref} className={`motion-press group inline-flex h-13 items-center justify-center gap-2 rounded-xl px-7 text-base font-bold ${villa ? "bg-aqua-400 text-navy-950 hover:bg-aqua-300" : "bg-navy-900 text-white hover:bg-navy-800"}`}>
                  {page.cta.primary} <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className={`motion-press inline-flex h-13 items-center justify-center gap-2 rounded-xl border px-7 text-base font-bold ${villa ? "border-white/20 text-white hover:bg-white/10" : "border-navy-200 bg-white text-navy-900 hover:bg-navy-50"}`}>
                    <MessageCircle className={`size-5 ${villa ? "text-aqua-300" : "text-aqua-600"}`} aria-hidden /> WhatsApp&apos;tan yazın
                  </a>
                ) : null}
              </div>
            </div>
            <ul className="intro-visual grid grid-cols-2 gap-3">
              {page.hero.highlights.map((h, i) => {
                return (
                  <li key={h.label} className={`flex flex-col gap-4 rounded-2xl border p-5 ${villa ? "border-white/10 bg-white/[0.05]" : "border-navy-100 bg-white shadow-card"} ${i % 2 === 1 ? "lg:translate-y-6" : ""}`}>
                    <span className={`grid size-10 place-items-center rounded-xl ${villa ? "bg-aqua-400/15 text-aqua-300" : i === 0 ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-900"}`}>
                      <ServiceIcon name={h.icon} className="size-5" />
                    </span>
                    <span className={`text-sm font-bold leading-snug ${villa ? "text-white" : "text-navy-900"}`}>{h.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {page.blocks.map((b) => (
        <ServiceBlock key={b.id} block={b} villa={villa} projects={projects} />
      ))}

      {/* Related pages */}
      {page.related.length > 0 ? (
        <section className="scroll-mt-24 border-t border-navy-100 py-16 sm:py-20">
          <div className="container-page">
            <p data-reveal className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">İlgili sayfalar</p>
            <ul data-reveal-group className={`mt-6 grid gap-4 md:grid-cols-2 ${page.related.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {page.related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="group flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-6 transition-[border-color,box-shadow] duration-500 hover:border-navy-200 hover:shadow-lift">
                    <span className="font-display text-base font-bold text-navy-900">{r.title}</span>
                    <span className="mt-2 text-sm leading-relaxed text-navy-500">{r.text}</span>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-brand-600">
                      İnceleyin <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* FAQ */}
      {page.faq.length > 0 ? (
        <section id="sss" className="scroll-mt-24 bg-surface py-16 sm:py-24">
          <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div data-reveal="story">
              <p className="rv-eyebrow text-xs font-bold uppercase tracking-[0.18em] text-brand-600">SSS</p>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-[2.4rem]"><SplitWords text="Sık sorulan sorular" /></h2>
            </div>
            <div data-reveal-group className="divide-y divide-navy-100 border-y border-navy-100">
              {page.faq.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-base font-bold text-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:text-lg [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <Plus className="size-5 shrink-0 text-navy-400 transition-transform duration-300 group-open:rotate-45 group-open:text-navy-900" aria-hidden />
                  </summary>
                  <p className="pb-6 pr-10 leading-relaxed text-navy-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Cross-category link */}
      {page.crossLink ? (
        <section className="py-12 sm:py-16">
          <div className="container-page">
            <Link data-reveal href={page.crossLink.href} className="group flex flex-col gap-5 rounded-3xl border border-aqua-200 bg-aqua-50 p-7 transition-[box-shadow,translate] duration-500 hover:-translate-y-0.5 hover:shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-9">
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-aqua-700">{page.crossLink.eyebrow}</span>
                <span className="mt-2 block font-display text-xl font-extrabold tracking-tight text-navy-900">{page.crossLink.title}</span>
                <span className="mt-1.5 block max-w-2xl text-sm leading-relaxed text-navy-600">{page.crossLink.text}</span>
              </span>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy-900 text-white transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="size-5" aria-hidden />
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Closing CTA */}
      <section className="pb-20 sm:pb-28">
        <div className="container-page">
          <div data-reveal="cta" className={`relative overflow-hidden rounded-3xl px-6 py-14 sm:px-14 sm:py-16 ${villa ? "bg-navy-950" : "bg-navy-900"}`}>
            <div aria-hidden className="par-view absolute -right-24 -top-24 size-96 rounded-full bg-aqua-400/20 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-[2.4rem]"><SplitWords text={page.cta.bandTitle} /></h2>
                <p className="rv-text mt-4 max-w-xl text-navy-200">{page.cta.bandText}</p>
              </div>
              <div className="rv-actions flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link href={quoteHref} className="motion-press inline-flex h-13 items-center justify-center rounded-xl bg-white px-7 text-base font-bold text-navy-900 hover:bg-navy-50">{page.cta.primary}</Link>
                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="motion-press inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/25 px-7 text-base font-bold text-white hover:bg-white/10">
                    <MessageCircle className="size-5" aria-hidden /> WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
