/**
 * Applies pending SQL migrations from ./drizzle (forward-only, additive).
 * Drizzle records applied migrations in drizzle.__drizzle_migrations, so running
 * this repeatedly is safe. It never drops or truncates data by itself.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");
  const migrationsFolder = process.env.MIGRATIONS_DIR ?? path.resolve(process.cwd(), "drizzle");
  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    console.log(`[migrate] ${migrationsFolder} klasöründeki migration'lar uygulanıyor…`);
    await migrate(drizzle(client), { migrationsFolder });
    console.log("[migrate] Tamamlandı.");
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error("[migrate] HATA:", err);
  process.exit(1);
});
