import "server-only";
import { z } from "zod";
import { isIsoDate } from "@/lib/dates";
import { normalizeDecimalInput } from "@/lib/money";
import type { ActionState } from "@/lib/action-state";

const trimmed = (max: number) => z.string().trim().max(max, `En fazla ${max} karakter olabilir.`);

export const v = {
  requiredText: (max: number, msg = "Bu alan zorunludur.") => trimmed(max).min(1, msg),
  optionalText: (max: number) =>
    z
      .string()
      .trim()
      .max(max, `En fazla ${max} karakter olabilir.`)
      .optional()
      .transform((s) => (s ? s : null)),
  optionalEmail: () =>
    z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((s) => (s ? s.toLowerCase() : null))
      .refine((s) => s === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), "Geçerli bir e-posta adresi girin."),
  optionalPhone: () =>
    z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((s) => (s ? s : null))
      .refine((s) => s === null || /^[+\d][\d\s()-]{5,}$/.test(s), "Geçerli bir telefon numarası girin."),
  optionalUrl: () =>
    z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((s) => {
        if (!s) return null;
        return /^https?:\/\//i.test(s) ? s : `https://${s}`;
      })
      .refine((s) => {
        if (s === null) return true;
        try {
          const u = new URL(s);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      }, "Geçerli bir web adresi girin."),
  isoDate: (msg = "Geçerli bir tarih seçin.") => z.string().trim().refine((s) => isIsoDate(s), msg),
  optionalIsoDate: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((s) => (s ? s : null))
      .refine((s) => s === null || isIsoDate(s), "Geçerli bir tarih seçin."),
  money: (msg = "Geçerli bir tutar girin.") =>
    z
      .string()
      .trim()
      .transform((s, ctx) => {
        const n = normalizeDecimalInput(s);
        if (n === null || n.startsWith("-") || n.replace(".", "").length > 14) {
          ctx.addIssue({ code: "custom", message: msg });
          return z.NEVER;
        }
        return n;
      }),
  positiveMoney: (msg = "Sıfırdan büyük geçerli bir tutar girin.") =>
    v.money(msg).refine((s) => Number(s) > 0, msg),
  optionalMoney: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((s, ctx) => {
        if (!s) return null;
        const n = normalizeDecimalInput(s);
        if (n === null || n.startsWith("-") || n.replace(".", "").length > 14) {
          ctx.addIssue({ code: "custom", message: "Geçerli bir tutar girin." });
          return z.NEVER;
        }
        return n;
      }),
  optionalRate: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((s, ctx) => {
        if (!s) return null;
        const n = normalizeDecimalInput(s);
        if (n === null || n.startsWith("-") || Number(n) <= 0 || Number(n) > 1_000_000) {
          ctx.addIssue({ code: "custom", message: "Geçerli bir kur girin (örn. 36,4500)." });
          return z.NEVER;
        }
        return n;
      }),
  optionalUuid: () =>
    z
      .string()
      .trim()
      .optional()
      .transform((s) => (s ? s : null))
      .refine((s) => s === null || z.uuid().safeParse(s).success, "Geçersiz seçim."),
  uuid: () => z.uuid("Geçersiz kayıt."),
  checkbox: () =>
    z
      .string()
      .optional()
      .transform((s) => s === "on" || s === "true" || s === "1"),
  enumOf: <const T extends readonly [string, ...string[]]>(values: T, msg = "Geçersiz seçim.") =>
    z.enum(values, { error: msg }),
  optionalEnumOf: <const T extends readonly [string, ...string[]]>(values: T) =>
    z
      .string()
      .optional()
      .transform((s) => (s ? s : null))
      .refine((s) => s === null || (values as readonly string[]).includes(s), "Geçersiz seçim.")
      .transform((s) => s as T[number] | null),
};

export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, val] of formData.entries()) {
    if (k.startsWith("$ACTION")) continue;
    if (typeof val === "string") out[k] = val;
  }
  return out;
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; state: ActionState };

export function parseForm<S extends z.ZodType>(schema: S, formData: FormData): ParseResult<z.output<S>> {
  const result = schema.safeParse(formToObject(formData));
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    ok: false,
    state: { status: "error", message: "Lütfen işaretli alanları kontrol edin.", fieldErrors, at: Date.now() },
  };
}

export function errorState(message: string, fieldErrors?: Record<string, string>): ActionState {
  return { status: "error", message, fieldErrors, at: Date.now() };
}
export function successState(message: string, data?: Record<string, string>): ActionState {
  return { status: "success", message, at: Date.now(), data };
}

/** Maps common PostgreSQL errors to user-friendly Turkish messages. */
export function dbErrorMessage(err: unknown): string {
  const e = err as { code?: string; cause?: { code?: string }; constraint_name?: string };
  const code = e?.code ?? e?.cause?.code;
  switch (code) {
    case "23505":
      return "Bu kayıt zaten mevcut (benzersizlik kuralı).";
    case "23503":
      return "Bu kayıt başka kayıtlarla ilişkili olduğu için işlem yapılamadı.";
    case "23514":
      return "Girilen değerler veri kurallarına uymuyor.";
    case "22P02":
      return "Geçersiz değer formatı.";
    default:
      return "Beklenmeyen bir veritabanı hatası oluştu. Lütfen tekrar deneyin.";
  }
}
