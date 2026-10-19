"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { quotes, serviceType } from "@/server/db/schema";
import { isRateLimited, recordRateLimitEvent } from "@/server/rate-limit";
import { getClientIp } from "@/server/request";
import { logActivity } from "@/server/activity";
import { errorState, parseForm, successState, v } from "@/server/validation";
import { todayIso } from "@/lib/dates";
import type { ActionState } from "@/lib/action-state";

/**
 * PUBLIC endpoint (no authentication): website contact / quote request form.
 * Protections: strict validation & length limits, honeypot field, minimum fill time,
 * per-IP rate limit, explicit consent. It only INSERTS a lead; it never reads private data.
 */
const schema = z
  .object({
    name: v.requiredText(150, "Adınızı girin."),
    company: v.optionalText(200),
    email: v.optionalEmail(),
    phone: v.optionalPhone(),
    service: v.optionalEnumOf(serviceType.enumValues),
    budget: v.optionalText(60),
    message: v.requiredText(4000, "Kısaca projenizden bahsedin.").refine((s) => s.length >= 10, "Mesajınız en az 10 karakter olmalı."),
    consent: z.literal("on", { error: "Devam etmek için aydınlatma metnini onaylayın." }),
    website: z.string().max(0).optional(), // honeypot – must stay empty
    t: z.coerce.number().optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.email && !d.phone) ctx.addIssue({ code: "custom", path: ["email"], message: "E-posta veya telefon bilgilerinden en az birini girin." });
  });

export async function submitContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (String(formData.get("website") ?? "") !== "") return successState("Mesajınız alındı.");
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const d = parsed.data;
  if (d.t && Date.now() - d.t < 2500) return errorState("Lütfen formu tekrar gönderin.");

  const ip = await getClientIp();
  if (await isRateLimited({ bucket: "contact_ip", key: ip, max: 5, windowMs: 60 * 60_000 })) {
    return errorState("Kısa sürede çok fazla talep gönderildi. Lütfen daha sonra tekrar deneyin veya bize WhatsApp'tan ulaşın.");
  }
  await recordRateLimitEvent("contact_ip", ip);

  const [row] = await db
    .insert(quotes)
    .values({
      companyName: d.company ?? d.name,
      contactName: d.name,
      email: d.email,
      phone: d.phone,
      requestedService: d.service,
      message: d.budget ? `${d.message}\n\nBütçe aralığı: ${d.budget}` : d.message,
      status: "new",
      source: "website_form",
      nextFollowUpDate: todayIso(),
    })
    .returning({ id: quotes.id });
  await logActivity({ userId: null, action: "public.quote_request", entityType: "quote", entityId: row!.id, summary: `Web formu: ${d.company ?? d.name}` });
  return successState("Teşekkürler! Talebiniz bize ulaştı. En kısa sürede sizinle iletişime geçeceğiz.");
}
