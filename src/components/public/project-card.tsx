import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { serviceTypes } from "@/lib/labels";

export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  clientName: string | null;
  category: Parameters<typeof serviceTypes.label>[0];
  summary: string | null;
  imagePath: string | null;
  year: number | null;
}

export function ProjectCard({ p }: { p: PublicProject }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-navy-100 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/projeler/${p.slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-navy-800 to-brand-700">
          {p.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/media/${p.imagePath}`} alt={p.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="grid size-full place-items-center font-display text-lg font-bold text-white/80">{p.title}</div>
          )}
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold text-brand-600">{serviceTypes.label(p.category)}{p.year ? ` · ${p.year}` : ""}</p>
          <h3 className="mt-2 flex items-start justify-between gap-3 font-display text-lg font-bold text-navy-900">
            {p.title}
            <ArrowUpRight className="mt-1 size-4 shrink-0 text-navy-300 transition group-hover:text-brand-600" aria-hidden />
          </h3>
          {p.clientName ? <p className="text-xs text-navy-400">{p.clientName}</p> : null}
          {p.summary ? <p className="mt-3 line-clamp-2 text-sm text-navy-500">{p.summary}</p> : null}
        </div>
      </Link>
    </article>
  );
}
