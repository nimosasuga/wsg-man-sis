# Prompt Folder Index

Folder ini berisi dokumen handoff untuk AI/developer berikutnya yang akan melanjutkan project **Washeng Manajemen Sistem**.

Mulai dari file ini, lalu baca dokumen sesuai kebutuhan.

## Urutan Baca Yang Disarankan

1. `NEXT_AI_STRICT_PROMPT.md`
   Prompt utama untuk AI berikutnya. Berisi golden rules, cara kerja, larangan keras, struktur project, route penting, dan checklist sebelum/sesudah edit.

2. `PROJECT_HANDOFF.md`
   Ringkasan kondisi project, modul yang sudah dibuat, dan status fitur utama.

3. `TECHNICAL_NOTES.md`
   Catatan teknis untuk bug yang pernah muncul, schema penting, encoding data legacy, pagination Toolkit, active menu, dan deploy notes.

4. `RAILWAY_DEPLOY.md`
   Panduan deploy Railway, database, variables, build/start command, Node version, dan troubleshooting.

5. `WORK_HISTORY.md`
   Riwayat pekerjaan besar dari awal sampai modul terbaru.

6. `AI_CODEX.md`
   Instruksi awal project yang diberikan user. Tetap wajib dihormati.

## Status Terbaru

Per 2026-07-08:

- Project sudah terhubung ke GitHub:

```text
https://github.com/nimosasuga/wsg-man-sis.git
```

- Branch aktif:

```text
main
```

- Project sudah disiapkan untuk deploy Railway.
- Railway build sempat gagal karena konflik `@vitejs/plugin-react-oxc` dengan `vite@8`, lalu diperbaiki dengan `@vitejs/plugin-react`.
- Railway build sempat gagal karena Nixpacks mencoba `nodejs_24`, lalu Node dipin ke major `22`.
- Railway sempat blank putih karena mixed content asset `http://...` di halaman HTTPS, lalu diperbaiki dengan TrustProxies dan force HTTPS saat production.
- Database Railway sudah terisi, tetapi data berada di database:

```text
u495297697_appsheet
```

bukan database default `railway`.

## Golden Warning

Jangan menjalankan:

```bash
php artisan migrate:fresh
php artisan db:wipe
DROP DATABASE
TRUNCATE
```

Database berasal dari dump AppSheet/legacy dan sudah berisi data penting untuk prototype.

## Local Vs Railway

Local tetap memakai file `.env` lokal.

Railway memakai environment variables di dashboard Railway.

Deploy Railway tidak mengubah local `.env`.

Di local gunakan:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
DB_HOST=127.0.0.1
```

Di Railway gunakan:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://wsg-man-sis-production.up.railway.app
DB_HOST=mysql.railway.internal
DB_DATABASE=u495297697_appsheet
```

