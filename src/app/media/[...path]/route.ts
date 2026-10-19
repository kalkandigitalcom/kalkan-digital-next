import { readFile } from "node:fs/promises";
import { resolveMedia } from "@/server/uploads";

/** Serves uploaded public images (portfolio). Only strictly-named files are reachable. */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const resolved = resolveMedia(path);
  if (!resolved) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(resolved.file);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": resolved.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
