<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DummyUnitPositionSeeder extends Seeder
{
    public function run(): void
    {
        $positions = [
            ['BANDUNG', 'L-8285-UUD', 'IIP YAHYA', '-6.917464, 107.619123', 'Unit menuju titik bongkar area Bandung.'],
            ['SAMARINDA', 'L-8471-UM', 'MAKSIMILIAN KOLBE NUWA', '-0.502106, 117.153709', 'Perjalanan lancar, unit berada di jalur utama Samarinda.'],
            ['TERNATE', 'DG-8656-KB', 'EFENDI YUSUF', '0.790569, 127.384857', 'Unit selesai bongkar dan bersiap kembali ke pool.'],
            ['BALIKPAPAN', 'L-8798-UO', 'BELLY BERF RIZQIANTO', '-1.237928, 116.852852', 'Unit sedang menuju lokasi pelanggan Balikpapan.'],
            ['MAKASSAR', 'L-8171-UA', 'HAMZAH DGRANI', '-5.147665, 119.432732', 'Unit berhenti sebentar untuk pemeriksaan muatan.'],
            ['MANADO', 'L-8184-UA', 'RECKY NELSON DAVID KASENDA', '1.474830, 124.842079', 'Unit dalam perjalanan kembali setelah pengiriman.'],
            ['AMBON', 'L-9280-UA', 'FADIL MUHAMMAD DARLIN', '-3.695430, 128.181396', 'Unit sudah tiba di area tujuan Ambon.'],
            ['SINTANG', 'KB-8069-ME', 'AGUSTINUS RONALDO PAN', '0.078780, 111.495370', 'Unit melanjutkan perjalanan menuju titik serah.'],
            ['GORONTALO', 'DM-2255-FE', 'DAVIT JHON WAWORUNTU', '0.543544, 123.056770', 'Posisi terakhir tercatat dekat pusat Gorontalo.'],
            ['SURABAYA', 'L-8481-UDA', 'ALEXANDER, SE', '-7.257472, 112.752090', 'Unit sedang menuju pool Surabaya setelah selesai jalan.'],
        ];

        foreach ($positions as $index => [$area, $nopol, $driver, $location, $note]) {
            DB::table('operasional_update_posisi_unit')->updateOrInsert(
                ['id' => sprintf('DUMMY-POS-%02d', $index + 1)],
                [
                    'tanggal_jam' => now()->subMinutes($index * 11),
                    'nopol' => $nopol,
                    'nama_driver' => $driver,
                    'location' => $location,
                    'keterangan' => $note.' Area: '.$area.'.',
                ]
            );
        }
    }
}
