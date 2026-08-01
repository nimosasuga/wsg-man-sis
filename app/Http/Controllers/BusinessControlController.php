<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class BusinessControlController extends Controller
{
    public function performance()
    {
        $dbChartData = Cache::get('dashboard.db_chart_data', []);

        if ($dbChartData === [] || !array_key_exists('primaryActivityByYear', $dbChartData)) {
            app(DashboardController::class)->index();
            $dbChartData = Cache::get('dashboard.db_chart_data', []);
        }

        return Inertia::render('BusinessControl/Performance', [
            'dbChartData' => $dbChartData,
        ]);
    }

    public function health()
    {
        $dbChartData = Cache::get('dashboard.db_chart_data', []);

        if ($dbChartData === [] || !array_key_exists('primaryActivityByYear', $dbChartData)) {
            app(DashboardController::class)->index();
            $dbChartData = Cache::get('dashboard.db_chart_data', []);
        }

        return Inertia::render('BusinessControl/Health', [
            'title' => 'Business Health',
            'dbChartData' => $dbChartData,
        ]);
    }

    public function fatDocumentsPrimary(Request $request)
    {
        $status = $request->get('status');
        $search = $request->get('search');
        $kategori = $request->get('kategori');
        $regional = $request->get('regional');
        $vendor = $request->get('vendor');
        $jenis = $request->get('jenis');
        $week = $request->get('week');
        $tanggal_mulai = $request->get('tanggal_mulai');
        $tanggal_selesai = $request->get('tanggal_selesai');

        $query = DB::table('operasional_primary_input')
            ->select([
                'id_key', 'no_bap', 'regional', 'area', 'week', 'tanggal_muat', 'tanggal_terima',
                'rute_asal', 'rute_tujuan', 'vendor', 'nopol_driver',
                'qty', 'jenis', 'total', 'no_po', 'no_si', 'no_sj', 'tarif', 'total_tarif',
                'tarif_vendor', 'biaya_buruh_muat', 'biaya_buruh_bongkar', 'biaya_dooring',
                'biaya_kapal', 'biaya_bbm', 'biaya_transport', 'biaya_lain_lain', 'total_biaya',
                'productivity', 'profit', 'keterangan', 'status_dokument', 'tanggal_dokument_naik',
            ]);

        if ($status) {
            if ($status === 'DITERIMA FAT') {
                $query->where('status_dokument', 'DITERIMA');
            } elseif ($status === 'BELUM NAIK') {
                $query->where(function ($q) {
                    $q->whereNull('status_dokument')->orWhere('status_dokument', '')->orWhere('status_dokument', '0');
                });
            }
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nopol_driver', 'like', "%{$search}%")
                  ->orWhere('area', 'like', "%{$search}%");
            });
        }

        if ($kategori) {
            $areaList = DB::table('dropdownlist_area_primary')
                ->where('katagori', $kategori)
                ->pluck('area');
            if ($areaList->isNotEmpty()) {
                $query->whereIn('area', $areaList);
            }
        }

        if ($regional) {
            $query->where('regional', $regional);
        }

        if ($vendor) {
            $query->where('vendor', $vendor);
        }

        if ($jenis) {
            $query->where('jenis', $jenis);
        }

        if ($week) {
            $query->where('week', $week);
        }

        if ($tanggal_mulai) {
            $query->whereDate('tanggal_muat', '>=', $tanggal_mulai);
        }

        if ($tanggal_selesai) {
            $query->whereDate('tanggal_muat', '<=', $tanggal_selesai);
        }

        $records = $query->orderByDesc('tanggal_muat')->paginate(25);

        $kategoriList = DB::table('dropdownlist_area_primary')
            ->select('katagori')
            ->distinct()
            ->whereNotNull('katagori')
            ->where('katagori', '!=', '')
            ->orderBy('katagori')
            ->pluck('katagori');

        $regionalList = DB::table('operasional_primary_input')
            ->select('regional')
            ->distinct()
            ->whereNotNull('regional')
            ->where('regional', '!=', '')
            ->orderBy('regional')
            ->pluck('regional');

        $vendorList = DB::table('operasional_primary_input')
            ->select('vendor')
            ->distinct()
            ->whereNotNull('vendor')
            ->where('vendor', '!=', '')
            ->orderBy('vendor')
            ->pluck('vendor');

        $jenisList = DB::table('operasional_primary_input')
            ->select('jenis')
            ->distinct()
            ->whereNotNull('jenis')
            ->where('jenis', '!=', '')
            ->orderBy('jenis')
            ->pluck('jenis');

        $weekList = DB::table('operasional_primary_input')
            ->select('week')
            ->distinct()
            ->whereNotNull('week')
            ->where('week', '!=', '')
            ->orderBy('week')
            ->pluck('week');

        return Inertia::render('BusinessControl/FatDocumentsPrimary', [
            'records' => $records,
            'kategoriList' => $kategoriList,
            'regionalList' => $regionalList,
            'vendorList' => $vendorList,
            'jenisList' => $jenisList,
            'weekList' => $weekList,
            'filters' => $request->only(['status', 'search', 'kategori', 'regional', 'vendor', 'jenis', 'week', 'tanggal_mulai', 'tanggal_selesai']),
        ]);
    }

    public function fatDocumentsPrimaryDetail(string $id)
    {
        $record = DB::table('operasional_primary_input')
            ->select([
                'id_key', 'no_bap', 'regional', 'area', 'week', 'tanggal_muat', 'tanggal_terima',
                'rute_asal', 'rute_tujuan', 'vendor', 'nopol_driver',
                'qty', 'jenis', 'total', 'no_po', 'no_si', 'no_sj', 'tarif', 'total_tarif',
                'tarif_vendor', 'biaya_buruh_muat', 'biaya_buruh_bongkar', 'biaya_dooring',
                'biaya_kapal', 'biaya_bbm', 'biaya_transport', 'biaya_lain_lain', 'total_biaya',
                'productivity', 'profit', 'keterangan', 'status_dokument', 'tanggal_dokument_naik',
            ])
            ->where('id_key', $id)
            ->first();

        if (!$record) {
            abort(404, 'Record not found');
        }

        $editor = DB::table('operasional_catatan_update')
            ->where('id_record', $id)
            ->value('nama_admin');

        return Inertia::render('BusinessControl/FatDocumentsPrimaryDetail', [
            'record' => $record,
            'editor' => $editor ?: '—',
        ]);
    }

    public function primaryEditor(string $id)
    {
        $editor = DB::table('operasional_catatan_update')
            ->where('id_record', $id)
            ->value('nama_admin');

        return response()->json([
            'editor' => $editor ?: '—',
        ]);
    }

    public function fatDocumentsSecondary(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('status');
        $week = $request->get('week');
        $tanggal_mulai = $request->get('tanggal_mulai');
        $tanggal_selesai = $request->get('tanggal_selesai');

        $query = DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL'])
            ->select([
                'id_key', 'no_po', 'no_si', 'tanggal', 'jam_mulai', 'jam_selesai',
                'nopol', 'tipe_unit', 'area', 'driver', 'helper', 'qty',
                'tarif_unit', 'add_cost_long_route', 'subsidi_bbm', 'tkbm', 'spsi',
                'parkir_liar_keamanan', 'allowance', 'biaya_tagihan_hotel', 'tarif_hotel',
                'subsidi_hotel', 'selisih_tagihan_hotel', 'penyebrangan_pas_masuk',
                'rapid_antigen', 'nominal_pengisian_bbm', 'selisih_bbm', 'non_claim_bbm',
                'nominal_pengisian_bbm_2', 'selisih_bbm_2', 'non_claim_bbm_2',
                'total_nominal_pengisian_bbm', 'parkir_resmi', 'tarif_sewa_unit_vendor',
                'tol', 'kirim_dokumen', 'atk', 'tarif_gs', 'biaya_lainnya',
                'total_biaya_operasional', 'total_tarif', 'status_dokument',
                'tanggal_dokument_naik', 'keterangan', 'region', 'project',
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nopol', 'like', "%{$search}%")
                  ->orWhere('area', 'like', "%{$search}%")
                  ->orWhere('driver', 'like', "%{$search}%");
            });
        }

        if ($status) {
            if ($status === 'DITERIMA FAT') {
                $query->where('status_dokument', 'DITERIMA');
            } elseif ($status === 'BELUM NAIK') {
                $query->where(function ($q) {
                    $q->whereNull('status_dokument')->orWhere('status_dokument', '')->orWhere('status_dokument', '0');
                });
            }
        }

        if ($week) {
            $query->where('week', $week);
        }

        if ($tanggal_mulai) {
            $query->whereDate('tanggal', '>=', $tanggal_mulai);
        }

        if ($tanggal_selesai) {
            $query->whereDate('tanggal', '<=', $tanggal_selesai);
        }

        $records = $query->orderByDesc('tanggal')->paginate(25);

        $weekList = DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL'])
            ->select('week')
            ->distinct()
            ->whereNotNull('week')
            ->orderBy('week')
            ->pluck('week');

        return Inertia::render('BusinessControl/FatDocumentsSecondary', [
            'records' => $records,
            'weekList' => $weekList,
            'filters' => $request->only(['search', 'status', 'week', 'tanggal_mulai', 'tanggal_selesai']),
        ]);
    }

    public function fatDocumentsSecondaryDetail(string $id)
    {
        $record = DB::table('operasional_secondary_input')
            ->select([
                'id_key', 'no_po', 'no_si', 'tanggal', 'jam_mulai', 'jam_selesai',
                'nopol', 'tipe_unit', 'area', 'driver', 'helper', 'qty',
                'tarif_unit', 'add_cost_long_route', 'subsidi_bbm', 'tkbm', 'spsi',
                'parkir_liar_keamanan', 'allowance', 'biaya_tagihan_hotel', 'tarif_hotel',
                'subsidi_hotel', 'selisih_tagihan_hotel', 'penyebrangan_pas_masuk',
                'rapid_antigen', 'nominal_pengisian_bbm', 'selisih_bbm', 'non_claim_bbm',
                'nominal_pengisian_bbm_2', 'selisih_bbm_2', 'non_claim_bbm_2',
                'total_nominal_pengisian_bbm', 'parkir_resmi', 'tarif_sewa_unit_vendor',
                'tol', 'kirim_dokumen', 'atk', 'tarif_gs', 'biaya_lainnya',
                'total_biaya_operasional', 'total_tarif', 'status_dokument',
                'tanggal_dokument_naik', 'keterangan', 'region', 'project',
            ])
            ->where('id_key', $id)
            ->first();

        if (!$record) {
            abort(404, 'Record not found');
        }

        $editor = DB::table('operasional_catatan_update')
            ->where('id_record', $id)
            ->value('nama_admin');

        return Inertia::render('BusinessControl/FatDocumentsSecondaryDetail', [
            'record' => $record,
            'editor' => $editor ?: '—',
        ]);
    }
}
