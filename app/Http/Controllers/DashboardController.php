<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Inventori;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
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

        // 6. Lempar data matang ke Frontend
        return Inertia::render('Dashboard', [
            'dbChartData' => [
                'pajak' => $chartDataPajak,
                'stnk' => $chartDataStnk,
                'kir' => $chartDataKir,
                'invoice' => $chartDataInvoice,
                'totalPajak' => $totalPajak,
                'totalStnk' => $totalStnk,
                'totalKir' => $totalKir,
                'totalInvoice' => $totalInvoice,
            ]
        ]);
    }
}
