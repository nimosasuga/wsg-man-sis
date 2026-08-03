#!/bin/sh
set -eu

: "${MYSQL_TLS_DOMAIN:?MYSQL_TLS_DOMAIN wajib diisi}"

certificate_root='/caddy-data/caddy/certificates'
certificate_file="$(find "$certificate_root" -type f -name "${MYSQL_TLS_DOMAIN}.crt" -print -quit)"

if [ -z "$certificate_file" ]; then
    echo "Sertifikat ${MYSQL_TLS_DOMAIN} belum ditemukan di volume Caddy." >&2
    exit 1
fi

key_file="${certificate_file%.crt}.key"

if [ ! -f "$key_file" ]; then
    echo "Private key untuk ${MYSQL_TLS_DOMAIN} belum ditemukan." >&2
    exit 1
fi

install -d -m 700 /tls
install -m 644 "$certificate_file" /tls/server-cert.pem
install -m 600 "$key_file" /tls/server-key.pem
chown 999:999 /tls/server-cert.pem /tls/server-key.pem

echo "Sertifikat MySQL untuk ${MYSQL_TLS_DOMAIN} berhasil disalin ke volume TLS."
