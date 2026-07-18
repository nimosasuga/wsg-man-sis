<?php

namespace App\Http\Controllers\Biaya;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use Illuminate\Support\Facades\DB;
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
        $vehicleCostRows = $this->vehicleCosts($this->emptyFilters())->values();
        $operationRows = $this->operationRows()->values();
        $summary = collect($this->categories)->map(function ($category, $slug) {
            return [
                'slug' => $slug,
                'title' => $category['title'],
                'amount' => $this->sumCategory($category),
                'actionLabel' => 'LIHAT RINCIAN BIAYA',
            ];
        })->values();

        return Inertia::render('Biaya/Index', [
            'summaryData' => $summary,
            'vehicleCosts' => $vehicleCostRows,
            'vehicleCostRows' => $vehicleCostRows,
            'operationFlow' => $this->operationFlow($filters, $operationRows),
            'operationRows' => $operationRows,
            'filters' => $filters,
            'filterOptions' => $this->filterOptions(),
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
                ->orderByRaw("STR_TO_DATE(NULLIF($date, ''), '%d/%m/%Y') asc")
                ->orderBy('area')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'service' => DB::table('maintenance_input_maintenance')
                ->select('id_key', 'nopol', 'area', 'driver', 'tipe_service as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc($date)
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'ban' => DB::table('maintenance_monitoring_ban')
                ->select('id_key', 'nopol', 'area', 'driver', 'jenis_pengerjaan as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc($date)
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'primary' => DB::table('operasional_primary_input')
                ->select('id_key', 'nopol_driver as nopol', 'area', 'vendor as driver', 'rute_tujuan as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc('create_data')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            'secondary' => DB::table('operasional_secondary_input')
                ->select('id_key', 'nopol', 'area', 'driver', 'order_type as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc('crosscek_date')
                ->get()
                ->map(fn ($row) => $this->withDateGroups($row)),
            default => collect(),
        };
    }

    private function withDateGroups(object $row): object
    {
        [$year, $month] = $this->dateGroups($row->tanggal ?? null);
        $row->groupYear = $year;
        $row->groupMonth = $month;
        $row->groupArea = $row->area ?: 'TIDAK DIKETAHUI';

        return $row;
    }

    private function dateGroups(?string $date): array
    {
        $date = trim((string) $date);

        if ($date === '' || $date === '0000-00-00') {
            return ['0', '0'];
        }

        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $date, $matches)) {
            return [$matches[3], $this->monthLabel((int) $matches[2])];
        }

        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $date, $matches)) {
            return [$matches[1], $this->monthLabel((int) $matches[2])];
        }

        if (preg_match('/(\d{4})/', $date, $matches)) {
            return [$matches[1], '0'];
        }

        return ['0', '0'];
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
                    'legalitasTotal' => $summary['legalitasTotal'],
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
        $rows = ($operationRows ?? $this->operationRows())
            ->filter(fn ($row) => $this->matchesOperationFilters((object) $row, $filters));

        $primaryRows = $rows->where('source', 'primary');
        $secondaryRows = $rows->where('source', 'secondary');

        $years = $primaryRows
            ->pluck('year')
            ->merge($secondaryRows->pluck('year'))
            ->filter(fn ($year) => $year && $year !== '0')
            ->unique()
            ->sort()
            ->values();

        return $years->map(function ($year) use ($primaryRows, $secondaryRows) {
            $primary = (float) $primaryRows->where('year', $year)->sum('nominal');
            $secondary = (float) $secondaryRows->where('year', $year)->sum('nominal');

            return [
                'year' => $year,
                'primary' => $primary,
                'secondary' => $secondary,
                'total' => $primary + $secondary,
            ];
        })->values()->all();
    }

    private function filters(): array
    {
        return [
            'TAHUN' => (string) request()->query('TAHUN', 'ALL'),
            'BULAN' => (string) request()->query('BULAN', 'ALL'),
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
            'AREA' => 'ALL',
            'TIPE' => 'ALL',
            'NOPOL' => 'ALL',
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
            $date = \DateTimeImmutable::createFromFormat('m/d/Y', trim((string) $row->tanggal));
            if (! $date || ! $row->nama) {
                return;
            }
            $key = $date->format('Y-m-d').'|'.mb_strtoupper(trim((string) $row->nama));
            $lookup[$key] ??= (float) ($row->approval_ovt ?: 0);
        });

        return $lookup;
    }

    private function secondaryRevenue(object $row, array $ovtLookup): float
    {
        $date = \DateTimeImmutable::createFromFormat('m-d-Y', trim((string) $row->tanggal));
        $dateKey = $date?->format('Y-m-d');
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

    private function filterOptions(): array
    {
        $inventory = Inventori::select('nopol', 'area', 'tipe')
            ->whereNotNull('nopol')
            ->where('nopol', '!=', '')
            ->get();

        $years = DB::table('operasional_primary_input')
            ->select('tanggal_muat as tanggal')
            ->whereNotNull('tanggal_muat')
            ->get()
            ->merge(DB::table('operasional_secondary_input')->select('tanggal')->whereNotNull('tanggal')->get())
            ->map(fn ($row) => $this->dateGroups($row->tanggal ?? null)[0])
            ->filter(fn ($year) => $year && $year !== '0')
            ->unique()
            ->sortDesc()
            ->values();

        return [
            'TAHUN' => $this->optionList($years),
            'BULAN' => $this->optionList([
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
            ]),
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
            'legalitasTotal' => $pajakTahunan + $pajakLimaTahun + $kir,
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
        [$year, $month] = $this->dateGroups($date);

        return ($filters['TAHUN'] === 'ALL' || $year === $filters['TAHUN'])
            && ($filters['BULAN'] === 'ALL' || $month === $filters['BULAN']);
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
