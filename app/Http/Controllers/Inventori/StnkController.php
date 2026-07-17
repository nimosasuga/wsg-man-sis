<?php

namespace App\Http\Controllers\Inventori;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use App\Support\VehicleCostSummary;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StnkController extends Controller
{
    public function index()
    {
        $dataInventori = Inventori::select(
            'id_key',
            'nopol',
            'area',
            'tipe',
            'pabrikan',
            'model',
            'jatuh_tempo_stnk',
            'jatuh_tempo_pajak',
            'status_stnk',
            'status_pajak',
            'foto_stnk',
            'foto_pajak'
        )->get();

        return Inertia::render('Inventori/Stnk/Index', [
            'rawTableData' => $dataInventori
        ]);
    }

    public function show(mixed $nopol)
    {
        $unit = Inventori::where('nopol', $nopol)->firstOrFail();

        $riwayatService = DB::table('maintenance_input_maintenance')
            ->where('nopol', $nopol)
            ->orderBy('tanggal_services', 'desc')
            ->get(['id_key', 'tanggal_services', 'tipe_service', 'total_biaya_service', 'keluhan']);

        $riwayatBan = DB::table('maintenance_monitoring_ban')
            ->where('nopol', $nopol)
            ->orderBy('tanggal_ganti_ban', 'desc')
            ->get(['id_key', 'tanggal_ganti_ban', 'posisi', 'jenis_ban', 'tipe_ban', 'total_harga']);
        $riwayatPrimary = DB::table('operasional_primary_input')
            ->where('nopol_driver', $nopol)
            ->orderBy('tanggal_muat', 'desc')
            ->get(['id_key', 'tanggal_muat', 'area', 'rute_asal', 'rute_tujuan', 'jenis', 'total_biaya']);
        $riwayatSecondary = DB::table('operasional_secondary_input')
            ->where('nopol', $nopol)
            ->orderBy('tanggal', 'desc')
            ->get(['id_key', 'tanggal', 'area', 'rute', 'order_type', 'tipe_unit', 'total_biaya_operasional']);

        $aggregates = [
            'qtyService' => $riwayatService->count(),
            'biayaService' => $riwayatService->sum('total_biaya_service'),
            'qtyBan' => $riwayatBan->count(),
            'biayaBan' => $riwayatBan->sum('total_harga'),
            'qtyPrimary' => $riwayatPrimary->count(),
            'biayaPrimary' => $riwayatPrimary->sum('total_biaya'),
            'qtySecondary' => $riwayatSecondary->count(),
            'biayaSecondary' => $riwayatSecondary->sum('total_biaya_operasional'),
        ];

        return Inertia::render('Inventori/Stnk/Detail', [
            'unitData' => $unit,
            'riwayatService' => $riwayatService,
            'riwayatBan' => $riwayatBan,
            'riwayatPrimary' => $riwayatPrimary,
            'riwayatSecondary' => $riwayatSecondary,
            'aggregates' => $aggregates,
            'vehicleCost' => VehicleCostSummary::forNopol((string) $unit->nopol),
        ]);
    }
}
