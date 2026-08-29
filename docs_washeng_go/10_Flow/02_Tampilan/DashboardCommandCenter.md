# Dashboard Command Center

## Tujuan

Dashboard `/dashboard` berfungsi sebagai Washeng GO Command Center: pintu utama semua modul, ringkasan kondisi operasional, financial pulse, data health snapshot, prioritas hari ini, shortcut modul, shipment movement, dan indikator visual ringkas.

## Batas Domain

Dashboard hanya menampilkan snapshot ringkas. Analisis detail tetap berada di:

- Business Performance: `/business-control/performance`
- Data Health: `/business-control/health`
- Profit Unit: `/profit-unit`
- Legalitas unit: `/inventori/pajak`, `/inventori/stnk`, `/inventori/kir`
- Need Approval: `/need-approval`

## Struktur UI Final

1. Header Dashboard
2. Global KPI Row
3. Prioritas Hari Ini
4. Financial Pulse
5. Module Overview Grid
6. Operational Pulse
7. Data Health Snapshot
8. Shipment Movement

`Aktivitas Terbaru` dihapus dari dashboard agar halaman tetap fokus sebagai command center, bukan feed aktivitas.

## Visual Infografis

Dashboard memakai komponen internal ringan:

- `MiniMetricBar` untuk Financial Pulse, Operational Pulse, dan side summary Shipment Movement
- `StackedBar` untuk komposisi dokumen dan invoice
- `MiniRadial` untuk Data Health Score

Visual dipakai untuk memperjelas proporsi, bukan menggantikan halaman detail.

## Shipment Movement

Shipment Movement memakai tab `Primary` dan `Secondary` dari parent state.

Behavior:

- `activeType` menentukan dataset aktif
- `selectedYear` disimpan di parent
- `ActivityChart` menerima `activeType`, `selectedYear`, dan `setSelectedYear`
- ketika tab berubah, tahun aktif divalidasi ke daftar tahun dataset baru
- jika tahun tidak tersedia, fallback ke tahun pertama/terbaru dari dataset aktif
- total pengiriman mengikuti tab dan tahun aktif
- chart mengikuti tab dan tahun aktif
- empty state muncul jika dataset/tahun aktif tidak punya data

## Module Overview

Card shortcut yang ditampilkan:

- Business Performance
- Data Health
- Biaya
- Profit Unit
- Daftar Unit
- Daftar Asset
- On The Road
- Need Approval
- Daftar Karyawan
- Service Unit
- Activity Log

## Sumber Data

Data utama berasal dari `DashboardController@index` prop `dbChartData`:

- `totalPajak`, `pajak`, `stnk`, `kir` untuk unit dan legalitas
- `invoiceProgress`, `totalInvoice` untuk invoice
- `primaryActivityByYear`, `secondaryActivityByYear`, `totalActivityPrimary`, `totalActivitySecondary` untuk shipment
- `globalProfit` untuk revenue, cost, profit, margin
- `fatPrimaryStatus`, `fatSecondaryStatus` untuk FAT
- `needApprovalCount` untuk outstanding approval

## Fallback

Jika ringkasan modul belum tersedia, card tetap menjadi shortcut dan menampilkan `Lihat modul`, `Belum tersedia`, atau `-`. Tidak ada angka palsu.

## Verifikasi

- `npm run build`
- `/dashboard` desktop 1366px dan 1440px dengan sidebar terbuka
- tablet 768px
- mobile 390px
- browser zoom 100%
- tidak ada horizontal overflow
- link shortcut modul aktif
- Shipment Movement tab Primary/Secondary bekerja
- filter tahun Shipment Movement bekerja
- total Shipment Movement sinkron dengan tab+tahun aktif
- `/business-control/performance`, `/business-control/health`, `/profit-unit` tidak diubah
