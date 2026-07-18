<?php

namespace App\Http\Controllers\ProfitUnit;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class ProfitUnitController extends Controller
{
    private const RENTAL_TYPE_COLORS = [
        'CDD' => '#2563eb',
        'CDE' => '#14b8a6',
        'L300' => '#f97316',
        'HILUX' => '#22c55e',
        'GMX' => '#e11d48',
        'DEFAULT' => '#8b5cf6',
    ];

    private function filterValue(string $snake, string $label, string $default = 'ALL'): string
    {
        return (string) request()->query($snake, request()->query($label, $default));
    }

    private function filterOptions(string $table, array $columns): array
    {
        $options = [];

        foreach ($columns as $label => $column) {
            $values = DB::table($table)
                ->select($column)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->distinct()
                ->orderBy($column)
                ->pluck($column)
                ->map(fn ($value) => (string) $value)
                ->values()
                ->all();

            $options[$label] = array_values(array_unique(array_merge(['ALL'], $values)));
        }

        return $options;
    }

    private function yearOptionsFromDate(string $table, string $column, string $format = '%Y-%m-%d'): array
    {
        return array_values(array_unique(array_merge(
            ['ALL'],
            DB::table($table)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->selectRaw("YEAR(STR_TO_DATE($column, ?)) as tahun", [$format])
                ->distinct()
                ->orderBy('tahun')
                ->pluck('tahun')
                ->filter()
                ->map(fn ($value) => (string) $value)
                ->all()
        )));
    }

    private function rentalDoughnutData($rows, string $valueKey): array
    {
        return [
            'labels' => $rows->pluck('name')->values()->all(),
            'data' => $rows->map(fn ($row) => (float) ($row[$valueKey] ?? 0))->values()->all(),
            'colors' => $rows
                ->map(fn ($row) => self::RENTAL_TYPE_COLORS[strtoupper((string) $row['name'])] ?? self::RENTAL_TYPE_COLORS['DEFAULT'])
                ->values()
                ->all(),
        ];
    }

    private function tableBackUrl(string $fallback): string
    {
        return url()->previous() ?: route($fallback);
    }

    private function secondaryOvtLookup(): array
    {
        $lookup = [];

        DB::table('operasional_absen')
            ->whereNotNull('nama')
            ->whereNotNull('tanggal')
            ->get(['nama', 'tanggal', 'approval_ovt'])
            ->each(function ($row) use (&$lookup) {
                $date = \DateTimeImmutable::createFromFormat('m/d/Y', trim((string) $row->tanggal));
                if (! $date) {
                    return;
                }

                $key = $date->format('Y-m-d').'|'.mb_strtoupper(trim((string) $row->nama));
                if (! array_key_exists($key, $lookup)) {
                    $lookup[$key] = (float) ($row->approval_ovt ?: 0);
                }
            });

        return $lookup;
    }

    private function secondaryMetrics(object $row, array $ovtLookup): array
    {
        $number = static fn ($value): float => (float) ($value ?: 0);
        $date = \DateTimeImmutable::createFromFormat('m-d-Y', trim((string) ($row->tanggal ?? '')));
        $dateKey = $date ? $date->format('Y-m-d') : null;
        $ovt = static function ($name) use ($ovtLookup, $dateKey): float {
            if (! $dateKey || ! $name) {
                return 0;
            }

            return $ovtLookup[$dateKey.'|'.mb_strtoupper(trim((string) $name))] ?? 0;
        };

        $claimOvt = max($ovt($row->driver ?? null), $ovt($row->helper ?? null));
        $nilaiOvt = $claimOvt > 0 ? $claimOvt * 32500 : 0;
        $tagihan = $number($row->total_tarif ?? 0)
            + $number($row->add_cost_long_route ?? 0)
            + $number($row->tkbm ?? 0)
            + $number($row->spsi ?? 0)
            + $number($row->parkir_liar_keamanan ?? 0)
            + $number($row->penyebrangan_pas_masuk ?? 0)
            + $number($row->rapid_antigen ?? 0)
            + ($number($row->allowance ?? 0) > 0 ? 125000 : 0)
            + $number($row->total_subsidi_bbm ?? 0)
            + $number($row->subsidi_hotel ?? 0)
            + $nilaiOvt;
        $totalNoKlaim = $number($row->parkir_resmi ?? 0)
            + $number($row->tol ?? 0)
            + $number($row->kirim_dokumen ?? 0)
            + $number($row->tarif_gs ?? 0)
            + $number($row->atk ?? 0)
            + $number($row->biaya_lainnya ?? 0)
            + $number($row->tarif_sewa_unit_vendor ?? 0)
            + ($number($row->selisih_tagihan_hotel ?? 0) < 0 ? -$number($row->selisih_tagihan_hotel) : 0)
            + $number($row->total_non_klaim_bbm ?? 0);
        $cost = $number($row->total_biaya_operasional ?? 0);
        $hasTarif = ($row->tarif_unit ?? null) !== null
            && trim((string) $row->tarif_unit) !== ''
            && $number($row->tarif_unit) >= 0;

        return [
            'tagihan' => $tagihan,
            'cost' => $cost,
            'profit' => $hasTarif ? $tagihan - $cost : -$totalNoKlaim,
            'nilai_ovt' => $nilaiOvt,
            'total_no_klaim' => $totalNoKlaim,
        ];
    }

    private function secondaryRowsWithMetrics()
    {
        $ovtLookup = $this->secondaryOvtLookup();

        return DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL'])
            ->orderByRaw("STR_TO_DATE(tanggal, '%m-%d-%Y') desc")
            ->get([
                'id_key', 'tanggal', 'bulan', 'week', 'area', 'nopol', 'tipe_unit', 'order_type', 'driver', 'helper',
                'tarif_unit', 'total_tarif', 'add_cost_long_route', 'tkbm', 'spsi',
                'parkir_liar_keamanan', 'penyebrangan_pas_masuk', 'rapid_antigen', 'allowance',
                'total_subsidi_bbm', 'subsidi_hotel', 'total_biaya_operasional', 'parkir_resmi',
                'tol', 'kirim_dokumen', 'tarif_gs', 'atk', 'biaya_lainnya',
                'tarif_sewa_unit_vendor', 'selisih_tagihan_hotel', 'total_non_klaim_bbm', 'add_data',
            ])
            ->map(function ($row) use ($ovtLookup) {
                $metrics = $this->secondaryMetrics($row, $ovtLookup);

                return [
                    'id_key' => $row->id_key,
                    'tanggal' => $row->tanggal,
                    'bulan' => $row->bulan,
                    'week' => $row->week,
                    'area' => $row->area ?: 'TIDAK DIKETAHUI',
                    'nopol' => $row->nopol ?: '-',
                    'tipe' => $row->tipe_unit ?: 'TIDAK DIKETAHUI',
                    'rute' => $row->order_type ?: '-',
                    'revenue' => $metrics['tagihan'],
                    'cost' => $metrics['cost'],
                    'profit' => $metrics['profit'],
                ];
            });
    }


    public function index()
    {
        $primaryQuery = DB::table('operasional_primary_input');
        $primaryRevenue = (float) (clone $primaryQuery)->sum('total_tarif');
        $primaryCost = (float) (clone $primaryQuery)->sum('total_biaya');

        $secondaryRows = $this->secondaryRowsWithMetrics();
        $secondaryRevenue = (float) $secondaryRows->sum('revenue');
        $secondaryCost = (float) $secondaryRows->sum('cost');
        $secondaryProfit = (float) $secondaryRows->sum('profit');

        $rentalRevenue = (float) DB::table('operasional_rental_unit_input')->sum('tarif_sewa_unit_bln');

        $lclQuery = DB::table('db_chargo_data_paket_masuk');
        $lclRevenue = (float) (clone $lclQuery)->sum('total_ongkir');
        $lclCost = 0.0;

        return Inertia::render('ProfitUnit/Index', [
            'summaryData' => [
                [
                    'slug' => 'primary',
                    'title' => 'Profit Primary',
                    'revenue' => $primaryRevenue,
                    'cost' => $primaryCost,
                    'profit' => $primaryRevenue - $primaryCost,
                    'count' => (clone $primaryQuery)->count(),
                    'includeInAssetSummary' => true,
                ],
                [
                    'slug' => 'secondary',
                    'title' => 'Profit Secondary',
                    'revenue' => $secondaryRevenue,
                    'cost' => $secondaryCost,
                    'profit' => $secondaryProfit,
                    'count' => $secondaryRows->count(),
                    'includeInAssetSummary' => true,
                ],
                [
                    'slug' => 'rental',
                    'title' => 'Profit Rental',
                    'revenue' => $rentalRevenue,
                    'cost' => 0,
                    'profit' => $rentalRevenue,
                    'count' => DB::table('operasional_rental_unit_input')->count(),
                    'includeInAssetSummary' => true,
                ],
                [
                    'slug' => 'lcl',
                    'title' => 'Profit LCL',
                    'revenue' => $lclRevenue,
                    'cost' => $lclCost,
                    'profit' => $lclRevenue - $lclCost,
                    'count' => (clone $lclQuery)->count(),
                    'includeInAssetSummary' => true,
                ],
            ],
        ]);
    }

    public function secondary()
    {
        return Inertia::render('ProfitUnit/Secondary', [
            'rows' => $this->secondaryRowsWithMetrics(),
        ]);
    }

    public function secondaryTable()
    {
        $area = $this->filterValue('area', 'AREA');
        $nopol = (string) request()->query('nopol', 'ALL');
        $search = (string) request()->query('search', '');

        $query = DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL']);

        if ($area !== 'ALL') {
            $query->where('area', $area);
        }
        if ($nopol !== 'ALL' && $nopol !== '') {
            $query->where('nopol', $nopol);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('id_key', 'like', "%{$search}%")
                    ->orWhere('tanggal', 'like', "%{$search}%")
                    ->orWhere('area', 'like', "%{$search}%")
                    ->orWhere('nopol', 'like', "%{$search}%")
                    ->orWhere('tipe_unit', 'like', "%{$search}%")
                    ->orWhere('driver', 'like', "%{$search}%");
            });
        }

        $ovtLookup = $this->secondaryOvtLookup();
        $rows = $query
            ->orderByRaw("STR_TO_DATE(tanggal, '%m-%d-%Y') desc")
            ->limit(300)
            ->get()
            ->map(function ($row) use ($ovtLookup) {
                $metrics = $this->secondaryMetrics($row, $ovtLookup);

                return [
                    'id_key' => $row->id_key,
                    'tanggal' => $row->tanggal,
                    'area' => $row->area,
                    'nopol' => $row->nopol,
                    'tipe' => $row->tipe_unit,
                    'tarif' => $metrics['tagihan'],
                    'biaya' => $metrics['cost'],
                    'profit' => $metrics['profit'],
                    'week' => $row->week ? 'W'.$row->week : '-',
                ];
            });

        return Inertia::render('ProfitUnit/OperationTable', [
            'title' => 'Tabel Profit Secondary',
            'type' => 'secondary',
            'rows' => $rows,
            'filters' => ['AREA' => $area, 'NOPOL' => $nopol, 'SEARCH' => $search],
            'summary' => [
                'count' => $rows->count(),
                'revenue' => $rows->sum('tarif'),
                'cost' => $rows->sum('biaya'),
                'profit' => $rows->sum('profit'),
            ],
        ]);
    }

    public function secondaryDetail(string $id)
    {
        $row = DB::table('operasional_secondary_input')->where('id_key', $id)->first();
        abort_if(! $row, 404);

        $metrics = $this->secondaryMetrics(
            $row,
            $this->secondaryOvtLookup()
        );

        return Inertia::render('ProfitUnit/OperationDetail', [
            'title' => 'Detail Profit Secondary',
            'type' => 'secondary',
            'backUrl' => $this->tableBackUrl('profit-unit.secondary.table'),
            'detail' => [
                'id_key' => $row->id_key,
                'tahun' => $row->tahun,
                'bulan' => $row->bulan,
                'tanggal' => $row->tanggal,
                'crosscek_date' => $row->crosscek_date,
                'project' => $row->project,
                'posisi_project' => $row->posisi_project,
                'add_data' => $row->add_data,
                'area' => $row->area,
                'nopol' => $row->nopol,
                'tipe' => $row->tipe_unit,
                'driver' => $row->driver,
                'tarif' => $metrics['tagihan'],
                'biaya' => $metrics['cost'],
                'profit' => $metrics['profit'],
                'week' => $row->week ? 'W'.$row->week : '-',
                'order_type' => $row->order_type,
                'no_po' => $row->no_po,
                'no_si' => $row->no_si,
            ],
        ]);
    }

    public function rental()
    {
        $area = $this->filterValue('area', 'AREA');
        $hari = $this->filterValue('hari', 'HARI', '');
        $tahun = $this->filterValue('tahun', 'TAHUN');

        $query = DB::table('operasional_rental_unit_input');

        if ($area !== 'ALL') {
            $query->where('area', $area);
        }
        if ($hari) {
            $query->where('tanggal', date('m-d-Y', strtotime($hari)));
        }
        if ($tahun !== 'ALL') {
            $query->whereRaw("YEAR(STR_TO_DATE(tanggal, '%m-%d-%Y')) = ?", [$tahun]);
        }

        $revenue = (float) (clone $query)->sum('tarif_sewa_unit_bln');
        $cost = 0;
        $profitTotal = $revenue;
        $count = (clone $query)->count();

        $rataProfit = $count > 0 ? $profitTotal / $count : 0;
        $rataTarif = $count > 0 ? $revenue / $count : 0;

        $byArea = (clone $query)
            ->select('area', DB::raw('SUM(tarif_sewa_unit_bln) as profit'))
            ->groupBy('area')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->area ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
            ]);

        $byType = (clone $query)
            ->select('tipe', DB::raw('COUNT(*) as total'), DB::raw('SUM(tarif_sewa_unit_bln) as revenue'))
            ->groupBy('tipe')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->tipe ?: 'TIDAK DIKETAHUI',
                'value' => (int) $row->total,
                'revenue' => (float) $row->revenue,
            ]);

        $byYear = (clone $query)
            ->selectRaw("YEAR(STR_TO_DATE(tanggal, '%m-%d-%Y')) as tahun, SUM(tarif_sewa_unit_bln) as revenue, COUNT(*) as total")
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get()
            ->map(fn ($row) => [
                'name' => (string) ($row->tahun ?: 'TIDAK DIKETAHUI'),
                'revenue' => (float) $row->revenue,
                'total' => (int) $row->total,
            ]);

        $byRegional = (clone $query)
            ->select('regional', DB::raw('SUM(tarif_sewa_unit_bln) as revenue'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('regional')
            ->where('regional', '!=', '')
            ->groupBy('regional')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->regional ?: 'TIDAK DIKETAHUI',
                'revenue' => (float) $row->revenue,
                'value' => (int) $row->total,
            ]);

        $topUnits = (clone $query)
            ->select('nopol', 'area', 'tipe', DB::raw('SUM(tarif_sewa_unit_bln) as revenue'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('nopol')
            ->where('nopol', '!=', '')
            ->groupBy('nopol', 'area', 'tipe')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'nopol' => $row->nopol,
                'area' => $row->area ?: 'TIDAK DIKETAHUI',
                'tipe' => $row->tipe ?: 'TIDAK DIKETAHUI',
                'revenue' => (float) $row->revenue,
                'total' => (int) $row->total,
            ]);

        $rows = DB::table('operasional_rental_unit_input')
            ->orderByRaw("STR_TO_DATE(tanggal, '%m-%d-%Y') desc")
            ->get([
                'id_key',
                'tanggal',
                'area',
                'regional',
                'nopol',
                'tipe',
                'tarif_sewa_unit_bln',
            ])
            ->map(function ($row) {
                $date = \DateTimeImmutable::createFromFormat('m-d-Y', trim((string) $row->tanggal));

                return [
                    'id_key' => $row->id_key,
                    'tanggal' => $row->tanggal,
                    'week' => $date ? (int) $date->format('W') : null,
                    'area' => $row->area ?: 'TIDAK DIKETAHUI',
                    'nopol' => $row->nopol ?: '-',
                    'tipe' => $row->tipe ?: 'TIDAK DIKETAHUI',
                    'rute' => $row->regional ?: 'TIDAK DIKETAHUI',
                    'revenue' => (float) $row->tarif_sewa_unit_bln,
                    'cost' => 0.0,
                    'profit' => (float) $row->tarif_sewa_unit_bln,
                ];
            });

        return Inertia::render('ProfitUnit/Rental', [
            'rows' => $rows,
            'filters' => [
                'AREA' => $area,
                'HARI' => $hari,
                'TAHUN' => $tahun,
            ],
            'record' => [
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profitTotal,
                'count' => $count,
            ],
            'byArea' => $byArea,
            'byType' => $byType,
            'byYear' => $byYear,
            'byRegional' => $byRegional,
            'topUnits' => $topUnits,
            'typeCompositionChart' => $this->rentalDoughnutData($byType, 'value'),
            'typeValueChart' => $this->rentalDoughnutData($byType, 'revenue'),
            'sumProfit' => $profitTotal,
            'rataProfit' => $rataProfit,
            'rataTarif' => $rataTarif,
            'rataBiaya' => 0,
            'kunjungan' => $count,
            'filterOptions' => $this->filterOptions('operasional_rental_unit_input', [
                'AREA' => 'area',
            ]) + [
                'TAHUN' => $this->yearOptionsFromDate('operasional_rental_unit_input', 'tanggal', '%m-%d-%Y'),
            ],
        ]);
    }

    public function rentalTable()
    {
        $area = $this->filterValue('area', 'AREA');
        $nopol = (string) request()->query('nopol', 'ALL');
        $search = (string) request()->query('search', '');
        $tahun = $this->filterValue('tahun', 'TAHUN');

        $query = DB::table('operasional_rental_unit_input');

        if ($area !== 'ALL') {
            $query->where('area', $area);
        }
        if ($nopol !== 'ALL' && $nopol !== '') {
            $query->where('nopol', $nopol);
        }
        if ($tahun !== 'ALL') {
            $query->whereRaw("YEAR(STR_TO_DATE(tanggal, '%m-%d-%Y')) = ?", [$tahun]);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('tanggal', 'like', "%{$search}%")
                    ->orWhere('area', 'like', "%{$search}%")
                    ->orWhere('nopol', 'like', "%{$search}%")
                    ->orWhere('tipe', 'like', "%{$search}%")
                    ->orWhere('regional', 'like', "%{$search}%")
                    ->orWhere('no_bap', 'like', "%{$search}%")
                    ->orWhere('no_po', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->orderByRaw("STR_TO_DATE(tanggal, '%m-%d-%Y') desc")
            ->orderBy('area')
            ->limit(300)
            ->get()
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal,
                'area' => $row->area,
                'nopol' => $row->nopol,
                'tipe' => $row->tipe,
                'tarif_sewa_unit_bln' => (float) $row->tarif_sewa_unit_bln,
                'week' => $row->tanggal ? 'W'.date('W', strtotime($row->tanggal)) : '-',
            ]);

        return Inertia::render('ProfitUnit/RentalTable', [
            'rows' => $rows,
            'filters' => [
                'AREA' => $area,
                'NOPOL' => $nopol,
                'TAHUN' => $tahun,
                'SEARCH' => $search,
            ],
            'summary' => [
                'count' => $rows->count(),
                'revenue' => $rows->sum('tarif_sewa_unit_bln'),
            ],
        ]);
    }

    public function rentalDetail(string $id)
    {
        $row = DB::table('operasional_rental_unit_input')
            ->where('id_key', $id)
            ->first();

        abort_if(! $row, 404);

        $rentalDate = \DateTimeImmutable::createFromFormat('m-d-Y', (string) $row->tanggal);

        $detail = [
            'id_key' => $row->id_key,
            'tanggal' => $row->tanggal,
            'area' => $row->area,
            'regional' => $row->regional,
            'nopol' => $row->nopol,
            'tipe' => $row->tipe,
            'tarif_sewa_unit_bln' => (float) $row->tarif_sewa_unit_bln,
            'week' => $rentalDate ? 'W'.$rentalDate->format('W') : '-',
            'tahun' => $rentalDate ? $rentalDate->format('Y') : '-',
            'bulan' => $rentalDate ? $rentalDate->format('m') : '-',
            'no_bap' => $row->no_bap,
            'no_po' => $row->no_po,
        ];

        return Inertia::render('ProfitUnit/RentalDetail', [
            'detail' => $detail,
            'backUrl' => url()->previous() ?: route('profit-unit.rental.table'),
        ]);
    }

    public function lcl()
    {
        $sales = $this->filterValue('sales', 'SALES');
        $area = $this->filterValue('area', 'AREA');
        $kategori = $this->filterValue('kategori', 'KATEGORI');
        $hari = $this->filterValue('hari', 'HARI', '');
        $week = $this->filterValue('week', 'WEEK');
        $bulan = $this->filterValue('bulan', 'BULAN');
        $tahun = $this->filterValue('tahun', 'TAHUN');

        $query = DB::table('db_chargo_data_paket_masuk');

        if ($hari) {
            $query->where('tanggal', $hari);
        }
        if ($area !== 'ALL') {
            $query->where('kota_tujuan', $area);
        }
        if ($week !== 'ALL') {
            $query->where('week', $week);
        }
        if ($bulan !== 'ALL') {
            $query->where('bulan', $bulan);
        }
        if ($tahun !== 'ALL') {
            $query->where('tahun', $tahun);
        }
        if ($kategori !== 'ALL') {
            $query->where('kode_pesanan', $kategori);
        }

        $deliveryQuery = DB::table('db_chargo_data_paket_delivery as d')
            ->leftJoin('db_chargo_data_paket_masuk as m', 'm.no_stt', '=', 'd.no_stt');
        if ($hari) {
            $deliveryQuery->where('d.tanggal', $hari);
        }
        if ($area !== 'ALL') {
            $deliveryQuery->where('m.kota_tujuan', $area);
        }
        if ($week !== 'ALL') {
            $deliveryQuery->where('d.week', $week);
        }
        if ($bulan !== 'ALL') {
            $deliveryQuery->where('d.bulan', $bulan);
        }
        if ($tahun !== 'ALL') {
            $deliveryQuery->where('d.tahun', $tahun);
        }
        if ($kategori !== 'ALL') {
            $deliveryQuery->where('d.kode_pesanan', $kategori);
        }

        $revenue = (float) (clone $query)->sum('total_ongkir');
        $cost = 0.0;
        $profitTotal = $revenue - $cost;
        $count = (clone $query)->count();
        $rataProfit = $count > 0 ? $profitTotal / $count : 0;
        $rataTarif = $count > 0 ? $revenue / $count : 0;
        $rataBiaya = $count > 0 ? $cost / $count : 0;

        $byArea = (clone $query)
            ->select('kota_tujuan', DB::raw('SUM(total_ongkir) as profit'))
            ->groupBy('kota_tujuan')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->kota_tujuan ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
            ]);

        $byKapal = (clone $deliveryQuery)
            ->select('d.nama_kapal', DB::raw('SUM(d.total_cod) as ongkir'))
            ->whereNotNull('d.nama_kapal')
            ->where('d.nama_kapal', '!=', '')
            ->groupBy('d.nama_kapal')
            ->orderByDesc('ongkir')
            ->limit(20)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->nama_kapal,
                'ongkir' => (float) $row->ongkir,
            ]);

        $byDeparture = (clone $deliveryQuery)
            ->select('d.tgl_kapal_berangkat', DB::raw('SUM(d.total_cod) as total'))
            ->whereNotNull('d.tgl_kapal_berangkat')
            ->where('d.tgl_kapal_berangkat', '!=', '')
            ->groupBy('d.tgl_kapal_berangkat')
            ->orderByRaw("STR_TO_DATE(d.tgl_kapal_berangkat, '%c/%e/%Y')")
            ->get()
            ->map(fn ($row) => [
                'name' => $row->tgl_kapal_berangkat,
                'total' => (float) $row->total,
            ]);

        $byType = (clone $query)
            ->select('katagori_barang', DB::raw('COUNT(*) as total'), DB::raw('SUM(total_ongkir) as revenue'), DB::raw('SUM(total_ongkir) as profit'))
            ->groupBy('katagori_barang')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->katagori_barang ?: 'TIDAK DIKETAHUI',
                'value' => (int) $row->total,
                'revenue' => (float) $row->revenue,
                'profit' => (float) $row->profit,
            ]);

        $byBulan = (clone $query)
            ->select('bulan', DB::raw('SUM(total_ongkir) as total'))
            ->whereNotNull('bulan')
            ->where('bulan', '!=', '')
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->bulan,
                'total' => (float) $row->total,
            ]);

        $cityRecords = [
            'kupang' => (float) (clone $query)->where('kota_asal', 'KUPANG')->sum('total_ongkir'),
            'surabaya' => (float) (clone $query)->where('kota_asal', 'SURABAYA')->sum('total_ongkir'),
        ];

        $byYear = (clone $query)
            ->selectRaw("tahun, SUM(total_ongkir) as revenue, 0 as cost, SUM(total_ongkir) as profit, COUNT(*) as total")
            ->whereNotNull('tahun')
            ->where('tahun', '!=', '')
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get()
            ->map(fn ($row) => [
                'name' => (string) ($row->tahun ?: 'TIDAK DIKETAHUI'),
                'revenue' => (float) $row->revenue,
                'cost' => (float) $row->cost,
                'profit' => (float) $row->profit,
                'total' => (int) $row->total,
            ]);

        $byRegional = (clone $query)
            ->select('region', DB::raw('SUM(total_ongkir) as profit'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('region')
            ->where('region', '!=', '')
            ->groupBy('region')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->region ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
                'value' => (int) $row->total,
            ]);

        $topUnits = (clone $query)
            ->select('no_stt', 'kota_tujuan', 'katagori_barang', DB::raw('SUM(total_ongkir) as profit'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('no_stt')
            ->where('no_stt', '!=', '')
            ->groupBy('no_stt', 'kota_tujuan', 'katagori_barang')
            ->orderByDesc('profit')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'nopol' => $row->no_stt,
                'area' => $row->kota_tujuan ?: 'TIDAK DIKETAHUI',
                'tipe' => $row->katagori_barang ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
                'total' => (int) $row->total,
            ]);

        $paymentStatus = [
            'lunas' => (float) (clone $query)->where('status_ongkir', '!=', '')->sum('total_ongkir'),
            'belum_lunas' => (float) (clone $query)->where(function ($q) {
                $q->whereNull('status_ongkir')->orWhere('status_ongkir', '');
            })->sum('total_ongkir'),
        ];

        $deliveryStatus = [
            'dlv' => [
                'count' => (int) (clone $deliveryQuery)->where('d.status_paket', 'Delivery')->count(),
                'nominal' => (float) (clone $deliveryQuery)->where('d.status_paket', 'Delivery')->sum('d.total_cod'),
            ],
            'sent' => [
                'count' => (int) (clone $deliveryQuery)->where('d.status_paket', 'Sent')->count(),
                'nominal' => (float) (clone $deliveryQuery)->where('d.status_paket', 'Sent')->sum('d.total_cod'),
            ],
        ];

        $rows = DB::table('db_chargo_data_paket_masuk')
            ->orderByRaw("STR_TO_DATE(tanggal, '%m-%d-%Y') desc")
            ->get([
                'id_key',
                'tanggal',
                'kota_asal',
                'kota_tujuan',
                'no_stt',
                'katagori_barang',
                'week',
                'total_ongkir',
            ])
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal,
                'area' => $row->kota_tujuan ?: 'TIDAK DIKETAHUI',
                'nopol' => $row->no_stt ?: '-',
                'tipe' => $row->katagori_barang ?: 'TIDAK DIKETAHUI',
                'rute' => trim(($row->kota_asal ?: '-').' - '.($row->kota_tujuan ?: '-')),
                'week' => $row->week,
                'revenue' => (float) $row->total_ongkir,
                'cost' => 0.0,
                'profit' => (float) $row->total_ongkir,
            ]);

        return Inertia::render('ProfitUnit/Lcl', [
            'filters' => [
                'SALES' => $sales,
                'AREA' => $area,
                'KATEGORI' => $kategori,
                'HARI' => $hari,
                'WEEK' => $week,
                'BULAN' => $bulan,
                'TAHUN' => $tahun,
            ],
            'record' => [
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profitTotal,
                'count' => $count,
            ],
            'byArea' => $byArea,
            'byType' => $byType,
            'byKapal' => $byKapal,
            'byBulan' => $byBulan,
            'byDeparture' => $byDeparture,
            'byYear' => $byYear,
            'byRegional' => $byRegional,
            'topUnits' => $topUnits,
            'cityRecords' => $cityRecords,
            'typeCompositionChart' => $this->rentalDoughnutData($byType, 'value'),
            'typeValueChart' => $this->rentalDoughnutData($byType, 'profit'),
            'rataProfit' => $rataProfit,
            'rataTarif' => $rataTarif,
            'rataBiaya' => $rataBiaya,
            'kunjungan' => $count,
            'paymentStatus' => $paymentStatus,
            'deliveryStatus' => $deliveryStatus,
            'rows' => $rows,
            'filterOptions' => $this->filterOptions('db_chargo_data_paket_masuk', [
                'AREA' => 'kota_tujuan',
                'WEEK' => 'week',
                'BULAN' => 'bulan',
                'TAHUN' => 'tahun',
                'KATEGORI' => 'kode_pesanan',
            ]) + [
                'SALES' => ['ALL'],
            ],
        ]);
    }

    public function lclTable()
    {
        $area = $this->filterValue('area', 'AREA');
        $nopol = (string) request()->query('nopol', 'ALL');
        $search = (string) request()->query('search', '');

        $query = DB::table('db_chargo_data_paket_masuk');

        if ($area !== 'ALL') {
            $query->where('kota_tujuan', $area);
        }
        if ($nopol !== 'ALL' && $nopol !== '') {
            $query->where('no_stt', $nopol);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('id_key', 'like', "%{$search}%")
                    ->orWhere('no_stt', 'like', "%{$search}%")
                    ->orWhere('tanggal', 'like', "%{$search}%")
                    ->orWhere('kota_tujuan', 'like', "%{$search}%")
                    ->orWhere('katagori_barang', 'like', "%{$search}%")
                    ->orWhere('nama_pengirim', 'like', "%{$search}%")
                    ->orWhere('nama_penerima', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->orderByRaw("STR_TO_DATE(tanggal, '%m-%d-%Y') desc")
            ->limit(300)
            ->get()
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal,
                'area' => $row->kota_tujuan,
                'nopol' => $row->no_stt,
                'tipe' => $row->katagori_barang,
                'tarif' => (float) $row->total_ongkir,
                'biaya' => 0,
                'profit' => (float) $row->total_ongkir,
                'week' => $row->week ? 'W'.$row->week : '-',
            ]);

        return Inertia::render('ProfitUnit/OperationTable', [
            'title' => 'Tabel Profit LCL',
            'type' => 'lcl',
            'rows' => $rows,
            'filters' => ['AREA' => $area, 'NOPOL' => $nopol, 'SEARCH' => $search],
            'summary' => [
                'count' => $rows->count(),
                'revenue' => $rows->sum('tarif'),
                'cost' => $rows->sum('biaya'),
                'profit' => $rows->sum('profit'),
            ],
        ]);
    }

    public function lclDetail(string $id)
    {
        $row = DB::table('db_chargo_data_paket_masuk')->where('id_key', $id)->first();
        abort_if(! $row, 404);

        return Inertia::render('ProfitUnit/OperationDetail', [
            'title' => 'Detail Profit LCL',
            'type' => 'lcl',
            'backUrl' => $this->tableBackUrl('profit-unit.lcl.table'),
            'detail' => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal,
                'area' => $row->kota_tujuan,
                'nopol' => $row->no_stt,
                'tipe' => $row->katagori_barang,
                'driver' => $row->dibuat_oleh,
                'tarif' => (float) $row->total_ongkir,
                'biaya' => 0,
                'profit' => (float) $row->total_ongkir,
                'week' => $row->week ? 'W'.$row->week : '-',
                'order_type' => $row->status_pembayaran,
                'no_po' => $row->nomor_inv,
                'no_si' => $row->no_stt,
                'rute' => $row->kota_asal.' - '.$row->kota_tujuan,
                'vendor' => $row->nama_pengirim.' / '.$row->nama_penerima,
                'sales' => $row->kode_pesanan,
                'nama_pengirim' => $row->nama_pengirim,
                'kota_asal' => $row->kota_asal,
                'nama_penerima' => $row->nama_penerima,
                'kota_tujuan' => $row->kota_tujuan,
                'total_koli' => (int) $row->total_koli,
                'qty_unit' => (int) $row->qty_unit,
                'jenis_ppn' => $row->jenis_ppn,
                'total_ppn' => (float) $row->total_ppn,
                'tagihan_cod' => (float) $row->tagihan_cod,
                'total_bayar' => (float) $row->total_bayar,
                'kembalian' => (float) $row->kembalian,
            ],
        ]);
    }

    public function primary()
    {
        $tipeUnit = $this->filterValue('tipe_unit', 'TIPE UNIT');
        $area = $this->filterValue('area', 'AREA');
        $hari = $this->filterValue('hari', 'HARI', '');
        $week = $this->filterValue('week', 'WEEK');
        $tahun = $this->filterValue('tahun', 'TAHUN');
        $kategori = $this->filterValue('kategori', 'KATEGORI');

        $query = DB::table('operasional_primary_input');

        if ($tipeUnit !== 'ALL') {
            $query->where('jenis', $tipeUnit);
        }
        if ($area !== 'ALL') {
            $query->where('area', $area);
        }
        if ($hari) {
            $query->where(function ($q) use ($hari) {
                $q->where('tanggal_muat', $hari)
                    ->orWhere('tanggal_terima', $hari);
            });
        }
        if ($week !== 'ALL') {
            $query->where('week', $week);
        }
        if ($tahun !== 'ALL') {
            $query->where(function ($q) use ($tahun) {
                $q->whereYear('tanggal_muat', $tahun)
                    ->orWhereYear('tanggal_terima', $tahun);
            });
        }

        $revenue = (float) (clone $query)->sum('total_tarif');
        $cost = (float) (clone $query)->sum('total_biaya');
        $profitTotal = $revenue - $cost;
        $count = (clone $query)->count();

        $avgProfit = $count > 0 ? $profitTotal / $count : 0;
        $avgTarif = (float) (clone $query)->avg('total_tarif');
        $avgBiaya = (float) (clone $query)->avg('total_biaya');

        $byArea = (clone $query)
            ->select('area', DB::raw('SUM(total_tarif - total_biaya) as profit'))
            ->groupBy('area')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->area ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
            ]);

        $byType = (clone $query)
            ->select('jenis', DB::raw('COUNT(*) as total'), DB::raw('SUM(total_tarif) as revenue'), DB::raw('SUM(total_tarif - total_biaya) as profit'))
            ->groupBy('jenis')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->jenis ?: 'TIDAK DIKETAHUI',
                'value' => (int) $row->total,
                'revenue' => (float) $row->revenue,
                'profit' => (float) $row->profit,
            ]);

        $byYear = (clone $query)
            ->selectRaw('YEAR(tanggal_muat) as tahun, SUM(total_tarif) as revenue, SUM(total_biaya) as cost, SUM(total_tarif - total_biaya) as profit, COUNT(*) as total')
            ->whereNotNull('tanggal_muat')
            ->groupBy('tahun')
            ->orderBy('tahun')
            ->get()
            ->map(fn ($row) => [
                'name' => (string) ($row->tahun ?: 'TIDAK DIKETAHUI'),
                'revenue' => (float) $row->revenue,
                'cost' => (float) $row->cost,
                'profit' => (float) $row->profit,
                'total' => (int) $row->total,
            ]);

        $byRegional = (clone $query)
            ->select('regional', DB::raw('SUM(total_tarif - total_biaya) as profit'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('regional')
            ->where('regional', '!=', '')
            ->groupBy('regional')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->regional ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
                'value' => (int) $row->total,
            ]);

        $topUnits = (clone $query)
            ->select('nopol_driver', 'area', 'jenis', DB::raw('SUM(total_tarif - total_biaya) as profit'), DB::raw('COUNT(*) as total'))
            ->whereNotNull('nopol_driver')
            ->where('nopol_driver', '!=', '')
            ->groupBy('nopol_driver', 'area', 'jenis')
            ->orderByDesc('profit')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'nopol' => $row->nopol_driver,
                'area' => $row->area ?: 'TIDAK DIKETAHUI',
                'tipe' => $row->jenis ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
                'total' => (int) $row->total,
            ]);

        $rows = DB::table('operasional_primary_input')
            ->orderByDesc('tanggal_muat')
            ->get([
                'id_key',
                'tanggal_muat',
                'tanggal_terima',
                'area',
                'regional',
                'nopol_driver',
                'jenis',
                'rute_asal',
                'rute_tujuan',
                'week',
                'total_tarif',
                'total_biaya',
                'profit',
            ])
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal_muat,
                'tanggal_terima' => $row->tanggal_terima,
                'area' => $row->area ?: 'TIDAK DIKETAHUI',
                'regional' => $row->regional ?: '-',
                'nopol' => $row->nopol_driver ?: '-',
                'tipe' => $row->jenis ?: 'TIDAK DIKETAHUI',
                'rute' => trim(($row->rute_asal ?: '-').' - '.($row->rute_tujuan ?: '-')),
                'week' => $row->week,
                'revenue' => (float) $row->total_tarif,
                'cost' => (float) $row->total_biaya,
                'profit' => (float) $row->total_tarif - (float) $row->total_biaya,
            ]);

        return Inertia::render('ProfitUnit/Primary', [
            'filters' => [
                'TIPE UNIT' => $tipeUnit,
                'AREA' => $area,
                'HARI' => $hari,
                'WEEK' => $week,
                'TAHUN' => $tahun,
                'KATEGORI' => $kategori,
            ],
            'record' => [
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profitTotal,
                'count' => $count,
            ],
            'byArea' => $byArea,
            'byType' => $byType,
            'byYear' => $byYear,
            'byRegional' => $byRegional,
            'topUnits' => $topUnits,
            'rows' => $rows,
            'typeCompositionChart' => $this->rentalDoughnutData($byType, 'value'),
            'typeValueChart' => $this->rentalDoughnutData($byType, 'profit'),
            'sumProfit' => $profitTotal,
            'rataProfit' => $avgProfit,
            'rataTarif' => $avgTarif,
            'rataBiaya' => $avgBiaya,
            'kunjungan' => $count,
            'filterOptions' => $this->filterOptions('operasional_primary_input', [
                'TIPE UNIT' => 'jenis',
                'AREA' => 'area',
                'WEEK' => 'week',
            ]) + [
                'TAHUN' => $this->yearOptionsFromDate('operasional_primary_input', 'tanggal_muat'),
                'KATEGORI' => ['ALL'],
            ],
        ]);
    }

    public function primaryTable()
    {
        $area = $this->filterValue('area', 'AREA');
        $nopol = (string) request()->query('nopol', 'ALL');
        $search = (string) request()->query('search', '');

        $query = DB::table('operasional_primary_input');

        if ($area !== 'ALL') {
            $query->where('area', $area);
        }
        if ($nopol !== 'ALL' && $nopol !== '') {
            $query->where('nopol_driver', $nopol);
        }
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('id_key', 'like', "%{$search}%")
                    ->orWhere('tanggal_muat', 'like', "%{$search}%")
                    ->orWhere('tanggal_terima', 'like', "%{$search}%")
                    ->orWhere('area', 'like', "%{$search}%")
                    ->orWhere('nopol_driver', 'like', "%{$search}%")
                    ->orWhere('jenis', 'like', "%{$search}%");
            });
        }

        $rows = $query
            ->orderByDesc('tanggal_muat')
            ->limit(300)
            ->get()
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal_muat,
                'area' => $row->area,
                'nopol' => $row->nopol_driver,
                'tipe' => $row->jenis,
                'tarif' => (float) $row->total_tarif,
                'biaya' => (float) $row->total_biaya,
                'profit' => (float) $row->total_tarif - (float) $row->total_biaya,
                'week' => $row->week ? 'W'.$row->week : '-',
            ]);

        return Inertia::render('ProfitUnit/OperationTable', [
            'title' => 'Tabel Profit Primary',
            'type' => 'primary',
            'rows' => $rows,
            'filters' => ['AREA' => $area, 'NOPOL' => $nopol, 'SEARCH' => $search],
            'summary' => [
                'count' => $rows->count(),
                'revenue' => $rows->sum('tarif'),
                'cost' => $rows->sum('biaya'),
                'profit' => $rows->sum('profit'),
            ],
        ]);
    }

    public function primaryDetail(string $id)
    {
        $row = DB::table('operasional_primary_input')->where('id_key', $id)->first();
        abort_if(! $row, 404);

        return Inertia::render('ProfitUnit/OperationDetail', [
            'title' => 'Detail Profit Primary',
            'type' => 'primary',
            'backUrl' => $this->tableBackUrl('profit-unit.primary.table'),
            'detail' => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal_muat,
                'tanggal_terima' => $row->tanggal_terima,
                'area' => $row->area,
                'nopol' => $row->nopol_driver,
                'tipe' => $row->jenis,
                'tarif' => (float) $row->total_tarif,
                'biaya' => (float) $row->total_biaya,
                'profit' => (float) $row->total_tarif - (float) $row->total_biaya,
                'week' => $row->week ? 'W'.$row->week : '-',
                'rute' => trim(($row->rute_asal ?: '-').' - '.($row->rute_tujuan ?: '-')),
                'vendor' => $row->vendor,
                'no_po' => $row->no_po,
                'no_si' => $row->no_si,
                'no_sj' => $row->no_sj,
            ],
        ]);
    }
}
