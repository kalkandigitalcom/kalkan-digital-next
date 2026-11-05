import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findServicePage, villaSubPages } from "@/lib/service-pages";
import { ServicePageView } from "@/components/public/service/service-page";
import { serviceMetadata } from "@/components/public/service/metadata";

export const dynamic = "force-dynamic";

function pageFor(slug: string) {
  const page = findServicePage(`/villa-kiralama-yazilimi/${slug}`);
  return page && villaSubPages.includes(page) ? page : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = pageFor((await params).slug);
  return page ? serviceMetadata(page) : {};
}

export default async function VillaSubPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = pageFor((await params).slug);
  if (!page) notFound();
  return <ServicePageView page={page} />;
}
