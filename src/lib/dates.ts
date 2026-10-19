/**
 * Date helpers. All business dates are calendar dates (YYYY-MM-DD) in Europe/Istanbul.
 */
export const APP_TZ = "Europe/Istanbul";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export function isIsoDate(s: string | null | undefined): s is string {
  if (!s || !ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Today's calendar date in Istanbul. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return { y, m, d };
}
const pad = (n: number) => String(n).padStart(2, "0");
export function makeIso(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}
export function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Adds months, clamping to the end of month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number, anchorDay?: number): string {
  const { y, m, d } = parts(iso);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const day = Math.min(anchorDay ?? d, daysInMonth(ny, nm));
  return makeIso(ny, nm, day);
}

export function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);
}

export function yearOf(iso: string) {
  return parts(iso).y;
}

export type RangePreset = "this_month" | "last_30" | "this_year" | "prev_year" | "custom";
export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "this_month", label: "Bu ay" },
  { value: "last_30", label: "Son 30 gün" },
  { value: "this_year", label: "Bu yıl" },
  { value: "prev_year", label: "Önceki yıl" },
  { value: "custom", label: "Özel aralık" },
];

export interface DateRange {
  preset: RangePreset;
  from: string; // inclusive
  to: string; // inclusive
  label: string;
}

export function resolveRange(
  input: { range?: string | null; from?: string | null; to?: string | null },
  today: string = todayIso(),
): DateRange {
  const { y, m } = parts(today);
  const preset = (RANGE_PRESETS.some((p) => p.value === input.range) ? input.range : "this_month") as RangePreset;
  switch (preset) {
    case "last_30":
      return { preset, from: addDays(today, -29), to: today, label: "Son 30 gün" };
    case "this_year":
      return { preset, from: makeIso(y, 1, 1), to: makeIso(y, 12, 31), label: `${y} yılı` };
    case "prev_year":
      return { preset, from: makeIso(y - 1, 1, 1), to: makeIso(y - 1, 12, 31), label: `${y - 1} yılı` };
    case "custom": {
      if (isIsoDate(input.from) && isIsoDate(input.to)) {
        const [from, to] = input.from <= input.to ? [input.from, input.to] : [input.to, input.from];
        return { preset, from, to, label: `${formatDate(from)} – ${formatDate(to)}` };
      }
      return { preset: "this_month", from: makeIso(y, m, 1), to: makeIso(y, m, daysInMonth(y, m)), label: "Bu ay" };
    }
    default:
      return { preset: "this_month", from: makeIso(y, m, 1), to: makeIso(y, m, daysInMonth(y, m)), label: "Bu ay" };
  }
}

const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export const TR_MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
export function monthName(m: number) {
  return TR_MONTHS[m - 1] ?? "";
}

/** 2026-10-19 → 19.10.2026 */
export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const s = iso instanceof Date ? todayIso(iso) : iso.slice(0, 10);
  if (!isIsoDate(s)) return "—";
  const { y, m, d } = parts(s);
  return `${pad(d)}.${pad(m)}.${y}`;
}

export function formatDateLong(iso: string | null | undefined): string {
  if (!iso || !isIsoDate(iso.slice(0, 10))) return "—";
  const { y, m, d } = parts(iso.slice(0, 10));
  return `${d} ${monthName(m)} ${y}`;
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: APP_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Converts an <input type="datetime-local"> value interpreted in Istanbul time to a Date. */
export function istanbulLocalToDate(local: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  // Istanbul has been fixed UTC+3 (no DST) since 2016.
  const d = new Date(`${local}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
export function dateToIstanbulLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const shifted = new Date(d.getTime() + 3 * 3600_000);
  return shifted.toISOString().slice(0, 16);
}
