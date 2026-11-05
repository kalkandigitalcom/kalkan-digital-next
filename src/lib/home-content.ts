/**
 * Home page copy (strategy report v3.2, sections 3.4 and 5.1).
 *
 * Only verified facts: no invented references, durations, prices or features. Online payment is
 * not offered as an existing feature; ready calendar sync is two-way with Airbnb and Booking.com,
 * other platforms only as custom development; no frequency / "real-time" claim.
 */

export const heroTrust = ["2018'den beri", "Villa kiralama sektörüne özel dijital çözümler", "Kurumsal, WordPress ve e-ticaret projeleri"] as const;

/** Brand message (services intro). */
export const brandMessage = {
  lead: "Yalnızca uzman olduğumuz alanlarda iş geliştiriyoruz.",
  text: "Uzmanlık alanımızın dışına çıkmadan, işletmelere gerçek değer katan çözümler geliştiriyoruz.",
} as const;

/** Category A: Web Tasarım ve Dijital Çözümler. `short` is the chip label used in compact lists; `href` only where a page exists. */
export const webServices = [
  { icon: "MonitorSmartphone", title: "Kurumsal Web Tasarım", href: "/hizmetler/kurumsal-web-tasarim", short: "Kurumsal web tasarım", text: "Markanızı doğru anlatan, hızlı ve SEO altyapılı web siteleri." },
  { icon: "Code2", title: "Özel Web Yazılım", href: "/hizmetler/ozel-yazilim", short: "Özel web yazılım", text: "Teklif, takip, rezervasyon ve raporlama için işletmenize özel sistemler." },
  { icon: "Home", title: "Villa Kiralama Yazılımı", href: "/villa-kiralama-yazilimi", short: "Villa kiralama yazılımı", text: "Villa portföyü, rezervasyon yönetimi, müsaitlik takvimi ve Airbnb & Booking.com ile çift yönlü takvim eşitleme. Diğer platform entegrasyonları ihtiyaca göre geliştirilir.", villa: true },
  { icon: "ShoppingCart", title: "E-Ticaret", href: "/hizmetler/e-ticaret", short: "E-ticaret", text: "Ürünlerinizi online satmanız için mağaza, ürün ve sipariş yönetimi." },
  { icon: "ServerCog", title: "Sunucu, Hosting ve Yazılım Altyapısı", href: "/hizmetler/hosting-teknik-destek", short: "Sunucu ve hosting", text: "Güvenilir sunucu altyapısı, hosting, kurulum, optimizasyon, yedekleme ve teknik destek." },
  { icon: "Mail", title: "Kurumsal E-Posta Kurulum ve Yönetimi", href: "/hizmetler/kurumsal-e-posta", short: "Kurumsal e-posta", text: "Şirketinize özel kurumsal e-posta adresleri, kurulum, yapılandırma ve teknik yönetim." },
  { icon: "Megaphone", title: "Google Ads ve Dijital Reklam Yönetimi", href: "/hizmetler/google-ads", short: "Google Ads", text: "Google Ads kampanyaları, reklam optimizasyonu ve performans takibi." },
  { icon: "Share2", title: "Sosyal Medya Yönetimi", href: "/hizmetler/sosyal-medya-yonetimi", short: "Sosyal medya", text: "Sosyal medya hesap yönetimi, içerik planlama ve dijital reklam çalışmaları." },
] as const;

/** Category A chips (the villa service has its own category card). */
export const webServiceChips = webServices.filter((s) => !("villa" in s)).map((s) => s.short);

/** Category B: Villa Kiralama Yazılımları (all "Mevcut" in the report, section 10.1) */
export const villaFeatures = [
  { icon: "CalendarSync", title: "Airbnb ve Booking.com ile çift yönlü takvim eşitleme", text: "Sitenizdeki rezervasyonlar platform takvimlerine, platformlardaki rezervasyonlar sitenizin müsaitlik takvimine yansır." },
  { icon: "Languages", title: "Çoklu dil", text: "Misafirleriniz sitenizi kendi dillerinde gezer." },
  { icon: "Coins", title: "Çoklu para birimi", text: "Fiyatlar TL, USD, EUR ve GBP olarak gösterilebilir." },
  { icon: "CalendarDays", title: "Müsaitlik ve rezervasyon takvimi", text: "Her villanın takvimi durumlarıyla tek ekranda." },
  { icon: "Tags", title: "Dönemsel fiyatlandırma", text: "Tarih aralığına göre gecelik ve haftalık fiyatlar, minimum konaklama." },
  { icon: "LayoutGrid", title: "Çok villalı portföy yönetimi", text: "Tek villadan geniş portföylere; bölge ve tipe göre arama." },
] as const;

export const homeProcess = [
  { icon: "MessagesSquare", title: "Keşif görüşmesi", text: "İşletmenizi ve hedeflerinizi dinliyoruz." },
  { icon: "FileText", title: "Teklif ve plan", text: "Kapsam, takvim ve bütçe yazılı." },
  { icon: "PenTool", title: "Tasarım", text: "Sayfa yapısı ve görsel tasarım onayınıza sunulur." },
  { icon: "Code2", title: "Geliştirme ve içerik", text: "Kurulum, içerik, mobil ve hız testleri. Villa projelerinde fiyat dönemleri ve takvim eşitleme kurulumu." },
  { icon: "Rocket", title: "Yayın ve destek", text: "Eğitim, hosting ve bakım." },
] as const;

export const homeReasons = [
  { icon: "MapPin", title: "Yereliz", text: "Ofisimiz Kaş'ta; Kaş ve Kalkan'da yüz yüze görüşüyoruz." },
  { icon: "ServerCog", title: "Altyapı bizde", text: "Hosting, yedekleme ve güncellemeleri biz yönetiyoruz." },
  { icon: "ShieldCheck", title: "Odaklı uzmanlık", text: "Villa kiralama sektörüne özel çözümlerimiz ile kurumsal, WordPress ve e-ticaret projelerimiz farklı sektörlerde çalışıyor." },
  { icon: "FileCheck2", title: "Şeffaf teklif", text: "Kapsam, süre ve fiyat baştan yazılı." },
] as const;

export const serviceRegions = [
  { name: "Antalya", places: ["Kaş", "Kalkan", "Demre", "Alanya", "Manavgat", "Side", "Kemer", "Serik"] },
  { name: "Muğla", places: ["Fethiye", "Dalaman", "Ortaca", "Bodrum", "Marmaris"] },
] as const;

/** Only questions whose answers are verified (report 5.1); placeholder answers are left out. */
export const homeFaq = [
  {
    q: "Web sitesi yaptırmak ne kadar tutar?",
    a: "Sayfa sayısı, dil, yönetim paneli, e-ticaret veya rezervasyon gibi özellikler ve içerik desteğine göre değişir. Kısa bir görüşmeden sonra kapsamı yazılı paylaşır, net fiyat veririz.",
  },
  {
    q: "WordPress mi, özel yazılım mı?",
    a: "İçeriği sık değişen siteler için WordPress, iş süreçlerine özel ihtiyaçlar için özel yazılım genellikle daha doğru. Görüşmede birlikte karar veriyoruz.",
  },
  {
    q: "Yayından sonra destek veriyor musunuz?",
    a: "Evet; hosting, yedekleme, güncelleme ve teknik destek sunuyoruz.",
  },
  {
    q: "Sadece Kaş ve Kalkan'a mı hizmet veriyorsunuz?",
    a: "Merkezimiz Kaş'ta; Antalya'nın ve Fethiye başta olmak üzere Muğla'nın tamamına, ayrıca Türkiye genelinde uzaktan hizmet veriyoruz.",
  },
  {
    q: "Villa sitem Airbnb ve Booking.com takvimimle eşitlenebilir mi?",
    a: "Evet, çift yönlü. Villa sitenizdeki rezervasyonlar platformların takvimlerine, platformlardaki rezervasyonlar da sitenizin müsaitlik takvimine yansıtılır. Böylece çifte rezervasyon riskini azaltırsınız. Diğer rezervasyon platformları veya yerel firmalarla takvim entegrasyonu ise ihtiyacınıza göre projenize özel geliştirilebilir.",
  },
  {
    q: "Villa sitesinden online ödeme alınabilir mi?",
    a: "İhtiyaçlarınıza göre online ödeme altyapısı da sisteme özel olarak entegre edilebilir.",
  },
] as const;
