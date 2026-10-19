import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "@/server/env";

const MAX_BYTES = 5 * 1024 * 1024;

function sniff(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png" };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ env().UPLOAD_DIR);
}

/** Saves an uploaded image after validating its real content type (not the client-provided one). */
export async function saveImage(file: File, folder: "portfolio"): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "Dosya boş." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Görsel en fazla 5 MB olabilir." };
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buf);
  if (!kind) return { ok: false, error: "Sadece PNG, JPEG veya WebP görseller yüklenebilir." };
  const dir = path.join(/*turbopackIgnore: true*/ uploadRoot(), folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${kind.ext}`;
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), buf, { mode: 0o644 });
  return { ok: true, path: `${folder}/${name}` };
}

export async function removeUpload(rel: string | null | undefined) {
  if (!rel || !/^[a-z]+\/[0-9a-f-]{36}\.(png|jpg|webp)$/.test(rel)) return;
  await unlink(path.join(/*turbopackIgnore: true*/ uploadRoot(), rel)).catch(() => {});
}

/** Resolves a public media path safely (no traversal). */
export function resolveMedia(segments: string[]): { file: string; mime: string } | null {
  const rel = segments.join("/");
  const m = /^([a-z]+)\/([0-9a-f-]{36})\.(png|jpg|webp)$/.exec(rel);
  if (!m) return null;
  return { file: path.join(/*turbopackIgnore: true*/ uploadRoot(), m[1]!, `${m[2]}.${m[3]}`), mime: MIME_BY_EXT[m[3]!]! };
}
