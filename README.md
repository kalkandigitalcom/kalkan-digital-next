# Kalkan Digital — Web Sitesi + İşletme Yönetim Sistemi

Tek bir Next.js uygulamasında iki bölüm:

1. **Public web sitesi** (`/`, `/projeler`, `/projeler/[slug]`, `/iletisim`, `/kvkk`)
2. **Yönetim paneli** (`/admin/*`) — müşteri, proje, gelir-gider, yenilemeler, teklifler, görevler, raporlar, portfolyo, ayarlar.

Supabase vb. harici bir servise bağımlılık yoktur; kendi PostgreSQL veritabanınızla (`DATABASE_URL`) çalışır.

## Teknoloji

| Katman | Seçim |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, `output: "standalone"`) · React 19 · TypeScript (strict) |
| Stil | Tailwind CSS v4 · Manrope + Montserrat (self-hosted, `@fontsource-variable`) · Lucide ikonlar |
| Veritabanı | PostgreSQL 14+ · Drizzle ORM · `postgres` sürücüsü |
| Doğrulama | Zod 4 (tüm sunucu girdileri) |
| Grafik | Recharts 3 |
| Kimlik doğrulama | Kendi implementasyonu: scrypt parola hash, veritabanı oturumları, httpOnly çerez |
| Test | Vitest (birim + gerçek PostgreSQL ile entegrasyon) |

## Klasör yapısı

```
drizzle/                 SQL migration'ları (ileri yönlü, yıkıcı değil)
scripts/                 migrate, create-admin, seed-dev (yalnızca geliştirme), build-scripts
src/app/(site)/          Public web sitesi
src/app/admin/login      Giriş · src/app/admin/setup  Tek seferlik ilk kurulum
src/app/admin/(panel)/   Yönetim paneli sayfaları (her sayfa requireAdmin() çağırır)
src/app/api/health       Sağlık kontrolü · src/app/media  Yüklenen görseller
src/components/          UI kiti (form, tablo, modal, toast…), admin ve public bileşenleri
src/lib/                 İstemci+sunucu ortak yardımcılar (para, tarih, etiketler)
src/server/db/schema.ts  Veritabanı şeması
src/server/auth/         Parola, oturum, token
src/server/finance/      Finansal hesaplama çekirdeği + tekrarlayan faturalama
src/server/services/     Okuma katmanı (her fonksiyon yetki kontrolü yapar)
src/server/actions/      Server action'lar (her biri yetki kontrolü yapar)
tests/                   Vitest testleri
proxy.ts                 (src/) Admin rotaları için iyimser yönlendirme
```

## Yerel geliştirme

```bash
cp .env.example .env.local          # değerleri doldurun
npm install
npm run db:migrate                  # tabloları + varsayılan kategorileri oluşturur
npm run admin:create                # ilk yöneticiyi oluşturur (etkileşimli)
npm run dev                         # http://localhost:3000  ·  panel: /admin
```

Yerelde HTTP kullanıyorsanız `.env.local` içinde `COOKIE_SECURE=false` olabilir (varsayılan `auto`: yalnızca production'da Secure çerez).

### Demo verisi (yalnızca geliştirme)

```bash
ALLOW_DEV_SEED=true npm run db:seed:dev
```

`NODE_ENV=production` ise, `ALLOW_DEV_SEED=true` yoksa veya veritabanında müşteri varsa **çalışmaz**. Tüm kayıtlar `[DEMO]` önekiyle eklenir. Production'a hiçbir zaman otomatik demo verisi eklenmez.

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✔ | PostgreSQL bağlantısı |
| `SESSION_SECRET` | ✔ | ≥32 karakter rastgele değer (`openssl rand -base64 48`) |
| `SESSION_TTL_HOURS` | | Oturum süresi, varsayılan 12 saat |
| `ADMIN_SETUP_TOKEN` | | Doluysa ve hiç yönetici yoksa `/admin/setup` açılır. Kurulumdan sonra silin. |
| `COOKIE_SECURE` | | `auto` (önerilen) / `true` / `false` |
| `TRUST_PROXY`, `TRUSTED_PROXY_HOPS` | | Reverse proxy arkasında gerçek IP tespiti (Coolify: `true`, `1`) |
| `UPLOAD_DIR` | | Portfolyo görselleri; Docker'da kalıcı volume'a bağlayın |
| `RUN_MIGRATIONS` | | `true` ise container başlangıcında migration uygulanır |
| `DATABASE_POOL_MAX` | | Bağlantı havuzu (varsayılan 10) |
| `NEXT_PUBLIC_SITE_URL` | | Canonical URL, sitemap (build-time) |
| `NEXT_PUBLIC_CONTACT_EMAIL/PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | | Yedek iletişim bilgileri; **Admin › Ayarlar**'daki değerler önceliklidir |

Gizli değerler yalnızca sunucuda okunur (`src/server/env.ts`, `server-only`). İstemci bundle'ına sadece `NEXT_PUBLIC_*` değerleri girer.

## Komutlar

```bash
npm run dev           # geliştirme
npm run build         # production build (+ dist-scripts/ migrate & create-admin paketleri)
npm run start         # build sonrası çalıştırma
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
TEST_DATABASE_URL=postgres://…@localhost/kalkan_digital_test npm test   # yalnızca yerel (localhost/127.0.0.1), adı "_test" ile biten, silinebilir bir DB!
npm run db:generate   # şema değişikliğinden yeni migration üret
npm run db:migrate    # bekleyen migration'ları uygula
npm run admin:create  # yönetici oluştur  ·  -- --reset-password ile parola sıfırla
```

## Hetzner + Coolify ile yayın

1. **PostgreSQL:** Coolify'da bir PostgreSQL kaynağı oluşturun (veya mevcut sunucunuzu kullanın). Kalıcı volume ve düzenli yedek açık olsun.
2. **Uygulama:** Coolify › New Resource › Git deposu › Build Pack: **Dockerfile**. Port: `3000`.
3. **Environment variables:** `.env.example`'daki değerleri girin (`DATABASE_URL`, `SESSION_SECRET` secret olarak). `NEXT_PUBLIC_*` değerlerini **build variable** olarak da işaretleyin.
4. **Kalıcı depolama:** `/app/uploads` için bir volume ekleyin (portfolyo görselleri).
5. **Migration:** `RUN_MIGRATIONS=true` ile container her başlangıçta bekleyen migration'ları uygular (ileri yönlü, veri silmez). Alternatif: Coolify "Pre-deployment command" → `node dist-scripts/migrate.mjs`.
6. **İlk yönetici** (iki yoldan biri):
   - Coolify terminalinden: `node dist-scripts/create-admin.mjs` (etkileşimli) veya `ADMIN_EMAIL=… ADMIN_NAME=… ADMIN_PASSWORD=… node dist-scripts/create-admin.mjs`
   - veya geçici olarak `ADMIN_SETUP_TOKEN` tanımlayıp `https://alanadiniz/admin/setup` sayfasını kullanın, ardından değişkeni silin.
7. **Domain:** `kalkandigital.com` ve `www` için domain ekleyin; Coolify/Traefik HTTPS sertifikasını otomatik alır.
8. **Sağlık kontrolü:** `GET /api/health` (Dockerfile HEALTHCHECK tanımlı).

> Mevcut bir production veritabanında: önce yedek alın, `drizzle/` altındaki yeni SQL dosyalarını gözden geçirin, sonra migrate edin. Migration'lar `DROP`/`TRUNCATE` içermez.

## Güvenlik özeti

- **Parolalar:** scrypt (N=2¹⁵, r=8, salt'lı), timing-safe karşılaştırma; olmayan e-postada sahte hash ile sabit süre.
- **Oturumlar:** 256-bit rastgele token, DB'de yalnızca SHA-256 hash'i; `httpOnly`, `SameSite=Lax`, production'da `Secure` + `__Host-` önek; mutlak süre sonu; parola değişince diğer oturumlar kapanır; devre dışı hesabın oturumları geçersiz.
- **Yetkilendirme:** `proxy.ts` yalnızca iyimser yönlendirme yapar. Asıl kontrol her sayfa, her server action ve her servis fonksiyonunun başında `requireAdmin()` ile sunucuda yapılır. `tests/authorization.test.ts` bunu tüm dosyalar için otomatik denetler.
- **Rate limiting:** giriş (e-posta başına 5, IP başına 20 / 15 dk), kurulum sayfası ve iletişim formu (IP başına 5 / saat); IP'ler HMAC ile saklanır.
- **CSRF:** Mutasyonlar Server Actions ile yapılır (Next.js Origin/Host doğrulaması) + `SameSite=Lax` çerez. Ayrı bir mutasyon API'si yoktur.
- **SQL injection:** Tüm sorgular Drizzle parametreleriyle; arama ifadelerinde LIKE joker karakterleri kaçışlanır.
- **XSS:** React çıktı kaçışlama; `dangerouslySetInnerHTML` yalnızca JSON-LD için (`<` kaçışlanmış).
- **Yüklemeler:** içerik byte'larından tür tespiti (PNG/JPEG/WebP), 5 MB sınır, rastgele dosya adı, path traversal korumalı servis.
- **Başlıklar:** HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy; admin için `noindex` + `no-store`.
- **Denetim kaydı:** giriş/çıkış, başarısız denemeler ve tüm hassas işlemler `activity_logs`'a; silinen finansal kayıtların tam kopyası saklanır.

## Veri bütünlüğü ve silme politikası

| Kayıt | Politika |
|---|---|
| Müşteri | Proje / finansal işlem / tekrarlayan hizmeti varsa **silinemez → arşivlenir** (DB'de `ON DELETE RESTRICT`). Yoksa onayla silinir; takip notları silinir, teklif/görev bağlantısı kaldırılır. |
| Proje | Finansal işlemi varsa silinemez → arşivlenir. |
| Finansal işlem | Yenileme dönemine bağlıysa silinemez → "İptal". Diğerleri onayla silinir, kopyası denetim kaydına yazılır. |
| Tekrarlayan hizmet | Faturalandırılmış dönemi varsa silinemez → "İptal edildi". |
| Kategori | Kullanımdaysa silinemez → pasif yapılır. |

## Finansal kurallar

- **Tahsil edilen gelir:** `income` + `completed`, **tahsilat tarihine** (`settled_date`) göre.
- **Bekleyen alacak:** `income` + `pending` — hiçbir zaman gelir sayılmaz; vade (`due_date`, yoksa işlem tarihi) geçince "gecikmiş".
- **Gerçekleşen / bekleyen gider:** aynı mantık, `expense`.
- **Net nakit hareketi:** tahsil edilen gelir − gerçekleşen gider (aynı dönem).
- **Tahmini proje kârlılığı:** anlaşılan tutar − tahmini maliyet (ayrı gösterilir); **proje nakit sonucu:** projeye bağlı tahsilat − ödenen gider.
- **Proje tamamlanması** hiçbir finansal kaydı değiştirmez. **Teklifin kabulü** müşteri+proje oluşturur, tahsilat oluşturmaz.
- **Çoklu para birimi:** her işlemde orijinal tutar + para birimi, işlem anındaki kur (`exchange_rate`, kaynağıyla) ve baz para birimi karşılığı (`base_amount`) ayrı saklanır. Kur girilmemiş yabancı para işlemleri baz toplamlara katılmaz, ekranda uyarı gösterilir. Kur uydurulmaz; güncel kur servisi entegre değildir.
- **Tutarlar** PostgreSQL `numeric(14,2)`; uygulama içi hesaplar BigInt sabit noktalı aritmetikle (`src/lib/money.ts`). Toplamlar SQL'de `sum(numeric)` ile.
- **Yenilemeler:** "Tahsilat kaydı" bir dönemi **bekleyen** gelir olarak oluşturur ve sonraki yenileme tarihini ilerletir. `(hizmet, dönem başlangıcı)` benzersiz kısıtı + satır kilidi ile aynı dönem iki kez faturalandırılamaz.
- Özet rakamlar ayrıca saklanmaz; dashboard ve raporlar her istekte işlem kayıtlarından hesaplanır.

## Bilinen sınırlar / yapılandırılmamış entegrasyonlar

- **E-posta / bildirim yok:** İletişim formu talepleri veritabanına "Teklifler" altına kaydedilir; e-posta gönderilmez. Görev hatırlatmaları yalnızca panelde vurgulanır.
- **Döviz kuru servisi yok:** Kurlar manuel girilir.
- **Logo:** Orijinal logo dosyası projeye eklenmedi; `src/components/brand/logo.tsx` şimdilik marka renklerinde metin wordmark kullanır. Dosyaları `public/brand/` altına koyup `LOGO_FILES` sabitini doldurmanız yeterli.
- **KVKK metni** genel bir taslaktır; hukuk danışmanınızla gözden geçirin.
- **Docker imajı** bu ortamda Docker Hub erişimi olmadığı için derlenemedi; standalone build ve paketlenmiş scriptler ayrı ayrı test edildi.
