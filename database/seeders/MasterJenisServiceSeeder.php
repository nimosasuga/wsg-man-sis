<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterJenisServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            'SERVICE RUTIN',
            'GANTI OLI',
            'REM',
            'KAKI-KAKI',
            'MESIN',
            'TRANSMISI',
            'AC',
            'KELISTRIKAN',
            'BODY',
            'GENERAL CHECK',
        ];

        foreach ($services as $index => $service) {
            DB::table('dropdownlist_jenis_service')->insertOrIgnore([
                'id_key' => sprintf('MASTER-SERVICE-%02d', $index + 1),
                'jenis_service' => $service,
            ]);
        }
    }
}
