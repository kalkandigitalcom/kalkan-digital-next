import type { Metadata } from "next";
import { getPublicContact } from "@/server/public";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "KVKK aydınlatma metni", alternates: { canonical: "/kvkk" } };

export default async function KvkkPage() {
  const c = await getPublicContact();
  return (
    <>
      <section className="bg-navy-900 pb-14 pt-36">
        <div className="container-page motion-intro-group max-w-3xl">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">KVKK aydınlatma metni</h1>
        </div>
      </section>
      <section className="py-14">
        <div data-reveal className="container-page max-w-3xl space-y-5 leading-relaxed text-navy-700">
          <p>
            {c.companyName} olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, web sitemizdeki iletişim ve teklif formu aracılığıyla
            paylaştığınız ad soyad, firma, e-posta, telefon ve mesaj içeriği bilgilerinizi yalnızca talebinize dönüş yapmak, teklif hazırlamak ve
            sizinle iletişim kurmak amacıyla işliyoruz.
          </p>
          <p>Bu veriler, açık rızanız olmadan üçüncü kişilerle paylaşılmaz ve yalnızca yetkili çalışanlarımızın erişebildiği güvenli sistemlerde saklanır.</p>
          <p>
            Kanun&apos;un 11. maddesi kapsamındaki haklarınızı (bilgi talep etme, düzeltme, silme vb.) kullanmak için
            {c.email ? <> <a className="font-semibold text-brand-600 underline" href={`mailto:${c.email}`}>{c.email}</a> adresine</> : " bizimle iletişime geçerek"} başvurabilirsiniz.
          </p>
          <p className="text-sm text-navy-400">Not: Bu metin genel bilgilendirme amaçlıdır; yayına almadan önce hukuk danışmanınızla gözden geçirmeniz önerilir.</p>
        </div>
      </section>
    </>
  );
}
