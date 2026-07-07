<?php

namespace App\Http\Controllers\Inventori;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use Inertia\Inertia;

class DaftarUnitController extends Controller
{
    private array $categories = [
        'tipe-unit' => ['title' => 'Tipe Unit', 'field' => 'tipe'],
        'pajak-stnk' => ['title' => 'Pajak STNK', 'field' => 'status_pajak'],
        'data-kir' => ['title' => 'Data KIR', 'field' => 'status_kir'],
        'my-pertamina' => ['title' => 'My Pertamina', 'field' => 'my_pertamina'],
        'gps-unit' => ['title' => 'GPS Unit', 'field' => 'gps'],
        'tahun-unit' => ['title' => 'Tahun Unit', 'field' => 'tahun'],
    ];

    public function index()
    {
        $inventori = Inventori::select(
            'id_key',
            'nopol',
            'area',
            'tipe',
            'pabrikan',
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

        return Inertia::render('Inventori/DaftarUnit/Index', [
            'summary' => [
                'totalUnit' => $inventori->count(),
                'tipeUnit' => $this->groupCounts($inventori, 'tipe'),
                'pajakStnk' => [
                    'pajak' => $this->groupCounts($inventori, 'status_pajak'),
                    'stnk' => $this->groupCounts($inventori, 'status_stnk'),
                ],
                'dataKir' => $this->groupCounts($inventori, 'status_kir'),
                'myPertamina' => $this->groupCounts($inventori, 'my_pertamina'),
                'gpsUnit' => $this->groupCounts($inventori, 'gps'),
                'tahunUnit' => $this->groupCounts($inventori, 'tahun'),
            ],
            'rawTableData' => $inventori,
        ]);
    }

    public function category(string $category)
    {
        abort_unless(isset($this->categories[$category]), 404);

        $dataInventori = Inventori::select(
            'id_key',
            'nopol',
            'area',
            'tipe',
            'pabrikan',
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
                ...$this->categories[$category],
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
