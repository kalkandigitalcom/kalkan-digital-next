-- Reference data (NOT demo data): default financial categories and settings.
-- Idempotent: safe to run on databases that already contain these rows.
INSERT INTO "financial_categories" ("type", "name", "sort_order") VALUES
  ('income', 'Web tasarım', 10),
  ('income', 'Yazılım geliştirme', 20),
  ('income', 'Villa kiralama yazılımı', 30),
  ('income', 'Hosting', 40),
  ('income', 'Domain', 50),
  ('income', 'Bakım anlaşması', 60),
  ('income', 'Dijital reklam yönetimi', 70),
  ('income', 'Sosyal medya', 80),
  ('income', 'Fotoğraf ve video', 90),
  ('income', 'Diğer gelirler', 100),
  ('expense', 'Sunucu ve hosting', 10),
  ('expense', 'Domain ve lisans', 20),
  ('expense', 'Yazılım abonelikleri', 30),
  ('expense', 'Reklam giderleri', 40),
  ('expense', 'Donanım', 50),
  ('expense', 'Personel ve dış hizmet', 60),
  ('expense', 'Vergi ve muhasebe', 70),
  ('expense', 'Diğer giderler', 80)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO "app_settings" ("key", "value") VALUES ('base_currency', '"TRY"'::jsonb)
ON CONFLICT ("key") DO NOTHING;
