/**
 * Exact decimal arithmetic for money using BigInt fixed-point values.
 * Never use JS floating point for financial values.
 */
export const CURRENCIES = ["TRY", "EUR", "USD", "GBP"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

const DECIMAL_RE = /^-?\d+(\.\d+)?$/;

/** Normalises user input like "1.234,56" / "1234.56" / "1 234,5" into "1234.56". */
export function normalizeDecimalInput(raw: string): string | null {
  let s = raw.trim().replace(/\s/g, "").replace(/[₺€$£]/g, "");
  if (!s) return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // The last separator is the decimal separator.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    s = s.replace(",", ".");
  } else if (hasDot) {
    // "1.234" (TR thousands) vs "12.5" (decimal): treat groups of exactly 3 digits after dots as thousands.
    const parts = s.split(".");
    if (parts.length > 2 || (parts.length === 2 && parts[1]!.length === 3 && /^[1-9]\d{0,2}$/.test(parts[0]!))) {
      // ambiguous single "1.234" → thousands separator in Turkish formatting
      s = parts.join("");
    }
  }
  return DECIMAL_RE.test(s) ? s : null;
}

/** Parses a decimal string into a scaled BigInt (value × 10^scale), rounding half away from zero. */
export function toScaled(value: string, scale: number): bigint {
  if (!DECIMAL_RE.test(value)) throw new Error(`Geçersiz ondalık değer: ${value}`);
  const negative = value.startsWith("-");
  const [intPart, fracPart = ""] = (negative ? value.slice(1) : value).split(".");
  const padded = (fracPart + "0".repeat(scale + 1)).slice(0, scale + 1);
  let n = BigInt(intPart! + padded.slice(0, scale));
  if (Number(padded[scale]) >= 5) n += 1n;
  return negative ? -n : n;
}

export function fromScaled(n: bigint, scale: number): string {
  const negative = n < 0n;
  const abs = negative ? -n : n;
  const s = abs.toString().padStart(scale + 1, "0");
  const intPart = s.slice(0, s.length - scale);
  const frac = s.slice(s.length - scale);
  return `${negative ? "-" : ""}${intPart}${scale > 0 ? "." + frac : ""}`;
}

/** amount (2 dp) × rate (6 dp) → base amount rounded to 2 dp (half away from zero). */
export function convertAmount(amount: string, rate: string): string {
  const a = toScaled(amount, 2);
  const r = toScaled(rate, 6);
  const product = a * r; // scale 8
  const divisor = 1_000_000n;
  const negative = product < 0n;
  const abs = negative ? -product : product;
  let q = abs / divisor;
  if ((abs % divisor) * 2n >= divisor) q += 1n;
  return fromScaled(negative ? -q : q, 2);
}

export function addMoney(...values: (string | null | undefined)[]): string {
  return fromScaled(
    values.reduce<bigint>((acc, v) => acc + (v ? toScaled(v, 2) : 0n), 0n),
    2,
  );
}

export function subMoney(a: string | null | undefined, b: string | null | undefined): string {
  return fromScaled((a ? toScaled(a, 2) : 0n) - (b ? toScaled(b, 2) : 0n), 2);
}

export function mulMoney(amount: string, qty: string): string {
  return convertAmount(amount, qty);
}

export function compareMoney(a: string, b: string): number {
  const d = toScaled(a, 2) - toScaled(b, 2);
  return d === 0n ? 0 : d > 0n ? 1 : -1;
}

export function isZero(a: string | null | undefined) {
  return !a || toScaled(a, 2) === 0n;
}

const formatters = new Map<string, Intl.NumberFormat>();
export function formatMoney(value: string | number | null | undefined, currency: CurrencyCode = "TRY"): string {
  if (value === null || value === undefined || value === "") return "—";
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("tr-TR", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    formatters.set(currency, f);
  }
  // Display only: the string was produced by exact arithmetic; Number() is safe for 2-dp values < 2^53 / 100.
  return f.format(typeof value === "number" ? value : Number(value));
}

export function formatNumber(value: string | number, digits = 2) {
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(Number(value));
}
