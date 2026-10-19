/**
 * Static authorisation guard: every exported server action / data-access function that touches
 * private data must call requireAdmin() itself (middleware/proxy is NOT relied upon).
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");

/** Public by design – reviewed explicitly. */
const PUBLIC_ALLOWLIST: Record<string, string> = {
  "server/actions/auth.ts#loginAction": "login form",
  "server/actions/auth.ts#logoutAction": "destroys own session only",
  "server/actions/auth.ts#setupAction": "guarded by ADMIN_SETUP_TOKEN + zero-admin check",
  "server/actions/public.ts#submitContactAction": "public contact form (insert-only, rate limited)",
  "server/services/portfolio.ts#listPublishedPortfolio": "published portfolio items only",
  "server/services/portfolio.ts#getPublishedBySlug": "published portfolio items only",
};

function exportedFunctions(file: string) {
  const src = readFileSync(file, "utf8");
  const re = /export async function (\w+)\s*\(/g;
  const out: { name: string; body: string }[] = [];
  const matches = [...src.matchAll(re)];
  matches.forEach((m, i) => {
    const start = m.index!;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : src.length;
    out.push({ name: m[1]!, body: src.slice(start, end) });
  });
  return out;
}

function walk(dir: string, filter: (f: string) => boolean): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p, filter) : filter(p) ? [p] : [];
  });
}

describe("authorisation coverage", () => {
  const files = [...walk(path.join(root, "server/actions"), (f) => f.endsWith(".ts")), ...walk(path.join(root, "server/services"), (f) => f.endsWith(".ts"))];

  it("finds server actions and services", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  for (const file of files) {
    const rel = path.relative(root, file).split(path.sep).join("/");
    for (const fn of exportedFunctions(file)) {
      const key = `${rel}#${fn.name}`;
      it(`${key} enforces admin authorisation`, () => {
        if (PUBLIC_ALLOWLIST[key]) return;
        // The guard must be the first awaited call in the function body.
        const firstAwait = fn.body.match(/await\s+([\w.]+)\(/);
        expect(firstAwait?.[1], `${key} must start with await requireAdmin()`).toBe("requireAdmin");
      });
    }
  }

  it("every admin panel page calls requireAdmin()", () => {
    const pages = walk(path.join(root, "app/admin/(panel)"), (f) => f.endsWith("page.tsx"));
    expect(pages.length).toBeGreaterThan(15);
    for (const p of pages) {
      expect(readFileSync(p, "utf8"), p).toMatch(/await requireAdmin\(\)/);
    }
  });

  it("'use server' modules only export async functions", () => {
    for (const file of walk(path.join(root, "server/actions"), (f) => f.endsWith(".ts"))) {
      const src = readFileSync(file, "utf8");
      expect(src.startsWith('"use server";'), file).toBe(true);
      const bad = src.match(/^export (const|let|class|function(?! )|default)/m);
      expect(bad, file).toBeNull();
    }
  });

  it("client bundles never import server-only modules with secrets", () => {
    const clientFiles = walk(root, (f) => /\.(tsx|ts)$/.test(f)).filter((f) => readFileSync(f, "utf8").startsWith('"use client"'));
    for (const f of clientFiles) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/^import (?!type )[^;]*from "@\/server\/(env|db|auth\/session|auth\/password|settings|services\/)/m);
    }
  });
});
