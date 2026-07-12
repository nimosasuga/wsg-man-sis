# Railway Deploy Guide

Panduan ini untuk deploy prototype Laravel + Inertia React + MySQL ke Railway.

Status per 2026-07-08:

- Deploy Railway sudah berhasil.
- URL prototype:

```text
https://wsg-man-sis-production.up.railway.app
```

- Database sudah berhasil diimport dan tabel terbaca dari CMD lokal.
- Data berada di database `u495297697_appsheet`.
- Railway UI bisa terlihat "no tables" jika sedang melihat database default `railway`.

## 1. Database

Database dump sudah diarahkan ke database:

```text
u495297697_appsheet
```

Karena file SQL berisi:

```sql
CREATE DATABASE IF NOT EXISTS `u495297697_appsheet`;
USE `u495297697_appsheet`;
```

Maka di environment Laravel Railway gunakan:

```env
DB_DATABASE=u495297697_appsheet
```

Jika app Laravel berada di project Railway yang sama dengan MySQL, gunakan host internal:

```env
DB_HOST=mysql.railway.internal
DB_PORT=3306
```

## 2. Variables Railway

Set variable berikut pada service Laravel/app, bukan hanya service MySQL:

```env
APP_NAME="Washeng ERP"
APP_ENV=production
APP_KEY=base64:ISI_DENGAN_APP_KEY
APP_DEBUG=false
APP_URL=https://domain-app-railway.up.railway.app

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_DATABASE=u495297697_appsheet
DB_USERNAME=root
DB_PASSWORD=ISI_PASSWORD_MYSQL_RAILWAY

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local

VITE_APP_NAME="${APP_NAME}"
```

Untuk membuat `APP_KEY` lokal:

```bash
php artisan key:generate --show
```

Copy hasilnya ke variable `APP_KEY` di Railway.

## 3. Build Dan Start

Project sudah memiliki:

```text
railway.json
nixpacks.toml
```

Build command:

```bash
composer install --no-dev --optimize-autoloader --no-interaction && npm ci --include=dev && npm run build
```

Start command:

```bash
php artisan config:cache && php artisan view:cache && php artisan serve --host=0.0.0.0 --port=$PORT
```

Tidak menjalankan migration otomatis karena database berasal dari dump SQL.

## 3.1 Node Dan Vite

Project memakai:

```json
"@vitejs/plugin-react": "^6.0.3"
```

Jangan gunakan `@vitejs/plugin-react-oxc` untuk kondisi saat ini. Plugin itu pernah menyebabkan `npm ci` Railway gagal dengan konflik peer dependency terhadap `vite@8`.

Node dipin ke major 22:

```json
"engines": {
  "node": "22",
  "npm": ">=10"
}
```

File tambahan:

```text
.node-version
```

berisi:

```text
22
```

Jangan ubah engine ke range longgar seperti `>=22.12.0`, karena Nixpacks pernah mencoba memilih `nodejs_24` dan gagal dengan:

```text
error: undefined variable 'nodejs_24'
```

## 3.2 HTTPS Railway

Railway berada di balik proxy. Untuk menghindari mixed content asset, project sudah menambahkan:

```php
$middleware->trustProxies(at: '*');
```

di:

```text
bootstrap\app.php
```

dan:

```php
URL::forceScheme('https');
```

saat `APP_ENV=production` di:

```text
app\Providers\AppServiceProvider.php
```

Jangan hapus bagian ini kecuali deploy target berubah dan sudah dites.

## 4. Setelah Deploy

Cek halaman:

```text
/dashboard
/inventori/daftar-asset
/inventori/daftar-asset/toolkit
/biaya
/profit-unit
```

Jika error database muncul:

- Pastikan `DB_DATABASE=u495297697_appsheet`.
- Pastikan Laravel service dan MySQL service ada di project Railway yang sama.
- Pastikan `DB_HOST=mysql.railway.internal` hanya dipakai oleh app di Railway.
- Untuk akses dari laptop, gunakan public TCP proxy, bukan internal host.

Jika halaman putih/blank:

- Buka DevTools Console.
- Jika ada `Mixed Content`, pastikan `APP_URL` memakai HTTPS dan konfigurasi proxy/force HTTPS tidak terhapus.
- Hard refresh browser dengan `Ctrl + Shift + R`.

Jika build gagal di `npm ci`:

- Pastikan `package-lock.json` tidak mengandung `@vitejs/plugin-react-oxc`.
- Pastikan `package.json` memakai `@vitejs/plugin-react`.
- Pastikan engine Node tetap `"22"`.

## 5. Security

Credential database pernah dikirim di chat. Setelah deploy berhasil, sebaiknya rotate/regenerate password MySQL Railway lalu update variable `DB_PASSWORD`.
