import { MessageCircle } from "lucide-react";

export function WhatsAppFab({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile yazın"
      className="motion-press fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-[#1f9d55] px-5 text-sm font-bold text-white shadow-lift transition hover:bg-[#188a49]"
    >
      <MessageCircle className="size-5" aria-hidden />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
