import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { PublicContact } from "@/server/public";
import { waHref } from "@/server/public";
import { site } from "@/lib/site";

export function SiteFooter({ contact }: { contact: PublicContact }) {
  const wa = waHref(contact.whatsapp);
  const year = new Date().getFullYear();
  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="container-page grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo variant="onDark" size="lg" />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-navy-300">
            Kalkan, Kaş merkezli dijital ajans. {site.foundedYear}&apos;den bu yana işletmeler için web siteleri, özel yazılımlar ve dijital büyüme çözümleri geliştiriyoruz.
          </p>
        </div>
        <div>
          <h2 className="font-display text-sm font-bold text-white">Sayfalar</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" href="/#hizmetler">Hizmetler</Link></li>
            <li><Link className="hover:text-white" href="/projeler">Projeler</Link></li>
            <li><Link className="hover:text-white" href="/#surec">Çalışma süreci</Link></li>
            <li><Link className="hover:text-white" href="/iletisim">İletişim ve teklif</Link></li>
            <li><Link className="hover:text-white" href="/kvkk">KVKK aydınlatma metni</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-sm font-bold text-white">İletişim</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden /> {contact.address}</li>
            {contact.phone ? <li><a className="flex gap-2.5 hover:text-white" href={`tel:${contact.phone.replace(/\s/g, "")}`}><Phone className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden /> {contact.phone}</a></li> : null}
            {contact.email ? <li><a className="flex gap-2.5 hover:text-white" href={`mailto:${contact.email}`}><Mail className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden /> {contact.email}</a></li> : null}
            {wa ? <li><a className="flex gap-2.5 hover:text-white" href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-400" aria-hidden /> WhatsApp</a></li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-navy-400 sm:flex-row">
          <p>© {year} {contact.companyName}. Tüm hakları saklıdır.</p>
          <p>{site.domain}</p>
        </div>
      </div>
    </footer>
  );
}
