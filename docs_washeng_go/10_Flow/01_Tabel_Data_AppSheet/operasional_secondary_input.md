# operasional_secondary_input

Tabel sumber dataProfit Unit Secondary di Washeng GO (MySQL legacy AppSheet).
Catatan pengetahuan formula virtual AppSheet — bukan perubahan database.

## Kolom Fisik (terverifikasi di source)

id_key, id_record, row_data, no_po, no_si, hari, tanggal, bulan, tahun, week,
jam_mulai, jam_selesai, total_jam, nopol, tipe_unit, area, driver, helper, qty,
km_awal, km_akhir, total_km, order_type, tarif_unit, add_cost_long_route, subsidi_bbm,
tkbm, spsi, parkir_liar_keamanan, allowance, biaya_tagihan_hotel, tarif_hotel, subsidi_hotel,
selisih_tagihan_hotel, penyebrangan_pas_masuk, rapid_antigen, bbm, nominal_pengisian_bbm,
jenis_bbm, harga_perliter, jumlah_liter, odo_isi_bbm, selisih_bbm, non_claim_bbm,
subsidi_bbm_2, tambah_bbm, bbm_2, parkir_resmi, tol, kirim_dokumen, tarif_gs, atk,
biaya_lainnya, tarif_sewa_unit_vendor, total_non_klaim_bbm, total_subsidi_bbm, total_tarif,
total_biaya_operasional, status, status_dokument, admin_cross_cek, crosscek_date.

Nama kolom BBM menggunakan underscore: `subsidi_bbm_2`, `bbm_2` (bukan `subsidi_bbm2`/`bbm2`).

## Formula Virtual AppSheet

1. TAGIHAN
total_tarif + add_cost_long_route + tkbm + spsi + parkir_liar_keamanan
+ penyebrangan_pas_masuk + rapid_antigen + IF(allowance>0,125000,0)
+ total_subsidi_bbm + subsidi_hotel + NILAI OVT ABSENSI

2. TOTAL KLAIM
tkbm + spsi + parkir_liar_keamanan + penyebrangan_pas_masuk + rapid_antigen
+ allowance + IF(biaya_tagihan_hotel>300000,300000,biaya_tagihan_hotel)
+ total_subsidi_bbm

3. TOTAL NO KLAIM
parkir_resmi + tol + kirim_dokumen + tarif_gs + atk + biaya_lainnya
+ tarif_sewa_unit_vendor + IF(selisih_tagihan_hotel<0,-1*selisih_tagihan_hotel,0)
+ total_non_klaim_bbm

4. PROFIT TRIP
IF(AND(ISNOTBLANK(tarif_unit), tarif_unit>=0), TAGIHAN - total_biaya_operasional, TOTAL NO KLAIM * -1)

5. NILAI OVT ABSENSI
IF(CLAIM TOTAL OVT>0, CLAIM TOTAL OVT * 32500, 0)
CLAIM TOTAL OVT = MAX(TOTAL JAM OVT DRIVER, TOTAL JAM OVT HELPER)
TOTAL JAM OVT DRIVER/HELPER diambil dari operasional_absen berdasarkan tanggal + nama.

6. STATUS DOC FAT
IF(status_dokument="DITERIMA","DITERIMA FAT", IF(ISBLANK(status_dokument),"BELUM NAIK","N/A"))

7. LAMA CEK DATA
IF(AND(ISNOTBLANK(jam_selesai), admin_cross_cek="OK"),
FLOOR(HOUR(crosscek_date - jam_selesai)/24), "") & " Hari"

8. EDIT TIME / EDITOR
MAX/ANY SELECT operasional_catatan_update berdasarkan id_record = id_key.

9. Daily Summary (DATE BY ROAD = TODAY)
TOTAL TARIF BERJALAN = SUM(TAGIHAN) baris tanggal=TODAY
TOTAL BIAYA OPERATIONAL = SUM(total_biaya_operasional) baris tanggal=TODAY
TOTAL PROFIT HARI INI = SUM(PROFIT TRIP) baris tanggal=TODAY
TOTAL UNIT JALAN HARI INI = COUNT(status="JALAN") baris tanggal=TODAY
Karena TAGIHAN/PROFIT TRIP bukan kolom fisik, dihitung row-by-row pakai rumus di atas lalu diagregasi.

## Implementasi Backend (ProfitUnitController)

- `secondaryMetrics()` menghitung tagihan, cost (total_biaya_operasional), profit (PROFIT TRIP), nilai_ovt, total_no_klaim.
- `secondaryDetail()` mengirim seluruh kolom fisik + computed: total_klaim (rumus #2), status_doc_fat (#6), lama_cek_data (#7), ovt jam driver/helper, edit_time/editor, dan dailySummary (agregasi via secondaryMetrics per baris tanggal=TODAY).
- Tidak ada perubahan schema/route/rumus AppSheet.
