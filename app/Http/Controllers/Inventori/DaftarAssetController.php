<?php

namespace App\Http\Controllers\Inventori;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DaftarAssetController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventori/DaftarAsset/Index');
    }

    public function assetHo()
    {
        $dataAsset = DB::table('hr_manager_inventaris_laptop')
            ->select(
                'id_key',
                'nama_pengguna',
                'katagori',
                'jenis_barang',
                'model_unit',
                'divisi',
                'lokasi',
                'jumlah_unit',
                'pengguna_sebelumnya',
                'spesifikasi',
                'status',
                'warna',
                'gambar',
                'serial_number',
                'keterangan'
            )
            ->get();

        return Inertia::render('Inventori/DaftarAsset/AssetHo', [
            'rawTableData' => $dataAsset,
        ]);
    }

    public function assetHoDetail(string $id)
    {
        $asset = DB::table('hr_manager_inventaris_laptop')
            ->where('id_key', $id)
            ->first();

        abort_if(!$asset, 404);

        return Inertia::render('Inventori/DaftarAsset/AssetHoDetail', [
            'asset' => $asset,
        ]);
    }

    public function kendaraanOperasional()
    {
        $dataKendaraan = DB::table('hr_manager_db_inventori')
            ->select(
                'id_key',
                'region',
                'area',
                'area_asal',
                'inventaris',
                'nopol',
                'tipe',
                'pabrikan',
                'model',
                'jenis',
                'gps',
                'no_mesin',
                'no_rangka',
                'project',
                'tahun',
                'tahun_pembelian',
                'distribusi',
                'status',
                'keterangan',
                'foto_unit',
                'status_stnk',
                'status_pajak',
                'status_kir',
                'my_pertamina'
            )
            ->where('project', 'OPERASIONAL UNIT')
            ->get();

        return Inertia::render('Inventori/DaftarAsset/KendaraanOperasional', [
            'rawTableData' => $dataKendaraan,
        ]);
    }

    public function kendaraanOperasionalDetail(string $id)
    {
        $asset = DB::table('hr_manager_db_inventori')
            ->where('id_key', $id)
            ->where('project', 'OPERASIONAL UNIT')
            ->first();

        abort_if(!$asset, 404);

        return Inertia::render('Inventori/DaftarAsset/KendaraanOperasionalDetail', [
            'asset' => $asset,
        ]);
    }

    public function toolkit()
    {
        $dataToolkit = DB::table('operasional_checklist')
            ->select(
                'id_key',
                'tanggal',
                'nopol',
                'tipe_unit',
                'area',
                'driver',
                'surat_kendaraan',
                'kebersihan_unit_kabin',
                'kondisi_mesin_oli',
                'service_berkala',
                'air_radiator',
                'air_aki',
                'kondisi_rem',
                'indikator_dashboard',
                'kondisi_kebersihan_box',
                'klakson',
                'lampu_lampu',
                'apar',
                'safety_belt',
                'p3k',
                'dongkrak',
                'kunci_roda',
                'engsel_pengunci_pintu',
                'gembok',
                'kondisi_ban',
                'tekanan_angin_ban',
                'status_checklist',
                'keluhan'
            )
            ->orderByDesc('tanggal')
            ->get();

        return Inertia::render('Inventori/DaftarAsset/Toolkit', [
            'rawTableData' => $dataToolkit,
        ]);
    }

    public function toolkitDetail(string $id)
    {
        $checklist = DB::table('operasional_checklist')
            ->where('id_key', $id)
            ->first();

        abort_if(!$checklist, 404);

        return Inertia::render('Inventori/DaftarAsset/ToolkitDetail', [
            'checklist' => $checklist,
        ]);
    }
}
