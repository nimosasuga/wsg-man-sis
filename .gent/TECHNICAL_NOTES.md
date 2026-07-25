# Technical Notes For Next AI

Dokumen ini berisi catatan teknis, bug yang pernah muncul, dan area yang perlu hati-hati saat melanjutkan.

## Database Dan Schema

Project memakai tabel lama dari AppSheet. Jangan mengubah schema sembarangan.

Production Railway database:

```text
u495297697_appsheet
```

Jangan pakai database default `railway` untuk Laravel app, karena dump SQL membuat dan memakai `u495297697_appsheet`.

Tabel yang sering dipakai:

```text
hr_manager_db_inventori
hr_manager_inventaris_laptop
operasional_checklist
```

### hr_manager_inventaris_laptop

Kolom penting:

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

Digunakan untuk:

```text
/inventori/daftar-asset/asset-ho
```

### hr_manager_db_inventori

Digunakan untuk data kendaraan dan legalitas.

Untuk Kendaraan Operasional:

```php
where('project', 'OPERASIONAL UNIT')
```

Route terkait:

```text
/inventori/daftar-asset/kendaraan-operasional
```

### operasional_checklist

Kolom penting:

```text
id_key
tanggal
nopol
tipe_unit
area
driver
surat_kendaraan
kebersihan_unit_kabin
kondisi_mesin_oli
service_berkala
air_radiator
air_aki
kondisi_rem
indikator_dashboard
kondisi_kebersihan_box
klakson
lampu_lampu
apar
safety_belt
p3k
dongkrak
kunci_roda
engsel_pengunci_pintu
gembok
kondisi_ban
tekanan_angin_ban
foto_ban
keluhan
status_checklist
paraf
email
hp_driver
foto_unit
respon_admin_maintenance
```

Digunakan untuk:

```text
/inventori/daftar-asset/toolkit
/inventori/daftar-asset/toolkit/{id}
```

## Encoding Checklist

Data checklist di `operasional_checklist` ada yang tersimpan sebagai mojibake, contoh:

```text
âœ”ï¸
âŒ
```

Karena itu fungsi `isChecked` di Toolkit dan ToolkitDetail tidak boleh hanya mengecek teks `YA/TIDAK`.

File:

```text
resources\js\Pages\Inventori\DaftarAsset\Toolkit.jsx
resources\js\Pages\Inventori\DaftarAsset\ToolkitDetail.jsx
```

Fungsi `isChecked` sekarang menangani:

- Unicode check asli
- Unicode cross asli
- Mojibake check/cross dari database
- Nilai teks seperti `OK`, `BAIK`, `ADA`, `YA`
- Nilai false seperti `TIDAK`, `TIDAK ADA`, `RUSAK`, `NO`, `FALSE`

Jika ada bug checklist lagi, cek fungsi ini dulu.

## Toolkit Performance

Halaman Toolkit awalnya lemot karena render ribuan row dan banyak kolom.

Optimasi saat ini:

- Client-side pagination.
- Default 100 baris per halaman.
- Opsi 50, 100, 200, 500 baris.
- Filter/sort reset ke halaman pertama.

File:

```text
resources\js\Pages\Inventori\DaftarAsset\Toolkit.jsx
```

Jika data bertambah jauh lebih besar, pertimbangkan pindah ke server-side pagination dari controller.

## Resizable Column

Kolom teks di Toolkit bisa di-resize oleh user:

- TANGGAL
- NOPOL
- STATUS CHECKLIST
- KELUHAN

Resize dilakukan via state `columnWidths`.

Jika ada klik row yang terganggu oleh resize, pastikan handle resize tetap memakai:

```js
event.preventDefault();
event.stopPropagation();
```

## Row Click Navigation

Toolkit row memakai:

```js
router.visit(`/inventori/daftar-asset/toolkit/${encodeURIComponent(row.id_key)}`)
```

Jangan ganti ke path mentah tanpa `encodeURIComponent`, karena `id_key` AppSheet kadang bisa mengandung karakter khusus.

## Active Menu

Active menu sidebar ada di:

```text
resources\js\Layouts\AdminLayout.jsx
```

Jika halaman detail baru ditambahkan, pastikan parent menu tetap aktif dengan `activePaths`.

Contoh:

```js
activePaths: ["/inventori/daftar-asset"]
```

Maka semua route di bawah `/inventori/daftar-asset/...` akan menjaga menu Daftar Asset aktif.

## Build Notes

Gunakan:

```bash
npm run build
```

Peringatan yang pernah muncul dan tidak menghentikan build:

```text
@vitejs/plugin-react-oxc is deprecated
[PLUGIN_TIMINGS] build spent significant time in plugin `laravel`
```

## Railway Notes

File deploy:

```text
railway.json
nixpacks.toml
.node-version
```

Node:

```text
22
```

Frontend plugin:

```text
@vitejs/plugin-react
```

Jangan pakai:

```text
@vitejs/plugin-react-oxc
```

karena pernah menyebabkan `npm ci` Railway gagal.

Railway HTTPS fix:

```text
bootstrap\app.php
app\Providers\AppServiceProvider.php
```

Kedua file tersebut menangani proxy dan force HTTPS di production. Ini penting agar asset Vite tidak dimuat lewat HTTP di halaman HTTPS.

## Hal Yang Perlu Dilanjutkan

Kemungkinan pekerjaan selanjutnya:

- Buat server-side pagination untuk Toolkit jika masih terasa berat.
- Tambahkan search global di Toolkit.
- Tambahkan filter tanggal di Toolkit.
- Rapikan tampilan detail Toolkit jika user meminta layout seperti modul detail lain.
- Samakan pola detail semua Daftar Asset.
- Tambahkan export Excel/PDF jika dibutuhkan.
- Periksa kembali mobile responsiveness untuk tabel lebar.

## Hal Yang Harus Dihindari

- Jangan reset database.
- Jangan menghapus data dummy tanpa instruksi.
- Jangan mengubah route lama tanpa cek menu yang sudah memakai route tersebut.
- Jangan mengubah total layout global ketika user hanya meminta perbaikan modul tertentu.
- Jangan rework Profit Primary kecuali user minta eksplisit, karena bagian itu sudah berkali-kali direvisi dan restore.
