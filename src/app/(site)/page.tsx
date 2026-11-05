import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarSync,
  Code2,
  Coins,
  FileCheck2,
  Home,
  Languages,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  FileText,
  PenTool,
  Rocket,
  MonitorSmartphone,
  Plus,
  ServerCog,
  ShieldCheck,
  Share2,
  ShoppingCart,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { listPublishedPortfolio } from "@/server/services/portfolio";
import { getPublicContact, waHref } from "@/server/public";
import { services } from "@/lib/content";
import { brandMessage, heroTrust, homeFaq, homeProcess, homeReasons, serviceRegions, villaFeatures, webServiceChips, webServices } from "@/lib/home-content";
import { serviceTypes } from "@/lib/labels";
import { site } from "@/lib/site";
import { SplitWords, Word } from "@/components/public/split-words";
import { HeroShowcase, type ShowcaseShot } from "@/components/public/home/hero-showcase";
import { SyncDiagram } from "@/components/public/home/sync-diagram";
import { PortfolioMarquee } from "@/components/public/home/portfolio-marquee";
import { TrustCards } from "@/components/public/home/trust-cards";
import { ExperienceBand } from "@/components/public/home/experience-band";
import { yearOf, todayIso } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Kalkan Digital | Web Tasarım, Yazılım ve Dijital Büyüme · Kalkan, Kaş" },
  description:
    "Kalkan Digital; işletmeler için modern web siteleri, villa kiralama ve turizm yazılımları, özel yazılım, hosting, dijital reklam ve sosyal medya hizmetleri sunar. 2018'den beri Kalkan, Kaş, Antalya.",
  alternates: { canonical: "/" },
};

const ICONS: Record<string, LucideIcon> = {
  MessagesSquare, FileText, PenTool, Rocket, MonitorSmartphone, Code2, Home, ShoppingCart, ServerCog, Mail, Megaphone, Share2, CalendarSync, Languages, Coins, CalendarDays, Tags, LayoutGrid, MapPin, ShieldCheck, FileCheck2,
};

const VILLA = "villa_rental_software";

/** Text placeholder for a project without a logo (no invented artwork). */
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toLocaleUpperCase("tr")).join("");
}

function SectionHeading({ eyebrow, title, text, light, align = "left" }: { eyebrow: string; title: string; text?: string; light?: boolean; align?: "left" | "center" }) {
  return (
    <div data-reveal="story" className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`rv-eyebrow text-xs font-bold uppercase tracking-[0.18em] ${light ? "text-aqua-300" : "text-brand-600"}`}>{eyebrow}</p>
      <h2 className={`mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-[2.75rem] ${light ? "text-white" : "text-navy-900"}`}><SplitWords text={title} /></h2>
      {text ? <p className={`rv-text mt-5 text-base leading-relaxed sm:text-lg ${light ? "text-navy-200" : "text-navy-500"}`}>{text}</p> : null}
    </div>
  );
}

export default async function HomePage() {
  const [projects, contact] = await Promise.all([listPublishedPortfolio(12).catch(() => []), getPublicContact()]);
  const years = yearOf(todayIso()) - site.foundedYear;
  const wa = waHref(contact.whatsapp, "Merhaba, web sitesi / yazılım için bilgi almak istiyorum.");
  const waVilla = waHref(contact.whatsapp, "Merhaba, villa kiralama sitesi için bilgi almak istiyorum.");

  const villaProjects = projects.filter((p) => p.category === VILLA);
  const webProjects = projects.filter((p) => p.category !== VILLA);
  const toShot = (p: (typeof projects)[number] | undefined): ShowcaseShot | null =>
    p?.imagePath ? { title: p.clientName ?? p.title, imagePath: p.imagePath, label: serviceTypes.label(p.category) } : null;
  const heroFront = toShot(webProjects.find((p) => p.imagePath)) ?? toShot(villaProjects.find((p) => p.imagePath));
  const heroBackCandidate = toShot(villaProjects.find((p) => p.imagePath));
  const heroBack = heroBackCandidate && heroBackCandidate.imagePath !== heroFront?.imagePath ? heroBackCandidate : null;

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
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const ld = (o: object) => JSON.stringify(o).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(faqLd) }} />

      {/* 1. Hero: general brand (report 3.4 / 5.1) */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-surface to-white pb-16 pt-32 sm:pb-20 sm:pt-40">
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(48rem_28rem_at_85%_0%,rgba(34,203,214,0.14),transparent_65%),radial-gradient(40rem_26rem_at_10%_10%,rgba(27,78,245,0.08),transparent_60%)]" />
        <div className="container-page grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="intro hero-recede">
            <p className="inline-flex items-center gap-2 rounded-full border border-navy-100 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-600 shadow-card">
              <span className="size-1.5 rounded-full bg-aqua-500" aria-hidden /> Kaş · Kalkan · Fethiye · Antalya · Muğla
            </p>
            <h1 className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.04] tracking-tight text-navy-900 sm:text-6xl lg:text-[3.6rem] xl:text-[4.25rem]">
              <Word index={0}>Web</Word><Word index={1}>tasarım,</Word>
              <Word index={2}>özel</Word><Word index={3}>yazılım</Word><Word index={4}>ve</Word>
              <Word index={5} className="text-brand-600">dijital</Word><Word index={6} className="text-brand-600">çözümler</Word>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-500">
              <strong className="font-semibold text-navy-800">Dijitalde güçlü bir iz bırakın.</strong> Kaş ve Kalkan&apos;daki ofisimizden Fethiye, Antalya ve Muğla&apos;daki işletmelere hızlı, mobil uyumlu web siteleri ve iş süreçlerine uygun yazılımlar geliştiriyoruz.
            </p>
            <div className="intro-cta mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/iletisim#teklif" className="motion-press group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-navy-900 px-7 text-base font-bold text-white shadow-[0_14px_30px_-12px_rgba(11,31,58,0.7)] hover:bg-navy-800">
                Ücretsiz teklif alın <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="motion-press inline-flex h-13 items-center justify-center gap-2 rounded-xl border border-navy-200 bg-white px-7 text-base font-bold text-navy-900 hover:border-navy-300 hover:bg-navy-50">
                  <MessageCircle className="size-5 text-aqua-600" aria-hidden /> WhatsApp&apos;tan yazın
                </a>
              ) : (
                <Link href="/projeler" className="motion-press inline-flex h-13 items-center justify-center rounded-xl border border-navy-200 bg-white px-7 text-base font-bold text-navy-900 hover:bg-navy-50">Projeleri inceleyin</Link>
              )}
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-navy-600">
              {heroTrust.map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-aqua-500" aria-hidden />{t}</li>
              ))}
            </ul>
          </div>
          <HeroShowcase front={heroFront} back={heroBack} />
        </div>
      </section>

      {/* 1b. Villa sector experience band (separate section, right below the hero) */}
      <ExperienceBand />

      {/* 2. Two equal category doors */}
      <section id="hizmetler" className="scroll-mt-24 py-20 sm:py-28">
        <div className="container-page">
          <SectionHeading eyebrow="Ne yapıyoruz?" title="İki uzmanlık, tek ekip" />
          <div data-reveal-group="scale" className="mt-12 grid gap-5 lg:grid-cols-2">
            <Link href="/hizmetler" className="group relative flex flex-col overflow-hidden rounded-3xl bg-navy-900 p-8 text-white outline-none transition-[translate,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(11,31,58,0.8)] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:p-10">
              <span className="rv-icon grid size-12 place-items-center rounded-2xl bg-white/10 text-white"><MonitorSmartphone className="size-6" aria-hidden /></span>
              <h3 className="mt-8 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Web Tasarım ve Dijital Çözümler</h3>
              <p className="mt-4 max-w-lg leading-relaxed text-navy-200">Kurumsal web siteleri, özel web yazılımları ve e-ticaret; sunucu altyapısı, kurumsal e-posta ve dijital reklam desteğiyle birlikte. İşletmenize gereken dijital altyapıyı baştan sona kuruyoruz.</p>
              <ul className="mt-7 flex flex-wrap gap-2">
                {webServiceChips.map((c) => <li key={c} className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-navy-100">{c}</li>)}
              </ul>
              <span className="mt-auto inline-flex items-center gap-2 pt-10 text-sm font-bold text-white">Hizmetleri inceleyin <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></span>
            </Link>
            <Link href="/villa-kiralama-yazilimi" className="group relative flex flex-col overflow-hidden rounded-3xl border border-aqua-200 bg-aqua-50 p-8 text-navy-900 outline-none transition-[translate,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(10,143,156,0.55)] focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:p-10">
              <span className="rv-icon grid size-12 place-items-center rounded-2xl bg-aqua-600 text-white"><Home className="size-6" aria-hidden /></span>
              <h3 className="mt-8 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Villa Kiralama Yazılımları</h3>
              <p className="mt-4 max-w-lg leading-relaxed text-navy-600">Kendi markanıza ait villa kiralama sitesi: Airbnb ve Booking.com ile çift yönlü takvim eşitleme, çoklu dil ve para birimi, dönemsel fiyatlar ve rezervasyon yönetimi tek sistemde. Diğer rezervasyon platformlarıyla takvim entegrasyonu ihtiyacınıza göre projenize özel geliştirilir.</p>
              <ul className="mt-7 flex flex-wrap gap-2">
                {["Villa kiralama sitesi", "Rezervasyon sistemi", "Airbnb ve Booking çift yönlü eşitleme", "Çoklu dil ve para birimi", "Dönemsel fiyatlandırma"].map((t) => (
                  <li key={t} className="rounded-full border border-aqua-200 bg-white px-3 py-1 text-xs font-semibold text-navy-700">{t}</li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-2 pt-10 text-sm font-bold text-aqua-700">Villa yazılımını inceleyin <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></span>
            </Link>
          </div>

          {/* 3. Trust cards */}
          <TrustCards years={years} foundedYear={site.foundedYear} />
        </div>
      </section>

      {/* 4. Category A: services (8 cards) */}
      <section id="web-cozumler" className="scroll-mt-24 bg-surface py-20 sm:py-28">
        <div className="container-page">
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <SectionHeading eyebrow="Web Tasarım ve Dijital Çözümler" title="İşletmeniz için doğru dijital çözüm" />
            <div data-reveal className="border-l-2 border-aqua-500 pl-5">
              <p className="font-display text-lg font-bold leading-snug text-navy-900 sm:text-xl">{brandMessage.lead}</p>
              <p className="mt-2 leading-relaxed text-navy-500">{brandMessage.text}</p>
            </div>
          </div>
          <ol data-reveal-group className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {webServices.map((s, i) => {
              const Icon = ICONS[s.icon]!;
              const villa = "villa" in s;
              return (
                <li key={s.title} className="group flex flex-col rounded-2xl border border-navy-100 bg-white p-6 transition-[border-color,box-shadow] duration-500 hover:border-navy-200 hover:shadow-lift">
                  <div className="flex items-center justify-between">
                    <span className={`rv-icon grid size-11 place-items-center rounded-xl ${villa ? "bg-aqua-50 text-aqua-700" : "bg-navy-50 text-navy-900"}`}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="rv-num font-display text-sm font-extrabold text-navy-300">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-5 font-display text-base font-bold leading-snug text-navy-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.text}</p>
                  {"href" in s ? (
                    <Link href={s.href} className={`mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold ${villa ? "text-aqua-700 hover:text-aqua-600" : "text-brand-600 hover:text-brand-700"}`}>
                      Ayrıntılar<span className="sr-only">: {s.title}</span> <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div data-reveal className="mt-10">
            <Link href="/iletisim#teklif" className="motion-press group inline-flex h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white hover:bg-brand-700">
              Ücretsiz teklif alın <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Category B: villa expertise band */}
      <section id="villa-yazilimi" className="scroll-mt-24 bg-navy-950 py-20 text-white sm:py-28">
        <div className="container-page">
          <div className="grid items-end gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <SectionHeading light eyebrow="Villa Kiralama Yazılımları" title="Villa kiralama yazılımlarında uzmanız" />
            <p data-reveal className="text-base leading-relaxed text-navy-200 sm:text-lg">
              Kalkan ve Kaş&apos;ta villa kiralamanın nasıl işlediğini yakından biliyoruz: kısa ve yoğun bir sezon, dünyanın dört bir yanından misafirler, aynı villanın hem kendi sitenizde hem platformlarda satılması. Bu yüzden villa kiralama sektörüne özel dijital çözümler geliştiriyoruz.
            </p>
          </div>

          <div data-reveal className="mt-12">
            <SyncDiagram />
          </div>

          <ul data-reveal-group className="mt-5 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {villaFeatures.slice(1).map((f) => {
              const Icon = ICONS[f.icon]!;
              return (
                <li key={f.title} className="bg-navy-950 p-6 sm:p-7">
                  <Icon className="rv-icon size-6 text-aqua-300" aria-hidden />
                  <h3 className="mt-4 font-display text-base font-bold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy-300">{f.text}</p>
                </li>
              );
            })}
            <li className="bg-aqua-500/10 p-6 sm:p-7">
              <p className="font-display text-base font-bold text-white">İhtiyaca göre geliştirilebilir</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-aqua-300">Projenize özel</p>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-navy-200">
                <li>Diğer rezervasyon platformları ve yerel firmalarla takvim entegrasyonu</li>
                <li>İhtiyaçlarınıza göre online ödeme altyapısı da sisteme özel olarak entegre edilebilir.</li>
              </ul>
            </li>
          </ul>

          {villaProjects.length > 0 ? (
            <div className="mt-14">
              <div data-reveal className="flex items-end justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-aqua-300">Canlı villa projeleri</p>
                <Link href="/projeler" className="text-sm font-bold text-navy-200 hover:text-white">Tümü</Link>
              </div>
              <ul data-reveal-group className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {villaProjects.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link href={`/projeler/${p.slug}`} className="group flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-[border-color,background-color] duration-500 hover:border-aqua-300/40 hover:bg-white/[0.07]">
                      <span className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2">
                        {p.logoPath ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`/media/${p.logoPath}`} alt={`${p.clientName ?? p.title} logosu`} loading="lazy" decoding="async" className="max-h-full w-auto max-w-full object-contain" />
                        ) : (
                          <span className="font-display text-sm font-extrabold text-navy-900" aria-hidden>{initials(p.clientName ?? p.title)}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-base font-bold text-white">{p.clientName ?? p.title}</span>
                        {p.summary ? <span className="mt-0.5 line-clamp-2 block text-sm text-navy-300">{p.summary}</span> : null}
                      </span>
                      <ArrowUpRight className="ml-auto size-5 shrink-0 text-navy-400 transition-[translate,color] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-aqua-300" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div data-reveal className="mt-12 flex flex-col gap-3 sm:flex-row">
            <a href={waVilla ?? "/iletisim#teklif"} {...(waVilla ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="motion-press inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-aqua-400 px-6 text-sm font-bold text-navy-950 hover:bg-aqua-300">
              Demo isteyin <ArrowRight className="size-4" aria-hidden />
            </a>
            <Link href="/iletisim?hizmet=villa_rental_software#teklif" className="motion-press inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-6 text-sm font-bold text-white hover:bg-white/10">
              Villa siteniz için teklif alın
            </Link>
            <Link href="/villa-kiralama-yazilimi" className="group inline-flex h-12 items-center justify-center gap-2 px-2 text-sm font-bold text-aqua-300 hover:text-aqua-200">
              Villa kiralama yazılımını inceleyin <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. References: two endless logo rows */}
      <section id="projeler" className="scroll-mt-24 overflow-hidden bg-surface py-20 sm:py-28">
        <div className="container-page">
          <div className="grid items-end gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div data-reveal="story">
              <p className="rv-eyebrow text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Referanslar</p>
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-navy-900 sm:text-5xl">
                <SplitWords text="Kimlerle çalıştık?" />
              </h2>
            </div>
            <div data-reveal className="lg:pb-1">
              <p className="text-base leading-relaxed text-navy-600 sm:text-lg">Farklı sektörlerdeki markalar için geliştirdiğimiz dijital projelerden seçkiler.</p>
              {projects.length > 0 ? (
                <Link href="/projeler" className="group mt-3 inline-flex items-center gap-2 text-sm font-bold text-navy-900 hover:text-brand-600">Tüm projeler <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></Link>
              ) : null}
            </div>
          </div>
          {projects.length === 0 ? (
            <div data-reveal className="mt-12 rounded-2xl border border-dashed border-navy-200 bg-white p-10 text-center">
              <p className="font-display text-lg font-bold text-navy-900">Proje vitrinimizi güncelliyoruz.</p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-navy-500">Sektörünüze yakın örnek çalışmalarımızı görüşmemizde sizinle paylaşmaktan memnuniyet duyarız.</p>
              <Link href="/iletisim#teklif" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-bold text-white hover:bg-navy-800">Görüşme planlayalım <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          ) : null}
        </div>
        {projects.length > 0 ? (
          <div data-reveal className="mx-auto mt-12 max-w-[1920px] sm:mt-16">
            <PortfolioMarquee projects={projects} />
          </div>
        ) : null}
      </section>

      {/* 7. Process */}
      <section id="surec" className="relative isolate scroll-mt-24 overflow-hidden bg-surface py-20 sm:py-28">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_24rem_at_100%_0%,rgba(34,195,206,0.10),transparent_65%),radial-gradient(40rem_22rem_at_0%_100%,rgba(27,78,245,0.07),transparent_60%)]" />
        <div className="container-page">
          <SectionHeading eyebrow="Nasıl çalışıyoruz" title="Fikirden yayına, net ve planlı bir süreç" text="Web sitesi, yazılım veya villa kiralama sitesi; beş adım iki kategori için de aynı." />
          <ol data-reveal-group className="process-line relative mt-14 grid gap-5 md:grid-cols-5 md:gap-5">
            {homeProcess.map((s, i) => {
              const Icon = ICONS[s.icon]!;
              return (
                <li key={s.title} className="relative pl-16 md:pl-0 md:pt-16">
                  <span className="process-dot rv-num absolute left-0 top-0 grid size-11 place-items-center rounded-full font-display text-sm font-extrabold text-white">{String(i + 1).padStart(2, "0")}</span>
                  <div className="process-card group h-full rounded-2xl border border-navy-100 bg-white p-5 transition-[translate,box-shadow,border-color] duration-500">
                    <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-navy-900 to-navy-700 text-aqua-300 transition-[background-color,color] duration-500">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-display text-base font-bold text-navy-900">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{s.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* 8. Why us + 9. Regions */}
      <section id="neden-biz" className="scroll-mt-24 py-20 sm:py-28">
        <div className="container-page grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Neden Kalkan Digital" title="Teknolojiyi işinizin diliyle konuşuyoruz" />
            <ul data-reveal-group className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {homeReasons.map((r) => {
                const Icon = ICONS[r.icon]!;
                return (
                  <li key={r.title}>
                    <span className="rv-icon grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" aria-hidden /></span>
                    <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{r.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-navy-500">{r.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <div id="bolgeler" data-reveal className="scroll-mt-24 self-start rounded-3xl border border-navy-100 bg-surface p-7 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Hizmet bölgelerimiz</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy-900">Antalya, Fethiye ve Muğla&apos;da yanınızdayız</h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-500">Merkezimiz Kaş&apos;ta. Antalya&apos;nın ve Fethiye başta olmak üzere Muğla&apos;nın tamamına, ayrıca Türkiye genelinde uzaktan hizmet veriyoruz.</p>
            {serviceRegions.map((r) => (
              <div key={r.name} className="mt-6">
                <p className="flex items-center gap-2 font-display text-sm font-bold text-navy-900"><MapPin className="size-4 text-aqua-600" aria-hidden /> {r.name}</p>
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {r.places.map((p) => <li key={p} className="rounded-full border border-navy-100 bg-white px-3 py-1 text-xs font-semibold text-navy-600">{p}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section id="sss" className="scroll-mt-24 border-t border-navy-100 py-20 sm:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading eyebrow="Sık sorulan sorular" title="Aklınıza takılanlar" text="Bulamadığınız bir soru varsa bize doğrudan yazın." />
          <div data-reveal-group className="divide-y divide-navy-100 border-y border-navy-100">
            {homeFaq.map((f) => (
              <details key={f.q} className="faq group">
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

      {/* 11. Closing CTA */}
      <section className="pb-20 sm:pb-28">
        <div className="container-page">
          <div data-reveal="cta" className="relative overflow-hidden rounded-3xl bg-navy-900 px-6 py-14 sm:px-14 sm:py-16">
            <div aria-hidden className="par-view absolute -right-24 -top-24 size-96 rounded-full bg-aqua-400/20 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-[2.75rem]"><SplitWords text="Projenizi konuşalım." /></h2>
                <p className="rv-text mt-4 max-w-xl text-navy-200">Web sitesi, yazılım, villa kiralama sitesi veya hosting: ihtiyacınızı birkaç cümleyle anlatın, kapsamı ve teklifi yazılı paylaşalım.</p>
                <ul className="rv-list mt-6 flex flex-wrap gap-2 text-sm">
                  {["Web sitesi", "Özel yazılım", "Villa kiralama sitesi", "Hosting"].map((t) => (
                    <li key={t} className="rounded-full border border-white/15 px-3.5 py-1.5 font-semibold text-navy-100">{t}</li>
                  ))}
                </ul>
              </div>
              <div className="rv-actions flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Link href="/iletisim#teklif" className="motion-press inline-flex h-13 items-center justify-center rounded-xl bg-white px-7 text-base font-bold text-navy-900 hover:bg-navy-50">Ücretsiz teklif alın</Link>
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
