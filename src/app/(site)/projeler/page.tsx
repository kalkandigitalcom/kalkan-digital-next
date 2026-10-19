import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPublishedPortfolio } from "@/server/services/portfolio";
import { ProjectCard } from "@/components/public/project-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Projeler",
  description: "Kalkan Digital tarafından geliştirilen web sitesi, yazılım ve dijital pazarlama projeleri.",
  alternates: { canonical: "/projeler" },
};

export default async function ProjectsPage() {
  const projects = await listPublishedPortfolio(60).catch(() => []);
  return (
    <>
      <section className="bg-navy-900 pb-16 pt-36">
        <div className="container-page">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Projeler</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Çalışmalarımız</h1>
          <p className="mt-4 max-w-2xl text-navy-200">Müşterilerimiz için hayata geçirdiğimiz web siteleri, yazılımlar ve dijital projeler.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="container-page">
          {projects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-navy-200 p-12 text-center">
              <p className="font-display text-lg font-bold text-navy-900">Proje vitrinimizi güncelliyoruz.</p>
              <p className="mt-2 text-sm text-navy-500">Örnek çalışmalarımızı görmek için bizimle iletişime geçin.</p>
              <Link href="/iletisim#teklif" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white hover:bg-brand-700">İletişime geçin <ArrowRight className="size-4" /></Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
