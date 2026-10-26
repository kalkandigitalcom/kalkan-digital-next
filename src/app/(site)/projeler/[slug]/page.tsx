import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SplitWords } from "@/components/public/split-words";
import { getPublishedBySlug } from "@/server/services/portfolio";
import { serviceTypes } from "@/lib/labels";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) return null;
  return getPublishedBySlug(slug).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) return { title: "Proje bulunamadı" };
  return {
    title: p.title,
    description: p.summary ?? `${p.title} – ${serviceTypes.label(p.category)}`,
    alternates: { canonical: `/projeler/${p.slug}` },
    openGraph: p.imagePath ? { images: [{ url: `/media/${p.imagePath}` }] } : undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await load(slug);
  if (!p) notFound();
  return (
    <article>
      <header className="bg-navy-900 pb-16 pt-36">
        <div className="container-page intro max-w-4xl">
          <Link href="/projeler" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-navy-200 hover:text-white"><ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" /> Tüm projeler</Link>
          <p className="mt-6 text-sm font-semibold text-brand-300">{serviceTypes.label(p.category)}{p.year ? ` · ${p.year}` : ""}</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl"><SplitWords text={p.title} /></h1>
          {p.clientName ? <p className="mt-3 text-navy-200">{p.clientName}</p> : null}
        </div>
      </header>
      <div data-reveal-group className="container-page max-w-4xl py-14">
        {p.imagePath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/${p.imagePath}`} alt={p.title} className="mb-10 w-full rounded-2xl border border-navy-100 object-cover shadow-lift" />
        ) : null}
        {p.summary ? <p className="text-lg leading-relaxed text-navy-700">{p.summary}</p> : null}
        {p.description ? <div className="mt-6 whitespace-pre-line leading-relaxed text-navy-600">{p.description}</div> : null}
        {p.tags.length ? (
          <ul className="mt-8 flex flex-wrap gap-2">
            {p.tags.map((t) => <li key={t} className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-600">{t}</li>)}
          </ul>
        ) : null}
        <div className="mt-10 flex flex-wrap gap-3">
          {p.liveUrl ? (
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="motion-press inline-flex h-12 items-center gap-2 rounded-xl bg-navy-900 px-6 text-sm font-bold text-white hover:bg-navy-800">Siteyi ziyaret et <ExternalLink className="size-4" /></a>
          ) : null}
          <Link href="/iletisim#teklif" className="motion-press inline-flex h-12 items-center rounded-xl bg-brand-600 px-6 text-sm font-bold text-white hover:bg-brand-700">Benzer bir proje için teklif alın</Link>
        </div>
      </div>
    </article>
  );
}
