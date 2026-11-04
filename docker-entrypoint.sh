#!/bin/sh
set -e

# Persistent upload storage guard. Uploaded images (portfolio logos/covers) must live on
# the host's persistent disk (Coolify Directory Mount: /data/kalkan-uploads -> /app/uploads),
# never in the container's ephemeral filesystem. With REQUIRE_PERSISTENT_UPLOADS=true the
# container refuses to start unless the mount is present (marker file) and writable, so a
# missing mount fails the deploy instead of silently losing new uploads.
UPLOAD_DIR="${UPLOAD_DIR:-/app/uploads}"
UPLOAD_MARKER="$UPLOAD_DIR/.kalkan-persistent"
if [ "$REQUIRE_PERSISTENT_UPLOADS" = "true" ]; then
  if [ ! -d "$UPLOAD_DIR" ]; then
    echo "[entrypoint] HATA: Yükleme dizini bulunamadı: $UPLOAD_DIR" >&2
    exit 1
  fi
  if [ ! -f "$UPLOAD_MARKER" ]; then
    echo "[entrypoint] HATA: Kalıcı depolama işaret dosyası yok: $UPLOAD_MARKER" >&2
    echo "[entrypoint] Kalıcı dizin ($UPLOAD_DIR) bağlanmamış olabilir. Uygulama başlatılmıyor." >&2
    exit 1
  fi
  UPLOAD_PROBE="$UPLOAD_DIR/.write-probe-$$"
  if ! ( : > "$UPLOAD_PROBE" ) 2>/dev/null; then
    echo "[entrypoint] HATA: $UPLOAD_DIR yazılabilir değil (uid $(id -u)). Sahiplik 1001:1001 olmalı. Uygulama başlatılmıyor." >&2
    exit 1
  fi
  rm -f "$UPLOAD_PROBE"
  echo "[entrypoint] Kalıcı yükleme dizini doğrulandı: $UPLOAD_DIR"
elif [ ! -f "$UPLOAD_MARKER" ]; then
  echo "[entrypoint] UYARI: $UPLOAD_MARKER yok; yüklenen görseller kalıcı olmayabilir (REQUIRE_PERSISTENT_UPLOADS=true önerilir)." >&2
fi

# Migrations are forward-only and additive; they never drop data. They run only when
# RUN_MIGRATIONS=true (recommended: enable it, or run `node dist-scripts/migrate.mjs` manually).
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] Veritabanı migration'ları uygulanıyor…"
  node dist-scripts/migrate.mjs
fi
exec "$@"
