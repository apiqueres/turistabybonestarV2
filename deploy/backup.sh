#!/usr/bin/env bash
# Copia diaria: volcado de PostgreSQL (pg_dump del contenedor `db`) + tar de data/uploads.
# Retención: 14 días. Ejecutar desde la carpeta del proyecto (donde está docker-compose.yml).
#
#   crontab -e   →   15 3 * * * cd /opt/turistabybonestar/turistabybonestarV2 && ./deploy/backup.sh >> backups/backup.log 2>&1
#
# Restaurar la base de datos (¡sobrescribe la actual!):
#   gunzip -c backups/db-AAAA-MM-DD.sql.gz | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
# Restaurar las imágenes:
#   tar -xzf backups/uploads-AAAA-MM-DD.tar.gz -C .
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a

DIR=backups
KEEP_DAYS=${BACKUP_KEEP_DAYS:-14}
STAMP=$(date +%F)
mkdir -p "$DIR"

echo "[$(date -Is)] pg_dump → $DIR/db-$STAMP.sql.gz"
docker compose exec -T db pg_dump -U "${POSTGRES_USER:-tbb}" -d "${POSTGRES_DB:-turistabybonestar}" --clean --if-exists | gzip > "$DIR/db-$STAMP.sql.gz.tmp"
mv "$DIR/db-$STAMP.sql.gz.tmp" "$DIR/db-$STAMP.sql.gz"

if [ -d data/uploads ]; then
  echo "[$(date -Is)] tar → $DIR/uploads-$STAMP.tar.gz"
  tar -czf "$DIR/uploads-$STAMP.tar.gz" data/uploads
fi

# Retención: se borran las copias con más de KEEP_DAYS días.
find "$DIR" -name 'db-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
find "$DIR" -name 'uploads-*.tar.gz' -mtime +"$KEEP_DAYS" -delete
echo "[$(date -Is)] hecho"
