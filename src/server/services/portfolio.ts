import "server-only";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { portfolioItems } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";

export async function listPortfolioAdmin() {
  await requireAdmin();
  return db.select().from(portfolioItems).orderBy(asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt));
}

export async function getPortfolioItem(id: string) {
  await requireAdmin();
  const [row] = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id)).limit(1);
  return row ?? null;
}

/** PUBLIC: only published items, only public fields. */
export async function listPublishedPortfolio(limit = 12) {
  return db
    .select({
      id: portfolioItems.id,
      title: portfolioItems.title,
      slug: portfolioItems.slug,
      clientName: portfolioItems.clientName,
      category: portfolioItems.category,
      summary: portfolioItems.summary,
      imagePath: portfolioItems.imagePath,
      logoPath: portfolioItems.logoPath,
      liveUrl: portfolioItems.liveUrl,
      year: portfolioItems.year,
      tags: portfolioItems.tags,
      isFeatured: portfolioItems.isFeatured,
    })
    .from(portfolioItems)
    .where(eq(portfolioItems.isPublished, true))
    .orderBy(desc(portfolioItems.isFeatured), asc(portfolioItems.sortOrder), desc(portfolioItems.createdAt))
    .limit(limit);
}

export async function getPublishedBySlug(slug: string) {
  const [row] = await db
    .select({
      id: portfolioItems.id,
      title: portfolioItems.title,
      slug: portfolioItems.slug,
      clientName: portfolioItems.clientName,
      category: portfolioItems.category,
      summary: portfolioItems.summary,
      description: portfolioItems.description,
      imagePath: portfolioItems.imagePath,
      liveUrl: portfolioItems.liveUrl,
      year: portfolioItems.year,
      tags: portfolioItems.tags,
      updatedAt: portfolioItems.updatedAt,
    })
    .from(portfolioItems)
    .where(sql`${portfolioItems.slug} = ${slug} and ${portfolioItems.isPublished} = true`)
    .limit(1);
  return row ?? null;
}
