import "server-only";
import { getCompanySettings } from "@/server/settings";
import { site } from "@/lib/site";

export interface PublicContact {
  companyName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
}

/** Public contact details: admin settings first, environment variables as fallback. Never throws. */
export async function getPublicContact(): Promise<PublicContact> {
  try {
    const c = await getCompanySettings();
    return {
      companyName: c.companyName || site.name,
      email: c.email || site.email,
      phone: c.phone || site.phone,
      whatsapp: c.whatsapp || site.whatsapp,
      address: c.address || site.location,
    };
  } catch {
    return { companyName: site.name, email: site.email, phone: site.phone, whatsapp: site.whatsapp, address: site.location };
  }
}

export function waHref(number: string, message?: string) {
  let d = number.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "9" + d;
  if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return `https://wa.me/${d}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
