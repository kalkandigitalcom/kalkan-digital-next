import { createHash, createHmac, randomBytes } from "node:crypto";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** The DB never stores the raw cookie token, only its SHA-256 hash. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hmacKey(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 40);
}
