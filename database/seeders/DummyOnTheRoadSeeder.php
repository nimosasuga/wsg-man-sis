<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DummyOnTheRoadSeeder extends Seeder
{
    public function run(): void
    {
        $units = DB::table('hr_manager_db_inventori')
            ->select('nopol', 'tipe', 'area', 'region', 'driver', 'project')
            ->whereNotNull('nopol')
            ->where('nopol', '!=', '')
            ->whereNotNull('area')
            ->where('area', '!=', '')
            ->orderBy('area')
            ->limit(36)
            ->get()
            ->values();

        if ($units->isEmpty()) {
            return;
        }

        $projects = [
            'PRIMARY',
            'ON DEMAND - FULL SERVICE',
            'RENTAL',
            'LCL',
            'REGULER',
            'DOORING',
            'ON DEMAND - UNIT ONLY',
        ];
        $routes = ['Dalam Kota', 'Luar Kota', 'Luar Kota - Menginap', 'Distribusi Retail', 'Long Route'];
        $orderTypes = ['REGULAR', 'LONG ROUTE', 'CITY', 'DOORING', 'UNIT ONLY'];
        $admins = ['Admin OTR', 'Oca', 'Admin Operasional', 'Control Room'];
        $rows = [];

        foreach ($units as $index => $unit) {
            $project = $projects[$index % count($projects)];
            $date = now()->addDays(match ($index % 4) {
                0 => 0,
                1 => -1,
                2 => 1,
                default => -2,
            });
            $nopolSlug = preg_replace('/[^A-Z0-9]/', '', strtoupper((string) $unit->nopol));
            $baseTarif = 650000 + (($index % 9) * 185000);
            $longRoute = in_array($project, ['ON DEMAND - FULL SERVICE', 'RENTAL'], true) ? 150000 + (($index % 4) * 45000) : 0;
            $subsidiBbm = 90000 + (($index % 6) * 35000);
            $bbm = $subsidiBbm + (($index % 5) * 22000);
            $tol = ($index % 3) * 55000;
            $parkir = ($index % 4) * 12000;
            $tkbm = in_array($project, ['LCL', 'REGULER', 'DOORING'], true) ? 75000 + (($index % 3) * 25000) : 0;
            $spsi = $project === 'PRIMARY' ? 65000 : 0;
            $allowance = $index % 5 === 0 ? 1 : 0;
            $hotel = $index % 7 === 0 ? 300000 : 0;
            $biayaLainnya = ($index % 6) * 15000;
            $totalBiaya = $bbm + $tol + $parkir + $tkbm + $spsi + $hotel + $biayaLainnya;
            $tagihan = $baseTarif + $longRoute + $tkbm + $spsi + ($allowance > 0 ? 125000 : 0) + $subsidiBbm + $hotel;
            $kmAwal = 25000 + ($index * 830);
            $kmAkhir = $kmAwal + 75 + (($index % 8) * 31);

            $rows[] = [
                'id_key' => 'DUMMY-OTR-'.$nopolSlug.'-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'row_data' => 'DUMMY-'.$index,
                'id_record' => 'OTR/'.now()->format('Ymd').'/'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'no_po' => 'PO-DUMMY-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'no_si' => 'SI-DUMMY-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'hari' => $date->locale('id')->translatedFormat('l'),
                'tanggal' => $date->format('Y-m-d'),
                'bulan' => $date->format('m F'),
                'tahun' => (int) $date->format('Y'),
                'week' => (int) $date->format('W'),
                'jam_mulai' => $date->format('m/d/Y').' 07:'.str_pad((string) (($index * 7) % 60), 2, '0', STR_PAD_LEFT).':00',
                'jam_selesai' => $date->format('m/d/Y').' 18:'.str_pad((string) (($index * 11) % 60), 2, '0', STR_PAD_LEFT).':00',
                'total_jam' => '11.00.00',
                'nopol' => $unit->nopol,
                'tipe_unit' => $unit->tipe ?: 'CDD',
                'area' => $unit->area,
                'driver' => $unit->driver ?: 'Driver '.$unit->area,
                'helper' => 'Helper '.$unit->area,
                'qty' => 1 + ($index % 4),
                'km_awal' => $kmAwal,
                'km_akhir' => $kmAkhir,
                'total_km' => $kmAkhir - $kmAwal,
                'order_type' => $orderTypes[$index % count($orderTypes)],
                'tarif_unit' => $baseTarif,
                'add_cost_long_route' => $longRoute,
                'subsidi_bbm' => $subsidiBbm,
                'tkbm' => $tkbm,
                'spsi' => $spsi,
                'parkir_liar_keamanan' => $parkir,
                'allowance' => $allowance,
                'biaya_tagihan_hotel' => $hotel,
                'tarif_hotel' => $hotel,
                'subsidi_hotel' => $hotel,
                'selisih_tagihan_hotel' => 0,
                'penyebrangan_pas_masuk' => 0,
                'rapid_antigen' => 0,
                'bbm' => $bbm,
                'nominal_pengisian_bbm' => $bbm,
                'jenis_bbm' => $index % 2 === 0 ? 'DEXLITE' : 'BIO SOLAR',
                'harga_perliter' => $index % 2 === 0 ? 14150 : 6800,
                'jumlah_liter' => round($bbm / ($index % 2 === 0 ? 14150 : 6800), 2),
                'odo_isi_bbm' => $kmAwal + 25,
                'selisih_bbm' => 0,
                'non_claim_bbm' => max(0, $bbm - $subsidiBbm),
                'subsidi_bbm_2' => 0,
                'tambah_bbm' => 0,
                'bbm_2' => 0,
                'nominal_pengisian_bbm_2' => 0,
                'jenis_bbm_2' => '',
                'harga_perliter_2' => 0,
                'jumlah_liter_2' => 0,
                'odo_isi_bbm_2' => 0,
                'selisih_bbm_2' => 0,
                'non_claim_bbm_2' => 0,
                'total_subsidi_bbm' => $subsidiBbm,
                'total_non_klaim_bbm' => max(0, $bbm - $subsidiBbm),
                'akumulasi_jenis_bbm' => $index % 2 === 0 ? 'DEXLITE' : 'BIO SOLAR',
                'total_nominal_pengisian_bbm' => $bbm,
                'total_liter' => round($bbm / ($index % 2 === 0 ? 14150 : 6800), 2),
                'total_kilometer_isi_bbm' => $kmAwal + 25,
                'parkir_resmi' => $parkir,
                'tarif_sewa_unit_vendor' => 0,
                'tol' => $tol,
                'kirim_dokumen' => 0,
                'atk' => 0,
                'tarif_gs' => 0,
                'keterangan_tarif_gs' => '',
                'biaya_lainnya' => $biayaLainnya,
                'keterangan_biaya_lainnya' => 'Dummy biaya kecil untuk validasi On The Road',
                'total_biaya_operasional' => $totalBiaya,
                'total_tarif' => $baseTarif,
                'status_dokument' => $index % 4 === 0 ? '' : 'DITERIMA',
                'tanggal_dokument_naik' => '',
                'region' => $unit->region ?: 'REGION DUMMY',
                'status' => 'JALAN',
                'keterangan' => 'Dummy On The Road terkait unit '.$unit->nopol,
                'admin_cross_cek' => $index % 4 === 0 ? '' : 'OK',
                'panel_indikator_bbm_sebelum_isi_bbm' => '',
                'panel_indikator_setelah_isi_bbm' => '',
                'panel_indikator_bbm_sebelum_isi_bbm_2' => '',
                'panel_indikator_setelah_isi_bbm_2' => '',
                'foto_km_awal' => '',
                'foto_km_akhir' => '',
                'rute' => $routes[$index % count($routes)],
                'jumlah_ws' => 1 + ($index % 8),
                'pilihan_biaya' => $hotel > 0 ? 'MENGINAP-BBM' : 'BBM',
                'gps_spbu' => '',
                'gps_spbu_2' => '',
                'foto_unit' => '',
                'sub_bbm' => '',
                'sub_bbm_2' => '',
                'email_driver' => 'driver'.($index + 1).'@washeng.local',
                'ponsel_driver' => '-',
                'unit_jalan' => (string) (1 + ($index % 9)),
                'nama_admin' => $admins[$index % count($admins)],
                'odo_awal' => $kmAwal,
                'petunjuk_km_akhir' => '',
                'keluhan_unit' => $index % 6 === 0 ? 'Perlu cek ban dan lampu sebelum jalan berikutnya.' : 'Unit aman.',
                'petunjuk_biaya_op' => '',
                'start_trip' => '',
                'data_unit' => '',
                'bbm_himbauan' => '',
                'bop' => '',
                'petunjuk_bbm2' => '',
                'pendapatan_lain' => 0,
                'asset' => 'WKM',
                'jam_isi_bbm_1' => '',
                'jam_isi_bbm_2' => '',
                'total_hari_menginap' => $hotel > 0 ? 1 : 0,
                'crosscek_date' => $date->format('m/d/Y').' 21:00:00',
                'project' => $project,
                'posisi_project' => '',
                'add_data' => 'DUMMY-OTR-'.$nopolSlug.'-'.$date->format('Ymd'),
            ];
        }

        DB::table('operasional_secondary_input')->upsert($rows, ['id_key']);
    }
}
