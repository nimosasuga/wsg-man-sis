<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RentalLegalCostSeeder extends Seeder
{
    public function run(): void
    {
        $records = DB::table('operasional_rental_unit_input')->get(['id_key', 'tarif_sewa_unit_bln']);

        foreach ($records as $row) {
            $legal = round((float) $row->tarif_sewa_unit_bln * (rand(5, 20) / 100), -3);
            DB::table('operasional_rental_unit_input')
                ->where('id_key', $row->id_key)
                ->update(['biaya_legalitas' => max($legal, 0)]);
        }

        $this->command->info('Biaya legalitas telah diisi untuk '.$records->count().' record rental.');
    }
}
