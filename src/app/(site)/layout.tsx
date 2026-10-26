import { SiteHeader } from "@/components/public/header";
import { SiteFooter } from "@/components/public/footer";
import { WhatsAppFab } from "@/components/public/whatsapp-fab";
import { ToastProvider } from "@/components/ui/toast";
import { SCROLL_REVEAL_BOOTSTRAP, ScrollReveal } from "@/components/public/scroll-reveal";
import { getPublicContact, waHref } from "@/server/public";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const contact = await getPublicContact();
  return (
    <ToastProvider>
      <script dangerouslySetInnerHTML={{ __html: SCROLL_REVEAL_BOOTSTRAP }} />
      <ScrollReveal />
      <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lift">
        İçeriğe geç
      </a>
      <SiteHeader />
      <main id="icerik">{children}</main>
      <SiteFooter contact={contact} />
      <WhatsAppFab href={waHref(contact.whatsapp, "Merhaba, Kalkan Digital web sitenizden ulaşıyorum.")} />
    </ToastProvider>
  );
}
