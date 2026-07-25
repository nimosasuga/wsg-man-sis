Saya sudah memeriksa project lama. Folder `C:\laragon\www\washengPart2` masih kosong, sedangkan project lama ternyata sudah menggunakan Laravel 13.8, Breeze, Inertia 2, React, MySQL, serta Spatie Permission.

Database lama yang akan dipakai bersama adalah `u495297697_appsheet`. Karena database dipakai oleh dua aplikasi, versi 2 harus dibangun tanpa mengubah struktur atau data secara sembarangan.

## Arah Project V2

V2 bukan sekadar menyalin project lama. Kita akan:

- Mempertahankan aturan bisnis dan kompatibilitas database.
- Menyederhanakan navigasi, tampilan, dan struktur kode.
- Memecah controller besar menjadi service/query class yang terfokus.
- Mengurangi dependency visual yang tidak diperlukan.
- Membuat komponen React yang konsisten dan reusable.
- Menggunakan bahasa Indonesia yang natural pada UI.
- Menulis kode yang mudah dipahami developer lain, sesuai prinsip “buatan manusia”, bukan hasil abstraksi berlebihan.

## Modul yang Ditemukan

Project lama memiliki modul:

1. Dashboard
2. Biaya
3. Profit Unit
   - Primary
   - Secondary
   - Rental
   - LCL
4. Need Approval
5. On The Road
6. Riwayat Service
   - Service umum
   - Service ban
7. Inventori
   - Daftar unit
   - Daftar aset
   - Pajak
   - STNK
   - KIR
8. Finance
   - Dokumen invoice
9. Daftar Karyawan
10. System
    - Data Health
    - Activity Log
11. Authentication dan hak akses

## Plan Kerja

### Fase 1 — Audit dan fondasi

- Inventarisasi seluruh tabel yang digunakan project lama.
- Petakan relasi tabel, primary key, tipe data, dan kolom yang tidak konsisten.
- Catat query bisnis penting dari setiap controller.
- Pisahkan tabel aplikasi dengan tabel autentikasi Laravel.
- Tentukan daftar fitur wajib, fitur yang disederhanakan, dan fitur yang tidak dibawa ke V2.
- Buat dokumen pemetaan: modul → route → controller → tabel → halaman.

Output: blueprint teknis dan matriks kompatibilitas database.

### Fase 2 — Inisialisasi project

- Instal Laravel 13 baru di `C:\laragon\www\washengPart2`.
- Pasang Breeze dengan Inertia.js + React.
- Konfigurasi MySQL ke database yang sama.
- Pasang Ziggy dan Spatie Permission bila tetap diperlukan.
- Siapkan ESLint/Prettier atau aturan formatting yang ringan.
- Konfigurasi Laravel Pint.
- Buat `.env.example` tanpa kredensial sensitif.
- Pastikan build frontend dan test dasar berjalan.

Catatan penting: migration tidak langsung dijalankan ke database bersama sebelum seluruh migration diperiksa.

### Fase 3 — Arsitektur backend

Struktur backend dirapikan menjadi:

- Controller: menerima request dan mengembalikan response.
- Form Request: validasi input.
- Service/Action: aturan bisnis dan operasi perubahan data.
- Query class: filter, agregasi, dashboard, dan laporan.
- Model: relasi, cast, scope, serta konstanta domain.
- Resource/Transformer: bentuk data yang dikirim ke React.
- Policy dan middleware: otorisasi.

Controller tidak boleh menjadi tempat seluruh query dan aturan bisnis seperti kecenderungan pada project lama.

### Fase 4 — Design system minimalis

Membuat fondasi UI bersama:

- App shell dan sidebar responsif.
- Header halaman.
- Breadcrumb.
- Stat card.
- Data table.
- Filter bar.
- Search input dengan debounce.
- Pagination.
- Badge status.
- Empty state.
- Loading/skeleton state.
- Modal konfirmasi.
- Form field dan pesan validasi.
- Toast/flash notification.

Karakter visual:

- Warna netral dengan satu warna aksen.
- Bayangan dan animasi secukupnya.
- Informasi penting tampil lebih dahulu.
- Tabel nyaman digunakan pada desktop dan mobile.
- Tidak memakai efek dekoratif yang mengganggu aplikasi operasional.
- Mengutamakan Lucide untuk ikon dan mengurangi library visual yang tumpang tindih.

### Fase 5 — Authentication dan authorization

- Login menggunakan akun pada database lama.
- Registration publik kemungkinan dinonaktifkan untuk sistem internal.
- Implementasi role dan permission.
- Middleware akses per modul.
- Shared Inertia props untuk user, role, permission, dan flash message.
- Audit akses pengguna.
- Proteksi session, CSRF, rate limit, dan password.

### Fase 6 — Implementasi modul bertahap

Urutan yang saya sarankan:

1. Dashboard dan layout utama.
2. Inventori unit.
3. On The Road.
4. Biaya.
5. Profit Unit.
6. Need Approval.
7. Riwayat Service.
8. Finance dan dokumen invoice.
9. Karyawan.
10. Pajak, STNK, dan KIR.
11. Activity Log dan Data Health.

Setiap modul diselesaikan secara vertikal:

- Audit query lama.
- Buat backend.
- Buat halaman React.
- Tambahkan filter, pencarian, dan pagination.
- Validasi terhadap hasil aplikasi lama.
- Tambahkan feature test.
- Review UX sebelum berpindah modul.

### Fase 7 — Strategi database bersama

Ini bagian paling kritis.

- V2 membaca tabel lama tanpa mengganti nama atau tipe kolom.
- Model harus secara eksplisit menentukan `$table`, primary key, timestamp, dan cast jika skema bukan standar Laravel.
- Tidak menjalankan migration destruktif.
- Perubahan skema baru harus backward-compatible dengan V1.
- Kolom baru harus nullable atau memiliki default yang aman.
- Operasi tulis memakai transaction.
- Tambahkan index hanya setelah query dianalisis.
- Lakukan backup sebelum perubahan skema.
- Hindari menyimpan kredensial database lama di repository.
- Buat pengujian perbandingan hasil query V1 dan V2.

### Fase 8 — Quality assurance

- Feature test untuk autentikasi, permission, CRUD, filter, dan approval.
- Unit test untuk kalkulasi biaya/profit.
- Validasi query dengan data nyata dalam mode read-only.
- Pemeriksaan N+1 query.
- Uji pagination pada tabel besar.
- Uji tampilan desktop, tablet, dan mobile.
- Uji build production.
- Jalankan Pint dan pemeriksaan frontend.
- Verifikasi bahwa V1 tetap berjalan setelah V2 terhubung.

### Fase 9 — Optimasi

- Server-side pagination untuk data besar.
- Eager loading terukur.
- Cache hanya untuk data agregat yang aman.
- Lazy/deferred props Inertia untuk panel berat.
- Debounced search dan partial reload.
- Code splitting halaman.
- Hindari mengirim seluruh record database ke browser.
- Evaluasi index berdasarkan query aktual.

### Fase 10 — Deployment dan transisi

- Siapkan environment staging.
- Gunakan database staging hasil salinan database utama.
- User acceptance testing per modul.
- Catat perbedaan hasil antara V1 dan V2.
- Deploy V2 berdampingan dengan V1.
- Awali dengan mode read-only jika diperlukan.
- Aktifkan operasi tulis secara bertahap.
- Siapkan rollback dan backup.
- Pindahkan pengguna setelah modul utama tervalidasi.

## Struktur Frontend yang Disarankan

```text
resources/js/
├── Components/
│   ├── DataDisplay/
│   ├── Feedback/
│   ├── Form/
│   ├── Navigation/
│   └── Overlay/
├── Layouts/
├── Pages/
│   ├── Approval/
│   ├── Biaya/
│   ├── Finance/
│   ├── Inventori/
│   ├── Karyawan/
│   ├── Maintenance/
│   ├── Operations/
│   ├── ProfitUnit/
│   └── System/
├── Hooks/
├── Lib/
└── app.jsx
```

## Aturan Implementasi

- Nama class dan fungsi menggunakan bahasa Inggris yang jelas.
- Teks antarmuka menggunakan bahasa Indonesia yang natural.
- Hindari nama generik seperti `data1`, `temp`, atau `handleThing`.
- Hindari komponen raksasa dan abstraksi prematur.
- Setiap fungsi memiliki satu tanggung jawab utama.
- Komentar menjelaskan alasan, bukan mengulang isi kode.
- Query kompleks diberi nama berdasarkan maksud bisnis.
- Tidak menyalin file lama secara massal; logika dibawa setelah diverifikasi.
- Setiap fase harus menghasilkan aplikasi yang tetap dapat dijalankan.

Langkah pertama implementasi nantinya adalah **Fase 1 dan Fase 2**: audit database secara aman, kemudian bootstrap Laravel 13 + Breeze React di folder `washengPart2`.
