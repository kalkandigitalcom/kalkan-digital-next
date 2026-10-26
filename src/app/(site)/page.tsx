import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Code2,
  Gauge,
  Handshake,
  HeartPulse,
  Home,
  Hotel,
  Layers,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Plane,
  Sailboat,
  ServerCog,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { listPublishedPortfolio } from "@/server/services/portfolio";
import { getPublicContact, waHref } from "@/server/public";
import { processSteps, reasons, sectors, services } from "@/lib/content";
import { site } from "@/lib/site";
import { FeaturedProjectsMarquee } from "@/components/public/featured-projects-marquee";
import { yearOf, todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Kalkan Digital | Web Tasarım, Yazılım ve Dijital Büyüme · Kalkan, Kaş" },
  description:
    "Kalkan Digital; işletmeler için modern web siteleri, villa kiralama ve turizm yazılımları, özel yazılım, hosting, dijital reklam ve sosyal medya hizmetleri sunar. 2018'den beri Kalkan, Kaş, Antalya.",
  alternates: { canonical: "/" },
};

const ICONS: Record<string, LucideIcon> = {
  MonitorSmartphone, Home, Hotel, Code2, ServerCog, Target, Share2, Camera, MapPin, Layers, Gauge, ShieldCheck, Handshake, Sparkles, Plane, UtensilsCrossed, Building2, Store, Sailboat, HeartPulse,
};

function SectionHeading({ eyebrow, title, text, light }: { eyebrow: string; title: string; text?: string; light?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${light ? "text-brand-300" : "text-brand-600"}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? "text-white" : "text-navy-900"}`}>{title}</h2>
      {text ? <p className={`mt-4 text-base leading-relaxed ${light ? "text-navy-200" : "text-navy-500"}`}>{text}</p> : null}
    </div>
  );
}

export default async function HomePage() {
  const [projects, contact] = await Promise.all([listPublishedPortfolio(8).catch(() => []), getPublicContact()]);
  const years = yearOf(todayIso()) - site.foundedYear;
  const wa = waHref(contact.whatsapp, "Merhaba, projem hakkında bilgi almak istiyorum.");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Kalkan Digital",
    url: site.url,
    foundingDate: String(site.foundedYear),
    address: { "@type": "PostalAddress", addressLocality: "Kalkan, Kaş", addressRegion: "Antalya", addressCountry: "TR" },
    areaServed: "TR",
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.phone ? { telephone: contact.phone } : {}),
    knowsAbout: services.map((s) => s.title),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* 2. Hero */}
      <section className="relative isolate overflow-hidden bg-navy-900 pb-24 pt-36 sm:pb-32 sm:pt-44">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_80%_-10%,rgba(27,78,245,0.45),transparent_60%),radial-gradient(40rem_30rem_at_0%_100%,rgba(27,78,245,0.18),transparent_60%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="container-page grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-slide-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-navy-100">
              <span className="size-1.5 rounded-full bg-brand-400" aria-hidden /> Kalkan, Kaş · {site.foundedYear}&apos;den beri
            </p>
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]">
              Dijitalde güçlü <br className="hidden sm:block" />
              bir <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">iz bırakın.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
              İşletmeniz için modern web siteleri, özel yazılım çözümleri ve dijital büyüme odaklı hizmetler geliştiriyoruz.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/projeler" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-base font-bold text-white shadow-[0_12px_32px_-10px_rgba(27,78,245,0.8)] transition hover:bg-brand-500">
                Projeleri İncele <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/iletisim#teklif" className="inline-flex h-13 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 text-base font-bold text-white transition hover:bg-white/10">
                Teklif Al
              </Link>
            </div>
          </div>

          {/* Decorative product visual (no data, no claims) */}
          <div aria-hidden className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-[2rem] bg-brand-600/20 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-1.5 px-2 pb-3">
                <span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" /><span className="size-2.5 rounded-full bg-white/20" />
                <span className="ml-3 h-5 flex-1 rounded-md bg-white/10" />
              </div>
              <div className="overflow-hidden rounded-xl bg-white">
                <div className="h-36 bg-gradient-to-br from-brand-600 via-brand-700 to-navy-900 p-6">
                  <div className="h-3 w-24 rounded bg-white/70" />
                  <div className="mt-4 h-5 w-56 rounded bg-white" />
                  <div className="mt-2 h-5 w-40 rounded bg-white/80" />
                  <div className="mt-5 h-7 w-28 rounded-lg bg-white/90" />
                </div>
                <div className="grid grid-cols-3 gap-3 p-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2 rounded-lg border border-navy-100 p-3">
                      <div className="h-14 rounded-md bg-navy-50" />
                      <div className="h-2.5 w-3/4 rounded bg-navy-200" />
                      <div className="h-2 w-1/2 rounded bg-navy-100" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-10 w-56 rounded-xl border border-white/10 bg-navy-800/90 p-4 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-brand-600"><Gauge className="size-5 text-white" /></span>
                <div className="space-y-1.5"><div className="h-2.5 w-24 rounded bg-white/70" /><div className="h-2 w-16 rounded bg-white/30" /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Experience since 2018 */}
      <section className="relative -mt-12 pb-8">
        <div className="container-page">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-navy-100 bg-navy-100 shadow-lift sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: `${years}+ yıl`, v: `${site.foundedYear}'den beri dijital projeler` },
              { k: "Kalkan, Kaş", v: "Bölgeyi tanıyan yerel ekip" },
              { k: "Uçtan uca", v: "Tasarım, yazılım, hosting ve pazarlama" },
              { k: "Tek muhatap", v: "Projenin her aşamasında doğrudan iletişim" },
            ].map((s) => (
              <div key={s.k} className="bg-white px-6 py-7">
                <p className="font-display text-2xl font-extrabold text-navy-900">{s.k}</p>
                <p className="mt-1 text-sm text-navy-500">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Services */}
      <section id="hizmetler" className="scroll-mt-24 py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Hizmetler" title="İşletmenizin dijital ihtiyaçları, tek çatı altında" text="Web sitenizden rezervasyon altyapınıza, reklamlarınızdan içerik üretiminize kadar yanınızdayız." />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => {
              const Icon = ICONS[s.icon]!;
              return (
                <article key={s.key} className="group rounded-2xl border border-navy-100 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift">
                  <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-base font-bold text-navy-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Featured projects */}
      <section id="projeler" className="scroll-mt-24 bg-surface py-24">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Öne çıkan projeler</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Hayata geçirdiğimiz çalışmalar</h2>
            </div>
            {projects.length > 0 ? (
              <Link href="/projeler" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700">Tüm projeler <ArrowRight className="size-4" /></Link>
            ) : null}
          </div>
          {projects.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-navy-200 bg-white p-10 text-center">
              <p className="font-display text-lg font-bold text-navy-900">Proje vitrinimizi güncelliyoruz.</p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-navy-500">Sektörünüze yakın örnek çalışmalarımızı görüşmemizde sizinle paylaşmaktan memnuniyet duyarız.</p>
              <Link href="/iletisim#teklif" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-bold text-white hover:bg-navy-800">Görüşme planlayalım <ArrowRight className="size-4" /></Link>
            </div>
          ) : null}
        </div>
        {projects.length > 0 ? (
          <div className="mx-auto mt-12 max-w-[1920px]">
            <FeaturedProjectsMarquee items={projects} />
          </div>
        ) : null}
      </section>

      {/* 6. Process */}
      <section id="surec" className="scroll-mt-24 py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Çalışma süreci" title="Fikirden yayına, net ve planlı bir süreç" />
          <ol className="mt-14 grid gap-5 md:grid-cols-5">
            {processSteps.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border border-navy-100 bg-white p-6">
                <span className="font-display text-sm font-extrabold text-brand-600">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-base font-bold text-navy-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. Why us */}
      <section id="neden-biz" className="scroll-mt-24 bg-navy-900 py-24">
        <div className="container-page">
          <SectionHeading light eyebrow="Neden Kalkan Digital?" title="Teknolojiyi işinizin diliyle konuşuyoruz" />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((r) => {
              const Icon = ICONS[r.icon]!;
              return (
                <div key={r.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <Icon className="size-6 text-brand-400" aria-hidden />
                  <h3 className="mt-4 font-display text-base font-bold text-white">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-200">{r.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Sectors */}
      <section className="py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Sektörler" title="Çalıştığımız sektörler" text="Özellikle turizm ve hizmet sektöründeki işletmelerin dijital ihtiyaçlarına odaklanıyoruz." />
          <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {sectors.map((s) => {
              const Icon = ICONS[s.icon]!;
              return (
                <li key={s.title} className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-4 py-4">
                  <Icon className="size-5 shrink-0 text-brand-600" aria-hidden />
                  <span className="text-sm font-semibold text-navy-800">{s.title}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 9. CTA */}
      <section className="pb-24">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-6 py-14 sm:px-14">
            <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Projenizi konuşalım.</h2>
                <p className="mt-3 max-w-xl text-brand-50">İhtiyacınızı birkaç cümleyle anlatın; size uygun çözümü ve net bir teklifi hazırlayalım.</p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white">
                  {["Ücretsiz ön görüşme", "Net kapsam ve takvim", "Şeffaf fiyatlandırma"].map((t) => (
                    <li key={t} className="flex items-center gap-2"><CheckCircle2 className="size-4" aria-hidden /> {t}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link href="/iletisim#teklif" className="inline-flex h-13 items-center justify-center rounded-xl bg-white px-7 text-base font-bold text-brand-700 hover:bg-brand-50">Teklif Al</Link>
                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-white/30 px-7 text-base font-bold text-white hover:bg-white/10">
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
