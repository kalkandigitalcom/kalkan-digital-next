import "server-only";

export const PAGE_SIZE = 20;

export type SearchParams = Record<string, string | string[] | undefined>;

/** Flattens Next.js searchParams into single string values. */
export function flatParams(sp: SearchParams): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, val] of Object.entries(sp)) out[k] = Array.isArray(val) ? val[0] : val;
  return out;
}

export function pageOf(p: Record<string, string | undefined>) {
  const n = Number(p.page);
  return Number.isInteger(n) && n > 0 && n < 100000 ? n : 1;
}

export function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function pickOptional<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Escapes LIKE wildcards in user search input. */
export function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

export function cleanQuery(q: string | undefined) {
  const s = (q ?? "").trim().slice(0, 100);
  return s.length ? s : undefined;
}
