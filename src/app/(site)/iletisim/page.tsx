import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getPublicContact, waHref } from "@/server/public";
import { ContactForm } from "@/components/public/contact-form";
import { serviceTypes } from "@/lib/labels";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "İletişim ve teklif",
  description: "Kalkan Digital ile iletişime geçin, projeniz için ücretsiz ön görüşme ve teklif alın. Kalkan, Kaş, Antalya.",
  alternates: { canonical: "/iletisim" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ hizmet?: string }> }) {
  const contact = await getPublicContact();
  const { hizmet } = await searchParams;
  const wa = waHref(contact.whatsapp, "Merhaba, teklif almak istiyorum.");
  const initial = serviceTypes.list.some((s) => s.value === hizmet) ? hizmet : undefined;
  return (
    <>
      <section className="bg-navy-900 pb-16 pt-36">
        <div className="container-page motion-intro-group">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">İletişim</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Birlikte çalışalım</h1>
          <p className="mt-4 max-w-2xl text-navy-200">Formu doldurun veya doğrudan ulaşın. Talebinizi inceleyip size en kısa sürede dönüş yapalım.</p>
        </div>
      </section>
      <section className="py-16">
        <div data-reveal-group className="container-page grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <aside className="space-y-4">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 transition hover:shadow-lift">
                <span className="grid size-11 place-items-center rounded-xl bg-[#1f9d55] text-white"><MessageCircle className="size-5" /></span>
                <span><span className="block font-display font-bold text-navy-900">WhatsApp ile yazın</span><span className="text-sm text-navy-600">Hızlı dönüş için</span></span>
              </a>
            ) : null}
            {contact.phone ? (
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-5 transition hover:shadow-lift">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Phone className="size-5" /></span>
                <span><span className="block font-display font-bold text-navy-900">Telefon</span><span className="text-sm text-navy-600">{contact.phone}</span></span>
              </a>
            ) : null}
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-5 transition hover:shadow-lift">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Mail className="size-5" /></span>
                <span><span className="block font-display font-bold text-navy-900">E-posta</span><span className="text-sm text-navy-600">{contact.email}</span></span>
              </a>
            ) : null}
            <div className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><MapPin className="size-5" /></span>
              <span><span className="block font-display font-bold text-navy-900">Konum</span><span className="text-sm text-navy-600">{contact.address}</span></span>
            </div>
          </aside>
          <div id="teklif" className="relative scroll-mt-28 rounded-2xl border border-navy-100 bg-white p-6 shadow-card sm:p-8">
            <h2 className="font-display text-2xl font-extrabold text-navy-900">Teklif alın</h2>
            <p className="mb-6 mt-1 text-sm text-navy-500">Zorunlu alanlar * ile işaretlidir. E-posta veya telefon bilgilerinden en az birini paylaşın.</p>
            <ContactForm initialService={initial} />
          </div>
        </div>
      </section>
    </>
  );
}
