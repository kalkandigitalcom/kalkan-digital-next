/**
 * Service and villa software pages (strategy report v3.2: 3.5, 3.13, 4.2–4.6, 5.2–5.5).
 *
 * Rules for this content:
 * - One target keyword group per page (report 4.2); other pages only link to it.
 * - Only verified facts. No durations, prices, response times, payment/cargo provider names or
 *   platform lists that the report marks as unverified. No ranking guarantees.
 * - Villa software: Airbnb and Booking.com two-way calendar sync is ready; other platforms only as
 *   custom development; never "real-time"/"instant". Online payment only as an optional custom
 *   integration, never as a ready feature.
 */

export type ServiceKey = "web_design" | "software" | "villa_rental_software" | "hosting_support";

export interface LinkCard {
  href: string;
  title: string;
  text: string;
}

export type Block =
  | { type: "features"; id: string; eyebrow: string; title: string; text?: string; items: { icon: string; title: string; text: string }[]; columns?: 2 | 3 | 4; tone?: "light" | "surface" | "dark" }
  | { type: "split"; id: string; eyebrow: string; title: string; paragraphs: string[]; bullets?: string[]; tone?: "light" | "surface" | "dark"; link?: { href: string; label: string } }
  | { type: "steps"; id: string; eyebrow: string; title: string; text?: string; items: { title: string; text: string }[]; tone?: "light" | "surface" }
  | { type: "flow"; id: string; eyebrow: string; title: string; text?: string; items: { icon: string; title: string; text: string }[]; tone?: "light" | "surface" | "dark" }
  | { type: "compare"; id: string; eyebrow: string; title: string; text?: string; columns: { title: string; tag: string; points: string[]; example?: string }[]; note?: string; tone?: "light" | "surface" }
  | { type: "checklist"; id: string; eyebrow: string; title: string; text: string; items: string[]; tone?: "light" | "surface"; note?: string }
  | { type: "scenarios"; id: string; eyebrow: string; title: string; text?: string; items: { title: string; text: string; href?: string; linkLabel?: string }[]; tone?: "light" | "surface" }
  | { type: "services"; id: string; eyebrow: string; title: string; text?: string; items: (LinkCard & { icon: string })[] }
  | { type: "sync"; id: string; eyebrow: string; title: string; text: string }
  | { type: "statuses"; id: string; eyebrow: string; title: string; text: string; statuses: { label: string; tone: "free" | "busy" | "pending" | "ok" | "pay" }[]; points: string[] }
  | { type: "optional"; id: string; eyebrow: string; title: string; text: string; items: { title: string; text: string }[] }
  | { type: "projects"; id: string; eyebrow: string; title: string; text?: string; categories: string[]; tone?: "light" | "dark" };

export interface ServicePage {
  path: string;
  kind: "web" | "villa";
  /** Short label used in breadcrumbs, menus and cards */
  label: string;
  /** Parent breadcrumb (besides the home page) */
  parent?: { href: string; label: string };
  seo: { title: string; description: string; keywords: string[] };
  schema: { serviceType: string; name: string };
  hero: { eyebrow: string; h1: string; lead: string; highlights: { icon: string; label: string }[] };
  cta: { primary: string; hizmet: ServiceKey; whatsapp: string; bandTitle: string; bandText: string };
  blocks: Block[];
  faq: { q: string; a: string }[];
  related: LinkCard[];
  crossLink?: LinkCard & { eyebrow: string };
}

const WEB_WA = "Merhaba, web sitesi / yazılım için bilgi almak istiyorum.";
const VILLA_WA = "Merhaba, villa kiralama sitesi için bilgi almak istiyorum.";

export const SERVICES_HUB = { href: "/hizmetler", label: "Hizmetler" };
export const VILLA_HUB = { href: "/villa-kiralama-yazilimi", label: "Villa Kiralama Yazılımı" };

/* ------------------------------------------------------------------------------------------------
 * A. Web Tasarım ve Dijital Çözümler
 * --------------------------------------------------------------------------------------------- */

export const hubPage: ServicePage = {
  path: "/hizmetler",
  kind: "web",
  label: "Hizmetler",
  seo: {
    title: "Web Tasarım ve Dijital Çözümler",
    description: "Kurumsal web tasarım, özel web yazılım, WordPress, e-ticaret, hosting ve teknik destek. İhtiyacınıza uygun çözümü birlikte seçelim.",
    keywords: ["web tasarım ve dijital çözümler", "web tasarım hizmetleri"],
  },
  schema: { serviceType: "Web tasarım ve yazılım hizmetleri", name: "Web Tasarım ve Dijital Çözümler" },
  hero: {
    eyebrow: "Hizmetler",
    h1: "Web tasarım ve dijital çözümler",
    lead: "Kurumsal web sitesinden işinize özel yazılıma, WordPress ve e-ticaretten sunucu ve teknik desteğe kadar; işletmenizin dijital altyapısını tek ekipte kuruyor, yayından sonra da yönetiyoruz.",
    highlights: [
      { icon: "MonitorSmartphone", label: "Kurumsal web tasarım" },
      { icon: "Code2", label: "Özel web yazılım" },
      { icon: "ShoppingCart", label: "E-ticaret" },
      { icon: "ServerCog", label: "Hosting ve teknik destek" },
    ],
  },
  cta: { primary: "Ücretsiz teklif alın", hizmet: "web_design", whatsapp: WEB_WA, bandTitle: "Hangi hizmetin size uygun olduğundan emin değil misiniz?", bandText: "İşinizi birkaç cümleyle anlatın; size uygun çözümü ve kapsamı yazılı olarak paylaşalım." },
  blocks: [
    {
      type: "services",
      id: "hizmetlerimiz",
      eyebrow: "Hizmetlerimiz",
      title: "Beş hizmet, tek ekip",
      text: "Her hizmetin kendi sayfasında neleri kapsadığını, nasıl çalıştığımızı ve sık sorulan soruları bulabilirsiniz.",
      items: [
        { icon: "MonitorSmartphone", href: "/hizmetler/kurumsal-web-tasarim", title: "Kurumsal web tasarım", text: "Markanızı doğru anlatan, hızlı, mobil uyumlu ve SEO altyapılı kurumsal web siteleri." },
        { icon: "Code2", href: "/hizmetler/ozel-yazilim", title: "Özel web yazılım", text: "Teklif, takip, rezervasyon ve raporlama için iş akışınıza göre geliştirilen sistemler." },
        { icon: "LayoutTemplate", href: "/hizmetler/wordpress", title: "WordPress", text: "İçeriğini kendiniz yönetebileceğiniz, güvenli ve bakımlı WordPress siteleri." },
        { icon: "ShoppingCart", href: "/hizmetler/e-ticaret", title: "E-ticaret", text: "Ürünlerinizi online satmanız için mağaza, ürün, stok ve sipariş yönetimi." },
        { icon: "ServerCog", href: "/hizmetler/hosting-teknik-destek", title: "Hosting ve teknik destek", text: "Sunucu, yedekleme, güncelleme ve teknik destekle siteniz yayından sonra da güvende." },
      ],
    },
    {
      type: "scenarios",
      id: "hangisi-size-uygun",
      eyebrow: "Yol haritası",
      title: "Hangisi size uygun?",
      text: "İhtiyacınızı en iyi anlatan durumu seçin; doğru hizmet sayfasına yönlendirelim.",
      tone: "surface",
      items: [
        { title: "İşletmemi tanıtmak ve müşteri talebi almak istiyorum", text: "Hizmetlerinizi, iletişim bilgilerinizi ve referanslarınızı net anlatan, hızlı bir kurumsal site.", href: "/hizmetler/kurumsal-web-tasarim", linkLabel: "Kurumsal web tasarım" },
        { title: "İçeriğimi sık güncelliyorum, blog veya duyuru yayınlıyorum", text: "Yazı, sayfa ve görselleri kendi ekibinizle kolayca yönettiğiniz bir yapı.", href: "/hizmetler/wordpress", linkLabel: "WordPress" },
        { title: "Ürünlerimi internetten satmak istiyorum", text: "Ürün, stok ve sipariş yönetimiyle birlikte mobilde rahat alışveriş sunan bir mağaza.", href: "/hizmetler/e-ticaret", linkLabel: "E-ticaret" },
        { title: "İş süreçlerim hazır programlara sığmıyor", text: "Excel tabloları ve mesaj gruplarının yerini alacak, işinize göre tasarlanmış bir sistem.", href: "/hizmetler/ozel-yazilim", linkLabel: "Özel web yazılım" },
      ],
    },
    {
      type: "features",
      id: "dijital-pazarlama-destegi",
      eyebrow: "Tamamlayıcı hizmetler",
      title: "Dijital pazarlama ve kurumsal e-posta desteği",
      text: "Sitenizi kurduktan sonra görünürlüğünüzü ve iletişiminizi destekleyen hizmetler. Kapsamı ihtiyacınıza göre birlikte belirliyoruz.",
      columns: 3,
      items: [
        { icon: "Megaphone", title: "Google Ads ve dijital reklam", text: "Google Ads kampanyalarının kurulumu, optimizasyonu ve performans takibi." },
        { icon: "Share2", title: "Sosyal medya yönetimi", text: "Hesap yönetimi, içerik planlama ve dijital reklam çalışmaları." },
        { icon: "Mail", title: "Kurumsal e-posta", text: "Alan adınıza özel e-posta adreslerinin kurulumu, yapılandırması ve teknik yönetimi." },
      ],
    },
    { type: "projects", id: "projeler", eyebrow: "Referanslar", title: "Web ve yazılım projelerimizden", categories: ["web_design", "software", "hotel_tourism_web", "hosting_support"] },
  ],
  faq: [
    { q: "Web sitesi yaptırmak ne kadar tutar?", a: "Sayfa sayısı, dil, yönetim paneli, e-ticaret veya rezervasyon gibi özellikler ve içerik desteğine göre değişir. Kısa bir görüşmeden sonra kapsamı yazılı olarak paylaşır, net fiyat veririz." },
    { q: "WordPress mi, özel yazılım mı?", a: "İçeriği sık değişen siteler için WordPress, iş süreçlerine özel ihtiyaçlar için özel yazılım genellikle daha doğru seçimdir. İkisini de geliştirdiğimiz için görüşmede size uygun olanı birlikte belirliyoruz." },
    { q: "Yayından sonra destek veriyor musunuz?", a: "Evet. Hosting, yedekleme, güncelleme ve teknik destek hizmetimizle sitenizi yayından sonra da çalışır ve güvende tutuyoruz." },
    { q: "Sadece Kaş ve Kalkan'a mı hizmet veriyorsunuz?", a: "Merkezimiz Kaş'ta. Antalya'nın ve Fethiye başta olmak üzere Muğla'nın tamamına, ayrıca Türkiye genelinde uzaktan hizmet veriyoruz." },
  ],
  related: [],
  crossLink: { eyebrow: "Villa kiralama işletmeleri için", href: "/villa-kiralama-yazilimi", title: "Villa kiralama işi mi yapıyorsunuz?", text: "Airbnb ve Booking.com ile çift yönlü takvim eşitlemeli, çok dilli ve çok para birimli villa kiralama yazılımımızı inceleyin." },
};

export const webServicePages: ServicePage[] = [
  {
    path: "/hizmetler/kurumsal-web-tasarim",
    kind: "web",
    label: "Kurumsal web tasarım",
    parent: SERVICES_HUB,
    seo: {
      title: "Kurumsal Web Tasarım",
      description: "Hızlı, mobil uyumlu ve SEO altyapılı kurumsal web siteleri. Tasarım, içerik, yayın ve bakım tek ekipte. Ücretsiz teklif alın.",
      keywords: ["kurumsal web tasarım", "kurumsal web sitesi", "web sitesi yaptırmak"],
    },
    schema: { serviceType: "Kurumsal web tasarım", name: "Kurumsal Web Tasarım" },
    hero: {
      eyebrow: "Web Tasarım ve Dijital Çözümler",
      h1: "Kurumsal web tasarım",
      lead: "İşletmenizi doğru anlatan, hızlı açılan ve ziyaretçiyi size ulaştıran bir web sitesi. Tasarım, teknik altyapı, yayın ve sonrasındaki bakım aynı ekipte.",
      highlights: [
        { icon: "PenTool", label: "Markanıza özel tasarım" },
        { icon: "Smartphone", label: "Mobil uyumlu" },
        { icon: "Search", label: "SEO altyapısı" },
        { icon: "LayoutDashboard", label: "Yönetim paneli" },
      ],
    },
    cta: { primary: "Kurumsal siteniz için teklif alın", hizmet: "web_design", whatsapp: "Merhaba, kurumsal web sitesi için bilgi almak istiyorum.", bandTitle: "Kurumsal sitenizi birlikte planlayalım.", bandText: "Sayfa yapısı, içerik ve özellikler için kısa bir ön görüşme yapalım; kapsamı ve takvimi yazılı paylaşalım." },
    blocks: [
      {
        type: "split",
        id: "kimler-icin",
        eyebrow: "Kimler için?",
        title: "Siteniz işletmenizin vitrini olmalı, eksik bir broşür değil",
        paragraphs: [
          "Müşterileriniz sizi önce internette arıyor. Eski görünen, telefonda zor okunan veya güncel olmayan bir site; iyi hizmet veren bir işletmeyi bile olduğundan zayıf gösterir.",
          "Kurumsal web tasarımda amacımız, ne yaptığınızı ilk ekranda anlatan ve ziyaretçiyi doğru adıma (arama, WhatsApp, teklif formu) yönlendiren bir yapı kurmak.",
        ],
        bullets: ["Yeni kurulan ve ilk sitesini yaptıracak işletmeler", "Eski veya yavaş sitesini yenilemek isteyen firmalar", "Turizm, sağlık, hizmet ve üretim sektöründeki işletmeler", "Birden fazla hizmeti veya şubesi olan kurumlar"],
      },
      {
        type: "features",
        id: "neler-dahil",
        eyebrow: "Neler dahil?",
        title: "Bir kurumsal sitede olması gerekenler",
        tone: "surface",
        columns: 3,
        items: [
          { icon: "PenTool", title: "Markanıza özel tasarım", text: "Renkleriniz, logonuz ve hizmetlerinize göre kurgulanan sayfa tasarımları." },
          { icon: "Smartphone", title: "Mobil uyum", text: "Telefon, tablet ve masaüstünde rahat okunan, dokunmaya uygun arayüz." },
          { icon: "Search", title: "Temel SEO altyapısı", text: "Başlık ve açıklama yapısı, site haritası, temiz URL'ler ve hızlı sayfalar." },
          { icon: "MessageCircle", title: "İletişim ve WhatsApp", text: "Arama, WhatsApp ve teklif formuyla ziyaretçinin size kolayca ulaşması." },
          { icon: "LayoutDashboard", title: "Yönetim paneli", text: "Metin, görsel ve duyuruları kendi ekibinizle güncelleyebileceğiniz panel." },
          { icon: "ShieldCheck", title: "KVKK ve güvenlik", text: "Aydınlatma metni sayfası, güvenli form yapısı ve SSL ile şifreli bağlantı." },
        ],
      },
      {
        type: "steps",
        id: "tasarim-sureci",
        eyebrow: "Tasarım süreci",
        title: "İlk görüşmeden yayına",
        items: [
          { title: "Keşif", text: "İşletmenizi, hedef müşterilerinizi ve rakiplerinizi dinliyoruz." },
          { title: "Site haritası", text: "Sayfaları ve her sayfanın içeriğini birlikte planlıyoruz." },
          { title: "Tasarım", text: "Ana sayfa ve iç sayfa tasarımlarını onayınıza sunuyoruz." },
          { title: "Geliştirme", text: "Siteyi kuruyor, içerikleri yerleştiriyor, mobil ve hız testlerini yapıyoruz." },
          { title: "Yayın", text: "Siteyi yayına alıyor, panel kullanımını gösteriyoruz." },
        ],
      },
      {
        type: "split",
        id: "hiz-ve-seo",
        eyebrow: "Hız ve SEO altyapısı",
        title: "Arama motorlarına doğru kurulmuş bir site",
        tone: "dark",
        paragraphs: [
          "Arama motorlarında belirli bir sıra kimse tarafından garanti edilemez. Bizim işimiz, sitenizin teknik olarak doğru kurulmasını sağlamak: hızlı açılan sayfalar, anlamlı başlık yapısı ve arama motorlarının kolayca okuyabildiği bir içerik düzeni.",
        ],
        bullets: ["Her sayfa için ayrı başlık ve açıklama", "Mobil öncelikli, hızlı yüklenen sayfalar", "Site haritası ve temiz URL yapısı", "Yapılandırılmış veri ile işletme bilgileri"],
      },
      {
        type: "checklist",
        id: "fiyati-etkileyenler",
        eyebrow: "Fiyatı etkileyenler",
        title: "Teklifi neler belirler?",
        text: "Her işletmenin ihtiyacı farklı olduğu için hazır paket yerine kapsamı birlikte netleştiriyoruz. Teklifi en çok şu konular etkiler:",
        tone: "surface",
        items: ["Sayfa sayısı ve içerik yoğunluğu", "Dil sayısı", "Teklif formu, rezervasyon gibi özel modüller", "Metin ve görsel hazırlığında destek ihtiyacı", "Harici sistemlerle bağlantılar", "Yayın sonrası hosting ve bakım"],
      },
      { type: "projects", id: "projeler", eyebrow: "Projeler", title: "Kurumsal projelerimizden", categories: ["web_design", "hotel_tourism_web"] },
    ],
    faq: [
      { q: "Kurumsal site ne kadar sürede hazır olur?", a: "Sayfa sayısına, içeriklerin hazır olup olmadığına ve özel modüllere göre değişir. Ön görüşmeden sonra kapsamla birlikte yazılı bir takvim paylaşıyoruz." },
      { q: "Siteyi kendim güncelleyebilir miyim?", a: "Evet. Metin, görsel ve duyuruları yönetim panelinden güncelleyebilirsiniz; yayından önce kısa bir kullanım eğitimi veriyoruz." },
      { q: "Google'da ilk sırada çıkar mıyım?", a: "Hiçbir firma sıralama garantisi veremez. Sitenizi arama motorlarına teknik olarak doğru, hızlı ve mobil uyumlu kuruyoruz; sıralama zamanla içerik, rekabet ve sitenin itibarıyla şekillenir." },
      { q: "Hosting ve bakımı siz mi yapıyorsunuz?", a: "İsterseniz evet. Hosting ve teknik destek hizmetimizle sitenizin sunucusunu, yedeklerini ve güncellemelerini yönetiyoruz." },
    ],
    related: [
      { href: "/hizmetler/wordpress", title: "WordPress ile mi kurulsun?", text: "İçeriğini sık güncelleyen kurumlar için WordPress seçeneği." },
      { href: "/hizmetler/hosting-teknik-destek", title: "Hosting ve teknik destek", text: "Yayından sonra sunucu, yedekleme ve güncellemeler." },
      { href: "/hizmetler/e-ticaret", title: "E-ticaret", text: "Ürün satışı da yapmak istiyorsanız mağaza altyapısı." },
    ],
    crossLink: { eyebrow: "Turizm işletmeleri için", href: "/villa-kiralama-yazilimi/villa-kiralama-sitesi", title: "Villa kiralama sitesi mi düşünüyorsunuz?", text: "Villa ve bungalov işletmeleri için takvim, dönemsel fiyat ve rezervasyon talebi içeren kiralama sitelerimizi inceleyin." },
  },
  {
    path: "/hizmetler/ozel-yazilim",
    kind: "web",
    label: "Özel web yazılım",
    parent: SERVICES_HUB,
    seo: {
      title: "Özel Web Yazılım Geliştirme",
      description: "İş süreçlerinize göre yönetim paneli, rezervasyon, teklif ve takip sistemleri. Güvenli, hızlı ve web tabanlı yazılım. Ön görüşme ücretsiz.",
      keywords: ["özel web yazılım", "web uygulaması geliştirme", "yönetim paneli yazılımı"],
    },
    schema: { serviceType: "Özel web yazılım geliştirme", name: "Özel Web Yazılım Geliştirme" },
    hero: {
      eyebrow: "Web Tasarım ve Dijital Çözümler",
      h1: "Özel web yazılım geliştirme",
      lead: "Hazır programlar işinize tam uymuyorsa, iş akışınıza göre bir sistem kuruyoruz: müşteri ve proje takibi, teklif ve tahsilat, rezervasyon, raporlama. Tarayıcıdan, her cihazdan erişilen web tabanlı yazılımlar.",
      highlights: [
        { icon: "LayoutDashboard", label: "Yönetim panelleri" },
        { icon: "Users", label: "Müşteri ve proje takibi" },
        { icon: "CalendarCheck", label: "Rezervasyon sistemleri" },
        { icon: "BarChart3", label: "Raporlama" },
      ],
    },
    cta: { primary: "Yazılım ihtiyacınızı anlatın", hizmet: "software", whatsapp: "Merhaba, özel yazılım için bilgi almak istiyorum.", bandTitle: "İş akışınızı bir görüşmede birlikte çizelim.", bandText: "Bugün nasıl çalıştığınızı anlatın; ilk aşamada neyin yapılması gerektiğini ve kapsamı yazılı olarak paylaşalım." },
    blocks: [
      {
        type: "features",
        id: "hangi-sorunlari-cozer",
        eyebrow: "Hangi sorunları çözer?",
        title: "Tablolar ve mesaj grupları yetmemeye başladığında",
        columns: 3,
        items: [
          { icon: "FileSpreadsheet", title: "Dağınık tablolar", text: "Aynı bilgi birkaç Excel dosyasında, kimin güncel olduğu belli değil." },
          { icon: "Copy", title: "Tekrarlanan veri girişi", text: "Bir müşteriyi veya siparişi farklı yerlere tekrar tekrar yazıyorsunuz." },
          { icon: "UserCog", title: "Yetki karmaşası", text: "Herkes her şeyi görüyor ya da kimin neyi değiştirdiği izlenemiyor." },
          { icon: "BarChart3", title: "Elle hazırlanan raporlar", text: "Ay sonu raporları için saatlerce veri derliyorsunuz." },
          { icon: "BellRing", title: "Takipte kalan işler", text: "Teklif, tahsilat veya görev hatırlatmaları gözden kaçıyor." },
          { icon: "Puzzle", title: "İşe uymayan hazır program", text: "Kullandığınız program sizin iş akışınıza değil, siz ona uyuyorsunuz." },
        ],
      },
      {
        type: "features",
        id: "ornek-cozumler",
        eyebrow: "Örnek çözümler",
        title: "Neler geliştirebiliriz?",
        tone: "surface",
        columns: 3,
        items: [
          { icon: "LayoutDashboard", title: "Yönetim paneli", text: "İşletmenizin verisini tek ekranda toplayan, rol bazlı yetkili panel." },
          { icon: "Users", title: "Müşteri ve proje takibi", text: "Müşteri kartları, notlar, projeler ve görevler tek yerde." },
          { icon: "Receipt", title: "Teklif ve tahsilat", text: "Teklif hazırlama, ödeme ve tahsilat takibi, vadesi geçen kayıtlar." },
          { icon: "CalendarCheck", title: "Rezervasyon sistemi", text: "Müsaitlik, fiyat dönemleri ve rezervasyon talepleri için takvim tabanlı yapı." },
          { icon: "BarChart3", title: "Raporlama", text: "Gelir, gider ve iş hacmi gibi göstergeler için otomatik raporlar." },
          { icon: "Plug", title: "Entegrasyonlar", text: "Mevcut sistemlerinizle veri alışverişi, ihtiyaca göre planlanır." },
        ],
      },
      {
        type: "split",
        id: "sektore-ozel-yazilim",
        eyebrow: "Sektöre özel yazılım örneği",
        title: "Villa kiralama sistemleri ve kendi yönetim panelimiz",
        tone: "dark",
        paragraphs: [
          "Sektöre özel yazılım deneyimimizin en iyi örneği villa kiralama sistemlerimiz: müsaitlik takvimi, dönemsel fiyatlar, rezervasyon talepleri ve Airbnb ile Booking.com'la çift yönlü takvim eşitleme.",
          "Kendi müşteri, proje ve finans takibimizi de kendi geliştirdiğimiz bir yönetim paneliyle yapıyoruz. Size önereceğimiz yaklaşımı her gün kendi işimizde kullanıyoruz.",
        ],
        link: { href: "/villa-kiralama-yazilimi", label: "Sektöre özel yazılım örneğimiz: villa kiralama yazılımı" },
      },
      {
        type: "steps",
        id: "surec",
        eyebrow: "Süreç",
        title: "Küçük başla, doğru büyüt",
        text: "Büyük bir sistemi tek seferde değil, en çok fayda sağlayacak modülden başlayarak aşamalı geliştiriyoruz.",
        items: [
          { title: "İhtiyaç analizi", text: "Bugünkü iş akışınızı ve sorun yaşadığınız noktaları birlikte çıkarıyoruz." },
          { title: "Kapsam ve öncelik", text: "İlk aşamada yapılacakları ve sonraki adımları yazılı netleştiriyoruz." },
          { title: "Arayüz ve veri yapısı", text: "Ekranları ve verilerin nasıl tutulacağını onayınıza sunuyoruz." },
          { title: "Aşamalı geliştirme", text: "Modülleri sırayla geliştirip her aşamada sizinle test ediyoruz." },
          { title: "Yayın ve bakım", text: "Sistemi yayına alıyor, ekibinize eğitim veriyor, bakımını sürdürüyoruz." },
        ],
      },
      {
        type: "checklist",
        id: "guvenlik-ve-sahiplik",
        eyebrow: "Güvenlik ve sahiplik",
        title: "Verileriniz güvende, koşullar baştan net",
        text: "İşletme verisi tutan bir yazılımda güvenlik sonradan eklenen bir özellik değildir. Geliştirdiğimiz sistemlerde şunlara dikkat ediyoruz:",
        tone: "surface",
        items: ["Rol bazlı yetkilendirme", "Parolaların güvenli biçimde saklanması", "Şifreli (SSL) bağlantı", "Düzenli yedekleme", "Önemli işlemlerin kaydının tutulması", "Kaynak kod ve kullanım koşullarının teklifte yazılı olarak belirlenmesi"],
      },
    ],
    faq: [
      { q: "Hazır program yerine neden özel yazılım?", a: "Hazır programlar genel ihtiyaçlar için tasarlanır. İş akışınız onlara uymuyorsa, ya işinizi programa uydurursunuz ya da çalışmayı tablolarla tamamlarsınız. Özel yazılım bu boşluğu kapatır; ancak her durumda gerekli değildir, görüşmede bunu da açıkça söylüyoruz." },
      { q: "Mevcut verilerimi yeni sisteme aktarabilir miyiz?", a: "Tablolarınızdaki veya eski sisteminizdeki verilerin aktarımını kapsamda birlikte değerlendiriyoruz." },
      { q: "Sistem telefonda çalışır mı?", a: "Geliştirdiğimiz yazılımlar web tabanlıdır; tarayıcıdan, telefon ve tablet dahil her cihazdan kullanılabilir." },
      { q: "Ne kadar sürer, maliyeti nedir?", a: "Kapsama göre değişir. Önce ilk aşamayı netleştirip yazılı takvim ve teklif paylaşıyoruz; sonraki modüller ayrıca planlanır." },
    ],
    related: [
      { href: "/hizmetler/hosting-teknik-destek", title: "Hosting ve teknik destek", text: "Yazılımınızın sunucu, yedekleme ve bakımı." },
      { href: "/hizmetler/kurumsal-web-tasarim", title: "Kurumsal web tasarım", text: "Yazılımınızın yanında tanıtım siteniz için." },
      { href: "/hizmetler/e-ticaret", title: "E-ticaret", text: "Online satış ihtiyacınız varsa mağaza altyapısı." },
    ],
  },
  {
    path: "/hizmetler/wordpress",
    kind: "web",
    label: "WordPress",
    parent: SERVICES_HUB,
    seo: {
      title: "WordPress Web Tasarım ve Kurulum",
      description: "İçeriğini kolayca yönetebileceğiniz, hızlı ve güvenli WordPress siteleri: tasarım, kurulum, eklenti, bakım ve taşıma. Teklif alın.",
      keywords: ["wordpress web tasarım", "wordpress site yaptırma", "wordpress bakım"],
    },
    schema: { serviceType: "WordPress web tasarım", name: "WordPress Web Tasarım ve Kurulum" },
    hero: {
      eyebrow: "Web Tasarım ve Dijital Çözümler",
      h1: "WordPress web tasarım",
      lead: "İçeriğini sık güncellediğiniz bir kurumsal site, blog veya duyuru sayfası mı istiyorsunuz? WordPress ile siteniz kurulur, içeriği kolayca yönetirsiniz. Tasarımı, kurulumu, güvenliği ve bakımı biz üstleniyoruz; size yalnızca içerik kalıyor.",
      highlights: [
        { icon: "PenLine", label: "Kolay içerik yönetimi" },
        { icon: "Gauge", label: "Hız optimizasyonu" },
        { icon: "ShieldCheck", label: "Güncelleme ve yedekleme" },
        { icon: "ArrowRightLeft", label: "Site taşıma" },
      ],
    },
    cta: { primary: "WordPress siteniz için teklif alın", hizmet: "web_design", whatsapp: "Merhaba, WordPress sitesi için bilgi almak istiyorum.", bandTitle: "WordPress sitenizi kuralım ya da toparlayalım.", bandText: "Yeni bir site veya yavaşlayan mevcut siteniz için ihtiyacınızı anlatın; size uygun yolu önerelim." },
    blocks: [
      {
        type: "scenarios",
        id: "kimler-icin",
        eyebrow: "Kimler için?",
        title: "WordPress kimler için doğru seçim?",
        items: [
          { title: "Sık içerik yayınlayan kurumlar", text: "Duyuru, haber ve etkinlikleri kendi ekibiyle hızlıca yayınlamak isteyenler." },
          { title: "Blog ve rehber siteleri", text: "Düzenli yazı yayınlayıp arama motorlarından ziyaretçi çekmeyi hedefleyenler." },
          { title: "Çok sayfalı kurumsal siteler", text: "Hizmet, ekip ve referans sayfaları zamanla büyüyen işletmeler." },
          { title: "Kendi ekibiyle yönetmek isteyenler", text: "Her küçük değişiklik için ajansa yazmak istemeyen işletmeler." },
        ],
      },
      {
        type: "features",
        id: "tasarim-ve-kurulum",
        eyebrow: "Tasarım, kurulum ve eğitim",
        title: "Kurulumdan yayına kadar",
        tone: "surface",
        columns: 3,
        items: [
          { icon: "PenTool", title: "Markanıza uygun tasarım", text: "Sayfa yapısı, menüler ve görsel dil markanıza göre düzenlenir." },
          { icon: "Puzzle", title: "Az ve güvenilir eklenti", text: "Yalnızca ihtiyaç duyulan, güncel ve güvenilir eklentiler kullanılır." },
          { icon: "FormInput", title: "Formlar ve iletişim", text: "İletişim ve teklif formları, WhatsApp ve arama butonları." },
          { icon: "PenLine", title: "İçerik yönetimi", text: "Sayfa, yazı ve görselleri panelden kolayca ekleyip düzenlersiniz." },
          { icon: "GraduationCap", title: "Kısa eğitim", text: "Yayından önce panel kullanımını ekibinizle birlikte gözden geçiriyoruz." },
          { icon: "Search", title: "Temel SEO ayarları", text: "Başlık ve açıklamalar, site haritası ve temiz URL yapısı." },
        ],
      },
      {
        type: "checklist",
        id: "guvenlik-yedekleme",
        eyebrow: "Hız, güvenlik ve bakım",
        title: "WordPress'i güncel ve hızlı tutmak",
        text: "WordPress siteleri çoğunlukla güncellenmediği veya gereksiz eklentilerle yavaşladığı için sorun çıkarır. Bakım kapsamında:",
        items: ["Çekirdek, tema ve eklenti güncellemeleri", "Düzenli yedekleme", "Gereksiz eklentilerden arındırılmış yapı", "Görsel optimizasyonu ve önbellek", "Güvenlik önlemleri ve izleme", "Hosting ve teknik destekle birlikte yönetim"],
      },
      {
        type: "split",
        id: "mevcut-site",
        eyebrow: "Mevcut WordPress siteniz",
        title: "Sitenizi devralıyor, hızlandırıyor ve toparlıyoruz",
        tone: "dark",
        paragraphs: [
          "Yavaşlayan, uzun süredir güncellenmeyen veya kimin yönettiği belli olmayan bir WordPress siteniz mi var? Önce inceliyoruz: kullanılmayan eklentiler, eski sürümler, yedekleme ve hız sorunları.",
          "Ardından sitenizi güvenli hale getiriyor, hızlandırıyor ya da yeni bir sunucuya taşıyoruz.",
        ],
        link: { href: "/hizmetler/hosting-teknik-destek", label: "Site taşıma ve teknik destek" },
      },
      {
        type: "compare",
        id: "wordpress-mi-ozel-yazilim-mi",
        eyebrow: "Karar rehberi",
        title: "WordPress mi, özel yazılım mı?",
        text: "İkisini de geliştirdiğimiz için size uygun olanı tarafsızca önerebiliyoruz.",
        tone: "surface",
        columns: [
          { title: "WordPress", tag: "İçerik ağırlıklı siteler", points: ["Sayfa ve yazı yönetimi kolay", "Kurumsal site, blog ve duyuru sayfaları için uygun", "Düzenli güncelleme ve bakım gerektirir"] },
          { title: "Özel yazılım", tag: "İş süreçlerine özel ihtiyaçlar", points: ["Rezervasyon, teklif, stok gibi iş akışları", "Yalnızca ihtiyacınız olan özellikler", "Verileriniz ve ekranlarınız işinize göre tasarlanır"] },
        ],
        note: "Kararsız mısınız? Ön görüşmede ihtiyacınıza göre birlikte seçiyoruz.",
      },
    ],
    faq: [
      { q: "Siteyi kendim güncelleyebilir miyim?", a: "Evet. Sayfa, yazı ve görselleri WordPress panelinden kendiniz ekleyip düzenleyebilirsiniz; yayından önce kısa bir eğitim veriyoruz." },
      { q: "Eklenti ve güncellemeleri kim yapar?", a: "Bakım hizmeti aldığınızda çekirdek, tema ve eklenti güncellemelerini ve yedeklemeyi biz yönetiyoruz." },
      { q: "Mevcut WordPress sitemi devralır mısınız?", a: "Evet. Önce sitenizi inceliyor, ardından güvenlik, hız ve bakım için yapılması gerekenleri öneriyoruz." },
      { q: "Hosting dahil mi?", a: "İsterseniz WordPress sitenizi kendi yönettiğimiz altyapıda barındırıyoruz; kapsam teklifte yazılı olarak belirtilir." },
    ],
    related: [
      { href: "/hizmetler/kurumsal-web-tasarim", title: "Kurumsal web tasarım", text: "Kurumsal sitenizin tasarım ve içerik planı." },
      { href: "/hizmetler/hosting-teknik-destek", title: "Hosting ve teknik destek", text: "WordPress siteniz için sunucu ve bakım." },
      { href: "/hizmetler/e-ticaret", title: "E-ticaret", text: "Ürün satışı için mağaza altyapısı." },
    ],
  },
  {
    path: "/hizmetler/e-ticaret",
    kind: "web",
    label: "E-ticaret",
    parent: SERVICES_HUB,
    seo: {
      title: "E-Ticaret Sitesi Yaptırma",
      description: "Ürünlerinizi online satmanız için e-ticaret sitesi: ürün ve stok yönetimi, ödeme ve kargo entegrasyonları, mobil uyum ve SEO. Teklif alın.",
      keywords: ["e-ticaret sitesi yaptırma", "e-ticaret sitesi kurmak", "online satış sitesi"],
    },
    schema: { serviceType: "E-ticaret sitesi", name: "E-Ticaret Sitesi Yaptırma" },
    hero: {
      eyebrow: "Web Tasarım ve Dijital Çözümler",
      h1: "E-ticaret sitesi yaptırma",
      lead: "Ürünlerinizi online satmak için ihtiyacınıza uygun e-ticaret sitesini kuruyoruz: ürün ve kategori yapısı, stok ve sipariş yönetimi, ödeme ve kargo entegrasyonları, mobilde rahat alışveriş ve arama motorlarına uygun ürün sayfaları.",
      highlights: [
        { icon: "Package", label: "Ürün ve stok yönetimi" },
        { icon: "CreditCard", label: "Ödeme entegrasyonu" },
        { icon: "Truck", label: "Kargo entegrasyonu" },
        { icon: "Smartphone", label: "Mobil alışveriş" },
      ],
    },
    cta: { primary: "E-ticaret siteniz için teklif alın", hizmet: "web_design", whatsapp: "Merhaba, e-ticaret sitesi için bilgi almak istiyorum.", bandTitle: "Online satışa doğru altyapıyla başlayın.", bandText: "Ürün sayınızı, satış kanallarınızı ve hedeflerinizi anlatın; altyapı ve kapsam önerimizi yazılı paylaşalım." },
    blocks: [
      {
        type: "flow",
        id: "satis-akisi",
        eyebrow: "Satış akışı",
        title: "Ziyaretçiden siparişe kadar her adım",
        text: "İyi bir e-ticaret sitesi yalnızca güzel ürün sayfalarından ibaret değildir; ödeme, sipariş ve kargo adımlarının da sorunsuz işlemesi gerekir.",
        items: [
          { icon: "Search", title: "Keşif", text: "Kategori, filtre ve arama" },
          { icon: "Package", title: "Ürün sayfası", text: "Görsel, varyasyon, stok" },
          { icon: "ShoppingCart", title: "Sepet ve ödeme", text: "Seçtiğiniz ödeme kuruluşu" },
          { icon: "ClipboardList", title: "Sipariş", text: "Durum takibi ve bildirim" },
          { icon: "Truck", title: "Kargo", text: "Çalıştığınız kargo firması" },
        ],
      },
      {
        type: "split",
        id: "kimler-icin",
        eyebrow: "Kimler için?",
        title: "Online satışa başlamak ya da mağazasını yenilemek isteyenler",
        tone: "surface",
        paragraphs: [
          "Ürünlerini internetten satmak isteyen yerel üreticiler, mağazalar ve markalar ile mevcut e-ticaret sitesini daha hızlı ve yönetilebilir hale getirmek isteyen işletmeler için çalışıyoruz.",
          "Altyapıyı ürün sayınıza, satış hedeflerinize ve bütçenize göre birlikte seçiyoruz; herkese aynı paketi önermiyoruz.",
        ],
      },
      {
        type: "features",
        id: "urun-ve-stok",
        eyebrow: "Mağaza yönetimi",
        title: "Ürün, kategori, stok ve sipariş yönetimi",
        columns: 4,
        items: [
          { icon: "Layers", title: "Kategoriler", text: "Ürünlerinizi mantıklı kategori ve filtrelerle düzenleyin." },
          { icon: "Shapes", title: "Varyasyonlar", text: "Beden, renk gibi seçenekleri tek üründe yönetin." },
          { icon: "Boxes", title: "Stok takibi", text: "Stok bilgisini panelden güncelleyin, tükenen ürünleri görün." },
          { icon: "ClipboardList", title: "Sipariş durumları", text: "Siparişleri hazırlanıyor, kargoda gibi durumlarla takip edin." },
        ],
      },
      {
        type: "split",
        id: "odeme-ve-kargo",
        eyebrow: "Ödeme ve kargo entegrasyonları",
        title: "Çalıştığınız kuruluşlara göre planlanır",
        tone: "dark",
        paragraphs: [
          "Ödeme ve kargo entegrasyonları, anlaşma yaptığınız ödeme kuruluşu ve kargo firmasının sunduğu imkânlara göre kurulur. Hangi seçeneklerin size uygun olduğunu proje başında birlikte değerlendiriyoruz.",
        ],
        bullets: ["Ödeme kuruluşunuzla entegrasyon", "Kargo firmanızla gönderi süreci", "Sipariş ve ödeme bildirimleri"],
      },
      {
        type: "checklist",
        id: "yasal-sayfalar",
        eyebrow: "Mobil uyum, SEO ve yasal sayfalar",
        title: "Satışa hazır bir mağazanın kontrol listesi",
        text: "Teknik altyapının yanında müşteri güveni ve yasal yükümlülükler için gereken sayfaları da kuruyoruz.",
        tone: "surface",
        items: ["Mobilde kolay alışveriş", "Hızlı açılan ürün ve kategori sayfaları", "Arama motorlarına uygun ürün sayfaları", "Mesafeli satış sözleşmesi sayfası", "İade ve değişim koşulları sayfası", "KVKK ve çerez politikası sayfaları"],
        note: "Yasal metinlerin içeriğinin hukuk danışmanınız tarafından kontrol edilmesini öneriyoruz.",
      },
      {
        type: "steps",
        id: "surec",
        eyebrow: "Süreç",
        title: "Mağazanız nasıl kuruluyor?",
        items: [
          { title: "İhtiyaç ve altyapı", text: "Ürün yapınızı ve satış hedeflerinizi konuşup altyapıyı seçiyoruz." },
          { title: "Tasarım", text: "Ana sayfa, kategori ve ürün sayfası tasarımlarını onayınıza sunuyoruz." },
          { title: "Kurulum", text: "Mağazayı, ödeme ve kargo bağlantılarını kuruyoruz." },
          { title: "Ürün ve eğitim", text: "Ürün yükleme yöntemini gösteriyor, ilk ürünleri birlikte giriyoruz." },
          { title: "Test ve yayın", text: "Sipariş akışını uçtan uca test edip mağazayı açıyoruz." },
        ],
      },
    ],
    faq: [
      { q: "Ürünleri kendim ekleyebilir miyim?", a: "Evet. Ürün, kategori, stok ve fiyatları yönetim panelinden kendiniz güncelleyebilirsiniz; yayından önce kısa bir eğitim veriyoruz." },
      { q: "Hangi ödeme yöntemlerini kullanabilirim?", a: "Bu, anlaşma yaptığınız ödeme kuruluşuna bağlıdır. Proje başında seçenekleri birlikte değerlendirip entegrasyonu buna göre planlıyoruz." },
      { q: "Yasal sayfaları siz mi hazırlıyorsunuz?", a: "Mesafeli satış, iade ve KVKK sayfalarını sitede kuruyoruz; metinlerin içeriğinin hukuk danışmanınız tarafından kontrol edilmesini öneriyoruz." },
      { q: "Hosting ve bakım dahil mi?", a: "İsterseniz mağazanızı kendi yönettiğimiz altyapıda barındırıyor, güncelleme ve yedeklemesini yapıyoruz; kapsam teklifte belirtilir." },
    ],
    related: [
      { href: "/hizmetler/ozel-yazilim", title: "Özel web yazılım", text: "Standart mağaza yapısına sığmayan ihtiyaçlar için." },
      { href: "/hizmetler/wordpress", title: "WordPress", text: "İçerik ağırlıklı siteler için kolay yönetim." },
      { href: "/hizmetler/hosting-teknik-destek", title: "Hosting ve teknik destek", text: "Mağazanızın sunucu, yedek ve bakımı." },
    ],
  },
  {
    path: "/hizmetler/hosting-teknik-destek",
    kind: "web",
    label: "Hosting ve teknik destek",
    parent: SERVICES_HUB,
    seo: {
      title: "Hosting ve Teknik Destek",
      description: "Güvenli sunucu, düzenli yedekleme, güncelleme ve teknik destek. Web sitenizi ve villa kiralama sisteminizi çalışır ve güvende tutuyoruz.",
      keywords: ["hosting ve teknik destek", "web sitesi bakım", "sunucu yönetimi"],
    },
    schema: { serviceType: "Hosting ve teknik destek", name: "Hosting ve Teknik Destek" },
    hero: {
      eyebrow: "Web Tasarım ve Dijital Çözümler",
      h1: "Hosting ve teknik destek",
      lead: "Sitenizi kurduktan sonra çalışır, güncel ve güvende tutuyoruz: güvenilir sunucu altyapısı, düzenli yedekleme, güncellemeler ve teknik destek. Geliştirdiğimiz sitelerin barındırmasını kendi yönettiğimiz altyapıda yapıyoruz.",
      highlights: [
        { icon: "Server", label: "Sunucu altyapısı" },
        { icon: "DatabaseBackup", label: "Düzenli yedekleme" },
        { icon: "RefreshCw", label: "Güncellemeler" },
        { icon: "LifeBuoy", label: "Teknik destek" },
      ],
    },
    cta: { primary: "Hosting ve destek için teklif alın", hizmet: "hosting_support", whatsapp: "Merhaba, hosting ve teknik destek için bilgi almak istiyorum.", bandTitle: "Sitenizin teknik tarafını bize bırakın.", bandText: "Mevcut sitenizi ve sunucunuzu anlatın; taşıma, bakım ve destek kapsamını birlikte belirleyelim." },
    blocks: [
      {
        type: "checklist",
        id: "neler-dahil",
        eyebrow: "Neler dahil?",
        title: "Sitenizin arkasındaki her şey",
        text: "Bir web sitesinin yayında kalması için görünmeyen birçok işin düzenli yapılması gerekir. Hosting ve teknik destek kapsamında:",
        items: ["Sunucu kurulumu, yapılandırması ve optimizasyonu", "SSL ile şifreli bağlantı", "Düzenli yedekleme", "Yazılım, tema ve eklenti güncellemeleri", "Güvenlik önlemleri", "Kurumsal e-posta kurulumu ve yönetimi", "Teknik sorunlarda destek"],
      },
      {
        type: "features",
        id: "yedekleme-ve-guvenlik",
        eyebrow: "Yedekleme ve güvenlik",
        title: "Bir şey ters giderse geri dönebilmek",
        tone: "surface",
        columns: 3,
        items: [
          { icon: "DatabaseBackup", title: "Düzenli yedek", text: "Site dosyaları ve veritabanı düzenli aralıklarla yedeklenir." },
          { icon: "ShieldCheck", title: "Güvenlik güncellemeleri", text: "Bilinen açıklara karşı yazılımlar güncel tutulur." },
          { icon: "History", title: "Geri yükleme", text: "Gerektiğinde siteniz yedekten önceki haline döndürülebilir." },
        ],
      },
      {
        type: "split",
        id: "site-tasima",
        eyebrow: "Site taşıma",
        title: "Mevcut sitenizi güvenle taşıyoruz",
        tone: "dark",
        paragraphs: [
          "Başka bir sunucuda veya firmada duran sitenizi inceleyip taşıma planı çıkarıyoruz: dosyalar, veritabanı, e-postalar ve alan adı ayarları.",
          "Taşıma sırasında sitenizin erişilemez kaldığı süreyi en aza indirecek şekilde çalışıyor, taşıma sonrası kontrolleri birlikte yapıyoruz.",
        ],
      },
      {
        type: "scenarios",
        id: "kimler-icin",
        eyebrow: "Kimler için?",
        title: "Hangi siteler için bakım ve barındırma?",
        items: [
          { title: "WordPress siteleri", text: "Çekirdek, tema ve eklenti güncellemeleri ile düzenli yedekleme.", href: "/hizmetler/wordpress", linkLabel: "WordPress hizmeti" },
          { title: "E-ticaret siteleri", text: "Satışın aksamaması için güncel, yedekli ve izlenen bir mağaza altyapısı.", href: "/hizmetler/e-ticaret", linkLabel: "E-ticaret hizmeti" },
          { title: "Villa kiralama sistemleri", text: "Rezervasyon ve takvim verisi tutan villa kiralama sitelerinin barındırılması.", href: "/villa-kiralama-yazilimi", linkLabel: "Villa kiralama sistemleri için barındırma" },
        ],
      },
    ],
    faq: [
      { q: "Mevcut sitemi taşıyabilir misiniz?", a: "Evet. Önce sitenizi ve mevcut sunucunuzu inceliyor, taşıma planını sizinle paylaşıyoruz." },
      { q: "Yedekleme yapılıyor mu?", a: "Evet. Barındırdığımız sitelerin dosyaları ve veritabanları düzenli olarak yedeklenir." },
      { q: "Kurumsal e-posta da kuruyor musunuz?", a: "Evet. Alan adınıza özel e-posta adreslerinin kurulumu, yapılandırması ve teknik yönetimini yapıyoruz." },
      { q: "Başka bir firmanın yaptığı siteye destek veriyor musunuz?", a: "Önce siteyi inceliyoruz; altyapı ve kod durumuna göre bakımını üstlenip üstlenemeyeceğimizi açıkça söylüyoruz." },
    ],
    related: [
      { href: "/hizmetler/wordpress", title: "WordPress", text: "WordPress sitelerinin kurulumu, bakımı ve taşınması." },
      { href: "/hizmetler/e-ticaret", title: "E-ticaret", text: "Mağaza altyapısı ve sipariş yönetimi." },
      { href: "/hizmetler/ozel-yazilim", title: "Özel web yazılım", text: "İşinize özel yazılımların geliştirilmesi." },
    ],
  },
];

/* ------------------------------------------------------------------------------------------------
 * B. Villa Kiralama Yazılımları
 * --------------------------------------------------------------------------------------------- */

const SYNC_TEXT =
  "Villa sitenizdeki rezervasyonlar ilgili platformların takvimlerine, platformlardaki rezervasyonlar da kendi sitenizin müsaitlik takvimine yansıtılır. Böylece farklı kanallardan gelen rezervasyonların takvimlerini birlikte yönetebilir, çifte rezervasyon riskini azaltırsınız.";

const VILLA_OPTIONAL = {
  type: "optional" as const,
  id: "ihtiyaca-gore-gelistirilebilir",
  eyebrow: "Projenize özel",
  title: "İhtiyaca göre geliştirilebilir",
  text: "Aşağıdakiler hazır özellik değildir; ihtiyacınıza göre projenize özel olarak planlanır ve geliştirilir.",
  items: [
    { title: "Online ödeme", text: "İhtiyaçlarınıza göre online ödeme altyapısı da sisteme özel olarak entegre edilebilir." },
    { title: "Diğer rezervasyon platformları", text: "Airbnb ve Booking.com dışındaki rezervasyon platformları ve yerel firmalarla takvim entegrasyonu ihtiyaca göre ayrıca geliştirilir." },
    { title: "Özel modül ve raporlar", text: "İşletmenize özel modül ve raporlar için birlikte çalışabiliriz." },
  ],
};

export const villaPillar: ServicePage = {
  path: "/villa-kiralama-yazilimi",
  kind: "villa",
  label: "Villa Kiralama Yazılımı",
  seo: {
    title: "Villa Kiralama Yazılımı | Kendi Markanıza Ait Rezervasyon Sitesi",
    description: "Kendi markanıza ait villa kiralama sitesi: Airbnb ve Booking.com ile çift yönlü takvim eşitleme, çoklu dil ve para birimi, dönemsel fiyatlar. Demo isteyin.",
    keywords: ["villa kiralama yazılımı", "villa yönetim yazılımı", "villa kiralama sistemi"],
  },
  schema: { serviceType: "Villa kiralama yazılımı", name: "Villa Kiralama Yazılımı" },
  hero: {
    eyebrow: "2018'den beri villa kiralama sektöründe",
    h1: "Villa kiralama yazılımı",
    lead: "Villalarınızı kendi markanıza ait bir siteden kiralayın. Airbnb ve Booking.com takvimlerinizle çift yönlü eşitlenen, çok dilli ve çok para birimli, dönemsel fiyatları ve rezervasyonları tek panelden yönettiğiniz bir villa kiralama sistemi.",
    highlights: [
      { icon: "CalendarSync", label: "Airbnb & Booking.com çift yönlü takvim eşitleme" },
      { icon: "Languages", label: "Çoklu dil ve para birimi" },
      { icon: "Tags", label: "Dönemsel fiyatlandırma" },
      { icon: "Smartphone", label: "Mobil uyumlu" },
    ],
  },
  cta: { primary: "Demo isteyin", hizmet: "villa_rental_software", whatsapp: VILLA_WA, bandTitle: "Villa siteniz için demo ve teklif.", bandText: "Villa sayınızı, bölgenizi, mevcut sitenizi ve kullandığınız platformları paylaşın; sistemi size uygun senaryoyla gösterelim." },
  blocks: [
    {
      type: "split",
      id: "kendi-markaniz",
      eyebrow: "Kendi markanız",
      title: "Kendi markanıza ait villa kiralama sitesi",
      paragraphs: [
        "Platformlar görünürlük sağlar, ama misafir ilişkisi ve marka onlarındır. Kendi sitenizde villalarınız sizin adınızla, sizin alan adınızda yayınlanır.",
        "Tekrar gelen misafirler ve tavsiyeyle gelenler doğrudan size ulaşır; platformları kullanmaya devam ederken kendi satış kanalınızı da güçlendirirsiniz.",
      ],
      link: { href: "/villa-kiralama-yazilimi/villa-kiralama-sitesi", label: "Villa kiralama sitesi yaptırma" },
    },
    { type: "sync", id: "takvim-esitleme", eyebrow: "Öne çıkan avantaj", title: "Airbnb ve Booking.com ile çift yönlü takvim eşitleme", text: "Villanızı aynı anda kendi sitenizde, Airbnb'de ve Booking.com'da kiralıyorsanız, takvimleri tek tek güncellemek hem zaman alır hem çifte rezervasyon riski yaratır." },
    {
      type: "features",
      id: "ozellikler",
      eyebrow: "Özellikler",
      title: "Villa kiralamanın her adımı tek sistemde",
      tone: "surface",
      columns: 4,
      items: [
        { icon: "Languages", title: "Çoklu dil", text: "Aynı sitede birden çok dil; tek pazara satıyorsanız site doğrudan o dilde kurulabilir." },
        { icon: "Coins", title: "Çoklu para birimi", text: "Fiyatlar TL, USD, EUR ve GBP olarak gösterilebilir." },
        { icon: "CalendarDays", title: "Müsaitlik takvimi", text: "Her villanın takvimi; müsait, dolu, beklemede ve onaylı durumlarıyla." },
        { icon: "Tags", title: "Dönemsel fiyatlandırma", text: "Tarih aralıklarına göre gecelik ve haftalık fiyatlar." },
        { icon: "Moon", title: "Minimum konaklama", text: "Villa bazında minimum gece kuralı, ör. 3 gece." },
        { icon: "LayoutGrid", title: "Portföy yönetimi", text: "Villaları bölge ve tipe göre düzenleyin; misafirler filtreyle arasın." },
        { icon: "ClipboardCheck", title: "Rezervasyon yönetimi", text: "Talepleri durumlarıyla takip edin; misafir rezervasyonunu sitede sorgulasın." },
        { icon: "Star", title: "Misafir yorumları", text: "Yorumlar siz onayladıktan sonra villa sayfasında yayına girer." },
      ],
    },
    {
      type: "flow",
      id: "urun-turu",
      eyebrow: "Ürün turu",
      title: "Misafirin aramasından panelinize kadar",
      items: [
        { icon: "Search", title: "Arama", text: "Tarih, kişi, bölge, tip" },
        { icon: "Home", title: "Villa sayfası", text: "Galeri, özellikler, harita" },
        { icon: "CalendarDays", title: "Takvim ve fiyat", text: "Boş günler, dönem fiyatı" },
        { icon: "Send", title: "Rezervasyon talebi", text: "Tarih ve kişi seçimiyle" },
        { icon: "LayoutDashboard", title: "Panelde takip", text: "Durumlarla yönetim" },
      ],
    },
    {
      type: "scenarios",
      id: "kimler-icin",
      eyebrow: "Kimler için?",
      title: "Tek villadan geniş portföylere",
      tone: "surface",
      items: [
        { title: "Tek villa veya bungalov sahipleri", text: "Sade, tek sayfalık ve takvimli bir kiralama sitesi.", href: "/villa-kiralama-yazilimi/villa-kiralama-sitesi", linkLabel: "Villa kiralama sitesi" },
        { title: "Çok villalı kiralama şirketleri", text: "Bölge ve tipe göre aranabilen portföy, dönem fiyatları ve rezervasyon yönetimi.", href: "/villa-kiralama-yazilimi/rezervasyon-sistemi", linkLabel: "Rezervasyon sistemi" },
        { title: "Yabancı pazara satan işletmeler", text: "Çok dilli arayüz ve misafirin alıştığı para biriminde fiyat gösterimi." },
      ],
    },
    { type: "projects", id: "canli-projeler", eyebrow: "Canlı projeler", title: "Villa kiralama projelerimiz", categories: ["villa_rental_software"], tone: "dark" },
    VILLA_OPTIONAL,
    {
      type: "steps",
      id: "kurulum-sureci",
      eyebrow: "Kurulum süreci",
      title: "Sisteminiz nasıl kuruluyor?",
      items: [
        { title: "Tanışma", text: "Villa sayınız, bölgeleriniz, hedef pazarlarınız ve kullandığınız platformlar." },
        { title: "Tasarım ve yapı", text: "Site yapısı ve tasarım onayınıza sunulur." },
        { title: "İçerik", text: "Villa içerikleri, fotoğraflar, diller, para birimleri ve fiyat dönemleri girilir." },
        { title: "Takvim eşitleme", text: "Airbnb ve Booking.com ile çift yönlü takvim eşitlemesi kurulur." },
        { title: "Test", text: "Mobil, hız ve rezervasyon akışı test edilir." },
        { title: "Yayın ve destek", text: "Yayın, panel eğitimi, hosting ve destek." },
      ],
    },
  ],
  faq: [
    { q: "Tek villam var, bu sistem bana uygun mu?", a: "Evet. Tek villa veya bungalov için sade, tek sayfalık siteler de kuruyoruz (ör. Kalkan Bungalow)." },
    { q: "Airbnb ve Booking.com'u kullanmaya devam edebilir miyim?", a: "Evet. Çift yönlü takvim eşitleme sayesinde sitenizdeki rezervasyonlar platform takvimlerine, platformlardaki rezervasyonlar sitenizin takvimine yansıtılır; kanallarınızı birlikte yönetirsiniz." },
    { q: "Başka rezervasyon platformlarıyla da çalışır mı?", a: "Airbnb ve Booking.com ile çift yönlü takvim eşitleme hazırdır. Diğer rezervasyon platformları veya yerel firmalarla takvim entegrasyonu ihtiyaca göre projenize özel geliştirilir." },
    { q: "Fiyatları döviz olarak gösterebilir miyim?", a: "Evet; fiyatlar TL, USD, EUR ve GBP olarak gösterilebilir." },
    { q: "Misafirler sitede online ödeme yapabilir mi?", a: "İhtiyaçlarınıza göre online ödeme altyapısı da sisteme özel olarak entegre edilebilir. Bu ihtiyacı teklif aşamasında birlikte değerlendiriyoruz." },
    { q: "Fiyatları ve müsaitliği kendim güncelleyebilir miyim?", a: "Evet, yönetim panelinden. Dönem fiyatlarını, minimum konaklamayı ve rezervasyon durumlarını siz yönetirsiniz." },
  ],
  related: [
    { href: "/villa-kiralama-yazilimi/villa-kiralama-sitesi", title: "Villa kiralama sitesi yaptırma", text: "Tasarım, site yapısı, çok dilli ve dövizli yapı." },
    { href: "/villa-kiralama-yazilimi/rezervasyon-sistemi", title: "Rezervasyon sistemi ve takvim eşitleme", text: "Müsaitlik, rezervasyon durumları ve dönem fiyatları." },
  ],
  crossLink: { eyebrow: "Web Tasarım ve Dijital Çözümler", href: "/hizmetler/hosting-teknik-destek", title: "Hosting ve teknik destek ya da size özel geliştirme mi gerekiyor?", text: "Villa kiralama sisteminizin barındırması, bakımı ve işletmenize özel yazılım ihtiyaçları için web hizmetlerimizi inceleyin." },
};

export const villaSubPages: ServicePage[] = [
  {
    path: "/villa-kiralama-yazilimi/villa-kiralama-sitesi",
    kind: "villa",
    label: "Villa kiralama sitesi",
    parent: VILLA_HUB,
    seo: {
      title: "Villa Kiralama Sitesi Yaptırma | Çok Dilli ve Dövizli",
      description: "Tek villanız ya da portföyünüz için kendi markanıza ait, çok dilli ve çok para birimli villa kiralama sitesi. Tasarım, kurulum ve içerik desteği.",
      keywords: ["villa kiralama sitesi yaptırma", "villa kiralama web sitesi", "çok dilli villa kiralama sitesi"],
    },
    schema: { serviceType: "Villa kiralama sitesi", name: "Villa Kiralama Sitesi Yaptırma" },
    hero: {
      eyebrow: "Villa Kiralama Yazılımı",
      h1: "Villa kiralama sitesi yaptırma",
      lead: "İster tek bir villanız, ister geniş bir portföyünüz olsun; kendi markanıza ait, çok dilli ve çok para birimli bir villa kiralama sitesini tasarımından yayınına kadar kuruyoruz. Tek villalar için sade ve tek sayfalık, portföyler için aramalı ve filtreli yapılar kullanıyoruz.",
      highlights: [
        { icon: "Globe", label: "Kendi alan adınızda" },
        { icon: "Languages", label: "Çok dilli" },
        { icon: "Coins", label: "Dövizli fiyat gösterimi" },
        { icon: "Smartphone", label: "Mobil uyumlu" },
      ],
    },
    cta: { primary: "Villa siteniz için teklif alın", hizmet: "villa_rental_software", whatsapp: VILLA_WA, bandTitle: "Villa sitenizi birlikte planlayalım.", bandText: "Villa sayınızı, bölgenizi ve hedef pazarlarınızı paylaşın; tek sayfa mı, portföy mü, size uygun yapıyı önerelim." },
    blocks: [
      {
        type: "compare",
        id: "tek-villa-mi-portfoy-mu",
        eyebrow: "Doğru yapı",
        title: "Tek villa mı, portföy mü?",
        text: "Sitenin yapısı villa sayınıza ve misafirlerinizin nasıl aradığına göre değişir.",
        columns: [
          { title: "Tek villa veya bungalov", tag: "Sade ve tek sayfa", points: ["Tüm bilgiler tek sayfada", "Takvim, dönem fiyatları ve rezervasyon talebi", "Hızlı kurulum, kolay yönetim"], example: "Canlı örnek: Kalkan Bungalow" },
          { title: "Çok villalı portföy", tag: "Aramalı ve filtreli", points: ["Bölge, tip, tarih ve kişiye göre arama", "Her villaya ayrı, zengin detay sayfası", "Rezervasyon sorgulama ve kısa süreli boş tarihler"], example: "Canlı örnekler: Yaz Villam, Villaya Gel, Tatilin Yeri" },
        ],
      },
      {
        type: "split",
        id: "kendi-markaniz",
        eyebrow: "Kendi markanız",
        title: "Kendi markanız ve alan adınız",
        tone: "surface",
        paragraphs: [
          "Siteniz kendi markanız ve kendi alan adınızla yayınlanır. Misafir sizi platformun içinde bir ilan olarak değil, işletmenizin kendi sitesinde görür.",
          "Bu, tekrar gelen misafirler ve tavsiyeyle gelenler için doğrudan size ulaşabilecekleri kalıcı bir adres demektir.",
        ],
      },
      {
        type: "features",
        id: "cok-dilli-dovizli",
        eyebrow: "Yabancı misafirler için",
        title: "Çok dilli ve çok para birimli yapı",
        text: "Misafirleriniz sitenizi kendi dillerinde gezer, fiyatları alıştıkları para biriminde görür.",
        columns: 3,
        items: [
          { icon: "Languages", title: "Aynı sitede çoklu dil", text: "Siteniz birden çok dilde yayınlanabilir; dilleri ihtiyacınıza göre belirliyoruz." },
          { icon: "Coins", title: "Dört para birimi", text: "Fiyatlar TL, USD, EUR ve GBP olarak gösterilebilir (canlı örnek: Balayı Villanız)." },
          { icon: "Flag", title: "Tek pazara özel site", text: "Yalnızca bir yabancı pazara satıyorsanız site doğrudan o dilde kurulabilir (canlı örnek: Villa Direkt, Almanca)." },
        ],
      },
      {
        type: "flow",
        id: "site-yapisi",
        eyebrow: "Site yapısı",
        title: "Bir villa kiralama sitesinde neler var?",
        tone: "dark",
        items: [
          { icon: "Home", title: "Ana sayfa", text: "Öne çıkan villalar, arama" },
          { icon: "LayoutGrid", title: "Villa listesi", text: "Bölge ve tip filtreleri" },
          { icon: "Image", title: "Villa sayfası", text: "Galeri, takvim, fiyatlar, harita, yorumlar" },
          { icon: "Send", title: "Rezervasyon talebi", text: "Tarih ve kişi seçimi" },
          { icon: "SearchCheck", title: "Sorgulama", text: "Misafir rezervasyonunu kontrol eder" },
        ],
      },
      {
        type: "split",
        id: "seo-uyumlu-villa-sayfalari",
        eyebrow: "Arama motorları ve mobil",
        title: "SEO uyumlu villa sayfaları, mobilde kolay kullanım",
        paragraphs: [
          "Her villanın kendi sayfası, kendi başlığı ve açıklaması olur; arama motorlarının okuyabileceği temiz bir yapıyla kurulur. Sıralama garantisi vermiyoruz, ama sitenizi teknik olarak doğru kuruyoruz.",
          "Misafirlerin çoğu villayı telefondan arar ve rezervasyon talebini telefondan gönderir. Sitelerimiz mobilde hızlı ve kolay kullanılacak şekilde tasarlanır.",
        ],
        bullets: ["Her villaya ayrı sayfa ve başlık", "Galeri, özellikler, harita ve mesafeler", "Kısa süreli boş tarihlerin ayrı listelenmesi", "Mobilde hızlı açılan sayfalar"],
      },
      { type: "projects", id: "ornek-siteler", eyebrow: "Örnek siteler", title: "Kurduğumuz villa kiralama siteleri", categories: ["villa_rental_software"] },
      {
        type: "steps",
        id: "surec",
        eyebrow: "Süreç",
        title: "Sitenizin kurulumu",
        tone: "surface",
        items: [
          { title: "Tanışma", text: "Villalarınız, bölgeleriniz ve hedef pazarlarınız." },
          { title: "Tasarım", text: "Tek sayfa ya da portföy yapısında tasarım onayı." },
          { title: "İçerik girişi", text: "Fotoğraflar, açıklamalar, diller ve fiyat dönemleri." },
          { title: "Test", text: "Mobil, hız ve rezervasyon talebi akışı." },
          { title: "Yayın ve eğitim", text: "Yayın, panel kullanımı ve destek." },
        ],
      },
    ],
    faq: [
      { q: "Tek villam var, site yaptırmaya değer mi?", a: "Evet. Tek villa veya bungalov için sade, tek sayfalık ve takvimli siteler kuruyoruz; misafir tüm bilgileri tek sayfada görür ve rezervasyon talebini oradan gönderir." },
      { q: "Sitem hangi dillerde olabilir?", a: "Aynı sitede birden çok dil kullanılabilir. Hedef pazarlarınıza göre hangi dillerin gerektiğini görüşmede birlikte netleştiriyoruz." },
      { q: "İçerikleri ve fiyatları kendim güncelleyebilir miyim?", a: "Evet. Villaları, fotoğrafları, dönem fiyatlarını ve müsaitliği yönetim panelinden güncelleyebilirsiniz." },
      { q: "Takvimim Airbnb ve Booking.com ile eşitlenir mi?", a: "Evet, çift yönlü. Ayrıntılar için rezervasyon sistemi sayfamıza bakabilirsiniz." },
    ],
    related: [
      { href: "/villa-kiralama-yazilimi", title: "Villa kiralama yazılımı", text: "Tüm özellikler ve canlı projeler." },
      { href: "/villa-kiralama-yazilimi/rezervasyon-sistemi", title: "Rezervasyon sistemi", text: "Müsaitlik, durumlar ve çift yönlü takvim eşitleme." },
    ],
  },
  {
    path: "/villa-kiralama-yazilimi/rezervasyon-sistemi",
    kind: "villa",
    label: "Rezervasyon sistemi",
    parent: VILLA_HUB,
    seo: {
      title: "Villa Rezervasyon Sistemi ve Airbnb, Booking Takvim Eşitleme",
      description: "Villa rezervasyon sistemi: Airbnb ve Booking.com ile çift yönlü takvim eşitleme, müsaitlik takvimi ve dönemsel fiyatlar. Çifte rezervasyon riskini azaltır.",
      keywords: ["villa rezervasyon sistemi", "airbnb booking takvim eşitleme", "villa müsaitlik takvimi"],
    },
    schema: { serviceType: "Villa rezervasyon sistemi", name: "Villa Rezervasyon Sistemi ve Çift Yönlü Takvim Eşitleme" },
    hero: {
      eyebrow: "Villa Kiralama Yazılımı",
      h1: "Villa rezervasyon sistemi ve çift yönlü takvim eşitleme",
      lead: "Rezervasyonlarınızı mesajlar, tablolar ve farklı platformlar arasında kaybetmeyin. Her villanın takvimi durumlarıyla tek ekranda; Airbnb ve Booking.com ile çift yönlü takvim eşitleme sayesinde farklı kanallardan gelen rezervasyonları birlikte yönetir, çifte rezervasyon riskini azaltırsınız.",
      highlights: [
        { icon: "CalendarSync", label: "Çift yönlü takvim eşitleme" },
        { icon: "CalendarDays", label: "Müsaitlik takvimi" },
        { icon: "Tags", label: "Dönem fiyatları" },
        { icon: "SearchCheck", label: "Rezervasyon sorgulama" },
      ],
    },
    cta: { primary: "Demo isteyin", hizmet: "villa_rental_software", whatsapp: VILLA_WA, bandTitle: "Rezervasyon yönetiminizi tek takvime toplayın.", bandText: "Kaç villanız olduğunu ve hangi platformlarda kiraladığınızı paylaşın; sistemi sizin senaryonuzla gösterelim." },
    blocks: [
      {
        type: "statuses",
        id: "musaitlik-takvimi",
        eyebrow: "Müsaitlik ve rezervasyon takvimi",
        title: "Her villanın takvimi, durumlarıyla tek ekranda",
        text: "Misafir villa sayfasında boş günleri görür; siz de her rezervasyonun hangi aşamada olduğunu takip edersiniz.",
        statuses: [
          { label: "Müsait", tone: "free" },
          { label: "Beklemede", tone: "pending" },
          { label: "Ödeme bekliyor", tone: "pay" },
          { label: "Onaylı", tone: "ok" },
          { label: "Dolu", tone: "busy" },
        ],
        points: ["Rezervasyon talepleri durumlarıyla listelenir", "Misafir tarih ve kişi seçerek talep gönderir", "Misafir rezervasyonunu sitede sorgulayabilir"],
      },
      { type: "sync", id: "takvim-esitleme", eyebrow: "Takvim eşitleme", title: "Airbnb ve Booking.com ile çift yönlü takvim eşitleme", text: SYNC_TEXT },
      {
        type: "features",
        id: "donemsel-fiyatlandirma",
        eyebrow: "Fiyatlandırma",
        title: "Dönemsel fiyatlandırma ve minimum konaklama",
        text: "Dönem bazlı gecelik ve haftalık fiyatları ve minimum konaklama kuralını bir kez tanımlarsınız; misafir villa sayfasında doğru fiyatı ve boş günleri görür.",
        tone: "surface",
        columns: 3,
        items: [
          { icon: "Tags", title: "Dönem fiyatları", text: "Yüksek ve düşük sezon için tarih aralıklarına göre fiyatlar." },
          { icon: "CalendarRange", title: "Gecelik ve haftalık", text: "Aynı dönem için gecelik ve haftalık fiyat tanımı." },
          { icon: "Moon", title: "Minimum konaklama", text: "Villa bazında minimum gece kuralı, ör. 3 gece." },
        ],
      },
      {
        type: "split",
        id: "kisa-sureli-bos-tarihler",
        eyebrow: "Kısa süreli boş tarihler",
        title: "Rezervasyonlar arasında kalan günleri değerlendirin",
        paragraphs: ["Rezervasyonlar arasında kalan kısa dönemler ayrı sayfalarda listelenerek son dakika kiralamaya açılır. Misafir, kısa bir tatil için uygun villayı doğrudan bu listeden bulur."],
        bullets: ["Kısa süreli boş tarihlerin ayrı listelenmesi", "Son dakika talepler için kolay erişim"],
      },
      {
        type: "split",
        id: "odeme",
        eyebrow: "Ödeme",
        title: "Ödeme: bugün ve ihtiyaca göre",
        tone: "surface",
        paragraphs: [
          "Rezervasyon talepleri ve ön ödeme koşulları sitede açıkça gösterilir; misafir rezervasyonun hangi koşullarla kesinleşeceğini baştan bilir.",
          "İhtiyaçlarınıza göre online ödeme altyapısı da sisteme özel olarak entegre edilebilir. Bu, hazır bir özellik değil; projenize özel planlanan bir geliştirmedir.",
        ],
      },
    ],
    faq: [
      { q: "Takvim eşitleme nasıl çalışır?", a: "Villa sitenizdeki rezervasyonlar Airbnb ve Booking.com takvimlerine, bu platformlardaki rezervasyonlar da sitenizin müsaitlik takvimine yansıtılır. Böylece farklı kanallardaki rezervasyonları birlikte yönetir, çifte rezervasyon riskini azaltırsınız." },
      { q: "Başka platformlarla da eşitleme yapılabilir mi?", a: "Airbnb ve Booking.com ile çift yönlü takvim eşitleme hazırdır. Diğer rezervasyon platformları ve yerel firmalarla takvim entegrasyonu ihtiyaca göre projenize özel geliştirilir." },
      { q: "Sezon fiyatlarını nasıl tanımlıyorum?", a: "Tarih aralığı belirleyip gecelik ve haftalık fiyat giriyorsunuz; minimum konaklamayı villa bazında ayarlıyorsunuz." },
      { q: "Misafir rezervasyonunu nasıl takip eder?", a: "Misafir, rezervasyonunu sitedeki sorgulama sayfasından kontrol edebilir; siz de talepleri panelde durumlarıyla takip edersiniz." },
      { q: "Online ödeme alınabilir mi?", a: "İhtiyaçlarınıza göre online ödeme altyapısı da sisteme özel olarak entegre edilebilir. Bu ihtiyacı teklif aşamasında birlikte değerlendiriyoruz." },
    ],
    related: [
      { href: "/villa-kiralama-yazilimi", title: "Villa kiralama yazılımı", text: "Tüm özellikler, canlı projeler ve kurulum süreci." },
      { href: "/villa-kiralama-yazilimi/villa-kiralama-sitesi", title: "Villa kiralama sitesi", text: "Site yapısı, çok dilli ve dövizli yapı." },
      { href: "/hizmetler/hosting-teknik-destek", title: "Hosting ve teknik destek", text: "Rezervasyon sisteminizin barındırması ve bakımı." },
    ],
  },
];

export const allServicePages: ServicePage[] = [hubPage, ...webServicePages, villaPillar, ...villaSubPages];

export function findServicePage(path: string) {
  return allServicePages.find((p) => p.path === path) ?? null;
}

/** Verified one-liners for live villa projects (report 5.2 / 5.6), keyed by portfolio slug. */
export const villaProjectNotes: Record<string, string> = {
  "balayi-villaniz": "Dört para birimiyle fiyat gösterimi, dönemsel gecelik ve haftalık fiyatlar.",
  "kalkan-bungalow": "İki bungalov için tek sayfalık, takvimli kiralama sitesi.",
  "villa-direkt": "Almanca arayüzle, Euro fiyatlı villa kiralama sitesi.",
  "yaz-villam": "Bölge ve tipe göre aranabilen portföy; rezervasyon sorgulama.",
  "villaya-gel": "Rezervasyon durumlarıyla yönetilen villa portföyü.",
  "tatilin-yeri": "Geniş portföy, yoğun sezon fiyatlandırması ve kısa süreli tarihler.",
};
