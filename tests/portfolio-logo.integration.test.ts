/**
 * Reference logos: an optional brand logo per portfolio item. Uploading, keeping and removing a
 * logo must never touch the existing cover image, slug or other stored values, and the public
 * list must expose the logo path.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { eq } from "drizzle-orm";
import { closeTestDb, hasTestDb, resetData, setupTestDb } from "./helpers";
import * as s from "@/server/db/schema";
import { idleState } from "@/lib/action-state";

const auth = vi.hoisted(() => ({ adminId: "" }));
vi.mock("@/server/auth/session", () => ({
  requireAdmin: vi.fn(async () => ({ id: auth.adminId, email: "t@t.co", name: "T", role: "owner", sessionId: "x" })),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

type DB = Awaited<ReturnType<typeof setupTestDb>>;
const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4c50000000049454e44ae426082", "hex");
const png = (name = "logo.png") => new File([PNG], name, { type: "image/png" });

function form(o: Record<string, string | File>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
}
const base = { title: "Villa Sitesi", clientName: "Alfa Villa", category: "web_design", sortOrder: "0", isPublished: "on" };

describe.skipIf(!hasTestDb)("portfolio reference logos (PostgreSQL)", () => {
  let db: DB;
  let actions: typeof import("@/server/actions/portfolio");
  let service: typeof import("@/server/services/portfolio");
  let uploadDir: string;

  beforeAll(async () => {
    uploadDir = await mkdtemp(path.join(os.tmpdir(), "kd-uploads-"));
    process.env.UPLOAD_DIR = uploadDir;
    db = await setupTestDb();
    actions = await import("@/server/actions/portfolio");
    service = await import("@/server/services/portfolio");
  });
  afterAll(async () => {
    await closeTestDb();
    await rm(uploadDir, { recursive: true, force: true });
  });
  beforeEach(async () => {
    await resetData(db);
    const [a] = await db.insert(s.adminUsers).values({ email: "t@t.co", name: "T", passwordHash: "x" }).returning();
    auth.adminId = a!.id;
  });

  it("stores an uploaded logo separately from the cover image and exposes it publicly", async () => {
    await expect(actions.createPortfolioAction(idleState, form({ ...base, logo: png(), image: png("cover.png") }))).rejects.toThrow(); // redirect on success
    const [row] = await db.select().from(s.portfolioItems);
    expect(row!.logoPath).toMatch(/^logos\/[0-9a-f-]{36}\.png$/);
    expect(row!.imagePath).toMatch(/^portfolio\/[0-9a-f-]{36}\.png$/);
    expect(existsSync(path.join(uploadDir, row!.logoPath!))).toBe(true);

    const [pub] = await service.listPublishedPortfolio();
    expect(pub).toMatchObject({ slug: row!.slug, clientName: "Alfa Villa", logoPath: row!.logoPath });
  });

  it("keeps existing values when edited without a new logo, replaces and removes logos cleanly", async () => {
    const [p] = await db
      .insert(s.portfolioItems)
      .values({ title: "Villa Sitesi", slug: "villa-sitesi", clientName: "Alfa Villa", imagePath: "portfolio/11111111-1111-1111-1111-111111111111.png", liveUrl: "https://alfa.example", isPublished: true })
      .returning();
    const edit = (extra: Record<string, string | File>) =>
      expect(actions.updatePortfolioAction(idleState, form({ ...base, id: p!.id, slug: "villa-sitesi", liveUrl: "https://alfa.example", ...extra }))).rejects.toThrow();
    const current = async () => (await db.select().from(s.portfolioItems).where(eq(s.portfolioItems.id, p!.id)))[0]!;

    await edit({}); // no logo: nothing changes
    expect(await current()).toMatchObject({ logoPath: null, imagePath: p!.imagePath, slug: "villa-sitesi", liveUrl: "https://alfa.example" });

    await edit({ logo: png() });
    const first = (await current()).logoPath!;
    expect(first).toMatch(/^logos\//);

    await edit({ logo: png() }); // replacing deletes the old file
    const second = (await current()).logoPath!;
    expect(second).not.toBe(first);
    expect(existsSync(path.join(uploadDir, first))).toBe(false);
    expect(existsSync(path.join(uploadDir, second))).toBe(true);

    await edit({ removeLogo: "on" });
    expect(await current()).toMatchObject({ logoPath: null, imagePath: p!.imagePath, slug: "villa-sitesi" });
    expect(existsSync(path.join(uploadDir, second))).toBe(false);
  });

  it("rejects a logo that is not a real image", async () => {
    const res = await actions.createPortfolioAction(idleState, form({ ...base, logo: new File(["<svg/>"], "logo.png", { type: "image/png" }) }));
    expect(res).toMatchObject({ status: "error", fieldErrors: { logo: "Sadece PNG, JPEG veya WebP görseller yüklenebilir." } });
    expect(await db.select().from(s.portfolioItems)).toHaveLength(0);
  });
});
