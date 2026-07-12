<?php

namespace App\Http\Controllers\Operations;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OnTheRoadController extends Controller
{
    private array $groups = [
        'primary' => ['label' => 'PRIMARY', 'projects' => ['PRIMARY']],
        'secondary' => ['label' => 'SECONDARY', 'projects' => ['ON DEMAND - FULL SERVICE', 'RENTAL']],
        'lcl' => ['label' => 'LCL', 'projects' => ['LCL', 'REGULER', 'DOORING']],
        'rental' => ['label' => 'RENTAL', 'projects' => ['ON DEMAND - UNIT ONLY']],
    ];

    public function index()
    {
        $date = $this->activeDate();
        $rows = $this->rowsForDate($date);
        $runningNopols = $rows->pluck('nopol')->filter()->unique();
        $standbyCount = DB::table('hr_manager_db_inventori')
            ->whereNotIn('nopol', $runningNopols)
            ->count();

        $cards = collect($this->groups)->map(function ($config, $slug) use ($rows, $date) {
            $items = $rows->whereIn('project', $config['projects'])->values();

            return [
                'slug' => $slug,
                'label' => $config['label'],
                'count' => $items->count(),
                'tarif' => (float) $items->sum('tagihan'),
                'biaya' => (float) $items->sum('total_biaya_operasional'),
                'profit' => (float) $items->sum('profit_trip'),
                'href' => route('on-the-road.table', ['category' => $slug, 'tanggal' => $date]),
            ];
        })->values();

        return Inertia::render('Operations/OnTheRoad/Index', [
            'date' => $date,
            'dateOptions' => $this->dateOptions(),
            'summary' => [
                'totalUnit' => DB::table('hr_manager_db_inventori')->count(),
                'runningCount' => $rows->count(),
                'standbyCount' => $standbyCount,
                'totalTarif' => (float) $rows->sum('tagihan'),
                'totalBiaya' => (float) $rows->sum('total_biaya_operasional'),
                'totalProfit' => (float) $rows->sum('profit_trip'),
            ],
            'cards' => $cards,
            'standbyHref' => route('on-the-road.table', ['category' => 'standby', 'tanggal' => $date]),
            'typeBreakdown' => $this->breakdown($rows, 'tipe_unit', 'type', $date),
            'areaBreakdown' => $this->breakdown($rows, 'area', 'area', $date),
            'sampleRows' => $rows->take(12)->values(),
        ]);
    }

    public function table(string $category)
    {
        abort_unless($category === 'standby' || isset($this->groups[$category]), 404);

        $date = $this->activeDate();
        $rows = $category === 'standby'
            ? $this->standbyRows($date)
            : $this->rowsForDate($date)->whereIn('project', $this->groups[$category]['projects'])->values();

        $rows = $this->withDetailHrefs($rows);

        return Inertia::render('Operations/OnTheRoad/Table', [
            'category' => $category,
            'title' => $category === 'standby' ? 'UNIT STANDBY' : $this->groups[$category]['label'],
            'date' => $date,
            'dateOptions' => $this->dateOptions(),
            'tablePath' => route('on-the-road.table', ['category' => $category]),
            'backHref' => route('on-the-road.index', ['tanggal' => $date]),
            'rows' => $rows->take(1500)->values(),
            'summary' => [
                'count' => $rows->count(),
                'tarif' => (float) $rows->sum('tagihan'),
                'biaya' => (float) $rows->sum('total_biaya_operasional'),
                'profit' => (float) $rows->sum('profit_trip'),
            ],
        ]);
    }

    public function breakdownTable(string $field, string $value)
    {
        abort_unless(in_array($field, ['type', 'area'], true), 404);

        $date = $this->activeDate();
        $column = $field === 'type' ? 'tipe_unit' : 'area';
        $title = ($field === 'type' ? 'JENIS UNIT: ' : 'AREA UNIT: ').strtoupper(urldecode($value));
        $rows = $this->rowsForDate($date)
            ->filter(fn ($row) => strtoupper((string) ($row->{$column} ?: 'TIDAK DIKETAHUI')) === strtoupper(urldecode($value)))
            ->values();
        $rows = $this->withDetailHrefs($rows);

        return Inertia::render('Operations/OnTheRoad/Table', [
            'category' => 'breakdown',
            'title' => $title,
            'date' => $date,
            'dateOptions' => $this->dateOptions(),
            'tablePath' => route('on-the-road.breakdown', ['field' => $field, 'value' => $value]),
            'backHref' => route('on-the-road.index', ['tanggal' => $date]),
            'rows' => $rows->take(1500)->values(),
            'summary' => [
                'count' => $rows->count(),
                'tarif' => (float) $rows->sum('tagihan'),
                'biaya' => (float) $rows->sum('total_biaya_operasional'),
                'profit' => (float) $rows->sum('profit_trip'),
            ],
        ]);
    }

    public function detail(string $category, string $id)
    {
        abort_unless($category === 'standby' || isset($this->groups[$category]), 404);

        if ($category === 'standby') {
            $row = DB::table('hr_manager_db_inventori')->where('id_key', $id)->first();
            abort_if(! $row, 404);

            return Inertia::render('Operations/OnTheRoad/Detail', [
                'category' => $category,
                'record' => $row,
                'isStandby' => true,
                'backUrl' => url()->previous() ?: route('on-the-road.table', ['category' => 'standby']),
            ]);
        }

        $row = DB::table('operasional_secondary_input')->where('id_key', $id)->first();
        abort_if(! $row, 404);
        $row->tagihan = $this->tagihan($row);
        $row->profit_trip = $this->profitTrip($row);

        return Inertia::render('Operations/OnTheRoad/Detail', [
            'category' => $category,
            'record' => $row,
            'isStandby' => false,
            'backUrl' => url()->previous() ?: route('on-the-road.table', ['category' => $category]),
        ]);
    }

    private function rowsForDate(string $date): Collection
    {
        return DB::table('operasional_secondary_input')
            ->get()
            ->map(function ($row) {
                $row->tanggal_normalized = $this->normalizeDate($row->tanggal);
                $row->tagihan = $this->tagihan($row);
                $row->profit_trip = $this->profitTrip($row);

                return $row;
            })
            ->filter(fn ($row) => $row->tanggal_normalized === $date)
            ->filter(fn ($row) => trim((string) $row->status) === '' || strtoupper((string) $row->status) === 'JALAN')
            ->values();
    }

    private function standbyRows(string $date): Collection
    {
        $runningNopols = $this->rowsForDate($date)->pluck('nopol')->filter()->unique()->values();

        return DB::table('hr_manager_db_inventori')
            ->whereNotIn('nopol', $runningNopols)
            ->get()
            ->map(function ($row) {
                $row->tipe_unit = $row->tipe;
                $row->tagihan = 0;
                $row->total_biaya_operasional = 0;
                $row->profit_trip = 0;
                $row->tanggal_normalized = null;

                return $row;
            })
            ->values();
    }

    private function activeDate(): string
    {
        $requested = request()->query('tanggal');
        if ($requested) {
            return $this->normalizeDate((string) $requested) ?: (string) $requested;
        }

        return $this->dateOptions()[0] ?? now()->toDateString();
    }

    private function dateOptions(): array
    {
        return DB::table('operasional_secondary_input')
            ->select('tanggal')
            ->whereNotNull('tanggal')
            ->where('tanggal', '!=', '')
            ->get()
            ->map(fn ($row) => $this->normalizeDate($row->tanggal))
            ->filter()
            ->unique()
            ->sortDesc()
            ->take(90)
            ->values()
            ->all();
    }

    private function normalizeDate(?string $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        foreach (['Y-m-d H:i:s', 'Y-m-d', 'm-d-Y', 'd/m/Y', 'm/d/Y'] as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);
                if ($date !== false) {
                    return $date->toDateString();
                }
            } catch (\Throwable) {
                // Try the next known AppSheet/local date format.
            }
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function tagihan(object $row): float
    {
        return $this->num($row->total_tarif ?? 0)
            + $this->num($row->add_cost_long_route ?? 0)
            + $this->num($row->tkbm ?? 0)
            + $this->num($row->spsi ?? 0)
            + $this->num($row->parkir_liar_keamanan ?? 0)
            + $this->num($row->penyebrangan_pas_masuk ?? 0)
            + $this->num($row->rapid_antigen ?? 0)
            + ($this->num($row->allowance ?? 0) > 0 ? 125000 : 0)
            + $this->num($row->total_subsidi_bbm ?? 0)
            + $this->num($row->subsidi_hotel ?? 0);
    }

    private function profitTrip(object $row): float
    {
        return $this->tagihan($row) - $this->num($row->total_biaya_operasional ?? 0);
    }

    private function num(mixed $value): float
    {
        return (float) ($value ?: 0);
    }

    private function breakdown(Collection $rows, string $field, string $routeField, string $date): array
    {
        return $rows
            ->groupBy(fn ($row) => (string) ($row->{$field} ?: 'TIDAK DIKETAHUI'))
            ->map(fn ($items, $name) => [
                'name' => $name,
                'value' => $items->count(),
                'href' => route('on-the-road.breakdown', [
                    'field' => $routeField,
                    'value' => $name,
                    'tanggal' => $date,
                ]),
            ])
            ->sortByDesc('value')
            ->values()
            ->take(8)
            ->all();
    }

    private function withDetailHrefs(Collection $rows): Collection
    {
        return $rows->map(function ($row) {
            if (! isset($row->detail_href)) {
                $category = $this->categoryForProject((string) ($row->project ?? ''));
                if ($category && isset($row->id_key)) {
                    $row->detail_href = route('on-the-road.detail', ['category' => $category, 'id' => $row->id_key]);
                }
            }

            return $row;
        });
    }

    private function categoryForProject(string $project): ?string
    {
        foreach ($this->groups as $slug => $group) {
            if (in_array($project, $group['projects'], true)) {
                return $slug;
            }
        }

        return null;
    }
}
