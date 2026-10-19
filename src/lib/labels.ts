/** Turkish UI labels for database enum values. Shared by server and client. */
type Tone = "gray" | "blue" | "green" | "amber" | "red" | "violet" | "navy";
export interface Option<T extends string = string> {
  value: T;
  label: string;
  tone?: Tone;
}

function opts<T extends string>(list: Option<T>[]) {
  const map = Object.fromEntries(list.map((o) => [o.value, o])) as Record<T, Option<T>>;
  return { list, map, label: (v: T | null | undefined) => (v ? (map[v]?.label ?? v) : "—") };
}

export const customerTypes = opts([
  { value: "company", label: "Kurumsal firma" },
  { value: "individual", label: "Bireysel" },
  { value: "villa_owner", label: "Villa sahibi" },
  { value: "hotel", label: "Otel / Pansiyon" },
  { value: "agency", label: "Acenta" },
  { value: "other", label: "Diğer" },
] as const satisfies Option[]);

export const customerStatuses = opts([
  { value: "lead", label: "Potansiyel", tone: "amber" },
  { value: "active", label: "Aktif", tone: "green" },
  { value: "passive", label: "Pasif", tone: "gray" },
] as const satisfies Option[]);

export const acquisitionSources = opts([
  { value: "referral", label: "Referans" },
  { value: "website", label: "Web sitesi" },
  { value: "social_media", label: "Sosyal medya" },
  { value: "google", label: "Google / arama" },
  { value: "direct", label: "Doğrudan iletişim" },
  { value: "existing_network", label: "Mevcut çevre" },
  { value: "other", label: "Diğer" },
] as const satisfies Option[]);

export const noteKinds = opts([
  { value: "call", label: "Telefon görüşmesi", tone: "blue" },
  { value: "meeting", label: "Toplantı", tone: "violet" },
  { value: "email", label: "E-posta", tone: "gray" },
  { value: "whatsapp", label: "WhatsApp", tone: "green" },
  { value: "note", label: "Not", tone: "gray" },
] as const satisfies Option[]);

export const serviceTypes = opts([
  { value: "web_design", label: "Web tasarım ve geliştirme" },
  { value: "software", label: "Özel yazılım geliştirme" },
  { value: "villa_rental_software", label: "Villa kiralama yazılımı" },
  { value: "hotel_tourism_web", label: "Otel ve turizm web sitesi" },
  { value: "hosting_support", label: "Hosting ve teknik destek" },
  { value: "digital_ads", label: "Dijital reklam yönetimi" },
  { value: "social_media", label: "Sosyal medya yönetimi" },
  { value: "photo_video", label: "Fotoğraf ve video prodüksiyonu" },
  { value: "other", label: "Diğer" },
] as const satisfies Option[]);

export const projectStatuses = opts([
  { value: "proposal", label: "Teklif", tone: "gray" },
  { value: "planned", label: "Planlandı", tone: "violet" },
  { value: "in_progress", label: "Devam ediyor", tone: "blue" },
  { value: "waiting_client", label: "Müşteri bekleniyor", tone: "amber" },
  { value: "completed", label: "Tamamlandı", tone: "green" },
  { value: "cancelled", label: "İptal", tone: "red" },
] as const satisfies Option[]);

export const paymentStatuses = opts([
  { value: "not_set", label: "Tutar belirlenmedi", tone: "gray" },
  { value: "unpaid", label: "Ödenmedi", tone: "red" },
  { value: "partial", label: "Kısmi ödendi", tone: "amber" },
  { value: "paid", label: "Tamamı ödendi", tone: "green" },
] as const satisfies Option[]);

export const currencies = opts([
  { value: "TRY", label: "TRY – Türk lirası" },
  { value: "EUR", label: "EUR – Euro" },
  { value: "USD", label: "USD – ABD doları" },
  { value: "GBP", label: "GBP – İngiliz sterlini" },
] as const satisfies Option[]);

export const transactionTypes = opts([
  { value: "income", label: "Gelir", tone: "green" },
  { value: "expense", label: "Gider", tone: "red" },
] as const satisfies Option[]);

export const transactionStatuses = opts([
  { value: "completed", label: "Gerçekleşti", tone: "green" },
  { value: "pending", label: "Bekliyor", tone: "amber" },
  { value: "cancelled", label: "İptal", tone: "gray" },
] as const satisfies Option[]);

export function transactionStatusLabel(type: "income" | "expense", status: "completed" | "pending" | "cancelled") {
  if (status === "cancelled") return "İptal";
  if (type === "income") return status === "completed" ? "Tahsil edildi" : "Tahsilat bekliyor";
  return status === "completed" ? "Ödendi" : "Ödeme bekliyor";
}

export const paymentMethods = opts([
  { value: "bank_transfer", label: "Havale / EFT" },
  { value: "cash", label: "Nakit" },
  { value: "credit_card", label: "Kredi kartı" },
  { value: "pos", label: "POS / sanal POS" },
  { value: "paypal", label: "PayPal" },
  { value: "wise", label: "Wise" },
  { value: "other", label: "Diğer" },
] as const satisfies Option[]);

export const recurringPeriods = opts([
  { value: "monthly", label: "Aylık" },
  { value: "quarterly", label: "3 aylık" },
  { value: "semiannual", label: "6 aylık" },
  { value: "yearly", label: "Yıllık" },
] as const satisfies Option[]);

export const recurringStatuses = opts([
  { value: "active", label: "Aktif", tone: "green" },
  { value: "paused", label: "Durduruldu", tone: "amber" },
  { value: "cancelled", label: "İptal edildi", tone: "gray" },
] as const satisfies Option[]);

export const quoteStatuses = opts([
  { value: "new", label: "Yeni", tone: "blue" },
  { value: "contacted", label: "İletişim kuruldu", tone: "violet" },
  { value: "proposal_sent", label: "Teklif gönderildi", tone: "amber" },
  { value: "negotiation", label: "Görüşme", tone: "navy" },
  { value: "won", label: "Kazanıldı", tone: "green" },
  { value: "lost", label: "Kaybedildi", tone: "red" },
] as const satisfies Option[]);

export const quoteSources = opts([
  { value: "manual", label: "Manuel" },
  { value: "website_form", label: "Web sitesi formu" },
] as const satisfies Option[]);

export const taskPriorities = opts([
  { value: "low", label: "Düşük", tone: "gray" },
  { value: "medium", label: "Normal", tone: "blue" },
  { value: "high", label: "Yüksek", tone: "amber" },
  { value: "urgent", label: "Acil", tone: "red" },
] as const satisfies Option[]);

export const taskStatuses = opts([
  { value: "todo", label: "Yapılacak", tone: "gray" },
  { value: "in_progress", label: "Devam ediyor", tone: "blue" },
  { value: "done", label: "Tamamlandı", tone: "green" },
  { value: "cancelled", label: "İptal", tone: "gray" },
] as const satisfies Option[]);

export type { Tone };
