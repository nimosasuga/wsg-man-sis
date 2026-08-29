<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Support\LegacyDate;
use App\Models\Inventori;

class BusinessControlController extends Controller
{
    public function performance(Request $request)
    {
        $year = $request->get('tahun');
        $allPerformanceData = Cache::remember('business-control.performance.v1.all', now()->addMinutes(5), fn () => $this->performanceData());
        $availableYears = collect($allPerformanceData['monthly'])->pluck('tahun')->unique()->sortDesc()->values()->all();
        $selectedYear = $year && in_array((int) $year, $availableYears, true) ? (int) $year : null;

        $dbChartData = Cache::get('dashboard.db_chart_data.v5', []);

        if ($dbChartData === [] || !array_key_exists('primaryActivityByYear', $dbChartData)) {
            app(DashboardController::class)->index();
            $dbChartData = Cache::get('dashboard.db_chart_data.v5', []);
        }

        $performanceData = $selectedYear
            ? Cache::remember("business-control.performance.v1.{$selectedYear}", now()->addMinutes(5), fn () => $this->performanceData($selectedYear))
            : $allPerformanceData;

        return Inertia::render('BusinessControl/Performance', [
            'dbChartData' => $dbChartData,
            'performanceData' => $performanceData,
            'selectedYear' => $selectedYear,
            'availableYears' => $availableYears,
        ]);
    }

    private function performanceData(?int $year = null): array
    {
        $modules = [
            'Primary' => ['module' => 'Primary', 'revenue' => 0.0, 'cost' => 0.0, 'records' => 0],
            'Secondary' => ['module' => 'Secondary', 'revenue' => 0.0, 'cost' => 0.0, 'records' => 0],
            'Rental' => ['module' => 'Rental', 'revenue' => 0.0, 'cost' => 0.0, 'records' => 0],
            'LCL' => ['module' => 'LCL', 'revenue' => 0.0, 'cost' => 0.0, 'records' => 0],
        ];
        $areas = [];
        $addArea = static function (mixed $area, float $revenue, float $cost) use (&$areas): void {
            $name = mb_strtoupper(trim((string) $area)) ?: 'TIDAK DIKETAHUI';
            $areas[$name] ??= ['area' => $name, 'revenue' => 0.0, 'cost' => 0.0, 'records' => 0];
            $areas[$name]['revenue'] += $revenue;
            $areas[$name]['cost'] += $cost;
            $areas[$name]['records']++;
        };
        $monthly = [];
        $addMonthly = static function (mixed $date, float $revenue, float $cost) use (&$monthly): void {
            $parsed = LegacyDate::parse($date);
            if (! $parsed) {
                return;
            }

            $key = $parsed->format('Y-m');
            $monthly[$key] ??= ['tahun' => (int) $parsed->format('Y'), 'bulan' => (int) $parsed->format('n'), 'revenue' => 0.0, 'cost' => 0.0];
            $monthly[$key]['revenue'] += $revenue;
            $monthly[$key]['cost'] += $cost;
        };

        $primaryQuery = DB::table('operasional_primary_input');
        if ($year) {
            LegacyDate::whereYear($primaryQuery, 'tanggal_muat', $year);
        }
        $primaryQuery->get(['area', 'tanggal_muat', 'total_tarif', 'total_biaya'])
            ->each(function ($row) use (&$modules, $addArea, $addMonthly) {
                $revenue = (float) ($row->total_tarif ?: 0);
                $cost = (float) ($row->total_biaya ?: 0);
                $modules['Primary']['revenue'] += $revenue;
                $modules['Primary']['cost'] += $cost;
                $modules['Primary']['records']++;
                $addArea($row->area, $revenue, $cost);
                $addMonthly($row->tanggal_muat, $revenue, $cost);
            });

        $ovtLookup = [];
        DB::table('operasional_absen')->get(['nama', 'tanggal', 'approval_ovt'])->each(function ($row) use (&$ovtLookup) {
            $date = LegacyDate::iso($row->tanggal);
            if ($date && $row->nama) {
                $ovtLookup[$date.'|'.mb_strtoupper(trim((string) $row->nama))] ??= (float) ($row->approval_ovt ?: 0);
            }
        });

        $secondaryQuery = DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL']);
        if ($year) {
            LegacyDate::whereYear($secondaryQuery, 'tanggal', $year);
        }
        $secondaryQuery->get(['area', 'tanggal', 'driver', 'helper', 'total_tarif', 'add_cost_long_route', 'tkbm', 'spsi', 'parkir_liar_keamanan', 'penyebrangan_pas_masuk', 'rapid_antigen', 'allowance', 'total_subsidi_bbm', 'subsidi_hotel', 'total_biaya_operasional'])
            ->each(function ($row) use (&$modules, $ovtLookup, $addArea, $addMonthly) {
                $date = LegacyDate::iso($row->tanggal);
                $ovt = static fn ($name): float => $date && $name ? ($ovtLookup[$date.'|'.mb_strtoupper(trim((string) $name))] ?? 0) : 0;
                $revenue = (float) ($row->total_tarif ?: 0) + (float) ($row->add_cost_long_route ?: 0) + (float) ($row->tkbm ?: 0) + (float) ($row->spsi ?: 0) + (float) ($row->parkir_liar_keamanan ?: 0) + (float) ($row->penyebrangan_pas_masuk ?: 0) + (float) ($row->rapid_antigen ?: 0) + ((float) ($row->allowance ?: 0) > 0 ? 125000 : 0) + (float) ($row->total_subsidi_bbm ?: 0) + (float) ($row->subsidi_hotel ?: 0) + (max($ovt($row->driver), $ovt($row->helper)) * 32500);
                $cost = (float) ($row->total_biaya_operasional ?: 0);
                $modules['Secondary']['revenue'] += $revenue;
                $modules['Secondary']['cost'] += $cost;
                $modules['Secondary']['records']++;
                $addArea($row->area, $revenue, $cost);
                $addMonthly($row->tanggal, $revenue, $cost);
            });

        $rentalQuery = DB::table('operasional_rental_unit_input');
        if ($year) {
            LegacyDate::whereYear($rentalQuery, 'tanggal', $year);
        }
        $rentalQuery->get(['area', 'tanggal', 'tarif_sewa_unit_bln', 'biaya_legalitas'])->each(function ($row) use (&$modules, $addArea, $addMonthly) {
            $revenue = (float) ($row->tarif_sewa_unit_bln ?: 0);
            $cost = (float) ($row->biaya_legalitas ?: 0);
            $modules['Rental']['revenue'] += $revenue;
            $modules['Rental']['cost'] += $cost;
            $modules['Rental']['records']++;
            $addArea($row->area, $revenue, $cost);
            $addMonthly($row->tanggal, $revenue, $cost);
        });

        $lclQuery = DB::table('db_chargo_data_paket_masuk');
        if ($year) {
            LegacyDate::whereYear($lclQuery, 'tanggal', $year);
        }
        $lclQuery->get(['kota_tujuan', 'tanggal', 'total_ongkir'])->each(function ($row) use (&$modules, $addArea, $addMonthly) {
            $revenue = (float) ($row->total_ongkir ?: 0);
            $modules['LCL']['revenue'] += $revenue;
            $modules['LCL']['records']++;
            $addArea($row->kota_tujuan, $revenue, 0);
            $addMonthly($row->tanggal, $revenue, 0);
        });

        $modules = collect($modules)->map(function (array $module) {
            $module['profit'] = $module['revenue'] - $module['cost'];
            $module['margin'] = $module['revenue'] > 0 ? $module['profit'] / $module['revenue'] * 100 : null;
            return $module;
        })->values()->all();

        $monthly = collect($monthly)->map(function (array $month) {
            $month['profit'] = $month['revenue'] - $month['cost'];
            return $month;
        })->sortBy(fn (array $month) => sprintf('%04d-%02d', $month['tahun'], $month['bulan']))->values()->all();

        $areas = collect($areas)->map(function (array $area) {
            $area['profit'] = $area['revenue'] - $area['cost'];
            return $area;
        })->sortByDesc('profit')->values()->all();
        $revenue = (float) collect($modules)->sum('revenue');
        $cost = (float) collect($modules)->sum('cost');
        $profit = $revenue - $cost;

        return [
            'summary' => ['revenue' => $revenue, 'cost' => $cost, 'profit' => $profit, 'margin' => $revenue > 0 ? $profit / $revenue * 100 : 0],
            'modules' => $modules,
            'monthly' => $monthly,
            'areas' => $areas,
        ];
    }

    public function health()
    {
        $dbChartData = Cache::get('dashboard.db_chart_data.v5', []);

        if ($dbChartData === [] || !array_key_exists('primaryActivityByYear', $dbChartData)) {
            app(DashboardController::class)->index();
            $dbChartData = Cache::get('dashboard.db_chart_data.v5', []);
        }

        return Inertia::render('BusinessControl/Health', [
            'title' => 'Data Health',
            'dbChartData' => $dbChartData,
            'healthData' => Cache::remember('business-control.health.v1', now()->addMinutes(5), fn () => $this->healthData()),
        ]);
    }

    private function healthData(): array
    {
        $units = Inventori::select('nopol', 'area', 'status_pajak', 'status_stnk', 'status_kir', 'jatuh_tempo_pajak', 'jatuh_tempo_stnk', 'jatuh_tempo_kir')->get();
        $documentTypes = [
            ['label' => 'Pajak', 'status' => 'status_pajak', 'date' => 'jatuh_tempo_pajak'],
            ['label' => 'STNK', 'status' => 'status_stnk', 'date' => 'jatuh_tempo_stnk'],
            ['label' => 'KIR', 'status' => 'status_kir', 'date' => 'jatuh_tempo_kir'],
        ];
        $documents = [];
        $dueSoon = [];
        $areaHealth = [];

        foreach ($units as $unit) {
            $area = mb_strtoupper(trim((string) $unit->area)) ?: 'TIDAK DIKETAHUI';
            $areaHealth[$area] ??= ['area' => $area, 'units' => 0, 'complete' => 0, 'expired' => 0, 'dueSoon' => 0, 'missing' => 0];
            $areaHealth[$area]['units']++;
            $complete = true;

            foreach ($documentTypes as $document) {
                $status = mb_strtoupper(trim((string) $unit->{$document['status']}));
                $date = $unit->{$document['date']};
                $documents[$document['label']] ??= ['label' => $document['label'], 'active' => 0, 'expired' => 0, 'dueSoon' => 0, 'missing' => 0, 'total' => 0];
                $documents[$document['label']]['total']++;

                if ($status === 'AKTIF') {
                    $documents[$document['label']]['active']++;
                } elseif ($status === 'EXPIRED') {
                    $documents[$document['label']]['expired']++;
                    $areaHealth[$area]['expired']++;
                    $complete = false;
                } elseif ($status === 'HAMPIR EXPIRED') {
                    $documents[$document['label']]['dueSoon']++;
                    $areaHealth[$area]['dueSoon']++;
                    $complete = false;
                } else {
                    $documents[$document['label']]['missing']++;
                    $areaHealth[$area]['missing']++;
                    $complete = false;
                }

                if (in_array($status, ['EXPIRED', 'HAMPIR EXPIRED'], true)) {
                    $dueSoon[] = ['type' => $document['label'], 'nopol' => $unit->nopol ?: '—', 'area' => $area, 'date' => LegacyDate::display($date), 'status' => $status];
                }
            }

            if ($complete) {
                $areaHealth[$area]['complete']++;
            }
        }

        $anomalies = [
            ['label' => 'Status dokumen unit kosong', 'value' => collect($documents)->sum('missing')],
            ['label' => 'FAT Primary belum naik', 'value' => $this->emptyDocumentCount('operasional_primary_input')],
            ['label' => 'FAT Secondary belum naik', 'value' => $this->emptyDocumentCount('operasional_secondary_input')],
            ['label' => 'Primary tanpa area', 'value' => $this->emptyFieldCount('operasional_primary_input', 'area')],
            ['label' => 'Secondary tanpa area', 'value' => $this->emptyFieldCount('operasional_secondary_input', 'area')],
        ];
        $anomalies = array_values(array_filter($anomalies, fn (array $item) => $item['value'] > 0));

        $areaHealth = collect($areaHealth)->map(function (array $area) {
            $totalChecks = max($area['units'] * 3, 1);
            $healthyChecks = ($area['complete'] * 3) + max(0, $area['units'] - $area['complete'] - $area['expired'] - $area['dueSoon'] - $area['missing']);
            $area['score'] = (int) round(min(100, max(0, $healthyChecks / $totalChecks * 100)));
            return $area;
        })->sortBy('score')->values()->all();

        return [
            'documents' => array_values($documents),
            'dueSoon' => collect($dueSoon)->sortBy(fn (array $item) => $item['status'] === 'EXPIRED' ? 0 : 1)->take(12)->values()->all(),
            'anomalies' => $anomalies,
            'areaHealth' => $areaHealth,
        ];
    }

    private function emptyDocumentCount(string $table): int
    {
        return (int) DB::table($table)->where(fn ($query) => $query->whereNull('status_dokument')->orWhere('status_dokument', '')->orWhere('status_dokument', '0'))->count();
    }

    private function emptyFieldCount(string $table, string $column): int
    {
        return (int) DB::table($table)->where(fn ($query) => $query->whereNull($column)->orWhere($column, ''))->count();
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
            LegacyDate::whereFrom($query, 'tanggal_muat', $tanggal_mulai);
        }

        if ($tanggal_selesai) {
            LegacyDate::whereTo($query, 'tanggal_muat', $tanggal_selesai);
        }

        $records = LegacyDate::orderBy($query, 'tanggal_muat', 'desc')->paginate(25);

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
            LegacyDate::whereFrom($query, 'tanggal', $tanggal_mulai);
        }

        if ($tanggal_selesai) {
            LegacyDate::whereTo($query, 'tanggal', $tanggal_selesai);
        }

        $records = LegacyDate::orderBy($query, 'tanggal', 'desc')->paginate(25);

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
