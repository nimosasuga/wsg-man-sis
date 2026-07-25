# Work History

Dokumen ini berisi histori pekerjaan besar yang sudah dilakukan selama sesi pengembangan.

## 1. Persiapan Dan Instruksi Proyek

- Membaca arahan dari `prompt\AI_CODEX.md`.
- Mengikuti aturan agar tidak merusak data AppSheet.
- Menjaga pola Laravel/Inertia/React yang sudah dipakai proyek.

## 2. Perubahan Layout Global

- Font package diganti ke Figtree lokal via `@fontsource/figtree`.
- Dashboard layout dibuat lebih modern.
- Sidebar dan top navbar dibuat fixed.
- Warna sidebar dan navbar disamakan.
- Dibuat efek lengkung pada pertemuan sidebar dan navbar.
- Area main content tetap scroll independen.
- Bug hover menu dan scrollbar menu diperbaiki.
- Tombol collapse/hide sidebar dipindah agar tidak bertabrakan dengan menu.
- Bug sidebar terbuka lagi saat pilih menu lain setelah hidden diperbaiki.
- Loading dibuat lebih lancar.
- Indikator loading dibuat dengan icon truck berjalan.

## 3. Dashboard

- Dashboard dibuat lebih profesional seperti dashboard ERP.
- Keterangan dibuat lebih lengkap.
- Chart status Pajak dan STNK sudah clickable.
- Chart status KIR juga dibuat clickable.
- Dokumen Invoice ditambahkan sebagai modul clickable.
- Bug garis hitam/focus saat klik chart diperbaiki.

## 4. Modul Biaya

- Menu Biaya dibuat menampilkan chart batang dan tabel list kategori biaya.
- Klik kategori membuka halaman rincian.
- Klik row rincian membuka halaman detail.
- Halaman detail memakai daftar nama kolom dari contoh data user.
- Bug chart batang kosong diperbaiki agar data tampil.

## 5. Profit Unit

- Menu Profit Unit dibuat berisi:
  - Profit Primary
  - Profit Secondary
  - Profit Rental
  - Profit LCL
- Kartu ringkasan profit dibuat.
- Masalah text overflow pada card sempat diperbaiki.
- Halaman Profit Primary sempat diubah mengikuti referensi gambar, lalu diminta restore beberapa kali.
- Versi stabil saat ini adalah versi modern normal, bukan full clone referensi lama.
- Filter dummy dibuat agar pilihan Tipe Unit, Area, Hari, Week, Bulan, Tahun, Kategori tersedia.

## 6. Daftar Unit

- Menu Daftar Unit dibuat sebagai halaman card.
- Card yang dibuat:
  - Tipe Unit
  - Pajak STNK
  - Data KIR
  - My Pertamina
  - GPS Unit
  - Tahun Unit
- Alur dikoreksi: klik card membuka halaman baru seperti `Inventori\Pajak\Index.jsx`, bukan detail langsung di card.
- Active sidebar tetap menyala saat masuk detail, contoh `/inventori/pajak/KT-5555-FE`.

## 7. Daftar Asset

- Menu Daftar Asset dibuat sebagai halaman card.
- Card:
  - Asset HO
  - Kendaraan Operasional
  - Toolkit

### Asset HO

- Card Asset HO clickable.
- Membuka halaman list seperti pola Pajak.
- Data dikelompokkan berdasarkan `jenis_barang`, misalnya AC, PC, DISPENSER, dan lainnya.
- Database `hr_manager_inventaris_laptop` awalnya kosong, lalu diisi dummy data.
- Dibuat halaman detail Asset HO.

### Kendaraan Operasional

- Card Kendaraan Operasional clickable.
- Dibuat halaman list seperti Asset HO.
- Data berasal dari `hr_manager_db_inventori` dengan filter `project = OPERASIONAL UNIT`.
- Dibuat halaman detail Kendaraan Operasional.

### Toolkit

- Card Toolkit clickable.
- Halaman Toolkit menampilkan table checklist.
- Kolom non-checklist:
  - NOPOL
  - TANGGAL
  - STATUS CHECKLIST
  - KELUHAN
- Kolom lain ditampilkan sebagai checklist/uncheck.
- Bug nilai checklist dari database yang encoding-nya rusak diperbaiki.
- Kolom `KELUHAN` dibuat bisa di-resize oleh user.
- Karena data banyak, table Toolkit dioptimalkan dengan pagination client-side.
- Row Toolkit dibuat clickable.
- Dibuat halaman detail Toolkit.

## 8. Database Dummy

- Data dummy diinject untuk table yang kosong, terutama `hr_manager_inventaris_laptop`.
- Jangan hapus data dummy tanpa permintaan user.
- Jangan jalankan reset database.

## 9. Build Dan Verifikasi

Build frontend beberapa kali berhasil dengan:

```bash
npm run build
```

Catatan:

- Build menampilkan peringatan `@vitejs/plugin-react-oxc is deprecated`, tetapi build tetap sukses.
- Build juga menampilkan info plugin timing dari Laravel/Vite, bukan error.

## 10. Deploy Railway

- Project dipush ke GitHub repository `nimosasuga/wsg-man-sis`.
- Railway digunakan untuk prototype client.
- SQL dump `u495297697_appsheet.sql` diimport ke MySQL Railway.
- Dump membuat database `u495297697_appsheet`, sehingga Laravel production harus memakai database itu, bukan `railway`.
- Railway build awal gagal karena konflik `@vitejs/plugin-react-oxc` dengan `vite@8`.
- Plugin diganti ke `@vitejs/plugin-react`.
- Railway build berikutnya gagal karena Nixpacks mencoba `nodejs_24`.
- Node dipin ke `22`.
- Setelah deploy, halaman sempat blank karena mixed content asset HTTP di halaman HTTPS.
- Ditambahkan TrustProxies dan force HTTPS saat production.
- Deploy berhasil dan URL prototype bisa dibagikan ke client.
