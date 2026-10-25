import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";
import * as schema from "@/server/db/schema";
import { assertSafeTestDatabaseUrl } from "./test-db-guard";

export const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

let client: ReturnType<typeof postgres> | null = null;

export async function setupTestDb() {
  // Re-checked here (also done in setup-env.ts) right before connecting and truncating.
  const url = assertSafeTestDatabaseUrl(process.env.TEST_DATABASE_URL);
  client = postgres(url, { max: 2, onnotice: () => {} });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, "../drizzle") });
  return db;
}

export async function resetData(db: ReturnType<typeof drizzle<typeof schema>>) {
  await db.execute(sql`truncate table recurring_occurrences, recurring_services, financial_transactions, quote_items, quotes, tasks, customer_notes, portfolio_items, projects, customers, sessions, rate_limit_events, activity_logs, admin_users restart identity cascade`);
}

export async function closeTestDb() {
  await client?.end({ timeout: 5 });
}
