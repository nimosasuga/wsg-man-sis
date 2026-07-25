<?php

namespace App\Http\Controllers\Inventori;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use Inertia\Inertia;

class DaftarUnitController extends Controller
{
    private array $categories = [
        'washeng' => ['title' => 'Washeng', 'inventaris' => 'WASHENG KEKE MANDIRI', 'field' => 'tipe'],
        'rental' => ['title' => 'Inventaris Rental', 'inventaris' => 'RENTAL', 'field' => 'tipe'],
    ];

    public function index()
    {
        $inventori = Inventori::select(
            'id_key',
            'nopol',
            'area',
            'tipe',
            'pabrikan',
            'inventaris',
            'model',
            'jatuh_tempo_stnk',
            'jatuh_tempo_pajak',
            'jatuh_tempo_kir',
            'status_stnk',
            'status_pajak',
            'status_kir',
            'my_pertamina',
            'gps',
            'tahun'
        )->get();

        $inventarisGroups = $this->groupCounts($inventori, 'inventaris');

        return Inertia::render('Inventori/DaftarUnit/Index', [
            'summary' => [
                'totalUnit' => $inventori->count(),
                'inventaris' => $inventarisGroups,
            ],
        ]);
    }

    public function category(string $category)
    {
        abort_unless(isset($this->categories[$category]), 404);

        $config = $this->categories[$category];

        $dataInventori = Inventori::where('inventaris', $config['inventaris'])
            ->select(
                'id_key',
                'nopol',
                'area',
                'tipe',
                'pabrikan',
                'inventaris',
                'model',
                'jatuh_tempo_stnk',
                'jatuh_tempo_pajak',
                'jatuh_tempo_kir',
                'status_stnk',
                'status_pajak',
                'status_kir',
                'my_pertamina',
                'gps',
                'tahun'
            )->get();

        return Inertia::render('Inventori/DaftarUnit/Category', [
            'rawTableData' => $dataInventori,
            'category' => [
                'slug' => $category,
                ...$config,
            ],
        ]);
    }

    private function groupCounts($collection, string $key): array
    {
        return $collection
            ->countBy(fn ($item) => filled($item->{$key}) ? strtoupper((string) $item->{$key}) : 'TIDAK DIKETAHUI')
            ->sortDesc()
            ->map(fn ($count, $label) => [
                'label' => $label,
                'value' => (int) $count,
            ])
            ->values()
            ->all();
    }
}
