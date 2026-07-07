<?php

namespace App\Http\Controllers\ProfitUnit;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class ProfitUnitController extends Controller
{
    public function index()
    {
        $primaryRevenue = (float) DB::table('operasional_primary_input')->sum('total_tarif');
        $primaryCost = (float) DB::table('operasional_primary_input')->sum('total_biaya');

        $secondaryRevenue = (float) DB::table('operasional_secondary_input')->sum('total_tarif');
        $secondaryCost = (float) DB::table('operasional_secondary_input')->sum('total_biaya_operasional');

        $rentalRevenue = (float) DB::table('operasional_rental_unit_input')->sum('tarif_sewa_unit_bln');

        $lclQuery = DB::table('operasional_secondary_input')
            ->where('order_type', 'like', '%LCL%');
        $lclRevenue = (float) (clone $lclQuery)->sum('total_tarif');
        $lclCost = (float) (clone $lclQuery)->sum('total_biaya_operasional');

        return Inertia::render('ProfitUnit/Index', [
            'summaryData' => [
                [
                    'slug' => 'primary',
                    'title' => 'Profit Primary',
                    'revenue' => $primaryRevenue,
                    'cost' => $primaryCost,
                    'profit' => $primaryRevenue - $primaryCost,
                    'count' => DB::table('operasional_primary_input')->count(),
                ],
                [
                    'slug' => 'secondary',
                    'title' => 'Profit Secondary',
                    'revenue' => $secondaryRevenue,
                    'cost' => $secondaryCost,
                    'profit' => $secondaryRevenue - $secondaryCost,
                    'count' => DB::table('operasional_secondary_input')->count(),
                ],
                [
                    'slug' => 'rental',
                    'title' => 'Profit Rental',
                    'revenue' => $rentalRevenue,
                    'cost' => 0,
                    'profit' => $rentalRevenue,
                    'count' => DB::table('operasional_rental_unit_input')->count(),
                ],
                [
                    'slug' => 'lcl',
                    'title' => 'Profit LCL',
                    'revenue' => $lclRevenue,
                    'cost' => $lclCost,
                    'profit' => $lclRevenue - $lclCost,
                    'count' => (clone $lclQuery)->count(),
                ],
            ],
        ]);
    }

    public function secondary()
    {
        $tipeUnit = request()->query('tipe_unit', 'ALL');
        $area = request()->query('area', 'ALL');
        $hari = request()->query('hari', '');
        $week = request()->query('week', 'ALL');
        $bulan = request()->query('bulan', 'ALL');
        $tahun = request()->query('tahun', 'ALL');
        $kategori = request()->query('kategori', 'ALL');

        $query = DB::table('operasional_secondary_input');

        if ($tipeUnit !== 'ALL') {
            $query->where('tipe_unit', $tipeUnit);
        }
        if ($area !== 'ALL') {
            $query->where('area', $area);
        }
        if ($hari) {
            $query->where('tanggal', $hari);
        }
        if ($week !== 'ALL') {
            $query->where('week', $week);
        }
        if ($bulan !== 'ALL') {
            $query->where('bulan', $bulan);
        }
        if ($tahun !== 'ALL') {
            $query->whereYear('tanggal', $tahun);
        }
        if ($kategori !== 'ALL') {
            $query->where('order_type', $kategori);
        }

        $revenue = (float) (clone $query)->sum('total_tarif');
        $cost = (float) (clone $query)->sum('total_biaya_operasional');
        $profitTotal = $revenue - $cost;
        $count = (clone $query)->count();

        $rataProfit = $count > 0 ? $profitTotal / $count : 0;
        $rataTarif = $count > 0 ? $revenue / $count : 0;
        $rataBiaya = $count > 0 ? $cost / $count : 0;

        $byArea = (clone $query)
            ->select('area', DB::raw('SUM(total_tarif - total_biaya_operasional) as profit'))
            ->groupBy('area')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->area ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
            ]);

        $byType = (clone $query)
            ->select('tipe_unit', DB::raw('COUNT(*) as total'))
            ->groupBy('tipe_unit')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->tipe_unit ?: 'TIDAK DIKETAHUI',
                'value' => (int) $row->total,
            ]);

        return Inertia::render('ProfitUnit/Secondary', [
            'filters' => [
                'TIPE UNIT' => $tipeUnit,
                'AREA' => $area,
                'HARI' => $hari,
                'WEEK' => $week,
                'BULAN' => $bulan,
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
            'sumProfit' => $profitTotal,
            'rataProfit' => $rataProfit,
            'rataTarif' => $rataTarif,
            'rataBiaya' => $rataBiaya,
            'kunjungan' => $count,
        ]);
    }

    public function rental()
    {
        $area = request()->query('area', 'ALL');
        $hari = request()->query('hari', '');
        $tahun = request()->query('tahun', 'ALL');

        $query = DB::table('operasional_rental_unit_input');

        if ($area !== 'ALL') {
            $query->where('area', $area);
        }
        if ($hari) {
            $query->where('tanggal', $hari);
        }
        if ($tahun !== 'ALL') {
            $query->whereYear('tanggal', $tahun);
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
            ->select('tipe', DB::raw('COUNT(*) as total'))
            ->groupBy('tipe')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->tipe ?: 'TIDAK DIKETAHUI',
                'value' => (int) $row->total,
            ]);

        return Inertia::render('ProfitUnit/Rental', [
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
            'sumProfit' => $profitTotal,
            'rataProfit' => $rataProfit,
            'rataTarif' => $rataTarif,
            'rataBiaya' => 0,
            'kunjungan' => $count,
        ]);
    }

    public function lcl()
    {
        $sales = request()->query('sales', 'ALL');
        $hari = request()->query('hari', '');
        $week = request()->query('week', 'ALL');
        $bulan = request()->query('bulan', 'ALL');
        $tahun = request()->query('tahun', 'ALL');

        $query = DB::table('operasional_secondary_input');

        if ($hari) {
            $query->where('tanggal', $hari);
        }
        if ($week !== 'ALL') {
            $query->where('week', $week);
        }
        if ($bulan !== 'ALL') {
            $query->where('bulan', $bulan);
        }
        if ($tahun !== 'ALL') {
            $query->whereYear('tanggal', $tahun);
        }

        $revenue = (float) (clone $query)->sum('total_tarif');
        $cost = (float) (clone $query)->sum('total_biaya_operasional');
        $profitTotal = $revenue - $cost;
        $count = (clone $query)->count();

        $byArea = (clone $query)
            ->select('area', DB::raw('SUM(total_tarif - total_biaya_operasional) as profit'))
            ->groupBy('area')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->area ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
            ]);

        $byKapal = (clone $query)
            ->select('nopol', DB::raw('SUM(total_tarif) as ongkir'))
            ->whereNotNull('nopol')
            ->where('nopol', '!=', '')
            ->groupBy('nopol')
            ->orderByDesc('ongkir')
            ->limit(20)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->nopol,
                'ongkir' => (float) $row->ongkir,
            ]);

        $byBulan = (clone $query)
            ->select('bulan', DB::raw('SUM(total_tarif) as total'))
            ->whereNotNull('bulan')
            ->where('bulan', '!=', '')
            ->groupBy('bulan')
            ->orderBy('bulan')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->bulan,
                'total' => (float) $row->total,
            ]);

        $paymentStatus = [
            'lunas' => (float) (clone $query)->where('status', '!=', '')->sum('total_tarif'),
            'belum_lunas' => (float) (clone $query)->where('status', '')->sum('total_tarif'),
        ];

        $deliveryStatus = [
            'dlv' => [
                'count' => (int) (clone $query)->where('status_dokument', 'DITERIMA')->count(),
                'nominal' => (float) (clone $query)->where('status_dokument', 'DITERIMA')->sum('total_tarif'),
            ],
            'sent' => [
                'count' => (int) (clone $query)->where('status_dokument', '')->count(),
                'nominal' => (float) (clone $query)->where('status_dokument', '')->sum('total_tarif'),
            ],
        ];

        return Inertia::render('ProfitUnit/Lcl', [
            'filters' => [
                'SALES' => $sales,
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
            'byKapal' => $byKapal,
            'byBulan' => $byBulan,
            'paymentStatus' => $paymentStatus,
            'deliveryStatus' => $deliveryStatus,
        ]);
    }

    public function primary()
    {
        $tipeUnit = request()->query('tipe_unit', 'ALL');
        $area = request()->query('area', 'ALL');
        $hari = request()->query('hari', '');
        $week = request()->query('week', 'ALL');
        $bulan = request()->query('bulan', 'ALL');
        $tahun = request()->query('tahun', 'ALL');
        $kategori = request()->query('kategori', 'ALL');

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
        if ($bulan !== 'ALL') {
            $query->where('bulan', $bulan);
        }
        if ($tahun !== 'ALL') {
            $query->whereYear('tanggal_muat', $tahun)
                ->orWhereYear('tanggal_terima', $tahun);
        }
        if ($kategori !== 'ALL') {
            $query->where('order_type', $kategori);
        }

        $revenue = (float) (clone $query)->sum('total_tarif');
        $cost = (float) (clone $query)->sum('total_biaya');
        $profitTotal = $revenue - $cost;
        $count = (clone $query)->count();

        $avgProfit = (float) (clone $query)->avg('profit');
        $avgTarif = (float) (clone $query)->avg('total_tarif');
        $avgBiaya = (float) (clone $query)->avg('total_biaya');

        $byArea = (clone $query)
            ->select('area', DB::raw('SUM(profit) as profit'))
            ->groupBy('area')
            ->orderByDesc('profit')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->area ?: 'TIDAK DIKETAHUI',
                'profit' => (float) $row->profit,
            ]);

        $byType = (clone $query)
            ->select('jenis', DB::raw('COUNT(*) as total'))
            ->groupBy('jenis')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->jenis ?: 'TIDAK DIKETAHUI',
                'value' => (int) $row->total,
            ]);

        return Inertia::render('ProfitUnit/Primary', [
            'filters' => [
                'TIPE UNIT' => $tipeUnit,
                'AREA' => $area,
                'HARI' => $hari,
                'WEEK' => $week,
                'BULAN' => $bulan,
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
            'sumProfit' => $profitTotal,
            'rataProfit' => $avgProfit,
            'rataTarif' => $avgTarif,
            'rataBiaya' => $avgBiaya,
            'kunjungan' => $count,
        ]);
    }
}
