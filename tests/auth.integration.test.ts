import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { closeTestDb, hasTestDb, resetData, setupTestDb } from "./helpers";
import * as s from "@/server/db/schema";
import { hashPassword, passwordPolicy, verifyPassword } from "@/server/auth/password";
import { generateSessionToken, hashSessionToken } from "@/server/auth/tokens";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Headers() }));

describe("password hashing", () => {
  it("hashes with scrypt and verifies", async () => {
    const h = await hashPassword("Dogru-Parola-123");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Dogru-Parola-123", h)).toBe(true);
    expect(await verifyPassword("yanlis", h)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });
  it("uses unique salts", async () => {
    expect(await hashPassword("Ayni-Parola-123")).not.toBe(await hashPassword("Ayni-Parola-123"));
  });
  it("enforces the password policy", () => {
    expect(passwordPolicy.check("kisa")).not.toBeNull();
    expect(passwordPolicy.check("hepsikucukharf123")).not.toBeNull();
    expect(passwordPolicy.check("Yeterince-Guclu1")).toBeNull();
  });
});

describe.skipIf(!hasTestDb)("sessions (PostgreSQL)", () => {
  type DB = Awaited<ReturnType<typeof setupTestDb>>;
  let db: DB;
  let userId: string;
  let validateSessionToken: typeof import("@/server/auth/session").validateSessionToken;

  beforeAll(async () => {
    db = await setupTestDb();
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    ({ validateSessionToken } = await import("@/server/auth/session"));
  });
  afterAll(async () => {
    await closeTestDb();
  });
  beforeEach(async () => {
    await resetData(db);
    const [u] = await db.insert(s.adminUsers).values({ email: "a@b.co", name: "A", passwordHash: await hashPassword("Yeterince-Guclu1") }).returning();
    userId = u!.id;
  });

  async function makeSession(expiresInMs: number) {
    const token = generateSessionToken();
    await db.insert(s.sessions).values({ id: hashSessionToken(token), userId, expiresAt: new Date(Date.now() + expiresInMs) });
    return token;
  }

  it("accepts a valid token and stores only its hash", async () => {
    const token = await makeSession(60_000);
    const principal = await validateSessionToken(token);
    expect(principal?.id).toBe(userId);
    const rows = await db.select().from(s.sessions);
    expect(rows[0]!.id).not.toBe(token);
  });

  it("rejects unknown, tampered and expired tokens", async () => {
    const token = await makeSession(60_000);
    expect(await validateSessionToken(token + "x")).toBeNull();
    expect(await validateSessionToken("")).toBeNull();
    const expired = await makeSession(-1000);
    expect(await validateSessionToken(expired)).toBeNull();
  });

  it("rejects sessions of deactivated admins", async () => {
    const token = await makeSession(60_000);
    await db.update(s.adminUsers).set({ isActive: false }).where(eq(s.adminUsers.id, userId));
    expect(await validateSessionToken(token)).toBeNull();
  });
});
