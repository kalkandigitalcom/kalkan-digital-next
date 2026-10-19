import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <p className="font-display text-5xl font-bold text-navy-200">404</p>
      <h1 className="mt-2 font-display text-lg font-semibold text-navy-900">Kayıt bulunamadı</h1>
      <p className="mt-1 text-sm text-navy-500">Aradığınız kayıt silinmiş veya hiç oluşturulmamış olabilir.</p>
      <LinkButton href="/admin/dashboard" className="mt-6">Genel bakışa dön</LinkButton>
    </div>
  );
}
