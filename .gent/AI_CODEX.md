# AI CODEX & KNOWLEDGE BASE: WASHENG MANAJEMEN SISTEM

1. IDENTITAS PROYEK

- Nama Proyek: Washeng Manajemen Sistem
- Konteks: Sistem Enterprise Resource Planning (ERP) & Fleet Management untuk memantau aset, legalitas (Pajak, STNK, KIR), riwayat service, armada, dan aktivitas operasional.
- Asal Data: Migrasi dari aplikasi AppSheet ke Custom Web App.

## 2. TECHNOLOGY STACK

- Backend: Laravel 13 (Stable)
- Frontend: React.js dikawinkan dengan Inertia.js (Single Page Application)
- Styling: Tailwind CSS (dengan pendekatan Enterprise UI, Glassmorphism, Clean Design)
- Icons & Visuals: `lucide-react`, `recharts` (untuk analitik), `framer-motion` & `tsparticles` (untuk animasi premium)
- Database: MySQL / MariaDB
- Environment: Shared Hosting (cPanel) kompatibel (Compile aset di lokal, deploy statis).

3. ATURAN ARSITEKTUR & STRUKTUR FOLDER

- Domain-Driven Design (DDD): Folder harus dikelompokkan berdasarkan Modul/Fungsi, bukan sekadar tipe file.
- _Frontend:_ `resources/js/Pages/Inventori/Pajak/Index.jsx`
- _Backend:_ `app/Http/Controllers/Inventori/PajakController.php`
- Routing: Gunakan _Route Grouping_ dan _Prefix_ (contoh: `Route::prefix('inventori')->name('inventori.')->group(...)`).

4. ATURAN DATABASE & ELOQUENT

- Tabel Non-Standar: Tabel berasal dari dump AppSheet (contoh: `hr_manager_db_inventori`, `maintenance_input_maintenance`).
- Primary Key: Sebagian besar tabel menggunakan `id_key` (String/Varchar), bukan `id` (Integer/Auto-Increment).
- Model Rules: Selalu matikan auto-increment dan timestamps jika tabel adalah bawaan AppSheet:

```php
protected $primaryKey = 'id_key';
public $incrementing = false;
protected $keyType = 'string';
public $timestamps = false;

5. ATURAN AUTENTIKASI & KEAMANAN
Login Credentials: Sistem menggunakan NIK (Nomor Induk Karyawan), BUKAN Email. Kolom di tabel users adalah nik.

Role-Based Access Control (RBAC): Menggunakan spatie/laravel-permission untuk membedakan Super Admin, Admin Area, Warehouse, dll.

Middleware: Semua rute aplikasi (kecuali login/guest) harus dilindungi oleh middleware auth.

6. STANDAR FRONTEND (UI/UX)
No Page Reloads: Selalu gunakan komponen <Link> dari @inertiajs/react atau router.get() untuk navigasi. Jangan pernah menggunakan tag <a> standar.

Interaktivitas:

Gunakan useMemo untuk filter dan sorting data secara real-time di sisi client untuk tabel dengan data di bawah 10.000 baris.

Seluruh baris tabel (<tr>) harus bisa diklik untuk menuju ke halaman detail.

Z-Index & Stacking: Perhatikan z-index pada Recharts Tooltip agar tidak tertutup oleh elemen teks absolute.

7. CORE AI DIRECTIVES (HUKUM HARAM)
Dilarang Berasumsi: Jika struktur tabel, kolom, atau rute tidak diketahui, AI HARUS bertanya atau meminta skema SQL-nya terlebih dahulu. Akurasi harus 98%.

Dilarang Merusak Skema Lama: Saat melakukan migrasi database, dilarang menggunakan migrate:fresh jika ada perintah mengelola tabel AppSheet asli.

Kode Bersih: Jangan gunakan inline-style CSS kecuali sangat terpaksa. Selalu manfaatkan utility classes Tailwind.
```
