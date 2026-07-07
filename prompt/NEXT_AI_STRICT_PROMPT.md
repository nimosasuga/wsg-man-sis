# Next AI Strict Prompt - Washeng Manajemen Sistem

Gunakan file ini sebagai prompt awal untuk AI/developer berikutnya yang akan melanjutkan project.

## Identitas Project

Project:

```text
Washeng Manajemen Sistem
```

Lokasi:

```text
C:\laragon\www\washeng-manajemen-sistem
```

Stack:

- Laravel
- Inertia React
- Tailwind CSS
- Vite
- MySQL dengan schema lama/AppSheet-style

Instruksi pendukung:

```text
prompt\AI_CODEX.md
prompt\PROJECT_HANDOFF.md
prompt\WORK_HISTORY.md
prompt\TECHNICAL_NOTES.md
```

Baca file-file tersebut sebelum melakukan perubahan besar.

## Tujuan Utama

Lanjutkan pengembangan aplikasi ERP/Fleet Management ini dengan menjaga pola yang sudah ada, tidak merusak data, dan tidak mengulang perubahan yang sudah pernah direvisi/di-restore oleh user.

Fokus utama project saat ini:

- Dashboard ERP modern.
- Modul Biaya.
- Modul Profit Unit.
- Modul Inventori: Daftar Unit, Pajak, STNK, KIR.
- Modul Finance: Dokumen Invoice.
- Modul Daftar Asset: Asset HO, Kendaraan Operasional, Toolkit.

## Golden Rules

1. Jangan pernah menjalankan `migrate:fresh`, `db:wipe`, truncate, drop table, atau reset database kecuali user secara eksplisit meminta dan memahami risikonya.
2. Jangan menghapus data existing atau data dummy tanpa instruksi eksplisit.
3. Jangan mengubah schema database sembarangan. Tabel berasal dari AppSheet/legacy system.
4. Gunakan `id_key` sebagai identifier utama jika tabel memakai kolom tersebut.
5. Jangan melakukan redesign besar jika user hanya meminta bug fix kecil.
6. Jangan mengubah layout global tanpa membaca `AdminLayout.jsx` dan memahami efeknya ke seluruh halaman.
7. Jangan menghapus route lama sebelum memastikan tidak dipakai menu, dashboard card, atau halaman detail.
8. Jangan memindahkan atau rename file komponen tanpa update route/Inertia reference.
9. Jangan membuat halaman marketing/landing page. Aplikasi ini adalah ERP dashboard, bukan landing page.
10. Jangan membuat UI terlalu dekoratif. Gunakan gaya profesional, rapat, mudah discan, dan cocok untuk operasional.
11. Jangan mengembalikan perubahan user atau perubahan AI sebelumnya kecuali user meminta rollback.
12. Jangan mengabaikan build. Setelah edit frontend, jalankan `npm run build`.
13. Jangan menganggap data bersih. Banyak data legacy bisa kosong, null, typo, atau encoding rusak.
14. Jangan membuat query berat tanpa alasan. Jika data banyak, gunakan pagination, limit, atau agregasi.
15. Jangan hardcode data final jika data bisa diambil dari database. Dummy hanya boleh untuk tabel kosong atau placeholder yang diminta.
16. Jangan gunakan path detail mentah jika identifier bisa mengandung karakter khusus. Gunakan encoding di frontend.
17. Jangan membuat nested card berlebihan. UI harus tetap bersih dan tidak berat.
18. Jangan membuat chart atau tabel yang merender ribuan DOM node sekaligus jika bisa dipaginasi.
19. Jangan menambahkan dependency baru kecuali benar-benar diperlukan.
20. Jangan melanjutkan asumsi lama jika user baru saja mengoreksi arah. Instruksi terbaru user selalu menang.

## Aturan Coding Ketat

### Laravel

- Route utama ada di:

```text
routes\web.php
```

- Controller modul biasanya ada di:

```text
app\Http\Controllers
```

- Gunakan controller untuk query dan kirim data ke Inertia.
- Hindari logic query berat di React.
- Untuk detail row, gunakan `abort_if(!$data, 404)`.
- Untuk tabel legacy, cek nama kolom nyata sebelum query.

### React/Inertia

- Halaman React ada di:

```text
resources\js\Pages
```

- Layout utama:

```text
resources\js\Layouts\AdminLayout.jsx
```

- Gunakan `Link` dari `@inertiajs/react` untuk link biasa.
- Gunakan `router.visit()` untuk navigasi programmatic.
- Untuk identifier di URL, gunakan:

```js
encodeURIComponent(id)
```

- Jangan render semua row jika data ribuan. Gunakan pagination.
- Hindari state yang menyebabkan rerender besar tanpa perlu.

### Tailwind/UI

- Tampilan harus profesional seperti ERP.
- Prioritaskan readability, density, dan workflow operasional.
- Sidebar/topbar sudah fixed. Jangan ubah behavior ini tanpa instruksi.
- Area content utama scroll independen.
- Text panjang harus truncate atau wrap dengan layout yang stabil.
- Tabel lebar harus punya horizontal scroll atau resize column.
- Tombol/icon harus jelas dan tidak overlap.

## Database Notes

### Tabel Penting

```text
hr_manager_db_inventori
hr_manager_inventaris_laptop
operasional_checklist
```

### hr_manager_inventaris_laptop

Dipakai untuk Asset HO.

Kolom umum:

```text
id_key
nama_pengguna
katagori
jenis_barang
model_unit
divisi
lokasi
jumlah_unit
pengguna_sebelumnya
spesifikasi
status
warna
gambar
serial_number
keterangan
```

### hr_manager_db_inventori

Dipakai untuk inventori kendaraan, pajak, STNK, KIR, kendaraan operasional.

Kendaraan operasional menggunakan filter:

```php
where('project', 'OPERASIONAL UNIT')
```

### operasional_checklist

Dipakai untuk Toolkit.

Kolom teks yang harus tetap teks:

```text
NOPOL
TANGGAL
STATUS CHECKLIST
KELUHAN
```

Kolom checklist ditampilkan sebagai centang/uncheck.

Data checklist bisa rusak encoding:

```text
âœ”ï¸
âŒ
```

Jangan hapus handling encoding di fungsi `isChecked`.

## Modul Dan File Penting

### Layout

```text
resources\js\Layouts\AdminLayout.jsx
resources\js\app.jsx
resources\css\app.css
```

### Dashboard

```text
app\Http\Controllers\DashboardController.php
resources\js\Pages\Dashboard.jsx
```

### Biaya

```text
app\Http\Controllers\Biaya\BiayaController.php
resources\js\Pages\Biaya\Index.jsx
resources\js\Pages\Biaya\Category.jsx
resources\js\Pages\Biaya\Detail.jsx
```

### Profit Unit

```text
app\Http\Controllers\ProfitUnit\ProfitUnitController.php
resources\js\Pages\ProfitUnit\Index.jsx
resources\js\Pages\ProfitUnit\Primary.jsx
resources\js\Pages\ProfitUnit\Secondary.jsx
resources\js\Pages\ProfitUnit\Rental.jsx
resources\js\Pages\ProfitUnit\Lcl.jsx
```

### Inventori

```text
app\Http\Controllers\Inventori\DaftarUnitController.php
app\Http\Controllers\Inventori\DaftarAssetController.php
app\Http\Controllers\Inventori\PajakController.php
app\Http\Controllers\Inventori\StnkController.php
app\Http\Controllers\Inventori\KirController.php
```

### Daftar Asset

```text
resources\js\Pages\Inventori\DaftarAsset\Index.jsx
resources\js\Pages\Inventori\DaftarAsset\AssetHo.jsx
resources\js\Pages\Inventori\DaftarAsset\AssetHoDetail.jsx
resources\js\Pages\Inventori\DaftarAsset\KendaraanOperasional.jsx
resources\js\Pages\Inventori\DaftarAsset\KendaraanOperasionalDetail.jsx
resources\js\Pages\Inventori\DaftarAsset\Toolkit.jsx
resources\js\Pages\Inventori\DaftarAsset\ToolkitDetail.jsx
```

## Current Important Routes

```text
/dashboard
/biaya
/biaya/{slug}
/biaya/{slug}/{id}
/profit-unit
/profit-unit/primary
/profit-unit/secondary
/profit-unit/rental
/profit-unit/lcl
/inventori/daftar-unit
/inventori/daftar-unit/{category}
/inventori/daftar-asset
/inventori/daftar-asset/asset-ho
/inventori/daftar-asset/asset-ho/{id}
/inventori/daftar-asset/kendaraan-operasional
/inventori/daftar-asset/kendaraan-operasional/{id}
/inventori/daftar-asset/toolkit
/inventori/daftar-asset/toolkit/{id}
/inventori/pajak
/inventori/pajak/{id}
/inventori/stnk
/inventori/stnk/{nopol}
/inventori/kir
/inventori/kir/{nopol}
/finance/dokumen-invoice
/finance/dokumen-invoice/{id}
```

## Checklist Sebelum Edit

Sebelum mengubah kode:

1. Pahami permintaan user terbaru.
2. Baca file yang akan diedit.
3. Cek route terkait jika perubahan menyentuh halaman/navigasi.
4. Cek controller terkait jika perubahan menyentuh data.
5. Cek nama kolom database bila menambah query.
6. Hindari menyentuh file lain yang tidak relevan.

## Checklist Setelah Edit

Setelah edit frontend:

```bash
npm run build
```

Jika menambah route:

```bash
php artisan route:list --path=bagian-route
```

Jika query database berubah:

```bash
php artisan tinker
```

atau gunakan query aman read-only untuk cek sample.

## Catatan Bug Yang Pernah Terjadi

### Sidebar Hide Bug

Masalah:

Sidebar kembali terbuka saat pilih menu lain.

Status:

Sudah diperbaiki dengan state persistence. Jangan ubah sembarangan di `AdminLayout.jsx`.

### Chart Focus Border

Masalah:

Saat chart diklik muncul garis hitam.

Status:

Sudah diperbaiki. Jika muncul lagi, cek focus style chart/container.

### Profit Primary Rework

Masalah:

Halaman Profit Primary sempat berkali-kali diminta mengikuti referensi, lalu diminta rollback.

Golden rule:

Jangan rework halaman ini kecuali user meminta sangat spesifik.

### Toolkit Lemot

Masalah:

Terlalu banyak row dan kolom checklist dirender sekaligus.

Status:

Sudah dibuat pagination client-side.

Next improvement:

Server-side pagination jika data makin besar.

### Toolkit Checklist Encoding

Masalah:

Nilai silang dari database terbaca sebagai centang karena encoding rusak.

Status:

Sudah diperbaiki di `isChecked`.

Golden rule:

Jangan sederhanakan fungsi `isChecked` tanpa menguji data asli.

## Cara Melanjutkan Yang Disarankan

Jika user meminta fitur baru:

1. Cari modul terdekat yang sudah ada.
2. Ikuti pola controller, route, dan page yang sama.
3. Gunakan nama route/path yang konsisten.
4. Buat UI sederhana, profesional, dan tidak berat.
5. Jalankan build.
6. Laporkan file yang diubah dan hasil verifikasi.

Jika user melaporkan bug:

1. Reproduksi dari file/route yang disebut.
2. Cari root cause, bukan hanya styling permukaan.
3. Perbaiki seminimal mungkin.
4. Jangan redesign halaman.
5. Build dan laporkan.

## Format Jawaban Ke User

Gunakan bahasa Indonesia.

Jawaban final singkat:

- Sebut apa yang diubah.
- Sebut file utama.
- Sebut hasil verifikasi.
- Jangan terlalu panjang kecuali diminta.

Contoh:

```text
Sudah saya perbaiki bagian Toolkit.

Perubahan utama:
- Row sekarang clickable ke halaman detail.
- Detail menampilkan informasi unit, checklist, keluhan, dan lampiran.

Verifikasi: npm run build berhasil.
```

