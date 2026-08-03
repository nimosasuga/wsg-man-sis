#!/bin/sh
set -eu

: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD wajib diisi}"
: "${DB_DATABASE:?DB_DATABASE wajib diisi}"
: "${APPSHEET_DB_USERNAME:?APPSHEET_DB_USERNAME wajib diisi}"
: "${APPSHEET_DB_PASSWORD:?APPSHEET_DB_PASSWORD wajib diisi}"

# Password database sebaiknya memakai karakter URL-safe agar aman dipakai oleh SQL ini.
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"

mysql --protocol=TCP -h db -uroot <<SQL
CREATE USER IF NOT EXISTS '${APPSHEET_DB_USERNAME}'@'%' IDENTIFIED BY '${APPSHEET_DB_PASSWORD}';
ALTER USER '${APPSHEET_DB_USERNAME}'@'%' IDENTIFIED BY '${APPSHEET_DB_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DB_DATABASE}\`.* TO '${APPSHEET_DB_USERNAME}'@'%';
FLUSH PRIVILEGES;
SQL

echo "User AppSheet berhasil disiapkan. Port MySQL masih tidak dipublikasikan ke internet."
