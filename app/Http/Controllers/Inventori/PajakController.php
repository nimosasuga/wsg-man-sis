<?php

namespace App\Http\Controllers\Inventori;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PajakController extends Controller
{
    /**
     * Menampilkan daftar tabel Pajak & STNK
     */
    public function index()
    {
        // Tarik data spesifik dari MySQL untuk performa optimal
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

        // Lempar data asli ke Frontend React (akan ditangkap sebagai props)
        return Inertia::render('Inventori/Pajak/Index', [
            'rawTableData' => $dataInventori
        ]);
    }

    /**
     * Menampilkan Detail per Unit (Berdasarkan Nopol)
     */
    public function show(mixed $nopol)
    {
        // Cari data berdasarkan nopol, jika tidak ada, kembalikan 404
        $unit = Inventori::where('nopol', $nopol)->firstOrFail();

        return Inertia::render('Inventori/Pajak/Detail', [
            'unitData' => $unit
        ]);
    }
}
