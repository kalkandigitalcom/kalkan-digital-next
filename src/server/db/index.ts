import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/server/env";

type DB = ReturnType<typeof createDb>;

function createDb() {
  const client = postgres(env().DATABASE_URL, {
    max: env().DATABASE_POOL_MAX,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: true,
    onnotice: () => {},
  });
  return drizzle(client, { schema, casing: undefined });
}

const globalForDb = globalThis as unknown as { __kdDb?: DB };

/** Lazily created singleton (survives hot reloads in development). */
export function getDb(): DB {
  if (!globalForDb.__kdDb) globalForDb.__kdDb = createDb();
  return globalForDb.__kdDb;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export type Database = DB;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export { schema };
