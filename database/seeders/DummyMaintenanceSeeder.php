<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DummyMaintenanceSeeder extends Seeder
{
    public function run(): void
    {
        $units = DB::table('hr_manager_db_inventori')
            ->select('nopol', 'area', 'tipe', 'driver')
            ->whereNotNull('nopol')
            ->where('nopol', '!=', '')
            ->whereNotNull('area')
            ->where('area', '!=', '')
            ->whereNotNull('tipe')
            ->where('tipe', '!=', '')
            ->orderBy('area')
            ->limit(28)
            ->get()
            ->values();

        if ($units->isEmpty()) {
            return;
        }

        $serviceTypes = [
            ['mode' => 'BERKALA', 'tipe' => 'SERVICE RUTIN', 'keluhan' => 'Service berkala, pengecekan oli mesin dan filter.', 'part' => 'Oli mesin, filter oli, filter udara', 'harga' => 875000],
            ['mode' => 'PERBAIKAN', 'tipe' => 'REM', 'keluhan' => 'Rem terasa kurang pakem saat unit membawa muatan.', 'part' => 'Kampas rem, minyak rem', 'harga' => 1250000],
            ['mode' => 'PERBAIKAN', 'tipe' => 'KAKI-KAKI', 'keluhan' => 'Bunyi pada bagian depan saat melewati jalan rusak.', 'part' => 'Ball joint, tierod, spooring', 'harga' => 1685000],
            ['mode' => 'BERKALA', 'tipe' => 'GANTI OLI', 'keluhan' => 'Penggantian oli sesuai jadwal kilometer.', 'part' => 'Oli mesin, oli gardan', 'harga' => 965000],
            ['mode' => 'PERBAIKAN', 'tipe' => 'KELISTRIKAN', 'keluhan' => 'Lampu indikator menyala dan aki lemah.', 'part' => 'Aki, soket lampu, kabel ground', 'harga' => 1425000],
        ];

        $banJobs = [
            ['jenis' => 'GANTI BAN BARU', 'posisi' => 'DEPAN KANAN', 'tipe' => 'RADIAL', 'harga' => 1850000, 'km' => 48200],
            ['jenis' => 'GANTI BAN BARU', 'posisi' => 'DEPAN KIRI', 'tipe' => 'RADIAL', 'harga' => 1850000, 'km' => 48750],
            ['jenis' => 'VULKANISIR', 'posisi' => 'BELAKANG KANAN LUAR', 'tipe' => 'VULKANISIR', 'harga' => 875000, 'km' => 35200],
            ['jenis' => 'TAMBAL BAN', 'posisi' => 'BELAKANG KIRI DALAM', 'tipe' => 'TUBELESS', 'harga' => 225000, 'km' => 18400],
            ['jenis' => 'ROTASI BAN', 'posisi' => 'SEMUA POSISI', 'tipe' => 'RADIAL', 'harga' => 350000, 'km' => 22000],
        ];

        $bengkels = ['Bengkel Mitra Washeng', 'Prima Diesel Service', 'Mandiri Truck Care', 'Surya Motor Fleet'];
        $tokoBan = ['Sentosa Ban', 'Mitra Ban Truck', 'Jaya Rubber', 'Prima Ban Fleet'];
        $serviceRows = [];
        $banRows = [];

        foreach ($units as $index => $unit) {
            $service = $serviceTypes[$index % count($serviceTypes)];
            $serviceDate = now()->subDays(12 + ($index * 5));
            $nopolSlug = preg_replace('/[^A-Z0-9]/', '', strtoupper((string) $unit->nopol));
            $odo = 35000 + ($index * 2750);
            $serviceCost = $service['harga'] + (($index % 4) * 175000);

            $serviceRows[] = [
                'id_key' => 'DUMMY-SVC-'.$nopolSlug.'-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'nopol' => $unit->nopol,
                'area' => $unit->area,
                'driver' => $unit->driver ?: 'Driver '.$unit->area,
                'mode_service' => $service['mode'],
                'tanggal_services' => $serviceDate->format('Y-m-d'),
                'odo_services' => $odo,
                'keluhan' => $service['keluhan'],
                'tipe_service' => $service['tipe'],
                'spare_parts' => $service['part'],
                'jenis_spare_parts' => $service['part'],
                'harga_parts' => $serviceCost,
                'nama_bengkel' => $bengkels[$index % count($bengkels)],
                'total_biaya_service' => $serviceCost + (($index % 3) * 125000),
                'status_penbayaran' => $index % 5 === 0 ? 'BELUM LUNAS' : 'LUNAS',
                'komentar_admin_maintenance' => 'Dummy realistis untuk validasi tampilan riwayat service unit.',
                'keterangan' => 'Reff unit '.$unit->nopol.' area '.$unit->area.' tipe '.$unit->tipe,
                'upload_nota' => '',
                'upload_foto_1' => '',
                'upload_foto_2' => '',
                'upload_foto_3' => '',
                'nama' => 'Admin Maintenance',
            ];

            if ($index % 2 === 0) {
                $ban = $banJobs[$index % count($banJobs)];
                $banDate = now()->subDays(7 + ($index * 6));
                $kmBefore = max(0, $odo - $ban['km']);
                $banTotal = $ban['harga'] + (($index % 3) * 75000);

                $banRows[] = [
                    'id_key' => 'DUMMY-BAN-'.$nopolSlug.'-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                    'nopol' => $unit->nopol,
                    'area' => $unit->area,
                    'driver' => $unit->driver ?: 'Driver '.$unit->area,
                    'tanggal_ganti_ban' => $banDate->format('Y-m-d'),
                    'jenis_pengerjaan' => $ban['jenis'],
                    'posisi' => $ban['posisi'],
                    'kilometer_ganti_ban' => $odo,
                    'kilometer_ganti_ban_sebelumnya' => $kmBefore,
                    'total_kilometer_pemakaian_ban' => $odo - $kmBefore,
                    'qty_ban' => $ban['jenis'] === 'ROTASI BAN' ? 4 : 1,
                    'no_seri_ban_lama' => 'OLD-'.$nopolSlug.'-'.$index,
                    'no_seri_ban_baru' => 'NEW-'.$nopolSlug.'-'.$index,
                    'jenis_ban' => 'Ban '.$unit->tipe,
                    'tipe_ban' => $ban['tipe'],
                    'harga_ban' => $ban['harga'],
                    'tools' => $ban['jenis'] === 'ROTASI BAN' ? 150000 : 0,
                    'ban_dalam' => 0,
                    'harga_ban_dalam' => 0,
                    'marset' => 0,
                    'harga_marset' => 0,
                    'total_harga' => $banTotal,
                    'nama_toko' => $tokoBan[$index % count($tokoBan)],
                    'keterangan' => 'Reff unit '.$unit->nopol.' area '.$unit->area.' tipe '.$unit->tipe,
                    'upload_nota' => '',
                    'upload_foto_1' => '',
                    'upload_foto_2' => '',
                    'upload_foto_3' => '',
                    'email' => 'maintenance@washeng.local',
                ];
            }
        }

        DB::table('maintenance_input_maintenance')->upsert($serviceRows, ['id_key']);
        DB::table('maintenance_monitoring_ban')->upsert($banRows, ['id_key']);
    }
}
