# Deploy VPS Washeng

Dokumen ini untuk Ubuntu VPS dengan Docker Compose. MySQL produksi berjalan sebagai container dengan volume persisten di VPS. Dump database tidak disimpan di repository.

## Prinsip aman

- Jangan menjalankan `migrate:fresh`, `db:wipe`, `truncate`, atau import dump lokal ke database produksi.
- Database lama tidak dihapus atau ditimpa. Salinan ke VPS dilakukan setelah container siap dan melalui prosedur cutover terpisah.
- Gunakan `.env` hanya di VPS dan jangan commit file tersebut.
- Jalankan `php artisan migrate --force` hanya setelah memeriksa `migrate:status` dan memastikan migration yang tertunda memang milik aplikasi.
- Port publik awal hanya `80` dan, setelah SSL, `443`. MySQL belum dibuka ke internet hingga uji AppSheet dan allowlist firewall siap.

## Environment produksi

Salin `.env.example` menjadi `.env` di direktori aplikasi VPS, lalu isi nilai produksi. Nilai minimal yang perlu diperiksa:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://cargo.washeng.online
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=u495297697_appsheet
DB_USERNAME=washeng_app
DB_PASSWORD=<password-aplikasi-baru>

MYSQL_ROOT_PASSWORD=<password-root-mysql-baru>
APPSHEET_DB_USERNAME=appsheet_sync
APPSHEET_DB_PASSWORD=<password-khusus-appsheet>

CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database
```

Generate `APP_KEY` sekali dari container, lalu salin hasilnya ke `.env`:

```bash
docker compose -f docker-compose.production.yml run --rm app php artisan key:generate --show
```

## Build dan menjalankan

```bash
docker compose -f docker-compose.production.yml build --pull
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
```

Siapkan user khusus AppSheet setelah database sehat:

```bash
docker compose -f docker-compose.production.yml --profile maintenance run --rm db-init-users
```

## Backup manual

Backup menghasilkan file gzip di folder `backups/` pada VPS:

```bash
docker compose -f docker-compose.production.yml --profile maintenance run --rm db-backup
```

## Cache Laravel

Sesudah `.env` final dan container berjalan:

```bash
docker compose -f docker-compose.production.yml exec app php artisan optimize
```

## Migrasi terkontrol

```bash
docker compose -f docker-compose.production.yml exec app php artisan migrate:status
docker compose -f docker-compose.production.yml exec app php artisan migrate --force
```

Jalankan baris kedua hanya setelah daftar status diverifikasi.

## Uji sebelum DNS

```bash
curl -I -H "Host: cargo.washeng.online" http://127.0.0.1
docker compose -f docker-compose.production.yml logs --tail=100 app web
```

Setelah uji aplikasi berhasil, arahkan DNS domain utama `cargo.washeng.online` ke IP VPS. SSL HTTPS dipasang setelah DNS sudah mengarah ke VPS.

## AppSheet dan port MySQL

Jangan membuka port `3306` saat tahap awal. Setelah data sudah dipindahkan dan koneksi SSL MySQL siap, port tersebut dibuka khusus untuk IP AppSheet menggunakan aturan firewall Docker `DOCKER-USER`. Daftar IP harus diverifikasi kembali pada dokumentasi resmi AppSheet tepat sebelum cutover.
