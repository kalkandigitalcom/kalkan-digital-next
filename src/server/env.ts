import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL zorunludur"),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  /** Used to HMAC rate-limit keys (IP addresses are never stored in clear text). */
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET en az 32 karakter olmalıdır"),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(12),
  /** Optional: enables the one-time /admin/setup page while no admin exists. */
  ADMIN_SETUP_TOKEN: z.string().min(24).optional().or(z.literal("").transform(() => undefined)),
  UPLOAD_DIR: z.string().default("./uploads"),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  COOKIE_SECURE: z
    .enum(["true", "false", "auto"])
    .default("auto"),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Geçersiz ortam değişkenleri: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
