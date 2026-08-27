<?php

namespace App\Http\Controllers\Biaya;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use App\Support\LegacyDate;
use App\Support\VehicleCostSummary;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class BiayaController extends Controller
{
    private array $categories = [
        'operasional-prim' => ['title' => 'Operasional Prim.', 'source' => 'primary', 'amount' => 'total_biaya', 'date' => 'tanggal_muat'],
        'operasional-sec' => ['title' => 'Operasional Sec.', 'source' => 'secondary', 'amount' => 'total_biaya_operasional', 'date' => 'tanggal'],
        'pajak-1-tahun' => ['title' => 'Pajak 1 tahun', 'source' => 'inventori', 'amount' => 'biaya_pajak', 'date' => 'jatuh_tempo_pajak'],
        'biaya-kir' => ['title' => 'Biaya KIR', 'source' => 'inventori', 'amount' => 'biaya_kir', 'date' => 'jatuh_tempo_kir'],
        'pajak-5-tahun' => ['title' => 'Pajak 5 tahun', 'source' => 'inventori', 'amount' => 'biaya_stnk', 'date' => 'jatuh_tempo_stnk'],
        'service-ban' => ['title' => 'Service Ban', 'source' => 'ban', 'amount' => 'total_harga', 'date' => 'tanggal_ganti_ban'],
        'service-umum' => ['title' => 'Service umum', 'source' => 'service', 'amount' => 'total_biaya_service', 'date' => 'tanggal_services'],
    ];

    public function index()
    {
        $filters = $this->filters();
        $sort = (string) request()->query('sort', 'total');
        $direction = request()->query('direction') === 'asc' ? 'asc' : 'desc';
        $page = max(1, (int) request()->query('page', 1));
        $perPage = 50;
        $operationRows = collect(Cache::remember(
            'biaya.operation-rows.v3',
            now()->addMinutes(5),
            fn () => $this->operationRows()->values()->all()
        ));
        $filterOptions = $this->filterOptions($filters, $operationRows);

        if ($filters['WEEK'] !== 'ALL' && ! in_array($filters['WEEK'], $filterOptions['WEEK'], true)) {
            $filters['WEEK'] = 'ALL';
        }

        $cacheSuffix = md5(json_encode($filters));

        $allVehicleCosts = collect(Cache::remember(
            "biaya.vehicle-costs.v3.{$cacheSuffix}",
            now()->addMinutes(3),
            fn () => $this->vehicleCosts($filters)->values()->all()
        ));
        $summary = $this->summaryFromVehicleCosts($allVehicleCosts);
        $sortedVehicleCosts = $this->sortVehicleCosts($allVehicleCosts, $sort, $direction);
        $totalRows = $sortedVehicleCosts->count();
        $lastPage = max(1, (int) ceil($totalRows / $perPage));
        $page = min($page, $lastPage);
        $items = $sortedVehicleCosts->forPage($page, $perPage)->values();

        return Inertia::render('Biaya/Index', [
            'summaryData' => $summary,
            'vehicleCosts' => [
                'data' => $items,
                'current_page' => $page,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $totalRows,
                'from' => $totalRows ? (($page - 1) * $perPage) + 1 : 0,
                'to' => min($page * $perPage, $totalRows),
            ],
            'operationFlow' => $this->operationFlow($filters, $operationRows),
            'dataComparison' => $this->comparisonData($filters, $operationRows),
            'smartAnalysis' => $this->smartAnalysis($summary, $allVehicleCosts, $filters, $operationRows),
            'filters' => $filters,
            'sort' => $sort,
            'direction' => $direction,
            'filterOptions' => $filterOptions,
        ]);
    }

    public function category(string $slug)
    {
        abort_unless(isset($this->categories[$slug]), 404);

        $category = $this->categories[$slug];

        return Inertia::render('Biaya/Category', [
            'category' => [
                'slug' => $slug,
                'title' => $category['title'],
                'amount' => $this->sumCategory($category),
                'source' => $category['source'],
            ],
            'rawTableData' => $this->rowsForCategory($slug, $category),
        ]);
    }

    public function unitDetail(string $nopol)
    {
        $unit = Inventori::where('nopol', $nopol)->firstOrFail();

        $riwayatService = DB::table('maintenance_input_maintenance')
            ->where('nopol', $nopol)
            ->orderByRaw(LegacyDate::sql('tanggal_services').' desc')
            ->get(['id_key', 'tanggal_services', 'tipe_service', 'total_biaya_service', 'keluhan']);
        $riwayatBan = DB::table('maintenance_monitoring_ban')
            ->where('nopol', $nopol)
            ->orderByRaw(LegacyDate::sql('tanggal_ganti_ban').' desc')
            ->get(['id_key', 'tanggal_ganti_ban', 'posisi', 'jenis_ban', 'tipe_ban', 'total_harga']);
        $riwayatPrimary = DB::table('operasional_primary_input')
            ->where('nopol_driver', $nopol)
            ->orderByRaw(LegacyDate::sql('tanggal_muat').' desc')
            ->get(['id_key', 'tanggal_muat', 'area', 'rute_asal', 'rute_tujuan', 'jenis', 'total_biaya']);
        $riwayatSecondary = DB::table('operasional_secondary_input')
            ->where('nopol', $nopol)
            ->orderByRaw(LegacyDate::sql('tanggal').' desc')
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

        return Inertia::render('Biaya/UnitDetail', [
            'unitData' => $unit,
            'riwayatService' => $riwayatService,
            'riwayatBan' => $riwayatBan,
            'riwayatPrimary' => $riwayatPrimary,
            'riwayatSecondary' => $riwayatSecondary,
            'aggregates' => $aggregates,
            'vehicleCost' => VehicleCostSummary::forNopol((string) $unit->nopol),
        ]);
    }

    public function detail(string $slug, string $id)
    {
        abort_unless(isset($this->categories[$slug]), 404);

        $category = $this->categories[$slug];
        $record = $this->recordForCategory($category, $id);

        abort_if(!$record, 404);

        return Inertia::render('Biaya/Detail', [
            'category' => [
                'slug' => $slug,
                'title' => $category['title'],
                'source' => $category['source'],
            ],
            'record' => $record,
            'relatedStats' => $category['source'] === 'inventori'
                ? $this->relatedInventoriStats($record->nopol)
                : null,
        ]);
    }

    private function sumCategory(array $category): float
    {
        return match ($category['source']) {
            'inventori' => (float) Inventori::sum($category['amount']),
            'service' => (float) DB::table('maintenance_input_maintenance')->sum($category['amount']),
            'ban' => (float) DB::table('maintenance_monitoring_ban')->sum($category['amount']),
            'primary' => (float) DB::table('operasional_primary_input')->sum($category['amount']),
            'secondary' => (float) DB::table('operasional_secondary_input')->sum($category['amount']),
            default => 0,
        };
    }

    private function rowsForCategory(string $slug, array $category)
    {
        $amount = $category['amount'];
        $date = $category['date'];

        return match ($category['source']) {
            'inventori' => Inventori::select(
                'id_key',
                'nopol',
                'area',
                'tipe',
                'pabrikan',
                'model',
                DB::raw("$date as tanggal"),
                DB::raw("$amount as nominal")
            )
                ->orderByRaw(LegacyDate::sql($date).' asc')
                ->orderBy('area')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'service' => DB::table('maintenance_input_maintenance')
                ->select('id_key', 'nopol', 'area', 'driver', 'tipe_service as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByRaw(LegacyDate::sql($date).' desc')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'ban' => DB::table('maintenance_monitoring_ban')
                ->select('id_key', 'nopol', 'area', 'driver', 'jenis_pengerjaan as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByRaw(LegacyDate::sql($date).' desc')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'primary' => DB::table('operasional_primary_input')
                ->select('id_key', 'nopol_driver as nopol', 'area', 'vendor as driver', 'rute_tujuan as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByRaw(LegacyDate::sql($date).' desc')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'secondary' => DB::table('operasional_secondary_input')
                ->select('id_key', 'nopol', 'area', 'driver', 'order_type as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByRaw(LegacyDate::sql($date).' desc')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            default => collect(),
        };
    }

    private function withDateGroups(object $row): object
    {
        [$year, $month, $week] = $this->dateGroups($row->tanggal ?? null);
        $row->groupYear = $year;
        $row->groupMonth = $month;
        $row->groupWeek = $week;
        $row->groupArea = $row->area ?: 'TIDAK DIKETAHUI';

        return $row;
    }

    private function dateGroups(?string $date): array
    {
        $date = trim((string) $date);

        if ($date === '' || $date === '0000-00-00') {
            return ['0', '0', '0'];
        }

        $parsed = LegacyDate::parse($date);
        if ($parsed) {
            return [$parsed->format('Y'), $this->monthLabel((int) $parsed->format('n')), $this->weekLabel($parsed)];
        }

        if (preg_match('/(\d{4})/', $date, $matches)) {
            return [$matches[1], '0', '0'];
        }

        return ['0', '0', '0'];
    }

    private function weekLabel(\DateTimeImmutable|false $date): string
    {
        if ($date === false) {
            return '0';
        }

        return 'W'.$date->format('W');
    }

    private function monthLabel(int $month): string
    {
        $labels = [
            1 => 'A Januari',
            2 => 'B Februari',
            3 => 'C Maret',
            4 => 'D April',
            5 => 'E Mei',
            6 => 'F Juni',
            7 => 'G Juli',
            8 => 'H Agustus',
            9 => 'I September',
            10 => 'J Oktober',
            11 => 'K November',
            12 => 'L Desember',
        ];

        return $labels[$month] ?? '0';
    }

    private function recordForCategory(array $category, string $id): ?object
    {
        return match ($category['source']) {
            'inventori' => Inventori::where('id_key', $id)->first(),
            'service' => DB::table('maintenance_input_maintenance')->where('id_key', $id)->first(),
            'ban' => DB::table('maintenance_monitoring_ban')->where('id_key', $id)->first(),
            'primary' => DB::table('operasional_primary_input')->where('id_key', $id)->first(),
            'secondary' => DB::table('operasional_secondary_input')->where('id_key', $id)->first(),
            default => null,
        };
    }

    private function relatedInventoriStats(?string $nopol): array
    {
        if (!$nopol) {
            return [];
        }

        $riwayatService = DB::table('maintenance_input_maintenance')
            ->where('nopol', $nopol);
        $riwayatBan = DB::table('maintenance_monitoring_ban')
            ->where('nopol', $nopol);
        $primary = DB::table('operasional_primary_input')
            ->where('nopol_driver', 'like', "%$nopol%");
        $secondary = DB::table('operasional_secondary_input')
            ->where('nopol', $nopol);

        return [
            'qty_service' => (clone $riwayatService)->count(),
            'total_biaya_service' => (clone $riwayatService)->sum('total_biaya_service'),
            'qty_ganti_ban' => (clone $riwayatBan)->count(),
            'total_biaya_ganti_ban' => (clone $riwayatBan)->sum('total_harga'),
            'primary' => (clone $primary)->count(),
            'secondary' => (clone $secondary)->count(),
            'total_biaya_operasional' => (clone $primary)->sum('total_biaya') + (clone $secondary)->sum('total_biaya_operasional'),
        ];
    }

    private function vehicleCosts(array $filters)
    {
        $units = Inventori::select(
            'nopol',
            'area',
            'tipe',
            'pabrikan',
            'model',
            'jatuh_tempo_pajak',
            'jatuh_tempo_stnk',
            'jatuh_tempo_kir',
            'biaya_pajak',
            'biaya_stnk',
            'biaya_kir',
        )
            ->whereNotNull('nopol')
            ->where('nopol', '!=', '')
            ->when($filters['AREA'] !== 'ALL', fn ($query) => $query->where('area', $filters['AREA']))
            ->when($filters['TIPE'] !== 'ALL', fn ($query) => $query->where('tipe', $filters['TIPE']))
            ->when($filters['NOPOL'] !== 'ALL', fn ($query) => $query->where('nopol', $filters['NOPOL']))
            ->get();

        $nopols = $units->pluck('nopol')->filter()->unique()->values();
        $servicesByNopol = DB::table('maintenance_input_maintenance')
            ->whereIn('nopol', $nopols)
            ->get(['nopol', 'tanggal_services', 'total_biaya_service'])
            ->groupBy('nopol');
        $banByNopol = DB::table('maintenance_monitoring_ban')
            ->whereIn('nopol', $nopols)
            ->get(['nopol', 'tanggal_ganti_ban', 'total_harga'])
            ->groupBy('nopol');
        $primaryByNopol = DB::table('operasional_primary_input')
            ->whereIn('nopol_driver', $nopols)
            ->get(['nopol_driver', 'tanggal_muat', 'total_biaya'])
            ->groupBy('nopol_driver');
        $secondaryByNopol = DB::table('operasional_secondary_input')
            ->whereIn('nopol', $nopols)
            ->get(['nopol', 'tanggal', 'total_biaya_operasional'])
            ->groupBy('nopol');

        return $units
            ->map(function ($unit) use ($filters, $servicesByNopol, $banByNopol, $primaryByNopol, $secondaryByNopol) {
                $summary = $this->vehicleCostFromRows(
                    $unit,
                    $filters,
                    $servicesByNopol->get($unit->nopol, collect()),
                    $banByNopol->get($unit->nopol, collect()),
                    $primaryByNopol->get($unit->nopol, collect()),
                    $secondaryByNopol->get($unit->nopol, collect()),
                );

                return [
                    'nopol' => $unit->nopol,
                    'area' => $unit->area,
                    'tipe' => $unit->tipe,
                    'unit' => trim(implode(' ', array_filter([$unit->pabrikan, $unit->model]))),
                    'total' => $summary['total'],
                    'pajakTahunanTotal' => $summary['pajakTahunanTotal'],
                    'pajakLimaTahunTotal' => $summary['pajakLimaTahunTotal'],
                    'kirTotal' => $summary['kirTotal'],
                    'legalitasTotal' => $summary['legalitasTotal'],
                    'serviceUmumTotal' => $summary['serviceUmumTotal'],
                    'serviceBanTotal' => $summary['serviceBanTotal'],
                    'maintenanceTotal' => $summary['maintenanceTotal'],
                    'operasionalPrimaryTotal' => $summary['operasionalPrimaryTotal'],
                    'operasionalSecondaryTotal' => $summary['operasionalSecondaryTotal'],
                    'operasionalTotal' => $summary['operasionalTotal'],
                    'serviceCount' => $summary['serviceCount'],
                    'banCount' => $summary['banCount'],
                    'primaryCount' => $summary['primaryCount'],
                    'secondaryCount' => $summary['secondaryCount'],
                ];
            })
            ->filter(function ($row) use ($filters) {
                return $filters['TAHUN'] === 'ALL' && $filters['BULAN'] === 'ALL'
                    ? true
                    : $row['total'] > 0;
            })
            ->sortByDesc('total')
            ->values()
            ->take(300);
    }

    private function operationFlow(array $filters, $operationRows = null): array
    {
        $rows = collect($operationRows ?? $this->operationRows())
            ->filter(fn ($row) => $this->matchesOperationFilters((object) $row, $filters));

        $group = $filters['WEEK'] !== 'ALL'
            ? 'week'
            : ($filters['TAHUN'] !== 'ALL' && $filters['BULAN'] !== 'ALL' ? 'week' : ($filters['TAHUN'] !== 'ALL' ? 'month' : 'year'));
        $keyField = $group === 'week' ? 'week' : ($group === 'month' ? 'month' : 'year');
        $timeline = collect($group === 'month'
            ? ($filters['BULAN'] === 'ALL' ? $this->monthOptions() : [$filters['BULAN']])
            : $rows->pluck($keyField)->filter(fn ($value) => $value && $value !== '0')->unique()->sort()->values());

        return $timeline->map(function ($key) use ($rows, $keyField, $group) {
            $groupedRows = $rows->where($keyField, $key);
            $primary = (float) $groupedRows->where('source', 'primary')->sum('nominal');
            $secondary = (float) $groupedRows->where('source', 'secondary')->sum('nominal');

            return [
                'key' => $key,
                'label' => $group === 'month' ? preg_replace('/^[A-L]\s+/', '', $key) : $key,
                'primary' => $primary,
                'secondary' => $secondary,
                'total' => $primary + $secondary,
            ];
        })->values()->all();
    }

    private function summaryFromVehicleCosts($rows)
    {
        return collect([
            ['slug' => 'operasional-prim', 'title' => 'Operasional Prim.', 'key' => 'operasionalPrimaryTotal'],
            ['slug' => 'operasional-sec', 'title' => 'Operasional Sec.', 'key' => 'operasionalSecondaryTotal'],
            ['slug' => 'pajak-1-tahun', 'title' => 'Pajak 1 tahun', 'key' => 'pajakTahunanTotal'],
            ['slug' => 'biaya-kir', 'title' => 'Biaya KIR', 'key' => 'kirTotal'],
            ['slug' => 'pajak-5-tahun', 'title' => 'Pajak 5 tahun', 'key' => 'pajakLimaTahunTotal'],
            ['slug' => 'service-ban', 'title' => 'Service Ban', 'key' => 'serviceBanTotal'],
            ['slug' => 'service-umum', 'title' => 'Service umum', 'key' => 'serviceUmumTotal'],
        ])->map(fn ($item) => [
            'slug' => $item['slug'],
            'title' => $item['title'],
            'amount' => (float) $rows->sum($item['key']),
            'actionLabel' => 'LIHAT RINCIAN BIAYA',
        ])->values();
    }

    private function sortVehicleCosts($rows, string $sort, string $direction)
    {
        $allowed = ['nopol', 'area', 'tipe', 'unit', 'legalitasTotal', 'maintenanceTotal', 'operasionalTotal', 'total', 'riwayatTotal'];
        $sort = in_array($sort, $allowed, true) ? $sort : 'total';

        return $rows->map(function ($row) {
            $row['riwayatTotal'] = (int) ($row['serviceCount'] ?? 0)
                + (int) ($row['banCount'] ?? 0)
                + (int) ($row['primaryCount'] ?? 0)
                + (int) ($row['secondaryCount'] ?? 0);

            return $row;
        })->sortBy(
            $sort,
            SORT_REGULAR,
            $direction === 'desc'
        )->values();
    }

    private function comparisonData(array $filters, $operationRows): ?array
    {
        if ($filters['TAHUN'] === 'ALL') {
            return null;
        }

        $aggregate = fn ($rows) => [
            'primary' => (float) $rows->where('source', 'primary')->sum('nominal'),
            'secondary' => (float) $rows->where('source', 'secondary')->sum('nominal'),
            'total' => (float) $rows->whereIn('source', ['primary', 'secondary'])->sum('nominal'),
            'revenue' => (float) $rows->sum('revenue'),
        ];
        $currentRows = $operationRows->filter(fn ($row) => (string) $row['year'] === $filters['TAHUN']
            && ($filters['BULAN'] === 'ALL' || (string) $row['month'] === $filters['BULAN'])
            && ($filters['WEEK'] === 'ALL' || (string) $row['week'] === $filters['WEEK'])
            && $this->matchesOperationFilters((object) $row, $filters));

        $previousLabel = null;
        $previousRows = collect();
        if ($filters['BULAN'] !== 'ALL') {
            $months = $this->monthOptions();
            $monthIndex = array_search($filters['BULAN'], $months, true);
            $previousMonth = $monthIndex > 0 ? $months[$monthIndex - 1] : end($months);
            $previousYear = $monthIndex > 0 ? $filters['TAHUN'] : (string) ((int) $filters['TAHUN'] - 1);
            $previousLabel = preg_replace('/^[A-L]\s+/', '', $previousMonth).' '.$previousYear;
            $previousRows = $operationRows->filter(fn ($row) => (string) $row['year'] === $previousYear && (string) $row['month'] === $previousMonth);
        } else {
            $previousYear = (string) ((int) $filters['TAHUN'] - 1);
            $previousLabel = $previousYear;
            $previousRows = $operationRows->where('year', $previousYear);
        }

        return [
            'current' => $aggregate($currentRows),
            'previous' => $previousRows->isNotEmpty() ? $aggregate($previousRows) : null,
            'previousLabel' => $previousLabel,
        ];
    }

    private function filters(): array
    {
        return [
            'TAHUN' => (string) request()->query('TAHUN', 'ALL'),
            'BULAN' => (string) request()->query('BULAN', 'ALL'),
            'WEEK' => (string) request()->query('WEEK', 'ALL'),
            'AREA' => (string) request()->query('AREA', 'ALL'),
            'TIPE' => (string) request()->query('TIPE', 'ALL'),
            'NOPOL' => (string) request()->query('NOPOL', 'ALL'),
        ];
    }

    private function emptyFilters(): array
    {
        return [
            'TAHUN' => 'ALL',
            'BULAN' => 'ALL',
            'WEEK' => 'ALL',
            'AREA' => 'ALL',
            'TIPE' => 'ALL',
            'NOPOL' => 'ALL',
        ];
    }

    private function monthOptions(): array
    {
        return [
            'A Januari',
            'B Februari',
            'C Maret',
            'D April',
            'E Mei',
            'F Juni',
            'G Juli',
            'H Agustus',
            'I September',
            'J Oktober',
            'K November',
            'L Desember',
        ];
    }

    private function smartAnalysis($summary, $vehicleCosts, array $filters, $operationRows): array
    {
        $totalBiaya = (float) $summary->sum('amount');
        $periodActive = $filters['TAHUN'] !== 'ALL' || $filters['BULAN'] !== 'ALL' || $filters['WEEK'] !== 'ALL';
        $operations = $operationRows->filter(fn ($row) => $this->matchesOperationFilters((object) $row, $filters));
        $revenue = (float) $operations->sum('revenue');
        $expense = $periodActive ? (float) $operations->sum('nominal') : (float) $vehicleCosts->sum('total');
        $profit = $revenue - $expense;
        $margin = $revenue > 0 ? ($profit / $revenue) * 100 : 0;
        $top = $summary->sortByDesc('amount')->first();
        $areaTotals = $operations->groupBy(fn ($row) => $row['area'] ?: 'TIDAK DIKETAHUI')
            ->map(fn ($rows, $area) => [
                'name' => $area,
                'revenue' => (float) $rows->sum('revenue'),
                'expense' => $periodActive ? (float) $rows->sum('nominal') : (float) $vehicleCosts->where('area', $area)->sum('total'),
            ])->map(function ($item) {
                $item['profit'] = $item['revenue'] - $item['expense'];
                $item['margin'] = $item['revenue'] > 0 ? ($item['profit'] / $item['revenue']) * 100 : 0;

                return $item;
            })->filter(fn ($item) => $item['revenue'] > 0)->values();
        $bestArea = $areaTotals->sortByDesc('profit')->first();
        $weakestArea = $areaTotals->sortBy('margin')->first();
        $notes = [];

        if ($top && $totalBiaya > 0) {
            $notes[] = sprintf('%s menjadi beban terbesar: Rp%s, sekitar %.1f%% dari total biaya.', $top['title'], number_format($top['amount'], 0, ',', '.'), ($top['amount'] / $totalBiaya) * 100);
        }
        if ($revenue > 0) {
            $notes[] = sprintf('Margin yang terbaca %.1f%%. Patokan kerja internal saat ini 15%%; angka di bawah itu perlu dicek bersama tarif, ritase, dan biaya lapangan.', $margin);
        }
        if ($bestArea) {
            $notes[] = sprintf('%s memberi sisa keuntungan area terbesar, Rp%s, dengan margin %.1f%%.', $bestArea['name'], number_format($bestArea['profit'], 0, ',', '.'), $bestArea['margin']);
        }
        if ($weakestArea && (!$bestArea || $weakestArea['name'] !== $bestArea['name'])) {
            $notes[] = sprintf('%s punya margin paling tipis, %.1f%%. Cek tarif dan biaya unit sebelum menambah pekerjaan.', $weakestArea['name'], $weakestArea['margin']);
        }
        if (!$notes) {
            $notes[] = 'Belum ada pendapatan atau biaya yang cocok dengan filter ini. Periksa periode dan sumber data yang dipilih.';
        }
        $notes[] = 'Mulai dari kategori biaya terbesar, lalu buka rincian kendaraan untuk memastikan biaya sejalan dengan aktivitas unitnya.';

        return [
            'top' => $top,
            'revenue' => $revenue,
            'expense' => $expense,
            'profit' => $profit,
            'margin' => $margin,
            'benchmarkMargin' => 15,
            'notes' => array_slice($notes, 0, 6),
        ];
    }

    private function operationRows()
    {
        $primaryRows = DB::table('operasional_primary_input')
            ->select('tanggal_muat as tanggal', 'area', 'nopol_driver as nopol', 'jenis as tipe', 'total_tarif as revenue', 'total_biaya as nominal')
            ->get()
            ->map(fn ($row) => $this->operationPayload($this->withDateGroups($row), 'primary'));

        $ovtLookup = $this->secondaryOvtLookup();
        $secondaryRows = DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL'])
            ->select(
                'tanggal', 'area', 'nopol', 'tipe_unit as tipe', 'driver', 'helper',
                'total_tarif', 'add_cost_long_route', 'tkbm', 'spsi', 'parkir_liar_keamanan',
                'penyebrangan_pas_masuk', 'rapid_antigen', 'allowance', 'total_subsidi_bbm',
                'subsidi_hotel', 'total_biaya_operasional as nominal'
            )
            ->get()
            ->map(function ($row) use ($ovtLookup) {
                $row->revenue = $this->secondaryRevenue($row, $ovtLookup);

                return $this->operationPayload($this->withDateGroups($row), 'secondary');
            });

        $rentalRows = DB::table('operasional_rental_unit_input')
            ->select('tanggal', 'area', 'nopol', 'tipe', 'tarif_sewa_unit_bln as revenue')
            ->get()
            ->map(function ($row) {
                $row->nominal = 0;

                return $this->operationPayload($this->withDateGroups($row), 'rental');
            });

        return $primaryRows->merge($secondaryRows)->merge($rentalRows);
    }

    private function operationPayload(object $row, string $source): array
    {
        return [
            'source' => $source,
            'year' => $row->groupYear,
            'month' => $row->groupMonth,
            'week' => $row->groupWeek,
            'area' => $row->area,
            'nopol' => $row->nopol,
            'tipe' => $row->tipe,
            'nominal' => (float) ($row->nominal ?? 0),
            'revenue' => (float) ($row->revenue ?? 0),
            'profit' => (float) ($row->revenue ?? 0) - (float) ($row->nominal ?? 0),
        ];
    }

    private function secondaryOvtLookup(): array
    {
        $lookup = [];
        DB::table('operasional_absen')->get(['nama', 'tanggal', 'approval_ovt'])->each(function ($row) use (&$lookup) {
            $dateKey = $this->dateKey($row->tanggal);
            if (! $dateKey || ! $row->nama) {
                return;
            }
            $key = $dateKey.'|'.mb_strtoupper(trim((string) $row->nama));
            $lookup[$key] ??= (float) ($row->approval_ovt ?: 0);
        });

        return $lookup;
    }

    private function secondaryRevenue(object $row, array $ovtLookup): float
    {
        $dateKey = $this->dateKey($row->tanggal);
        $approval = static fn ($name) => $dateKey && $name
            ? ($ovtLookup[$dateKey.'|'.mb_strtoupper(trim((string) $name))] ?? 0)
            : 0;

        return (float) $row->total_tarif
            + (float) $row->add_cost_long_route
            + (float) $row->tkbm
            + (float) $row->spsi
            + (float) $row->parkir_liar_keamanan
            + (float) $row->penyebrangan_pas_masuk
            + (float) $row->rapid_antigen
            + ((float) $row->allowance > 0 ? 125000 : 0)
            + (float) $row->total_subsidi_bbm
            + (float) $row->subsidi_hotel
            + max($approval($row->driver), $approval($row->helper)) * 32500;
    }

    private function dateKey(mixed $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        foreach (['m-d-Y', 'm/d/Y', 'd/m/Y', 'Y-m-d', 'Y-m-d H:i:s'] as $format) {
            $date = \DateTimeImmutable::createFromFormat('!'.$format, $value);
            if ($date !== false && $date->format($format) === $value) {
                return $date->format('Y-m-d');
            }
        }

        return null;
    }

    private function filterOptions(array $filters, $operationRows): array
    {
        $inventory = Inventori::select('nopol', 'area', 'tipe')
            ->whereNotNull('nopol')
            ->where('nopol', '!=', '')
            ->get();

        $operationRows = collect($operationRows);
        $years = $operationRows
            ->pluck('year')
            ->filter(fn ($year) => $year && $year !== '0')
            ->unique()
            ->sortDesc()
            ->values();
        $weeks = $operationRows
            ->filter(fn ($row) => ($filters['TAHUN'] === 'ALL' || (string) $row['year'] === $filters['TAHUN'])
                && ($filters['BULAN'] === 'ALL' || (string) $row['month'] === $filters['BULAN']))
            ->pluck('week')
            ->filter(fn ($week) => $week && $week !== '0')
            ->unique()
            ->sort()
            ->values();

        return [
            'TAHUN' => $this->optionList($years),
            'BULAN' => $this->optionList($this->monthOptions()),
            'WEEK' => $this->optionList($weeks),
            'AREA' => $this->optionList($inventory->pluck('area')),
            'TIPE' => $this->optionList($inventory->pluck('tipe')),
            'NOPOL' => $this->optionList($inventory->pluck('nopol')),
        ];
    }

    private function optionList($values): array
    {
        return collect($values)
            ->filter(fn ($value) => trim((string) $value) !== '')
            ->map(fn ($value) => (string) $value)
            ->unique()
            ->sort()
            ->prepend('ALL')
            ->values()
            ->all();
    }

    private function matchesOperationFilters(object $row, array $filters): bool
    {
        return ($filters['TAHUN'] === 'ALL' || (string) ($row->year ?? $row->groupYear ?? '') === $filters['TAHUN'])
            && ($filters['BULAN'] === 'ALL' || (string) ($row->month ?? $row->groupMonth ?? '') === $filters['BULAN'])
            && ($filters['WEEK'] === 'ALL' || (string) ($row->week ?? $row->groupWeek ?? '') === $filters['WEEK'])
            && ($filters['AREA'] === 'ALL' || (string) ($row->area ?? '') === $filters['AREA'])
            && ($filters['TIPE'] === 'ALL' || (string) ($row->tipe ?? '') === $filters['TIPE'])
            && ($filters['NOPOL'] === 'ALL' || (string) ($row->nopol ?? '') === $filters['NOPOL']);
    }

    private function unitHasCostInYear(string $nopol, string $year): bool
    {
        return $this->unitHasCostInPeriod($nopol, $year, 'ALL');
    }

    private function vehicleCostForFilters(object $unit, array $filters): array
    {
        return $this->vehicleCostFromRows(
            $unit,
            $filters,
            DB::table('maintenance_input_maintenance')->where('nopol', $unit->nopol)->get(['tanggal_services', 'total_biaya_service']),
            DB::table('maintenance_monitoring_ban')->where('nopol', $unit->nopol)->get(['tanggal_ganti_ban', 'total_harga']),
            DB::table('operasional_primary_input')->where('nopol_driver', $unit->nopol)->get(['tanggal_muat', 'total_biaya']),
            DB::table('operasional_secondary_input')->where('nopol', $unit->nopol)->get(['tanggal', 'total_biaya_operasional']),
        );
    }

    private function vehicleCostFromRows(object $unit, array $filters, $services, $ban, $primary, $secondary): array
    {
        $pajakTahunan = $this->dateMatchesFilters($unit->jatuh_tempo_pajak ?? null, $filters)
            ? (float) ($unit->biaya_pajak ?? 0)
            : 0;
        $pajakLimaTahun = $this->dateMatchesFilters($unit->jatuh_tempo_stnk ?? null, $filters)
            ? (float) ($unit->biaya_stnk ?? 0)
            : 0;
        $kir = $this->dateMatchesFilters($unit->jatuh_tempo_kir ?? null, $filters)
            ? (float) ($unit->biaya_kir ?? 0)
            : 0;

        $filteredServices = $services->filter(fn ($row) => $this->dateMatchesFilters($row->tanggal_services, $filters));
        $filteredBan = $ban->filter(fn ($row) => $this->dateMatchesFilters($row->tanggal_ganti_ban, $filters));
        $serviceUmum = (float) $filteredServices->sum('total_biaya_service');
        $serviceBan = (float) $filteredBan->sum('total_harga');
        $filteredPrimary = $primary->filter(fn ($row) => $this->dateMatchesFilters($row->tanggal_muat, $filters));
        $filteredSecondary = $secondary->filter(fn ($row) => $this->dateMatchesFilters($row->tanggal, $filters));
        $operasionalPrimary = (float) $filteredPrimary->sum('total_biaya');
        $operasionalSecondary = (float) $filteredSecondary->sum('total_biaya_operasional');
        $operasionalTotal = $operasionalPrimary + $operasionalSecondary;

        return [
            'total' => $pajakTahunan + $pajakLimaTahun + $kir + $serviceUmum + $serviceBan + $operasionalTotal,
            'pajakTahunanTotal' => $pajakTahunan,
            'pajakLimaTahunTotal' => $pajakLimaTahun,
            'kirTotal' => $kir,
            'legalitasTotal' => $pajakTahunan + $pajakLimaTahun + $kir,
            'serviceUmumTotal' => $serviceUmum,
            'serviceBanTotal' => $serviceBan,
            'maintenanceTotal' => $serviceUmum + $serviceBan,
            'operasionalPrimaryTotal' => $operasionalPrimary,
            'operasionalSecondaryTotal' => $operasionalSecondary,
            'operasionalTotal' => $operasionalTotal,
            'serviceCount' => $filteredServices->count(),
            'banCount' => $filteredBan->count(),
            'primaryCount' => $filteredPrimary->count(),
            'secondaryCount' => $filteredSecondary->count(),
        ];
    }

    private function dateMatchesFilters(?string $date, array $filters): bool
    {
        [$year, $month, $week] = $this->dateGroups($date);

        return ($filters['TAHUN'] === 'ALL' || $year === $filters['TAHUN'])
            && ($filters['BULAN'] === 'ALL' || $month === $filters['BULAN'])
            && ($filters['WEEK'] === 'ALL' || $week === $filters['WEEK']);
    }

    private function unitHasCostInPeriod(string $nopol, string $year, string $month): bool
    {
        $unit = Inventori::where('nopol', $nopol)->first();
        $legalDates = collect([
            $unit->jatuh_tempo_pajak ?? null,
            $unit->jatuh_tempo_stnk ?? null,
            $unit->jatuh_tempo_kir ?? null,
        ])->contains(function ($date) use ($year, $month) {
            [$dateYear, $dateMonth] = $this->dateGroups($date);

            return ($year === 'ALL' || $dateYear === $year)
                && ($month === 'ALL' || $dateMonth === $month);
        });

        if ($legalDates) {
            return true;
        }

        $serviceMatch = DB::table('maintenance_input_maintenance')
            ->where('nopol', $nopol)
            ->get(['tanggal_services'])
            ->contains(function ($row) use ($year, $month) {
                [$dateYear, $dateMonth] = $this->dateGroups($row->tanggal_services);

                return ($year === 'ALL' || $dateYear === $year)
                    && ($month === 'ALL' || $dateMonth === $month);
            });
        $banMatch = DB::table('maintenance_monitoring_ban')
            ->where('nopol', $nopol)
            ->get(['tanggal_ganti_ban'])
            ->contains(function ($row) use ($year, $month) {
                [$dateYear, $dateMonth] = $this->dateGroups($row->tanggal_ganti_ban);

                return ($year === 'ALL' || $dateYear === $year)
                    && ($month === 'ALL' || $dateMonth === $month);
            });

        $primaryMatch = DB::table('operasional_primary_input')
            ->where('nopol_driver', $nopol)
            ->get(['tanggal_muat'])
            ->contains(function ($row) use ($year, $month) {
                [$dateYear, $dateMonth] = $this->dateGroups($row->tanggal_muat);

                return ($year === 'ALL' || $dateYear === $year)
                    && ($month === 'ALL' || $dateMonth === $month);
            });
        $secondaryMatch = DB::table('operasional_secondary_input')
            ->where('nopol', $nopol)
            ->get(['tanggal'])
            ->contains(function ($row) use ($year, $month) {
                [$dateYear, $dateMonth] = $this->dateGroups($row->tanggal);

                return ($year === 'ALL' || $dateYear === $year)
                    && ($month === 'ALL' || $dateMonth === $month);
            });

        return $serviceMatch || $banMatch || $primaryMatch || $secondaryMatch;
    }
}
