<?php

namespace App\Support;

use App\Models\Inventori;
use Illuminate\Support\Facades\DB;

class VehicleCostSummary
{
    public static function forNopol(?string $nopol): array
    {
        $unit = $nopol ? Inventori::where('nopol', $nopol)->first() : null;
        $serviceQuery = DB::table('maintenance_input_maintenance')->where('nopol', $nopol);
        $banQuery = DB::table('maintenance_monitoring_ban')->where('nopol', $nopol);
        $primaryQuery = DB::table('operasional_primary_input')->where('nopol_driver', $nopol);
        $secondaryQuery = DB::table('operasional_secondary_input')->where('nopol', $nopol);

        $pajakTahunan = (float) ($unit->biaya_pajak ?? 0);
        $kir = (float) ($unit->biaya_kir ?? 0);
        $pajakLimaTahun = (float) ($unit->biaya_stnk ?? 0);
        $serviceUmum = (float) (clone $serviceQuery)->sum('total_biaya_service');
        $serviceBan = (float) (clone $banQuery)->sum('total_harga');
        $primary = (float) (clone $primaryQuery)->sum('total_biaya');
        $secondary = (float) (clone $secondaryQuery)->sum('total_biaya_operasional');

        $items = [
            [
                'key' => 'pajak_1_tahun',
                'label' => 'Pajak 1 tahun',
                'amount' => $pajakTahunan,
                'count' => $pajakTahunan > 0 ? 1 : 0,
                'date' => $unit->jatuh_tempo_pajak ?? null,
            ],
            [
                'key' => 'pajak_5_tahun',
                'label' => 'Pajak 5 tahun / STNK',
                'amount' => $pajakLimaTahun,
                'count' => $pajakLimaTahun > 0 ? 1 : 0,
                'date' => $unit->jatuh_tempo_stnk ?? null,
            ],
            [
                'key' => 'kir',
                'label' => 'Biaya KIR',
                'amount' => $kir,
                'count' => $kir > 0 ? 1 : 0,
                'date' => $unit->jatuh_tempo_kir ?? null,
            ],
            [
                'key' => 'service_umum',
                'label' => 'Service umum',
                'amount' => $serviceUmum,
                'count' => (clone $serviceQuery)->count(),
                'date' => (clone $serviceQuery)->max('tanggal_services'),
            ],
            [
                'key' => 'service_ban',
                'label' => 'Service ban',
                'amount' => $serviceBan,
                'count' => (clone $banQuery)->count(),
                'date' => (clone $banQuery)->max('tanggal_ganti_ban'),
            ],
            [
                'key' => 'operasional_primary',
                'label' => 'Operasional Primary',
                'amount' => $primary,
                'count' => (clone $primaryQuery)->count(),
                'date' => (clone $primaryQuery)->max('tanggal_muat'),
            ],
            [
                'key' => 'operasional_secondary',
                'label' => 'Operasional Secondary',
                'amount' => $secondary,
                'count' => (clone $secondaryQuery)->count(),
                'date' => (clone $secondaryQuery)->max('tanggal'),
            ],
        ];

        return [
            'nopol' => $nopol,
            'total' => array_sum(array_column($items, 'amount')),
            'legalitasTotal' => $pajakTahunan + $pajakLimaTahun + $kir,
            'maintenanceTotal' => $serviceUmum + $serviceBan,
            'serviceTotal' => $serviceUmum + $serviceBan,
            'primaryTotal' => $primary,
            'secondaryTotal' => $secondary,
            'operasionalTotal' => $primary + $secondary,
            'items' => $items,
            'serviceCount' => $items[3]['count'],
            'banCount' => $items[4]['count'],
            'primaryCount' => $items[5]['count'],
            'secondaryCount' => $items[6]['count'],
        ];
    }
}
