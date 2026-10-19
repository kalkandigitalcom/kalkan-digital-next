/** Public, non-secret site configuration (safe for the client bundle). */
export const site = {
  name: "Kalkan Digital",
  domain: "kalkandigital.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kalkandigital.com",
  location: "Kalkan, Kaş, Antalya, Türkiye",
  foundedYear: 2018,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "",
  /** International format without +, e.g. 905xxxxxxxxx */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
};

export function whatsappLink(message?: string) {
  if (!site.whatsapp) return null;
  const digits = site.whatsapp.replace(/\D/g, "");
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${q}`;
}
