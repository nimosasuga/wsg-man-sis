<?php

namespace App\Http\Controllers\ProfitUnit;

use App\Http\Controllers\Controller;
use App\Support\LegacyDate;
use Illuminate\Support\Facades\Cache;
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

    private function monthNumberFromFilter(string $value): ?int
    {
        $value = trim($value);
        if ($value === '' || $value === 'ALL') {
            return null;
        }

        if (preg_match('/^(\d{1,2})(?:\D|$)/', $value, $matches)) {
            $month = (int) $matches[1];

            return $month >= 1 && $month <= 12 ? $month : null;
        }

        if (preg_match('/^([A-L])(?:\s|$)/i', $value, $matches)) {
            return ord(strtoupper($matches[1])) - 64;
        }

        $monthNames = [
            'januari', 'februari', 'maret', 'april', 'mei', 'juni',
            'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
        ];
        $normalized = strtolower($value);

        foreach ($monthNames as $index => $monthName) {
            if (str_contains($normalized, $monthName)) {
                return $index + 1;
            }
        }

        return null;
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
        return LegacyDate::yearOptions($table, $column);
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
        return Cache::remember('profit.secondary.ovt-lookup.v2', now()->addMinutes(5), function () {
            $lookup = [];

            DB::table('operasional_absen')
                ->whereNotNull('nama')
                ->whereNotNull('tanggal')
                ->get(['nama', 'tanggal', 'approval_ovt'])
                ->each(function ($row) use (&$lookup) {
                    $date = $this->normalizeDate($row->tanggal);
                    if (! $date) {
                        return;
                    }

                    $key = $date.'|'.mb_strtoupper(trim((string) $row->nama));
                    $lookup[$key] ??= (float) ($row->approval_ovt ?: 0);
                });

            return $lookup;
        });
    }

    private function normalizeDate(mixed $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        return LegacyDate::iso($value);
    }

    private function secondaryMetrics(object $row, array $ovtLookup): array
    {
        $number = static fn ($value): float => (float) ($value ?: 0);
        $dateKey = $this->normalizeDate($row->tanggal ?? null);
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
        return collect(Cache::remember('profit.secondary.rows.v3', now()->addMinutes(5), function () {
            $ovtLookup = $this->secondaryOvtLookup();

            return DB::table('operasional_secondary_input')
                ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL'])
                ->get([
                'id_key', 'tanggal', 'bulan', 'week', 'hari', 'area', 'nopol', 'tipe_unit', 'order_type', 'driver', 'helper',
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
                        'hari' => $row->hari,
                        'area' => $row->area ?: 'TIDAK DIKETAHUI',
                        'nopol' => $row->nopol ?: '-',
                        'tipe' => $row->tipe_unit ?: 'TIDAK DIKETAHUI',
                        'driver' => $row->driver ?: '-',
                        'rute' => $row->order_type ?: '-',
                        'revenue' => $metrics['tagihan'],
                        'cost' => $metrics['cost'],
                        'profit' => $metrics['profit'],
                    ];
                })
            ->sortByDesc(fn ($row) => $this->normalizeDate($row['tanggal']) ?? '0000-00-00')
                ->values()
                ->all();
        }));
    }


    public function index()
    {
        $primaryQuery = DB::table('operasional_primary_input');
        $primaryRevenue = (float) (clone $primaryQuery)->sum('total_tarif');
        $primaryCost = (float) (clone $primaryQuery)->sum('total_biaya');
        $primaryProfit = (float) (clone $primaryQuery)->sum('profit');

        $secondaryRows = $this->secondaryRowsWithMetrics();
        $secondaryRevenue = (float) $secondaryRows->sum('revenue');
        $secondaryCost = (float) $secondaryRows->sum('cost');
        $secondaryProfit = (float) $secondaryRows->sum('profit');

        $rentalRevenue = (float) DB::table('operasional_rental_unit_input')->sum('tarif_sewa_unit_bln');
        $rentalCost = 0.0;

        $lclQuery = DB::table('db_chargo_data_paket_masuk');
        $lclDeliveryQuery = DB::table('db_chargo_data_paket_delivery');
        $lclRevenue = (float) (clone $lclQuery)->sum('total_ongkir');
        $lclCost = (float) (clone $lclQuery)->sum('biaya_kirim');
        $lclProfit = (float) (clone $lclDeliveryQuery)->sum('total_cod');


        return Inertia::render('ProfitUnit/Index', [
            'summaryData' => [
                [
                    'slug' => 'primary',
                    'title' => 'Profit Primary',
                    'revenue' => $primaryRevenue,
                    'cost' => $primaryCost,
                    'profit' => $primaryProfit,
                    'count' => (clone $primaryQuery)->count(),
                    'revenueLabel' => 'Total Tarif Primary',
                    'costLabel' => 'Total Biaya Primary',
                    'formulaNote' => 'Profit merupakan total hasil setiap transaksi setelah tarif dikurangi seluruh biaya operasional dan produktivitas. Transaksi kategori Selisih BBM tidak menghasilkan profit.',
                ],
                [
                    'slug' => 'secondary',
                    'title' => 'Profit Secondary',
                    'revenue' => $secondaryRevenue,
                    'cost' => $secondaryCost,
                    'profit' => $secondaryProfit,
                    'count' => $secondaryRows->count(),
                    'revenueLabel' => 'Total Tagihan Secondary',
                    'costLabel' => 'Total Biaya Operasional Secondary',
                    'formulaNote' => 'Profit merupakan total tagihan Secondary dikurangi biaya operasional. Jika tarif unit kosong, transaksi dibaca rugi sebesar total biaya non-claim.',
                ],
                [
                    'slug' => 'rental',
                    'title' => 'Profit Rental',
                    'revenue' => $rentalRevenue,
                    'cost' => $rentalCost,
                    'profit' => $rentalRevenue,
                    'count' => DB::table('operasional_rental_unit_input')->count(),
                    'revenueLabel' => 'Nilai Sewa Unit',
                    'costLabel' => 'Biaya Dalam Rumus',
                    'formulaNote' => 'Profit Rental dihitung dari total nilai sewa unit bulanan. Biaya legalitas tidak menjadi pengurang pada rumus profit AppSheet.',
                ],
                [
                    'slug' => 'lcl',
                    'title' => 'Profit LCL',
                    'revenue' => $lclRevenue,
                    'cost' => $lclCost,
                    'profit' => $lclProfit,
                    'count' => (clone $lclQuery)->count(),
                    'revenueLabel' => 'Sum Tarif LCL',
                    'costLabel' => 'Sum Biaya LCL',
                    'formulaNote' => 'Profit LCL mengikuti total COD dari data delivery. Nilainya diambil dari ongkir per paket yang hanya masuk jika pembayaran berstatus COD.',
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
        $bulan = (string) request()->query('bulan', '');
        $tahun = (string) request()->query('tahun', '');

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
        if ($bulan !== '') {
            $query->whereRaw('MONTH('.LegacyDate::sql('tanggal').') = ?', [(int) $bulan]);
        }
        if ($tahun !== '') {
            LegacyDate::whereYear($query, 'tanggal', $tahun);
        }

        $pageSize = max(1, min((int) request()->query('per_page', 50), 200));
        $sort = (string) request()->query('sort', 'tanggal');
        $direction = (string) request()->query('direction', 'desc');

        $sortable = ['id_key', 'tanggal', 'area', 'nopol', 'tipe_unit', 'driver', 'total_tarif', 'total_biaya_operasional', 'week'];
        if (! in_array($sort, $sortable, true)) {
            $sort = 'tanggal';
            $direction = 'desc';
        }

        $ovtLookup = $this->secondaryOvtLookup();

        $summaryRows = (clone $query)
            ->get([
                'tanggal', 'driver', 'helper', 'tarif_unit', 'total_tarif',
                'add_cost_long_route', 'tkbm', 'spsi', 'parkir_liar_keamanan',
                'penyebrangan_pas_masuk', 'rapid_antigen', 'allowance',
                'total_subsidi_bbm', 'subsidi_hotel', 'total_biaya_operasional',
                'parkir_resmi', 'tol', 'kirim_dokumen', 'tarif_gs', 'atk',
                'biaya_lainnya', 'tarif_sewa_unit_vendor', 'selisih_tagihan_hotel',
                'total_non_klaim_bbm',
            ])
            ->map(fn ($row) => $this->secondaryMetrics($row, $ovtLookup));

        $direction = $direction === 'asc' ? 'asc' : 'desc';
        if ($sort === 'tanggal') {
            LegacyDate::orderBy($query, $sort, $direction);
        } else {
            $query->orderBy($sort, $direction);
        }

        $paginator = $query->paginate($pageSize)->withQueryString();

        $paginator->through(fn ($row) => $this->secondaryTableRow($row, $ovtLookup));

        return Inertia::render('ProfitUnit/OperationTable', [
            'title' => 'Tabel Profit Secondary',
            'type' => 'secondary',
            'rows' => $paginator,
            'filters' => ['AREA' => $area, 'NOPOL' => $nopol, 'SEARCH' => $search, 'SORT' => $sort, 'DIRECTION' => $direction],
            'summary' => [
                'count' => $summaryRows->count(),
                'revenue' => (float) $summaryRows->sum('tagihan'),
                'cost' => (float) $summaryRows->sum('cost'),
                'profit' => (float) $summaryRows->sum('profit'),
            ],
        ]);
    }

    private function secondaryTableRow($row, array $ovtLookup): array
    {
        $metrics = $this->secondaryMetrics($row, $ovtLookup);

        return [
            'id_key' => $row->id_key,
            'tanggal' => $row->tanggal,
            'area' => $row->area,
            'nopol' => $row->nopol,
            'tipe' => $row->tipe_unit,
            'editor' => $row->nama_admin ?? '-',
            'lama_cek_data' => $row->crosscek_date ?? '-',
            'admin_cross_cek' => $row->admin_cross_cek ?? '-',
            'jam_mulai' => $row->jam_mulai ?? '-',
            'jam_selesai' => $row->jam_selesai ?? '-',
            'tarif_unit' => (float) ($row->tarif_unit ?? 0),
            'total_tarif' => $metrics['tagihan'],
            'total_biaya_operasional' => $metrics['cost'],
            'profit' => $metrics['profit'],
            'week' => $row->week ? 'W'.$row->week : '-',
        ];
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
            LegacyDate::whereDate($query, 'tanggal', $hari);
        }
        if ($tahun !== 'ALL') {
            LegacyDate::whereYear($query, 'tanggal', $tahun);
        }

        $revenue = (float) (clone $query)->sum('tarif_sewa_unit_bln');
        $cost = (float) (clone $query)->sum('biaya_legalitas');
        $profitTotal = $revenue - $cost;
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
            ->selectRaw('YEAR('.LegacyDate::sql('tanggal').') as tahun, SUM(tarif_sewa_unit_bln) as revenue, COUNT(*) as total')
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
            ->select('nopol', 'area', 'tipe', DB::raw('SUM(tarif_sewa_unit_bln) as revenue'), DB::raw('SUM(biaya_legalitas) as cost'), DB::raw('COUNT(*) as total'))
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
                'cost' => (float) ($row->cost ?? 0),
                'total' => (int) $row->total,
            ]);

        $rows = DB::table('operasional_rental_unit_input')
            ->orderByRaw(LegacyDate::sql('tanggal').' desc')
            ->get([
                'id_key',
                'tanggal',
                'area',
                'regional',
                'nopol',
                'tipe',
                'tarif_sewa_unit_bln',
                'biaya_legalitas',
            ])
            ->map(function ($row) {
                $date = LegacyDate::parse($row->tanggal);
                $cost = (float) ($row->biaya_legalitas ?? 0);

                return [
                    'id_key' => $row->id_key,
                    'tanggal' => $row->tanggal,
                    'week' => $date ? (int) $date->format('W') : null,
                    'area' => $row->area ?: 'TIDAK DIKETAHUI',
                    'nopol' => $row->nopol ?: '-',
                    'tipe' => $row->tipe ?: 'TIDAK DIKETAHUI',
                    'rute' => $row->regional ?: 'TIDAK DIKETAHUI',
                    'revenue' => (float) $row->tarif_sewa_unit_bln,
                    'cost' => $cost,
                    'profit' => (float) $row->tarif_sewa_unit_bln - $cost,
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
            'rataBiaya' => $count > 0 ? $cost / $count : 0,
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
            LegacyDate::whereYear($query, 'tanggal', $tahun);
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

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as total_rows')
            ->selectRaw('COALESCE(SUM(tarif_sewa_unit_bln), 0) as revenue')
            ->selectRaw('COALESCE(SUM(biaya_legalitas), 0) as cost')
            ->first();

        $pageSize = max(1, min((int) request()->query('per_page', 50), 200));
        $rows = $query
            ->orderByRaw(LegacyDate::sql('tanggal').' desc')
            ->orderBy('area')
            ->paginate($pageSize)
            ->withQueryString();

        $rows->through(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal,
                'area' => $row->area,
                'nopol' => $row->nopol,
                'tipe' => $row->tipe,
                'tarif_sewa_unit_bln' => (float) $row->tarif_sewa_unit_bln,
                'biaya_legalitas' => (float) ($row->biaya_legalitas ?? 0),
                'week' => LegacyDate::parse($row->tanggal) ? 'W'.LegacyDate::parse($row->tanggal)->format('W') : '-',
            ]);

        $totalCost = (float) ($totals->cost ?? 0);
        $totalRevenue = (float) ($totals->revenue ?? 0);

        return Inertia::render('ProfitUnit/RentalTable', [
            'rows' => $rows,
            'filters' => [
                'AREA' => $area,
                'NOPOL' => $nopol,
                'TAHUN' => $tahun,
                'SEARCH' => $search,
            ],
            'summary' => [
                'count' => (int) ($totals->total_rows ?? 0),
                'revenue' => $totalRevenue,
                'cost' => $totalCost,
                'profit' => $totalRevenue - $totalCost,
            ],
        ]);
    }

    public function rentalDetail(string $id)
    {
        $row = DB::table('operasional_rental_unit_input')
            ->where('id_key', $id)
            ->first();

        abort_if(! $row, 404);

        $rentalDate = LegacyDate::parse($row->tanggal);

        $detail = [
            'id_key' => $row->id_key,
            'tanggal' => $row->tanggal,
            'area' => $row->area,
            'regional' => $row->regional,
            'nopol' => $row->nopol,
            'tipe' => $row->tipe,
            'tarif_sewa_unit_bln' => (float) $row->tarif_sewa_unit_bln,
            'biaya_legalitas' => (float) ($row->biaya_legalitas ?? 0),
            'week' => $rentalDate ? 'W'.$rentalDate->format('W') : '-',
            'tahun' => $rentalDate ? $rentalDate->format('Y') : '-',
            'bulan' => $rentalDate ? $rentalDate->format('m') : '-',
            'no_bap' => $row->no_bap,
            'no_po' => $row->no_po,
        ];

        $legalitas = [];
        if ($row->nopol) {
            $unit = DB::table('hr_manager_db_inventori')
                ->where('nopol', $row->nopol)
                ->first();

            if ($unit) {
                $legalitas = [
                    'stnk' => [
                        'status' => $unit->status_stnk,
                        'jatuh_tempo' => $unit->jatuh_tempo_stnk,
                        'masa_aktif' => $unit->masa_aktif_stnk,
                        'no_bpkb' => $unit->no_bpkb,
                        'keterangan' => $unit->keterangan_stnk,
                    ],
                    'pajak' => [
                        'status' => $unit->status_pajak,
                        'jatuh_tempo' => $unit->jatuh_tempo_pajak,
                        'masa_aktif' => $unit->masa_aktif_pajak,
                    ],
                    'kir' => [
                        'status' => $unit->status_kir,
                        'jatuh_tempo' => $unit->jatuh_tempo_kir,
                        'masa_aktif' => $unit->masa_aktif_kir,
                        'ijin_muatan' => $unit->ijin_muatan,
                        'proses_keur' => $unit->keterangan_proses_keur,
                    ],
                ];
            }
        }

        return Inertia::render('ProfitUnit/RentalDetail', [
            'detail' => $detail,
            'legalitas' => $legalitas,
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
        $departure = $this->filterValue('departure', 'DEPARTURE');

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
        if ($departure !== 'ALL') {
            $query->whereExists(function ($subQuery) use ($departure) {
                $subQuery->select(DB::raw(1))
                    ->from('db_chargo_data_paket_delivery as dx')
                    ->whereColumn('dx.no_stt', 'db_chargo_data_paket_masuk.no_stt')
                    ->where('dx.tgl_kapal_berangkat', $departure);
            });
        }

        $deliveryQuery = DB::table('db_chargo_data_paket_delivery as d')
            ->leftJoin('db_chargo_data_paket_masuk as m', 'm.no_stt', '=', 'd.no_stt');
        if ($hari) {
            $deliveryQuery->where('m.tanggal', $hari);
        }
        if ($area !== 'ALL') {
            $deliveryQuery->where('m.kota_tujuan', $area);
        }
        if ($week !== 'ALL') {
            $deliveryQuery->where('m.week', $week);
        }
        if ($bulan !== 'ALL') {
            $deliveryQuery->where('m.bulan', $bulan);
        }
        if ($tahun !== 'ALL') {
            $deliveryQuery->where('m.tahun', $tahun);
        }
        if ($kategori !== 'ALL') {
            $deliveryQuery->where('d.kode_pesanan', $kategori);
        }
        if ($departure !== 'ALL') {
            $deliveryQuery->where('d.tgl_kapal_berangkat', $departure);
        }

        $record = (clone $query)
            ->selectRaw('COALESCE(SUM(total_ongkir), 0) as revenue, COALESCE(SUM(biaya_kirim), 0) as cost, COUNT(*) as total')
            ->first();
        $profitRecord = (clone $deliveryQuery)
            ->selectRaw('COALESCE(SUM(d.total_cod), 0) as profit')
            ->first();
        $revenue = (float) ($record->revenue ?? 0);
        $cost = (float) ($record->cost ?? 0);
        $profitTotal = (float) ($profitRecord->profit ?? 0);
        $count = (int) ($record->total ?? 0);
        $rataProfit = $count > 0 ? $profitTotal / $count : 0;
        $rataTarif = $count > 0 ? $revenue / $count : 0;
        $rataBiaya = $count > 0 ? $cost / $count : 0;

        $byArea = (clone $deliveryQuery)
            ->select('m.kota_tujuan', DB::raw('SUM(COALESCE(d.total_cod, 0)) as profit'))
            ->groupBy('m.kota_tujuan')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->kota_tujuan ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
            ]);

        $byKapal = (clone $deliveryQuery)
            ->select('d.nama_kapal', DB::raw('SUM(COALESCE(d.total_cod, 0)) as ongkir'))
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
            ->select('d.tgl_kapal_berangkat', DB::raw('SUM(COALESCE(d.total_cod, 0)) as total'))
            ->whereNotNull('d.tgl_kapal_berangkat')
            ->where('d.tgl_kapal_berangkat', '!=', '')
            ->groupBy('d.tgl_kapal_berangkat')
            ->orderByRaw(LegacyDate::sql('d.tgl_kapal_berangkat'))
            ->get()
            ->map(fn ($row) => [
                'name' => $row->tgl_kapal_berangkat,
                'total' => (float) $row->total,
            ]);

        $byType = (clone $deliveryQuery)
            ->select('m.katagori_barang', DB::raw('COUNT(d.no_stt) as total'), DB::raw('SUM(COALESCE(d.total_cod, 0)) as revenue'), DB::raw('SUM(COALESCE(d.total_cod, 0)) as profit'))
            ->groupBy('m.katagori_barang')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->katagori_barang ?: 'TIDAK DIKETAHUI',
                'value' => (int) $row->total,
                'revenue' => (float) $row->revenue,
                'profit' => (float) $row->profit,
            ]);

        $byBulan = (clone $deliveryQuery)
            ->select('d.bulan', DB::raw('SUM(COALESCE(d.total_cod, 0)) as total'))
            ->whereNotNull('d.bulan')
            ->where('d.bulan', '!=', '')
            ->groupBy('d.bulan')
            ->orderBy('d.bulan')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->bulan,
                'total' => (float) $row->total,
            ]);

        $cityRecords = [
            'kupang' => (float) (clone $deliveryQuery)->where('m.kota_asal', 'KUPANG')->sum('d.total_cod'),
            'surabaya' => (float) (clone $deliveryQuery)->where('m.kota_asal', 'SURABAYA')->sum('d.total_cod'),
        ];

        $byYear = (clone $deliveryQuery)
            ->selectRaw("d.tahun, SUM(COALESCE(d.total_cod, 0)) as revenue, 0 as cost, SUM(COALESCE(d.total_cod, 0)) as profit, COUNT(d.no_stt) as total")
            ->whereNotNull('d.tahun')
            ->where('d.tahun', '!=', '')
            ->groupBy('d.tahun')
            ->orderBy('d.tahun')
            ->get()
            ->map(fn ($row) => [
                'name' => (string) ($row->tahun ?: 'TIDAK DIKETAHUI'),
                'revenue' => (float) $row->revenue,
                'cost' => (float) $row->cost,
                'profit' => (float) $row->profit,
                'total' => (int) $row->total,
            ]);

        $byRegional = (clone $deliveryQuery)
            ->select('m.region', DB::raw('SUM(COALESCE(d.total_cod, 0)) as profit'), DB::raw('COUNT(d.no_stt) as total'))
            ->whereNotNull('m.region')
            ->where('m.region', '!=', '')
            ->groupBy('m.region')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->region ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
                'value' => (int) $row->total,
            ]);

        $topUnits = (clone $deliveryQuery)
            ->select('d.no_stt', 'm.kota_tujuan', 'm.katagori_barang', DB::raw('SUM(COALESCE(d.total_cod, 0)) as profit'), DB::raw('COUNT(d.no_stt) as total'))
            ->whereNotNull('d.no_stt')
            ->where('d.no_stt', '!=', '')
            ->groupBy('d.no_stt', 'm.kota_tujuan', 'm.katagori_barang')
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

        $departuresQuery = DB::table('db_chargo_data_paket_delivery')
            ->select('no_stt', DB::raw('MAX(tgl_kapal_berangkat) as departure'))
            ->whereNotNull('no_stt')
            ->where('no_stt', '!=', '')
            ->whereNotNull('tgl_kapal_berangkat')
            ->whereRaw("TRIM(tgl_kapal_berangkat) NOT IN ('', '0000-00-00')")
            ->whereRaw(LegacyDate::sql('tgl_kapal_berangkat').' IS NOT NULL');

        if ($departure !== 'ALL') {
            $departuresQuery->where('tgl_kapal_berangkat', $departure);
        }

        $departures = $departuresQuery
            ->groupBy('no_stt')
            ->pluck('departure', 'no_stt');

        $departureDateExpression = LegacyDate::sql('d.tgl_kapal_berangkat');
        $departureMonth = $this->monthNumberFromFilter($bulan);
        $lclOptionFilters = [
            'TAHUN' => $tahun,
            'BULAN' => $bulan,
            'AREA' => $area,
            'WEEK' => $week,
        ];
        $applyLclOptionFilters = function ($optionQuery, array $activeFilters) use ($lclOptionFilters) {
            if (in_array('TAHUN', $activeFilters, true) && $lclOptionFilters['TAHUN'] !== 'ALL') {
                $optionQuery->where('m.tahun', $lclOptionFilters['TAHUN']);
            }

            if (in_array('BULAN', $activeFilters, true) && $lclOptionFilters['BULAN'] !== 'ALL') {
                $optionQuery->where('m.bulan', $lclOptionFilters['BULAN']);
            }

            if (in_array('AREA', $activeFilters, true) && $lclOptionFilters['AREA'] !== 'ALL') {
                $optionQuery->where('m.kota_tujuan', $lclOptionFilters['AREA']);
            }

            if (in_array('WEEK', $activeFilters, true) && $lclOptionFilters['WEEK'] !== 'ALL') {
                $optionQuery->where('m.week', $lclOptionFilters['WEEK']);
            }

            return $optionQuery;
        };
        $lclOptionBase = fn () => DB::table('db_chargo_data_paket_masuk as m');
        $lclOptionValues = function (string $label, string $column, array $activeFilters, ?string $orderByRaw = null) use ($lclOptionBase, $applyLclOptionFilters) {
            $optionQuery = $applyLclOptionFilters($lclOptionBase(), $activeFilters)
                ->whereNotNull($column)
                ->whereRaw("TRIM({$column}) != ''")
                ->selectRaw("{$column} as option_value")
                ->groupBy($column);

            if ($orderByRaw) {
                $optionQuery->orderByRaw($orderByRaw);
            } else {
                $optionQuery->orderBy($column);
            }

            $values = $optionQuery
                ->pluck('option_value')
                ->map(fn ($value) => (string) $value)
                ->values()
                ->all();

            return [$label => array_values(array_unique(array_merge(['ALL'], $values)))];
        };
        $departureOptionsQuery = $applyLclOptionFilters(
            DB::table('db_chargo_data_paket_delivery as d')
                ->leftJoin('db_chargo_data_paket_masuk as m', 'm.no_stt', '=', 'd.no_stt'),
            ['TAHUN', 'BULAN', 'AREA', 'WEEK']
        );

        if ($tahun !== 'ALL' && preg_match('/^\d{4}$/', $tahun)) {
            $departureOptionsQuery->whereRaw("YEAR({$departureDateExpression}) = ?", [(int) $tahun]);
        }

        if ($departureMonth !== null) {
            $departureOptionsQuery->whereRaw("MONTH({$departureDateExpression}) = ?", [$departureMonth]);
        }

        $departureOptions = $departureOptionsQuery
            ->whereNotNull('d.tgl_kapal_berangkat')
            ->whereRaw("TRIM(d.tgl_kapal_berangkat) NOT IN ('', '0000-00-00')")
            ->whereRaw($departureDateExpression.' IS NOT NULL')
            ->select('d.tgl_kapal_berangkat')
            ->groupBy('d.tgl_kapal_berangkat')
            ->orderByRaw($departureDateExpression.' desc')
            ->pluck('d.tgl_kapal_berangkat')
            ->map(fn ($value) => (string) $value)
            ->values()
            ->all();
        $lclFilterOptions = array_merge(
            ['SALES' => ['ALL']],
            $lclOptionValues('AREA', 'm.kota_tujuan', ['TAHUN', 'BULAN']),
            $lclOptionValues('WEEK', 'm.week', ['TAHUN', 'BULAN'], 'CAST(m.week AS UNSIGNED), m.week'),
            $lclOptionValues('BULAN', 'm.bulan', ['TAHUN']),
            $lclOptionValues('TAHUN', 'm.tahun', [], 'm.tahun desc'),
            ['DEPARTURE' => array_values(array_unique(array_merge(['ALL'], $departureOptions)))]
        );

        $deliveryProfitByStt = (clone $deliveryQuery)
            ->select('d.no_stt', DB::raw('SUM(COALESCE(d.total_cod, 0)) as profit'))
            ->whereNotNull('d.no_stt')
            ->where('d.no_stt', '!=', '')
            ->groupBy('d.no_stt')
            ->pluck('profit', 'no_stt');

        $rows = (clone $query)
            ->orderByRaw(LegacyDate::sql('tanggal').' desc')
            ->get([
                'id_key',
                'tanggal',
                'kota_asal',
                'kota_tujuan',
                'no_stt',
                'katagori_barang',
                'week',
                'total_ongkir',
                'biaya_kirim',
            ])
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal,
                'area' => $row->kota_tujuan ?: 'TIDAK DIKETAHUI',
                'nopol' => $row->no_stt ?: '-',
                'tipe' => $row->katagori_barang ?: 'TIDAK DIKETAHUI',
                'rute' => trim(($row->kota_asal ?: '-').' - '.($row->kota_tujuan ?: '-')),
                'week' => $row->week,
                'departure' => $departures->get((string) $row->no_stt) ?: 'TIDAK DIKETAHUI',
                'revenue' => (float) $row->total_ongkir,
                'cost' => (float) $row->biaya_kirim,
                'profit' => (float) ($deliveryProfitByStt->get((string) $row->no_stt) ?? 0),
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
                'DEPARTURE' => $departure,
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
            'filterOptions' => $lclFilterOptions,
        ]);
    }

    public function lclTable()
    {
        $area = $this->filterValue('area', 'AREA');
        $nopol = (string) request()->query('nopol', 'ALL');
        $search = (string) request()->query('search', '');
        $sort = (string) request()->query('sort', 'tanggal');
        $direction = request()->query('direction') === 'asc' ? 'asc' : 'desc';

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

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as total_rows')
            ->selectRaw('COALESCE(SUM(total_ongkir), 0) as revenue')
            ->selectRaw('COALESCE(SUM(biaya_kirim), 0) as cost')
            ->first();

        $allStt = (clone $query)
            ->whereNotNull('no_stt')
            ->where('no_stt', '!=', '')
            ->distinct()
            ->pluck('no_stt');
        $totalProfit = $allStt->isEmpty()
            ? 0.0
            : (float) DB::table('db_chargo_data_paket_delivery')
                ->whereIn('no_stt', $allStt)
                ->sum('total_cod');

        $sortable = ['id_key', 'tanggal', 'kota_tujuan', 'no_stt', 'katagori_barang', 'total_ongkir', 'biaya_kirim', 'week'];
        if (! in_array($sort, $sortable, true)) {
            $sort = 'tanggal';
            $direction = 'desc';
        }

        if ($sort === 'tanggal') {
            LegacyDate::orderBy($query, $sort, $direction);
        } else {
            $query->orderBy($sort, $direction);
        }

        $pageSize = max(1, min((int) request()->query('per_page', 50), 200));
        $paginator = $query->paginate($pageSize)->withQueryString();
        $rawRows = collect($paginator->items());

        $sttList = $rawRows
            ->pluck('no_stt')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $profitByStt = collect();

        if ($sttList !== []) {
            $profitByStt = DB::table('db_chargo_data_paket_delivery')
                ->select('no_stt', DB::raw('SUM(COALESCE(total_cod, 0)) as profit'))
                ->whereIn('no_stt', $sttList)
                ->groupBy('no_stt')
                ->pluck('profit', 'no_stt');
        }

        $paginator->through(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal,
                'area' => $row->kota_tujuan,
                'nopol' => $row->no_stt,
                'tipe' => $row->katagori_barang,
                'tarif' => (float) $row->total_ongkir,
                'biaya' => (float) $row->biaya_kirim,
                'profit' => (float) ($profitByStt->get((string) $row->no_stt) ?? 0),
                'week' => $row->week ? 'W'.$row->week : '-',
            ]);

        return Inertia::render('ProfitUnit/OperationTable', [
            'title' => 'Tabel Profit LCL',
            'type' => 'lcl',
            'rows' => $paginator,
            'filters' => ['AREA' => $area, 'NOPOL' => $nopol, 'SEARCH' => $search, 'SORT' => $sort, 'DIRECTION' => $direction],
            'summary' => [
                'count' => (int) ($totals->total_rows ?? 0),
                'revenue' => (float) ($totals->revenue ?? 0),
                'cost' => (float) ($totals->cost ?? 0),
                'profit' => $totalProfit,
            ],
        ]);
    }

    public function lclDetail(string $id)
    {
        $row = DB::table('db_chargo_data_paket_masuk')->where('id_key', $id)->first();
        abort_if(! $row, 404);

        $deliveryProfit = trim((string) $row->no_stt) === ''
            ? 0.0
            : (float) DB::table('db_chargo_data_paket_delivery')
                ->where('no_stt', $row->no_stt)
                ->sum('total_cod');

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
                'biaya' => (float) $row->biaya_kirim,
                'profit' => $deliveryProfit,
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
                LegacyDate::whereDate($q, 'tanggal_muat', $hari)
                    ->orWhere(fn ($inner) => LegacyDate::whereDate($inner, 'tanggal_terima', $hari));
            });
        }
        if ($week !== 'ALL') {
            $query->where('week', $week);
        }
        if ($tahun !== 'ALL') {
            $query->where(function ($q) use ($tahun) {
                LegacyDate::whereYear($q, 'tanggal_muat', $tahun)
                    ->orWhere(fn ($inner) => LegacyDate::whereYear($inner, 'tanggal_terima', $tahun));
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
            ->selectRaw('YEAR('.LegacyDate::sql('tanggal_muat').') as tahun, SUM(total_tarif) as revenue, SUM(total_biaya) as cost, SUM(total_tarif - total_biaya) as profit, COUNT(*) as total')
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

        $rows = LegacyDate::orderBy(DB::table('operasional_primary_input'), 'tanggal_muat', 'desc')
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
                'KATEGORI' => array_values(array_unique(array_merge(
                    ['ALL'],
                    DB::table('dropdownlist_area_primary')
                        ->whereNotNull('katagori')
                        ->where('katagori', '!=', '')
                        ->distinct()
                        ->orderBy('katagori')
                        ->pluck('katagori')
                        ->map(fn ($v) => (string) $v)
                        ->all()
                ))),
                'KATEGORI_MAP' => DB::table('dropdownlist_area_primary')
                    ->whereNotNull('katagori')
                    ->where('katagori', '!=', '')
                    ->select('katagori', 'regional')
                    ->distinct()
                    ->get()
                    ->groupBy('katagori')
                    ->map(fn ($items) => $items->pluck('regional')->map(fn ($v) => (string) $v)->values()->all())
                    ->all(),
            ],
        ]);
    }

    public function primaryTable()
    {
        $area = $this->filterValue('area', 'AREA');
        $nopol = (string) request()->query('nopol', 'ALL');
        $search = (string) request()->query('search', '');
        $bulan = (string) request()->query('bulan', '');
        $tahun = (string) request()->query('tahun', '');

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
        if ($bulan !== '') {
            $query->whereRaw('MONTH('.LegacyDate::sql('tanggal_muat').') = ?', [(int) $bulan]);
        }
        if ($tahun !== '') {
            LegacyDate::whereYear($query, 'tanggal_muat', $tahun);
        }

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as total_rows')
            ->selectRaw('COALESCE(SUM(total_tarif), 0) as revenue')
            ->selectRaw('COALESCE(SUM(total_biaya), 0) as cost')
            ->first();

        $pageSize = max(1, min((int) request()->query('per_page', 50), 200));
        $sort = (string) request()->query('sort', 'tanggal_muat');
        $direction = (string) request()->query('direction', 'desc');

        $sortable = ['id_key', 'tanggal_muat', 'area', 'nopol_driver', 'jenis', 'status_dokument', 'create_data', 'total_tarif', 'total_biaya', 'week'];
        if (! in_array($sort, $sortable, true)) {
            $sort = 'tanggal_muat';
            $direction = 'desc';
        }

        $direction = $direction === 'asc' ? 'asc' : 'desc';
        if (in_array($sort, ['tanggal_muat', 'create_data'], true)) {
            LegacyDate::orderBy($query, $sort, $direction);
        } else {
            $query->orderBy($sort, $direction);
        }

        $paginator = $query->paginate($pageSize)->withQueryString();

        $idKeys = $paginator->pluck('id_key');

        $latestUpdates = collect();
        $kategoriMap = collect();
        $regionalAreaList = collect();

        if ($idKeys->isNotEmpty()) {
            $latestUpdates = DB::table('operasional_catatan_update')
                ->whereIn('id_record', $idKeys)
                ->orderByRaw(LegacyDate::sql('tgl_cek_admin').' desc')
                ->get()
                ->groupBy('id_record')
                ->map(fn ($items) => $items->first());

            $regionalAreaList = $paginator->map(fn ($r) => ($r->regional ?? '') . '||' . ($r->area ?? ''))->unique()->filter();

            if ($regionalAreaList->isNotEmpty()) {
                $kategoriRows = DB::table('dropdownlist_area_primary')
                    ->get(['regional', 'area', 'katagori']);
                $kategoriMap = $kategoriRows
                    ->groupBy(fn ($r) => ($r->regional ?? '') . '||' . ($r->area ?? ''))
                    ->map(fn ($items) => $items->first()->katagori);
            }
        }

        $paginator->through(fn ($row) => [
            'id_key' => $row->id_key,
            'tanggal' => $row->tanggal_muat,
            'tahun' => strlen($row->tanggal_muat) >= 10 ? substr($row->tanggal_muat, 6, 4) : '-',
            'bulan' => strlen($row->tanggal_muat) >= 10 ? (int) substr($row->tanggal_muat, 3, 2) : '-',
            'jarak_waktu' => $row->create_data ?? '-',
            'status_doc_fat' => empty($row->status_dokument) ? 'BELUM NAIK' : 'DITERIMA FAT',
            'kategori' => $kategoriMap[($row->regional ?? '') . '||' . ($row->area ?? '')] ?? '-',
            'end_time' => optional($latestUpdates->get($row->id_key))->tgl_cek_admin ?? '-',
            'editor' => optional($latestUpdates->get($row->id_key))->nama_admin ?? '-',
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
            'rows' => $paginator,
            'filters' => ['AREA' => $area, 'NOPOL' => $nopol, 'SEARCH' => $search, 'SORT' => $sort, 'DIRECTION' => $direction],
            'summary' => [
                'count' => (int) ($totals->total_rows ?? 0),
                'revenue' => (float) ($totals->revenue ?? 0),
                'cost' => (float) ($totals->cost ?? 0),
                'profit' => (float) ($totals->revenue ?? 0) - (float) ($totals->cost ?? 0),
            ],
        ]);
    }

    public function primaryDetail(string $id)
    {
        $row = DB::table('operasional_primary_input')->where('id_key', $id)->first();
        abort_if(! $row, 404);

        $editor = DB::table('operasional_catatan_update')
            ->where('id_record', $id)
            ->orderByRaw(LegacyDate::sql('tgl_cek_admin').' desc')
            ->first();

        return Inertia::render('ProfitUnit/OperationDetail', [
            'title' => 'Detail Profit Primary',
            'type' => 'primary',
            'backUrl' => $this->tableBackUrl('profit-unit.primary.table'),
            'detail' => [
                'id_key' => $row->id_key,
                'create' => $row->create_data ?? '-',
                'tanggal_muat' => $row->tanggal_muat,
                'tanggal_terima' => $row->tanggal_terima,
                'regional' => $row->regional ?? '-',
                'area' => $row->area,
                'rute_asal' => $row->rute_asal ?? '-',
                'rute_tujuan' => $row->rute_tujuan ?? '-',
                'nopol' => $row->nopol_driver,
                'driver' => $row->nopol_driver,
                'vendor' => $row->vendor ?? '-',
                'qty' => (int) $row->qty,
                'jenis' => $row->jenis,
                'total' => (float) $row->total,
                'tarif' => (float) $row->tarif,
                'total_tarif' => (float) $row->total_tarif,
                'total_biaya' => (float) $row->total_biaya,
                'profit' => (float) $row->profit,
                'week' => $row->week ? 'W'.$row->week : '-',
                'no_po' => $row->no_po,
                'no_si' => $row->no_si,
                'no_sj' => $row->no_sj,
                'editor' => optional($editor)->nama_admin ?? '-',
                'edit_time' => optional($editor)->tgl_cek_admin ?? '-',
            ],
        ]);
    }
}
