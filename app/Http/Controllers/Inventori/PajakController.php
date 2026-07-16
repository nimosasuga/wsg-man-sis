<?php

namespace App\Http\Controllers\Inventori;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use App\Support\VehicleCostSummary;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PajakController extends Controller
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

        return Inertia::render('Inventori/Pajak/Index', [
            'rawTableData' => $dataInventori
        ]);
    }

    public function show(mixed $nopol)
    {
        // 1. Data Utama Unit
        $unit = Inventori::where('nopol', $nopol)->firstOrFail();

        // 2. Tarik Riwayat Service dari DB
        $riwayatService = DB::table('maintenance_input_maintenance')
            ->where('nopol', $nopol)
            ->orderBy('tanggal_services', 'desc')
            ->get(['id_key', 'tanggal_services', 'tipe_service', 'total_biaya_service', 'keluhan']);

        // 3. Tarik Riwayat Ganti Ban dari DB
        $riwayatBan = DB::table('maintenance_monitoring_ban')
            ->where('nopol', $nopol)
            ->orderBy('tanggal_ganti_ban', 'desc')
            ->get(['id_key', 'tanggal_ganti_ban', 'posisi', 'jenis_ban', 'tipe_ban', 'total_harga']);

        // 4. Kalkulasi Agregat untuk KPI Card di atas
        $aggregates = [
            'qtyService' => $riwayatService->count(),
            'biayaService' => $riwayatService->sum('total_biaya_service'),
            'qtyBan' => $riwayatBan->count(),
            'biayaBan' => $riwayatBan->sum('total_harga'),
        ];

        // Lempar semua data ke frontend
        return Inertia::render('Inventori/Pajak/Detail', [
            'unitData' => $unit,
            'riwayatService' => $riwayatService,
            'riwayatBan' => $riwayatBan,
            'aggregates' => $aggregates,
            'vehicleCost' => VehicleCostSummary::forNopol((string) $unit->nopol),
        ]);
    }
}
