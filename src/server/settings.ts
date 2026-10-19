import "server-only";
import { eq } from "drizzle-orm";
import { db, type Tx } from "@/server/db";
import { appSettings, type Currency } from "@/server/db/schema";
import { CURRENCIES } from "@/lib/money";

export interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  taxInfo: string;
  renewalWarningDays: number;
}

const COMPANY_DEFAULTS: CompanySettings = {
  companyName: "Kalkan Digital",
  email: "",
  phone: "",
  whatsapp: "",
  address: "Kalkan, Kaş, Antalya",
  taxInfo: "",
  renewalWarningDays: 30,
};

export async function getBaseCurrency(tx?: Tx): Promise<Currency> {
  const [row] = await (tx ?? db).select().from(appSettings).where(eq(appSettings.key, "base_currency")).limit(1);
  const value = row?.value;
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value) ? (value as Currency) : "TRY";
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "company")).limit(1);
  const value = (row?.value ?? {}) as Partial<CompanySettings>;
  return { ...COMPANY_DEFAULTS, ...value };
}

export async function setSetting(key: string, value: unknown, tx?: Tx) {
  await (tx ?? db)
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}
