<?php

namespace App\Http\Controllers\Biaya;

use App\Http\Controllers\Controller;
use App\Models\Inventori;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BiayaController extends Controller
{
    private array $categories = [
        'pajak-1-tahun' => ['title' => 'Pajak 1 tahun', 'source' => 'inventori', 'amount' => 'biaya_pajak', 'date' => 'jatuh_tempo_pajak'],
        'pajak-5-tahun' => ['title' => 'Pajak 5 tahun', 'source' => 'inventori', 'amount' => 'biaya_stnk', 'date' => 'jatuh_tempo_stnk'],
        'service-ban' => ['title' => 'Service Ban', 'source' => 'ban', 'amount' => 'total_harga', 'date' => 'tanggal_ganti_ban'],
        'service-umum' => ['title' => 'Service umum', 'source' => 'service', 'amount' => 'total_biaya_service', 'date' => 'tanggal_services'],
        'operasional-sec' => ['title' => 'Operasional Sec.', 'source' => 'secondary', 'amount' => 'total_biaya_operasional', 'date' => 'tanggal'],
        'operasional-prim' => ['title' => 'Operasional Prim.', 'source' => 'primary', 'amount' => 'total_biaya', 'date' => 'tanggal_muat'],
        'biaya-kir' => ['title' => 'Biaya KIR', 'source' => 'inventori', 'amount' => 'biaya_kir', 'date' => 'jatuh_tempo_kir'],
    ];

    public function index()
    {
        $summary = collect($this->categories)->map(function ($category, $slug) {
            return [
                'slug' => $slug,
                'title' => $category['title'],
                'amount' => $this->sumCategory($category),
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
            )->orderBy('area')->get(),
            'service' => DB::table('maintenance_input_maintenance')
                ->select('id_key', 'nopol', 'area', 'driver', 'tipe_service as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc($date)
                ->get(),
            'ban' => DB::table('maintenance_monitoring_ban')
                ->select('id_key', 'nopol', 'area', 'driver', 'jenis_pengerjaan as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc($date)
                ->get(),
            'primary' => DB::table('operasional_primary_input')
                ->select('id_key', 'nopol_driver as nopol', 'area', 'vendor as driver', 'rute_tujuan as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc('create_data')
                ->get(),
            'secondary' => DB::table('operasional_secondary_input')
                ->select('id_key', 'nopol', 'area', 'driver', 'order_type as keterangan', DB::raw("$date as tanggal"), DB::raw("$amount as nominal"))
                ->orderByDesc('crosscek_date')
                ->get(),
            default => collect(),
        };
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
