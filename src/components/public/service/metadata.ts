import type { Metadata } from "next";
import type { ServicePage } from "@/lib/service-pages";

const BRAND = " | Kalkan Digital";

/** Title, description, canonical and Open Graph for a service page. Long titles skip the brand suffix. */
export function serviceMetadata(page: ServicePage): Metadata {
  const withBrand = page.seo.title.length + BRAND.length <= 65;
  const fullTitle = withBrand ? `${page.seo.title}${BRAND}` : page.seo.title;
  return {
    title: withBrand ? page.seo.title : { absolute: page.seo.title },
    description: page.seo.description,
    keywords: page.seo.keywords,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: "Kalkan Digital",
      url: page.path,
      title: fullTitle,
      description: page.seo.description,
    },
    twitter: { card: "summary", title: fullTitle, description: page.seo.description },
  };
}
