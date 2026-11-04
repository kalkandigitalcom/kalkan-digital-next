/**
 * Home page copy (strategy report v3.2, sections 3.4 and 5.1).
 *
 * Only verified facts: no invented references, durations, prices or features. Online payment is
 * not offered as an existing feature; calendar sync is described as two-way with Airbnb and
 * Booking.com only, without any frequency / "real-time" claim.
 */

export const heroTrust = ["2018'den beri", "6 canlı villa kiralama sitesi", "Kurumsal, WordPress ve e-ticaret projeleri"] as const;

/** Category A: Web Tasarım ve Dijital Çözümler */
export const webServices = [
  { icon: "MonitorSmartphone", title: "Kurumsal web tasarım", text: "Markanızı doğru anlatan, hızlı ve SEO altyapılı web siteleri." },
  { icon: "Code2", title: "Özel web yazılım", text: "Teklif, takip, rezervasyon ve raporlama için size özel sistemler." },
  { icon: "LayoutTemplate", title: "WordPress", text: "İçeriğini kolayca yönetebileceğiniz, güvenli ve hızlı WordPress siteleri." },
  { icon: "ShoppingCart", title: "E-ticaret", text: "Ürünlerinizi online satmanız için mağaza, ürün ve sipariş yönetimi." },
  { icon: "ServerCog", title: "Hosting ve teknik destek", text: "Siteniz yayından sonra da güncel, yedekli ve güvende." },
] as const;

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
  { title: "Keşif görüşmesi", text: "İşletmenizi ve hedeflerinizi dinliyoruz." },
  { title: "Teklif ve plan", text: "Kapsam, takvim ve bütçe yazılı." },
  { title: "Tasarım", text: "Sayfa yapısı ve görsel tasarım onayınıza sunulur." },
  { title: "Geliştirme ve içerik", text: "Kurulum, içerik, mobil ve hız testleri. Villa projelerinde fiyat dönemleri ve takvim eşitleme kurulumu." },
  { title: "Yayın ve destek", text: "Eğitim, hosting ve bakım." },
] as const;

export const homeReasons = [
  { icon: "MapPin", title: "Yereliz", text: "Ofisimiz Kaş'ta; Kaş ve Kalkan'da yüz yüze görüşüyoruz." },
  { icon: "ServerCog", title: "Altyapı bizde", text: "Hosting, yedekleme ve güncellemeleri biz yönetiyoruz." },
  { icon: "ShieldCheck", title: "Kanıtlı uzmanlık", text: "Villa kiralama sistemlerimiz 6 canlı sitede; kurumsal, WordPress ve e-ticaret projelerimiz farklı sektörlerde çalışıyor." },
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
    a: "Merkezimiz Kaş'ta; Antalya ve Muğla'nın tamamına, ayrıca Türkiye genelinde uzaktan hizmet veriyoruz.",
  },
  {
    q: "Villa sitem Airbnb ve Booking.com takvimimle eşitlenebilir mi?",
    a: "Evet, çift yönlü. Villa sitenizdeki rezervasyonlar platformların takvimlerine, platformlardaki rezervasyonlar da sitenizin müsaitlik takvimine yansıtılır. Böylece çifte rezervasyon riskini azaltırsınız.",
  },
  {
    q: "Villa sitesinden online ödeme alınabilir mi?",
    a: "İhtiyaçlarınıza göre online ödeme altyapısı da sisteme özel olarak entegre edilebilir.",
  },
] as const;
