/**
 * Safety guard for database tests.
 *
 * The integration tests TRUNCATE every table (see resetData in ./helpers.ts), so they may only run
 * against an explicitly configured, local, disposable PostgreSQL database:
 *   - scheme postgres:// or postgresql://
 *   - host exactly "localhost" or "127.0.0.1" (no multi-host lists, no unix sockets)
 *   - an explicit database name ending in "_test"
 *   - no query parameters (postgres-js forwards them as connection options, e.g. ?database=…)
 *
 * The URL is checked the way postgres-js (node_modules/postgres/src/index.js#parseUrl) reads it,
 * so that environment fallbacks (PGHOST, PGDATABASE) can never take effect.
 * Error messages never echo the URL, because it may contain a password.
 * This module has no imports so the Vitest setup file can load it before anything else.
 */
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);
const DB_NAME_RE = /^[A-Za-z0-9_-]+_test$/;

export class UnsafeTestDatabaseError extends Error {
  constructor(reason: string) {
    super(`TEST_DATABASE_URL güvenli değil: ${reason} Testler başlatılmadı.`);
    this.name = "UnsafeTestDatabaseError";
  }
}

/** Returns the URL unchanged when it is safe; throws UnsafeTestDatabaseError otherwise. */
export function assertSafeTestDatabaseUrl(raw: string | undefined): string {
  const url = (raw ?? "").trim();
  if (!url) throw new UnsafeTestDatabaseError("değer boş.");

  const m = /^(?:postgres|postgresql):\/\/([^/?#]*)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i.exec(url);
  if (!m) throw new UnsafeTestDatabaseError("postgres:// veya postgresql:// ile başlayan bir bağlantı adresi olmalı.");
  const [, authority = "", path = "", query, fragment] = m;
  if (query !== undefined || fragment !== undefined)
    throw new UnsafeTestDatabaseError("sorgu parametresi (?…) veya # içeremez.");

  // postgres-js treats a "," in the decoded host part as a multi-host list (it then ignores the URL
  // hostname) and a "/" as a unix socket path. Both are rejected; otherwise it uses URL#hostname.
  let decoded: string;
  try {
    decoded = decodeURIComponent(authority);
  } catch {
    throw new UnsafeTestDatabaseError("bağlantı adresi çözümlenemedi.");
  }
  const driverHost = decoded.slice(decoded.indexOf("@") + 1);
  if (driverHost.includes(",") || driverHost.includes("/"))
    throw new UnsafeTestDatabaseError("birden fazla sunucu veya soket yolu kullanılamaz.");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeTestDatabaseError("bağlantı adresi çözümlenemedi.");
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname.toLowerCase()))
    throw new UnsafeTestDatabaseError('sunucu yalnızca "localhost" veya "127.0.0.1" olabilir.');

  const dbName = path.slice(1);
  if (!DB_NAME_RE.test(dbName))
    throw new UnsafeTestDatabaseError('veritabanı adı açıkça yazılmalı ve "_test" ile bitmelidir (harf, rakam, "_" veya "-").');

  return url;
}
