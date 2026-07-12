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
}
