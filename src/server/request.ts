import "server-only";
import { headers } from "next/headers";
import { env } from "@/server/env";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  if (env().TRUST_PROXY) {
    // Use the address appended by our own reverse proxy (right-most hop), which the client
    // cannot spoof. TRUSTED_PROXY_HOPS = number of proxies in front of the app (Coolify/Traefik: 1).
    const xff = h.get("x-forwarded-for");
    if (xff) {
      const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
      const hops = Math.max(1, Number(process.env.TRUSTED_PROXY_HOPS ?? 1) || 1);
      const ip = parts[Math.max(0, parts.length - hops)];
      if (ip) return ip.slice(0, 64);
    }
    const real = h.get("x-real-ip");
    if (real) return real.trim().slice(0, 64);
  }
  return "unknown";
}

export async function getUserAgent(): Promise<string> {
  const h = await headers();
  return (h.get("user-agent") ?? "").slice(0, 400);
}
