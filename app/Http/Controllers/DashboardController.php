<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Inventori;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $dbChartData = Cache::remember('dashboard.db_chart_data', now()->addMinutes(5), function () {
        // 1. Tarik hanya kolom yang dibutuhkan untuk efisiensi memori
        $inventori = Inventori::select('status_pajak', 'status_stnk', 'status_kir')->get();

        // 2. Kalkulasi Data Pajak
        $pajakCounts = $inventori->countBy('status_pajak');
        $chartDataPajak = [];
        $totalPajak = 0;
        foreach ($pajakCounts as $status => $count) {
            $name = empty($status) ? 'TIDAK DIKETAHUI' : strtoupper($status);
            $chartDataPajak[] = ['name' => $name, 'value' => $count];
            $totalPajak += $count;
        }

        // 3. Kalkulasi Data STNK
        $stnkCounts = $inventori->countBy('status_stnk');
        $chartDataStnk = [];
        $totalStnk = 0;
        foreach ($stnkCounts as $status => $count) {
            $name = empty($status) ? 'TIDAK DIKETAHUI' : strtoupper($status);
            $chartDataStnk[] = ['name' => $name, 'value' => $count];
            $totalStnk += $count;
        }

        // 4. Kalkulasi Data KIR
        $kirCounts = $inventori->countBy('status_kir');
        $chartDataKir = [];
        $totalKir = 0;
        foreach ($kirCounts as $status => $count) {
            $name = empty($status) ? 'TIDAK DIKETAHUI' : strtoupper($status);
            $chartDataKir[] = ['name' => $name, 'value' => $count];
            $totalKir += $count;
        }

        // 5. Kalkulasi Dokumen Invoice
        $invoiceCounts = DB::table('finance_accounting_tax_input_fat')
            ->select('status_dokumen_asli', DB::raw('COUNT(*) as total'))
            ->groupBy('status_dokumen_asli')
            ->get();
        $chartDataInvoice = [];
        $totalInvoice = 0;
        foreach ($invoiceCounts as $row) {
            $name = empty($row->status_dokumen_asli) ? 'TIDAK DIKETAHUI' : strtoupper($row->status_dokumen_asli);
            $chartDataInvoice[] = ['name' => $name, 'value' => (int) $row->total];
            $totalInvoice += (int) $row->total;
        }

        $activityPrimary = DB::table('operasional_primary_input')
            ->selectRaw("
                CASE
                    WHEN tanggal_muat IS NULL OR tanggal_muat = '' THEN 'TIDAK DIKETAHUI'
                    ELSE DATE_FORMAT(STR_TO_DATE(tanggal_muat, '%d/%m/%Y'), '%M')
                END as name,
                COUNT(*) as value
            ")
            ->groupBy('name')
            ->orderByRaw("MIN(STR_TO_DATE(tanggal_muat, '%d/%m/%Y'))")
            ->get()
            ->map(fn ($row) => [
                'name' => $this->monthNameId($row->name),
                'value' => (int) $row->value,
            ])
            ->values();
        $totalActivityPrimary = $activityPrimary->sum('value');

        $activitySecondary = DB::table('operasional_secondary_input')
            ->selectRaw("COALESCE(NULLIF(bulan, ''), 'TIDAK DIKETAHUI') as name, COUNT(*) as value")
            ->groupBy('name')
            ->orderBy('name')
            ->get()
            ->map(fn ($row) => [
                'name' => $this->cleanMonthLabel($row->name),
                'value' => (int) $row->value,
            ])
            ->values();
        $totalActivitySecondary = $activitySecondary->sum('value');

        $fatDocPrimary = $this->fatDocByDivision('Primary - Operasional');
        $fatDocSecondary = $this->fatDocByDivision('Secondary - Operasional');
        $globalProfit = $this->globalProfitKpis();

            return [
                'pajak' => $chartDataPajak,
                'stnk' => $chartDataStnk,
                'kir' => $chartDataKir,
                'invoice' => $chartDataInvoice,
                'activityPrimary' => $activityPrimary,
                'activitySecondary' => $activitySecondary,
                'fatDocPrimary' => $fatDocPrimary['data'],
                'fatDocSecondary' => $fatDocSecondary['data'],
                'totalPajak' => $totalPajak,
                'totalStnk' => $totalStnk,
                'totalKir' => $totalKir,
                'totalInvoice' => $totalInvoice,
                'totalActivityPrimary' => $totalActivityPrimary,
                'totalActivitySecondary' => $totalActivitySecondary,
                'totalFatDocPrimary' => $fatDocPrimary['total'],
                'totalFatDocSecondary' => $fatDocSecondary['total'],
                'globalProfit' => $globalProfit['summary'],
                'profitByArea' => $globalProfit['areas'],
            ];
        });

        // 6. Lempar data matang ke Frontend
        return Inertia::render('Dashboard', [
            'dbChartData' => $dbChartData,
        ]);
    }

    private function globalProfitKpis(): array
    {
        $areas = [];
        $add = static function (?string $area, float $revenue, float $cost) use (&$areas): void {
            $name = mb_strtoupper(trim((string) $area)) ?: 'TIDAK DIKETAHUI';
            $areas[$name] ??= ['area' => $name, 'revenue' => 0.0, 'cost' => 0.0, 'profit' => 0.0, 'records' => 0];
            $areas[$name]['revenue'] += $revenue;
            $areas[$name]['cost'] += $cost;
            $areas[$name]['profit'] += $revenue - $cost;
            $areas[$name]['records']++;
        };

        DB::table('operasional_primary_input')
            ->get(['area', 'total_tarif', 'total_biaya'])
            ->each(fn ($row) => $add($row->area, (float) $row->total_tarif, (float) $row->total_biaya));

        $ovtLookup = [];
        DB::table('operasional_absen')->get(['nama', 'tanggal', 'approval_ovt'])->each(function ($row) use (&$ovtLookup) {
            $date = \DateTimeImmutable::createFromFormat('m/d/Y', trim((string) $row->tanggal));
            if (! $date || ! $row->nama) {
                return;
            }
            $key = $date->format('Y-m-d').'|'.mb_strtoupper(trim((string) $row->nama));
            $ovtLookup[$key] ??= (float) ($row->approval_ovt ?: 0);
        });

        DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL'])
            ->get([
                'area', 'tanggal', 'driver', 'helper', 'tarif_unit', 'total_tarif',
                'add_cost_long_route', 'tkbm', 'spsi', 'parkir_liar_keamanan',
                'penyebrangan_pas_masuk', 'rapid_antigen', 'allowance',
                'total_subsidi_bbm', 'subsidi_hotel', 'total_biaya_operasional',
            ])
            ->each(function ($row) use ($add, $ovtLookup) {
                $date = \DateTimeImmutable::createFromFormat('m-d-Y', trim((string) $row->tanggal));
                $dateKey = $date?->format('Y-m-d');
                $approval = static fn ($name) => $dateKey && $name
                    ? ($ovtLookup[$dateKey.'|'.mb_strtoupper(trim((string) $name))] ?? 0)
                    : 0;
                $nilaiOvt = max($approval($row->driver), $approval($row->helper)) * 32500;
                $revenue = (float) $row->total_tarif
                    + (float) $row->add_cost_long_route
                    + (float) $row->tkbm
                    + (float) $row->spsi
                    + (float) $row->parkir_liar_keamanan
                    + (float) $row->penyebrangan_pas_masuk
                    + (float) $row->rapid_antigen
                    + ((float) $row->allowance > 0 ? 125000 : 0)
                    + (float) $row->total_subsidi_bbm
                    + (float) $row->subsidi_hotel
                    + $nilaiOvt;
                $add($row->area, $revenue, (float) $row->total_biaya_operasional);
            });

        DB::table('operasional_rental_unit_input')
            ->get(['area', 'tarif_sewa_unit_bln'])
            ->each(fn ($row) => $add($row->area, (float) $row->tarif_sewa_unit_bln, 0));

        DB::table('db_chargo_data_paket_masuk')
            ->get(['kota_tujuan', 'total_ongkir'])
            ->each(fn ($row) => $add($row->kota_tujuan, (float) $row->total_ongkir, 0));

        $ranked = collect(array_values($areas))->sortByDesc('profit')->values();
        $revenue = (float) $ranked->sum('revenue');
        $cost = (float) $ranked->sum('cost');
        $profit = $revenue - $cost;

        return [
            'summary' => [
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $profit,
                'margin' => $revenue > 0 ? $profit / $revenue * 100 : 0,
                'topArea' => $ranked->first()['area'] ?? '-',
                'topAreaProfit' => (float) ($ranked->first()['profit'] ?? 0),
                'areaCount' => $ranked->count(),
            ],
            'areas' => $ranked->take(10)->all(),
        ];
    }

    private function fatDocByDivision(string $division): array
    {
        $data = DB::table('finance_accounting_tax_input_fat')
            ->selectRaw("COALESCE(NULLIF(status_dokumen_asli, ''), 'TIDAK DIKETAHUI') as name, COUNT(*) as value")
            ->where('divisi', $division)
            ->groupBy('name')
            ->orderByDesc('value')
            ->get()
            ->map(fn ($row) => [
                'name' => strtoupper($row->name),
                'value' => (int) $row->value,
            ])
            ->values();

        return [
            'data' => $data,
            'total' => $data->sum('value'),
        ];
    }

    private function cleanMonthLabel(?string $label): string
    {
        if (! $label) {
            return 'TIDAK DIKETAHUI';
        }

        return trim(preg_replace('/^[A-Z]\./', '', $label));
    }

    private function monthNameId(?string $month): string
    {
        return [
            'January' => 'Januari',
            'February' => 'Februari',
            'March' => 'Maret',
            'April' => 'April',
            'May' => 'Mei',
            'June' => 'Juni',
            'July' => 'Juli',
            'August' => 'Agustus',
            'September' => 'September',
            'October' => 'Oktober',
            'November' => 'November',
            'December' => 'Desember',
        ][$month] ?? ($month ?: 'TIDAK DIKETAHUI');
    }
}
