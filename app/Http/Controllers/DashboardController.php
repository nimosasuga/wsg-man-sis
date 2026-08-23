<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Inventori;
use App\Support\LegacyDate;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $dbChartData = Cache::remember('dashboard.db_chart_data.v4', now()->addMinutes(5), function () {
        // 1. Tarik hanya kolom yang dibutuhkan untuk efisiensi memori
        $inventori = Inventori::select('status_pajak', 'status_stnk', 'status_kir')->get();
        $inventoriByArea = Inventori::select('area', 'status_pajak', 'status_stnk', 'status_kir')->get()->groupBy('area');

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

        // 5. Status invoice mengikuti formula virtual AppSheet dari pembayaran yang telah disetujui.
        $rankedApprovals = DB::table('finance_accounting_tax_alur_aproval')
            ->select('id_key', 'no_invoice', 'no_payment', 'status_doc')
            ->selectRaw('ROW_NUMBER() OVER (PARTITION BY no_invoice, no_payment ORDER BY '.LegacyDate::sql('date_time').' DESC, id_key DESC) as approval_rank');

        $latestApprovals = DB::query()
            ->fromSub($rankedApprovals, 'ranked_approval')
            ->where('approval_rank', 1);

        $approvedPayments = DB::table('finance_accounting_tax_mutasi_pembayaran as payment')
            ->joinSub($latestApprovals, 'latest_approval', function ($join) {
                $join->on('latest_approval.no_invoice', '=', 'payment.no_invoice')
                    ->on('latest_approval.no_payment', '=', 'payment.no_payment');
            })
            ->whereRaw("UPPER(TRIM(COALESCE(latest_approval.status_doc, ''))) = 'APPROVED'")
            ->whereNotNull('payment.bukti_tf')
            ->where('payment.bukti_tf', '!=', '')
            ->selectRaw('payment.no_invoice, SUM(COALESCE(payment.payment_amount, 0) + COALESCE(payment.biaya_lainnya, 0)) as total_pembayaran_invoice')
            ->groupBy('payment.no_invoice');

        $invoiceSummary = DB::table('finance_accounting_tax_input_fat as invoice')
            ->leftJoinSub($approvedPayments, 'approved_payment', function ($join) {
                $join->on('approved_payment.no_invoice', '=', 'invoice.no_invoice');
            })
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN COALESCE(approved_payment.total_pembayaran_invoice, 0) = 0 THEN 1 ELSE 0 END) as unpaid')
            ->selectRaw('SUM(CASE WHEN COALESCE(approved_payment.total_pembayaran_invoice, 0) = COALESCE(invoice.total_payment, 0) AND COALESCE(approved_payment.total_pembayaran_invoice, 0) > 0 THEN 1 ELSE 0 END) as paid')
            ->selectRaw('SUM(CASE WHEN COALESCE(approved_payment.total_pembayaran_invoice, 0) > 0 AND COALESCE(approved_payment.total_pembayaran_invoice, 0) < COALESCE(invoice.total_payment, 0) THEN 1 ELSE 0 END) as partial_paid')
            ->selectRaw('SUM(CASE WHEN COALESCE(approved_payment.total_pembayaran_invoice, 0) > COALESCE(invoice.total_payment, 0) THEN 1 ELSE 0 END) as refund')
            ->first();

        $invoiceProgress = [
            ['key' => 'PAID', 'label' => 'Paid', 'value' => (int) ($invoiceSummary->paid ?? 0)],
            ['key' => 'UNPAID', 'label' => 'Unpaid', 'value' => (int) ($invoiceSummary->unpaid ?? 0)],
            ['key' => 'PARTIAL PAID', 'label' => 'Partial Paid', 'value' => (int) ($invoiceSummary->partial_paid ?? 0)],
        ];
        if ((int) ($invoiceSummary->refund ?? 0) > 0) {
            $invoiceProgress[] = ['key' => 'REFUND', 'label' => 'Refund', 'value' => (int) $invoiceSummary->refund];
        }
        $chartDataInvoice = $invoiceProgress;
        $totalInvoice = (int) ($invoiceSummary->total ?? 0);

        $activityPrimary = DB::table('operasional_primary_input')
            ->select('tanggal_muat')
            ->whereNotNull('tanggal_muat')
            ->where('tanggal_muat', '!=', '')
            ->get()
            ->groupBy(fn ($row) => substr($row->tanggal_muat, 3, 2))
            ->sortKeys()
            ->map(fn ($rows, $bulan) => [
                'name' => $this->monthNumToId($bulan),
                'value' => $rows->count(),
            ])
            ->values();
        $totalActivityPrimary = $activityPrimary->sum('value');

        $activitySecondary = DB::table('operasional_secondary_input')
            ->select('bulan')
            ->get()
            ->groupBy(fn ($row) => empty($row->bulan) ? 'TIDAK DIKETAHUI' : $row->bulan)
            ->sortKeys()
            ->map(fn ($rows, $name) => [
                'name' => $this->cleanMonthLabel($name),
                'value' => $rows->count(),
            ])
            ->values();
        $totalActivitySecondary = $activitySecondary->sum('value');

        $fatDocPrimary = $this->fatDocByDivision('Primary - Operasional');
        $fatDocSecondary = $this->fatDocByDivision('Secondary - Operasional');
        $globalProfit = $this->globalProfitKpis();

        $areaHealth = [];
        $profitByArea = collect($globalProfit['areas']);
        foreach ($inventoriByArea as $areaName => $units) {
            $total = $units->count();
            $pajakActive = $units->where('status_pajak', 'AKTIF')->count();
            $stnkActive = $units->where('status_stnk', 'AKTIF')->count();
            $kirActive = $units->where('status_kir', 'AKTIF')->count();
            $compliance = $total > 0 ? round((($pajakActive + $stnkActive + $kirActive) / ($total * 3)) * 100) : 0;

            $areaProfit = $profitByArea->firstWhere('area', mb_strtoupper(trim($areaName) ?: 'TIDAK DIKETAHUI'));
            $revenue = (float) ($areaProfit['revenue'] ?? 0);
            $profit = (float) ($areaProfit['profit'] ?? 0);
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 1) : 0;
            $marginScore = min(round(($margin / 50) * 100), 100);

            $score = round(($compliance * 0.5) + ($marginScore * 0.5));
            $areaHealth[] = [
                'area' => $areaName ?: 'TIDAK DIKETAHUI',
                'score' => $score,
                'compliance' => $compliance,
                'margin' => $margin,
                'total' => $total,
                'profit' => $profit,
                'revenue' => $revenue,
            ];
        }
        $areaHealth = collect($areaHealth)->sortByDesc('score')->values()->all();

            return [
                'pajak' => $chartDataPajak,
                'stnk' => $chartDataStnk,
                'kir' => $chartDataKir,
                'invoice' => $chartDataInvoice,
                'invoiceProgress' => $invoiceProgress,
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
                'areaHealth' => $areaHealth,
                'fatPrimaryStatus' => $this->fatPrimaryStatusCounts(),
                'fatSecondaryStatus' => $this->fatSecondaryStatusCounts(),
            ];
        });

        // 7. Hitung Aktivitas Primary di luar cache agar selalu segar
        $rawDates = DB::table('operasional_primary_input')
            ->select('tanggal_muat')
            ->whereNotNull('tanggal_muat')
            ->where('tanggal_muat', '!=', '')
            ->whereRaw('LENGTH(tanggal_muat) >= 10')
            ->get()
            ->groupBy(fn ($row) => substr($row->tanggal_muat, 6, 4))
            ->filter(fn ($items, $tahun) => ctype_digit($tahun) && (int) $tahun > 2000);

        $activityByYear = $rawDates
            ->map(function ($items, $tahun) {
                $byMonth = $items->groupBy(fn ($row) => substr($row->tanggal_muat, 3, 2));
                $months = collect();
                foreach (range(1, 12) as $m) {
                    $key = str_pad((string) $m, 2, '0', STR_PAD_LEFT);
                    $months->push([
                        'bulan' => $m,
                        'value' => optional($byMonth->get($key))->count() ?? 0,
                    ]);
                }
                return ['tahun' => (int) $tahun, 'months' => $months];
            })->sortKeysDesc()->values();

        $availableYears = $activityByYear->pluck('tahun')->values();
        $dbChartData['primaryActivityByYear'] = $activityByYear;
        $dbChartData['primaryActivityYears'] = $availableYears;

        // 8. Hitung Aktivitas Secondary per Tahun di luar cache
        $rawSecondary = DB::table('operasional_secondary_input')
            ->select('tanggal', 'tahun')
            ->whereNotNull('tanggal')
            ->where('tanggal', '!=', '')
            ->get()
            ->groupBy(fn ($row) => (int) $row->tahun)
            ->filter(fn ($items, $tahun) => $tahun > 2000);

        $secondaryActivityByYear = $rawSecondary
            ->map(function ($items, $tahun) {
                $byMonth = $items->groupBy(function ($row) {
                    return LegacyDate::parse($row->tanggal)?->format('n');
                })->filter(fn ($items, $bulan) => $bulan !== null);

                $months = collect();
                foreach (range(1, 12) as $m) {
                    $months->push([
                        'bulan' => $m,
                        'value' => $byMonth->get($m)?->count() ?? 0,
                    ]);
                }
                return ['tahun' => (int) $tahun, 'months' => $months];
            })->sortKeysDesc()->values();

        $secondaryAvailableYears = $secondaryActivityByYear->pluck('tahun')->values();
        $dbChartData['secondaryActivityByYear'] = $secondaryActivityByYear;
        $dbChartData['secondaryActivityYears'] = $secondaryAvailableYears;

        // 9. Recent Activity — 5 record terbaru
        $dbChartData['recentActivity'] = DB::table('operasional_primary_input')
            ->select('id_key', 'tanggal_muat', 'area', 'nopol_driver')
            ->whereNotNull('tanggal_muat')
            ->where('tanggal_muat', '!=', '')
            ->orderByRaw(LegacyDate::sql('tanggal_muat').' desc')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'tanggal' => $row->tanggal_muat,
                'area' => $row->area,
                'nopol' => $row->nopol_driver,
            ]);

        Cache::put('dashboard.db_chart_data.v4', $dbChartData, now()->addMinutes(5));

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
            ->selectRaw('area, SUM(COALESCE(total_tarif, 0)) as revenue, SUM(COALESCE(total_biaya, 0)) as cost')
            ->groupBy('area')
            ->get()
            ->each(fn ($row) => $add($row->area, (float) $row->revenue, (float) $row->cost));

        $ovtLookup = [];
        DB::table('operasional_absen')->get(['nama', 'tanggal', 'approval_ovt'])->each(function ($row) use (&$ovtLookup) {
            $dateKey = $this->dateKey($row->tanggal);
            if (! $dateKey || ! $row->nama) {
                return;
            }
            $key = $dateKey.'|'.mb_strtoupper(trim((string) $row->nama));
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
                $dateKey = $this->dateKey($row->tanggal);
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
            ->selectRaw('area, SUM(COALESCE(tarif_sewa_unit_bln, 0)) as revenue, SUM(COALESCE(biaya_legalitas, 0)) as cost')
            ->groupBy('area')
            ->get()
            ->each(fn ($row) => $add($row->area, (float) $row->revenue, (float) $row->cost));

        DB::table('db_chargo_data_paket_masuk')
            ->selectRaw('kota_tujuan, SUM(COALESCE(total_ongkir, 0)) as revenue')
            ->groupBy('kota_tujuan')
            ->get()
            ->each(fn ($row) => $add($row->kota_tujuan, (float) $row->revenue, 0));

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

    private function dateKey(mixed $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        return LegacyDate::iso($value);
    }

    private function fatPrimaryStatusCounts(): array
    {
        $counts = DB::table('operasional_primary_input')
            ->select(DB::raw("
                COUNT(*) as total,
                SUM(CASE WHEN status_dokument = 'DITERIMA' THEN 1 ELSE 0 END) as diterima,
                SUM(CASE WHEN status_dokument IS NULL OR status_dokument = '' OR status_dokument = '0' THEN 1 ELSE 0 END) as belum_naik
            "))
            ->first();

        $total = (int) $counts->total;
        $diterima = (int) $counts->diterima;
        $belumNaik = (int) $counts->belum_naik;
        $na = $total - $diterima - $belumNaik;

        return [
            'data' => [
                ['name' => 'DITERIMA FAT', 'value' => $diterima],
                ['name' => 'BELUM NAIK', 'value' => $belumNaik],
                ['name' => 'N/A', 'value' => $na],
            ],
            'total' => $total,
        ];
    }

    private function fatSecondaryStatusCounts(): array
    {
        $counts = DB::table('operasional_secondary_input')
            ->whereIn('project', ['ON DEMAND - FULL SERVICE', 'RENTAL'])
            ->select(DB::raw("
                COUNT(*) as total,
                SUM(CASE WHEN status_dokument = 'DITERIMA' THEN 1 ELSE 0 END) as diterima,
                SUM(CASE WHEN status_dokument IS NULL OR status_dokument = '' OR status_dokument = '0' THEN 1 ELSE 0 END) as belum_naik
            "))
            ->first();

        $total = (int) $counts->total;
        $diterima = (int) $counts->diterima;
        $belumNaik = (int) $counts->belum_naik;
        $na = $total - $diterima - $belumNaik;

        return [
            'data' => [
                ['name' => 'DITERIMA FAT', 'value' => $diterima],
                ['name' => 'BELUM NAIK', 'value' => $belumNaik],
                ['name' => 'N/A', 'value' => $na],
            ],
            'total' => $total,
        ];
    }

    private function fatDocByDivision(string $division): array
    {
        $rows = DB::table('finance_accounting_tax_input_fat')
            ->select('status_dokumen_asli')
            ->where('divisi', $division)
            ->get()
            ->groupBy(fn ($row) => empty($row->status_dokumen_asli) ? 'TIDAK DIKETAHUI' : $row->status_dokumen_asli);

        $data = $rows
            ->map(fn ($group, $name) => [
                'name' => strtoupper($name),
                'value' => $group->count(),
            ])
            ->sortByDesc('value')
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

    private function monthNumToId(string $num): string
    {
        $months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return $months[(int) $num] ?? 'TIDAK DIKETAHUI';
    }

    public function fatStatusApi()
    {
        return response()->json([
            'fatPrimaryStatus' => $this->fatPrimaryStatusCounts(),
            'fatSecondaryStatus' => $this->fatSecondaryStatusCounts(),
        ]);
    }
}
