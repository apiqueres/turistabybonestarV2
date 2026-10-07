#!/bin/sh
# Arranque del contenedor web: aplica las migraciones pendientes, siembra lo que falte
# (idempotente: destinos, ofertas, textos, usuario admin si no hay ninguno) y arranca Next.
set -e
cd /app

if [ -z "$DATABASE_URL" ]; then
  echo "[entrypoint] DATABASE_URL no está definida" >&2
  exit 1
fi

echo "[entrypoint] prisma migrate deploy"
node node_modules/prisma/build/index.js migrate deploy

if [ "${SEED_ON_START:-1}" != "0" ]; then
  echo "[entrypoint] seed"
  node .seed/seed.mjs
fi

exec "$@"
