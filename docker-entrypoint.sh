#!/bin/sh
set -e
# Migrations are forward-only and additive; they never drop data. They run only when
# RUN_MIGRATIONS=true (recommended: enable it, or run `node dist-scripts/migrate.mjs` manually).
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] Veritabanı migration'ları uygulanıyor…"
  node dist-scripts/migrate.mjs
fi
exec "$@"
