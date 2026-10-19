import "server-only";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { rateLimitEvents } from "@/server/db/schema";
import { env } from "@/server/env";
import { hmacKey } from "@/server/auth/tokens";

export interface Limit {
  bucket: string;
  key: string;
  max: number;
  windowMs: number;
}

function hashed(key: string) {
  return hmacKey(env().SESSION_SECRET, key.toLowerCase());
}

export async function isRateLimited(limit: Limit): Promise<boolean> {
  const since = new Date(Date.now() - limit.windowMs);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, limit.bucket), eq(rateLimitEvents.key, hashed(limit.key)), gt(rateLimitEvents.createdAt, since)));
  return (row?.n ?? 0) >= limit.max;
}

export async function recordRateLimitEvent(bucket: string, key: string) {
  await db.insert(rateLimitEvents).values({ bucket, key: hashed(key) });
  if (Math.random() < 0.05) {
    await db.delete(rateLimitEvents).where(lt(rateLimitEvents.createdAt, new Date(Date.now() - 2 * 86_400_000)));
  }
}

export async function clearRateLimit(bucket: string, key: string) {
  await db.delete(rateLimitEvents).where(and(eq(rateLimitEvents.bucket, bucket), eq(rateLimitEvents.key, hashed(key))));
}
