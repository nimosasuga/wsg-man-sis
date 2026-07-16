<?php

namespace App\Http\Controllers\Inventori;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use App\Support\VehicleCostSummary;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class KirController extends Controller
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
            'jatuh_tempo_kir',
            'jatuh_tempo_stnk',
            'jatuh_tempo_pajak',
            'status_kir',
            'status_stnk',
            'status_pajak',
            'foto_buku_kir',
            'foto_stnk',
            'foto_pajak',
            'keterangan_proses_keur'
        )->get();

        return Inertia::render('Inventori/Kir/Index', [
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

        $aggregates = [
            'qtyService' => $riwayatService->count(),
            'biayaService' => $riwayatService->sum('total_biaya_service'),
            'qtyBan' => $riwayatBan->count(),
            'biayaBan' => $riwayatBan->sum('total_harga'),
        ];

        return Inertia::render('Inventori/Kir/Detail', [
            'unitData' => $unit,
            'riwayatService' => $riwayatService,
            'riwayatBan' => $riwayatBan,
            'aggregates' => $aggregates,
            'vehicleCost' => VehicleCostSummary::forNopol((string) $unit->nopol),
        ]);
    }
}
