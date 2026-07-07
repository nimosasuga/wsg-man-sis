# Railway Deploy Guide

Panduan ini untuk deploy prototype Laravel + Inertia React + MySQL ke Railway.

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

## 5. Security

Credential database pernah dikirim di chat. Setelah deploy berhasil, sebaiknya rotate/regenerate password MySQL Railway lalu update variable `DB_PASSWORD`.
