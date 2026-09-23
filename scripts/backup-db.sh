#!/usr/bin/env bash
# Respaldo diario de MySQL (instalado en el servidor). Guarda los últimos 7 días.
# Instalar:  chmod +x scripts/backup-db.sh
#            crontab -e   ->   0 3 * * * /ruta/tienda/scripts/backup-db.sh >> /ruta/tienda/backups/db/backup.log 2>&1
# Credenciales en ~/.my.cnf (chmod 600) para no dejar la contraseña en el script:
#   [client]
#   user=root
#   password=TU_PASSWORD
set -euo pipefail
DB="${1:-tienda}"
DESTINO="$(cd "$(dirname "$0")/.." && pwd)/backups/db"
mkdir -p "$DESTINO"
ARCHIVO="$DESTINO/$DB-$(date +%F_%H%M).sql.gz"
mysqldump --single-transaction --routines --triggers "$DB" | gzip > "$ARCHIVO"
[ -s "$ARCHIVO" ] || { echo "Respaldo vacío: $ARCHIVO"; exit 1; }
find "$DESTINO" -name "$DB-*.sql.gz" -mtime +7 -delete
echo "$(date) OK $ARCHIVO"
