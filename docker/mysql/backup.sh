#!/bin/sh
set -eu

: "${DB_DATABASE:?DB_DATABASE wajib diisi}"

mkdir -p /backups
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="/backups/${DB_DATABASE}-${timestamp}.sql.gz"

mysqldump \
    --protocol=TCP \
    -h db \
    -uroot \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    "$DB_DATABASE" | gzip -c > "$target"

echo "Backup selesai: $target"
