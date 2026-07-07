# Project Handoff - Washeng Manajemen Sistem

Dokumen ini dibuat untuk membantu AI/developer lain melanjutkan pekerjaan proyek ini tanpa harus membaca seluruh histori chat.

## Konteks Umum

Project berada di:

```text
C:\laragon\www\washeng-manajemen-sistem
```

Stack utama:

- Laravel
- Inertia React
- Tailwind CSS
- Vite
- MySQL/AppSheet style schema

Instruksi utama proyek ada di:

```text
prompt\AI_CODEX.md
```

Wajib dibaca sebelum melanjutkan. Catatan penting dari instruksi tersebut:

- Jangan gunakan `migrate:fresh` karena data AppSheet tidak boleh hilang.
- Ikuti schema database yang sudah ada.
- Banyak tabel AppSheet memakai `id_key` sebagai identifier utama.
- Gunakan Inertia `Link` atau `router.visit` untuk navigasi frontend.
- Hindari perubahan besar yang tidak diminta.

## Status UI Saat Ini

Layout utama menggunakan:

```text
resources\js\Layouts\AdminLayout.jsx
```

Perubahan besar yang sudah dilakukan:

- Sidebar kiri dan top navbar dibuat fixed.
- Sidebar/topbar memakai warna latar yang sama.
- Ada efek lengkung/reverse radius di pertemuan sidebar dan navbar.
- Sidebar responsive untuk mobile, tablet, desktop.
- State hide/collapse sidebar disimpan agar tidak terbuka sendiri saat pindah menu.
- Menu aktif sudah disesuaikan untuk halaman detail.
- Global loading dibuat lebih ringan dengan indikator truck berjalan.

Font:

- Menggunakan `@fontsource/figtree`.
- Bunny font link sudah dihilangkan.

## Modul Yang Sudah Dikerjakan

### Dashboard

File terkait:

```text
resources\js\Pages\Dashboard.jsx
app\Http\Controllers\DashboardController.php
```

Perubahan:

- Dashboard dibuat lebih profesional seperti ERP.
- Ada ringkasan data, status legalitas, invoice, dan chart module.
- Chart status Pajak, STNK, KIR, Dokumen Invoice dibuat clickable ke halaman detail modul terkait.
- Bug focus/garis hitam pada chart sudah dihilangkan lewat CSS/focus handling.

### Biaya

File terkait:

```text
app\Http\Controllers\Biaya\BiayaController.php
resources\js\Pages\Biaya\Index.jsx
resources\js\Pages\Biaya\Category.jsx
resources\js\Pages\Biaya\Detail.jsx
```

Perubahan:

- Halaman Biaya memiliki chart batang dan tabel kategori biaya.
- Klik kategori membuka halaman rincian.
- Klik row rincian membuka halaman detail.
- Detail menampilkan nama kolom utama dari data inventori/biaya.

### Profit Unit

File terkait:

```text
app\Http\Controllers\ProfitUnit\ProfitUnitController.php
resources\js\Pages\ProfitUnit\Index.jsx
resources\js\Pages\ProfitUnit\Primary.jsx
resources\js\Pages\ProfitUnit\Secondary.jsx
resources\js\Pages\ProfitUnit\Rental.jsx
resources\js\Pages\ProfitUnit\Lcl.jsx
```

Perubahan:

- Menu Profit Unit berisi Profit Primary, Secondary, Rental, LCL.
- Halaman index menampilkan ringkasan profit.
- Halaman primary sempat banyak iterasi mengikuti referensi, lalu dikembalikan ke versi modern normal yang stabil.
- Ada filter dummy untuk Tipe Unit, Area, Hari, Week, Bulan, Tahun, Kategori.

### Inventori - Daftar Unit

File terkait:

```text
app\Http\Controllers\Inventori\DaftarUnitController.php
resources\js\Pages\Inventori\DaftarUnit\Index.jsx
resources\js\Pages\Inventori\DaftarUnit\Category.jsx
```

Perubahan:

- Halaman Daftar Unit dibuat sebagai card menu.
- Card: Tipe Unit, Pajak STNK, Data KIR, My Pertamina, GPS Unit, Tahun Unit.
- Klik card membuka halaman baru dengan layout daftar/detail seperti modul Pajak.
- Active menu tetap menyala saat masuk ke detail.

### Inventori - Pajak, STNK, KIR

File terkait:

```text
app\Http\Controllers\Inventori\PajakController.php
app\Http\Controllers\Inventori\StnkController.php
app\Http\Controllers\Inventori\KirController.php
resources\js\Pages\Inventori\Pajak\Index.jsx
resources\js\Pages\Inventori\Pajak\Show.jsx
resources\js\Pages\Inventori\Stnk\Index.jsx
resources\js\Pages\Inventori\Stnk\Show.jsx
resources\js\Pages\Inventori\Kir\Index.jsx
resources\js\Pages\Inventori\Kir\Show.jsx
```

Perubahan:

- Modul Pajak, STNK, KIR punya list dan detail.
- Filter lanjutan di view detail dihilangkan karena tidak berfungsi.

### Finance - Dokumen Invoice

File terkait:

```text
app\Http\Controllers\Finance\DokumenInvoiceController.php
resources\js\Pages\Finance\DokumenInvoice\Index.jsx
resources\js\Pages\Finance\DokumenInvoice\Show.jsx
```

Perubahan:

- Dokumen Invoice dibuat sebagai modul navigable dari dashboard.

### Inventori - Daftar Asset

File terkait:

```text
app\Http\Controllers\Inventori\DaftarAssetController.php
resources\js\Pages\Inventori\DaftarAsset\Index.jsx
resources\js\Pages\Inventori\DaftarAsset\AssetHo.jsx
resources\js\Pages\Inventori\DaftarAsset\AssetHoDetail.jsx
resources\js\Pages\Inventori\DaftarAsset\KendaraanOperasional.jsx
resources\js\Pages\Inventori\DaftarAsset\KendaraanOperasionalDetail.jsx
resources\js\Pages\Inventori\DaftarAsset\Toolkit.jsx
resources\js\Pages\Inventori\DaftarAsset\ToolkitDetail.jsx
```

Perubahan:

- Halaman Daftar Asset dibuat sebagai card menu.
- Card: Asset HO, Kendaraan Operasional, Toolkit.
- Asset HO clickable ke halaman list, dikelompokkan berdasarkan jenis barang.
- Asset HO punya halaman detail.
- Kendaraan Operasional dibuat mengikuti pola Asset HO.
- Toolkit dibuat sebagai halaman list checklist.
- Row Toolkit clickable ke halaman detail.

## Routes Penting

Beberapa route yang sudah ada:

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

## Cara Verifikasi

Setelah perubahan frontend:

```bash
npm run build
```

Untuk cek route:

```bash
php artisan route:list --path=inventori/daftar-asset
```

Untuk cek data cepat:

```bash
php artisan tinker
```

