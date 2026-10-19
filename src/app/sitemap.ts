import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { site } from "@/lib/site";
import { listPublishedPortfolio } from "@/server/services/portfolio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const projects = await listPublishedPortfolio(500).catch(() => []);
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/projeler`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${site.url}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...projects.map((p) => ({ url: `${site.url}/projeler/${p.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
