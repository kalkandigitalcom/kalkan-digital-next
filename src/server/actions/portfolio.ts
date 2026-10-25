"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { portfolioItems, serviceType } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth/session";
import { logActivity } from "@/server/activity";
import { removeUpload, saveImage } from "@/server/uploads";
import { dbErrorMessage, errorState, parseForm, successState, v } from "@/server/validation";
import { slugify } from "@/lib/slug";
import type { ActionState } from "@/lib/action-state";

const schema = z.object({
  title: v.requiredText(200, "Başlık zorunludur."),
  slug: v.optionalText(200),
  clientName: v.optionalText(200),
  category: v.enumOf(serviceType.enumValues),
  summary: v.optionalText(400),
  description: v.optionalText(10000),
  liveUrl: v.optionalUrl(),
  year: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : null))
    .refine((n) => n === null || (Number.isInteger(n) && n >= 2000 && n <= 2100), "Geçerli bir yıl girin."),
  tags: z
    .string()
    .optional()
    .transform((s) => (s ?? "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10)),
  isPublished: v.checkbox(),
  isFeatured: v.checkbox(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  removeImage: v.checkbox(),
  removeLogo: v.checkbox(),
});

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "proje";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const [hit] = await db
      .select({ id: portfolioItems.id })
      .from(portfolioItems)
      .where(excludeId ? and(eq(portfolioItems.slug, candidate), ne(portfolioItems.id, excludeId)) : eq(portfolioItems.slug, candidate))
      .limit(1);
    if (!hit) return candidate;
  }
  return `${root}-${Date.now()}`;
}

async function handleImage(formData: FormData) {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) return saveImage(file, "portfolio");
  return null;
}

/** Brand logo for the public references grid (PNG / JPEG / WebP, validated by content). */
async function handleLogo(formData: FormData) {
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) return saveImage(file, "logos");
  return null;
}

function revalidatePublic() {
  revalidatePath("/", "layout");
}

export async function createPortfolioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const img = await handleImage(formData);
  if (img && !img.ok) return errorState(img.error, { image: img.error });
  const logo = await handleLogo(formData);
  if (logo && !logo.ok) {
    if (img?.ok) await removeUpload(img.path);
    return errorState(logo.error, { logo: logo.error });
  }
  const { removeImage: _r, removeLogo: _l, slug, ...data } = parsed.data;
  void _r;
  void _l;
  let id: string;
  try {
    const [row] = await db
      .insert(portfolioItems)
      .values({ ...data, slug: await uniqueSlug(slug ?? data.title), imagePath: img?.ok ? img.path : null, logoPath: logo?.ok ? logo.path : null })
      .returning({ id: portfolioItems.id });
    id = row!.id;
    await logActivity({ userId: admin.id, action: "portfolio.create", entityType: "portfolio", entityId: id, summary: data.title });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePublic();
  redirect(`/admin/portfolio?flash=created`);
}

export async function updatePortfolioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const [before] = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id.data)).limit(1);
  if (!before) return errorState("Kayıt bulunamadı.");
  const img = await handleImage(formData);
  if (img && !img.ok) return errorState(img.error, { image: img.error });
  const logo = await handleLogo(formData);
  if (logo && !logo.ok) {
    if (img?.ok) await removeUpload(img.path);
    return errorState(logo.error, { logo: logo.error });
  }
  const { removeImage, removeLogo, slug, ...data } = parsed.data;
  const imagePath = img?.ok ? img.path : removeImage ? null : before.imagePath;
  const logoPath = logo?.ok ? logo.path : removeLogo ? null : before.logoPath;
  try {
    await db
      .update(portfolioItems)
      .set({ ...data, slug: slug && slug === before.slug ? before.slug : await uniqueSlug(slug ?? data.title, id.data), imagePath, logoPath })
      .where(eq(portfolioItems.id, id.data));
    if (imagePath !== before.imagePath) await removeUpload(before.imagePath);
    if (logoPath !== before.logoPath) await removeUpload(before.logoPath);
    await logActivity({ userId: admin.id, action: "portfolio.update", entityType: "portfolio", entityId: id.data, summary: data.title });
  } catch (e) {
    return errorState(dbErrorMessage(e));
  }
  revalidatePublic();
  redirect(`/admin/portfolio?flash=updated`);
}

export async function deletePortfolioAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return errorState("Geçersiz kayıt.");
  const res = await db.delete(portfolioItems).where(eq(portfolioItems.id, id.data)).returning();
  if (!res.length) return errorState("Kayıt bulunamadı.");
  await removeUpload(res[0]!.imagePath);
  await removeUpload(res[0]!.logoPath);
  await logActivity({ userId: admin.id, action: "portfolio.delete", entityType: "portfolio", entityId: id.data, summary: res[0]!.title });
  revalidatePublic();
  return successState("Portfolyo kaydı silindi.");
}
