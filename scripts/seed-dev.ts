/**
 * DEVELOPMENT-ONLY demo data. Never run against production.
 *
 *   ALLOW_DEV_SEED=true npm run db:seed:dev
 *
 * Safety: refuses when NODE_ENV=production, when ALLOW_DEV_SEED is not "true",
 * or when the database already contains customers. Every record is prefixed with
 * "[DEMO]" so it can never be mistaken for real business data.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as s from "../src/server/db/schema";
import { computeBaseValues } from "../src/server/finance/core";
import { addDays, addMonths, todayIso } from "../src/lib/dates";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Üretim ortamında demo verisi eklenemez.");
  if (process.env.ALLOW_DEV_SEED !== "true") throw new Error("Demo verisi için ALLOW_DEV_SEED=true gereklidir.");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil.");
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema: s });
  try {
    const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from customers`)) as unknown as [{ n: number }];
    if (n > 0) throw new Error("Veritabanında müşteri kaydı var; demo verisi yalnızca boş bir veritabanına eklenir.");

    const cats = await db.select().from(s.financialCategories);
    const cat = (type: "income" | "expense", name: string) => cats.find((c) => c.type === type && c.name === name)!.id;
    const today = todayIso();
    const pick = <T,>(arr: T[], i: number) => arr[i % arr.length]!;

    const customerRows = await db
      .insert(s.customers)
      .values(
        [
          ["[DEMO] Mavi Koy Villaları", "villa_owner", "active"],
          ["[DEMO] Akdeniz Butik Otel", "hotel", "active"],
          ["[DEMO] Liman Restoran", "company", "active"],
          ["[DEMO] Kaş Dalış Merkezi", "company", "active"],
          ["[DEMO] Patara Turizm", "agency", "active"],
          ["[DEMO] Ayşe Yılmaz", "individual", "passive"],
          ["[DEMO] Kalamar Emlak", "company", "lead"],
          ["[DEMO] Gelemiş Pansiyon", "hotel", "active"],
        ].map(([name, type, status], i) => ({
          companyName: name!,
          customerType: type as "company",
          status: status as "active",
          contactName: pick(["Mehmet K.", "Elif D.", "Can T.", "Zeynep A."], i),
          phone: `+90 532 000 00 ${String(10 + i).padStart(2, "0")}`,
          email: `demo${i + 1}@example.com`,
          source: pick(["referral", "website", "social_media", "google"] as const, i),
          firstContactDate: addMonths(today, -18 + i),
        })),
      )
      .returning();

    const projectRows = await db
      .insert(s.projects)
      .values(
        customerRows.slice(0, 6).map((c, i) => ({
          customerId: c.id,
          name: `[DEMO] ${pick(["Kurumsal web sitesi", "Villa rezervasyon sistemi", "Otel web sitesi", "Yönetim paneli", "Tanıtım filmi", "Reklam kampanyası"], i)}`,
          projectType: pick(["web_design", "villa_rental_software", "hotel_tourism_web", "software", "photo_video", "digital_ads"] as const, i),
          status: pick(["completed", "in_progress", "in_progress", "waiting_client", "planned", "completed"] as const, i),
          currency: i === 1 ? ("EUR" as const) : ("TRY" as const),
          quotedAmount: i === 1 ? "4500.00" : String(60000 + i * 15000) + ".00",
          agreedAmount: i === 1 ? "4200.00" : String(55000 + i * 15000) + ".00",
          estimatedCost: i === 1 ? "900.00" : String(8000 + i * 2000) + ".00",
          startDate: addMonths(today, -10 + i),
          targetDate: addMonths(today, -6 + i * 2),
        })),
      )
      .returning();

    const txs: (typeof s.financialTransactions.$inferInsert)[] = [];
    const add = (t: Omit<typeof s.financialTransactions.$inferInsert, "baseCurrency" | "baseAmount" | "exchangeRate"> & { exchangeRate?: string | null }) => {
      const b = computeBaseValues({ amount: t.amount, currency: t.currency, baseCurrency: "TRY", exchangeRate: t.exchangeRate ?? null });
      txs.push({ ...t, baseCurrency: "TRY", exchangeRate: b.exchangeRate, baseAmount: b.baseAmount, exchangeRateSource: t.currency === "TRY" ? null : t.exchangeRate ? "[DEMO] manuel kur" : null });
    };
    for (let m = 0; m < 20; m++) {
      const d = addDays(addMonths(today, -m), -3);
      const p = pick(projectRows, m);
      add({ type: "income", description: `[DEMO] Hakediş ${m + 1}`, amount: String(12000 + (m % 5) * 3500) + ".00", currency: "TRY", transactionDate: d, settledDate: d, status: "completed", customerId: p.customerId, projectId: p.id, categoryId: cat("income", pick(["Web tasarım", "Yazılım geliştirme", "Villa kiralama yazılımı", "Dijital reklam yönetimi"], m)), paymentMethod: "bank_transfer" });
      add({ type: "expense", description: `[DEMO] Sunucu ve lisans ${m + 1}`, amount: String(1500 + (m % 3) * 400) + ".00", currency: "TRY", transactionDate: d, settledDate: d, status: "completed", categoryId: cat("expense", pick(["Sunucu ve hosting", "Yazılım abonelikleri", "Reklam giderleri"], m)), paymentMethod: "credit_card" });
    }
    add({ type: "income", description: "[DEMO] Rezervasyon sistemi 1. taksit", amount: "2000.00", currency: "EUR", exchangeRate: "36.250000", transactionDate: addMonths(today, -2), settledDate: addMonths(today, -2), status: "completed", customerId: projectRows[1]!.customerId, projectId: projectRows[1]!.id, categoryId: cat("income", "Villa kiralama yazılımı"), paymentMethod: "wise" });
    add({ type: "income", description: "[DEMO] Rezervasyon sistemi 2. taksit", amount: "2200.00", currency: "EUR", transactionDate: today, dueDate: addDays(today, 20), status: "pending", customerId: projectRows[1]!.customerId, projectId: projectRows[1]!.id, categoryId: cat("income", "Villa kiralama yazılımı") });
    add({ type: "income", description: "[DEMO] Web sitesi kalan bakiye", amount: "25000.00", currency: "TRY", transactionDate: addDays(today, -40), dueDate: addDays(today, -10), status: "pending", customerId: projectRows[2]!.customerId, projectId: projectRows[2]!.id, categoryId: cat("income", "Web tasarım") });
    add({ type: "expense", description: "[DEMO] Muhasebe ücreti", amount: "3500.00", currency: "TRY", transactionDate: today, dueDate: addDays(today, 5), status: "pending", categoryId: cat("expense", "Vergi ve muhasebe") });
    await db.insert(s.financialTransactions).values(txs);

    await db.insert(s.recurringServices).values(
      customerRows.slice(0, 5).map((c, i) => ({
        customerId: c.id,
        categoryId: cat("income", i % 2 ? "Domain" : "Hosting"),
        name: `[DEMO] ${i % 2 ? "Alan adı yenileme" : "Hosting paketi"} – demo${i + 1}.com`,
        amount: i % 2 ? "750.00" : "4800.00",
        currency: "TRY" as const,
        period: i === 4 ? ("monthly" as const) : ("yearly" as const),
        startDate: addMonths(today, -12 + i * 2 - (i === 0 ? 0 : 0)),
        nextRenewalDate: addDays(today, -5 + i * 9),
        paymentTermDays: 10,
      })),
    );

    await db.insert(s.quotes).values([
      { companyName: "[DEMO] Yeşil Vadi Bungalov", contactName: "Ali V.", email: "demo-lead1@example.com", requestedService: "hotel_tourism_web", estimatedAmount: "85000.00", status: "proposal_sent", quoteDate: addDays(today, -6), nextFollowUpDate: addDays(today, -1), source: "manual" },
      { companyName: "[DEMO] Lagün Tekne Turları", contactName: "Deniz K.", phone: "+90 533 000 00 99", requestedService: "web_design", status: "new", source: "website_form", message: "[DEMO] Tekne turlarımız için çok dilli bir site istiyoruz.", nextFollowUpDate: today },
      { companyName: "[DEMO] Kaputaş Cafe", requestedService: "social_media", estimatedAmount: "12000.00", status: "negotiation", nextFollowUpDate: addDays(today, 3), source: "manual" },
    ]);

    await db.insert(s.tasks).values([
      { title: "[DEMO] Ana sayfa revizyonlarını gönder", customerId: projectRows[2]!.customerId, projectId: projectRows[2]!.id, dueAt: new Date(Date.now() - 86_400_000), priority: "high" },
      { title: "[DEMO] Hosting yenilemesi için müşteriyi ara", customerId: customerRows[0]!.id, dueAt: new Date(Date.now() + 2 * 86_400_000), remindAt: new Date(Date.now() - 3600_000), priority: "medium" },
      { title: "[DEMO] Teklif takibi – Yeşil Vadi", dueAt: new Date(Date.now() + 5 * 86_400_000), priority: "low" },
    ]);

    console.log(`Demo verisi eklendi: ${customerRows.length} müşteri, ${projectRows.length} proje, ${txs.length} işlem.`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error("HATA:", e instanceof Error ? e.message : e);
  process.exit(1);
});
