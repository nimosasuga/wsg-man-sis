<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DokumenInvoiceController extends Controller
{
    public function index()
    {
        $invoiceData = DB::table('finance_accounting_tax_input_fat')
            ->select(
                'id_key',
                'create_date',
                'due_date',
                'regional',
                'area',
                'divisi',
                'invoice_date',
                'no_invoice',
                'vendor_supplier',
                'dekripsi_invoice',
                'invoice_amount',
                'ppn',
                'pph',
                'total_payment',
                'pengajuan',
                'upload_invoice',
                'status_dokumen_asli'
            )
            ->orderByDesc('invoice_date')
            ->get();

        return Inertia::render('Finance/DokumenInvoice/Index', [
            'rawTableData' => $invoiceData
        ]);
    }

    public function show(string $id)
    {
        $invoice = DB::table('finance_accounting_tax_input_fat')
            ->where('id_key', $id)
            ->first();

        abort_if(!$invoice, 404);

        return Inertia::render('Finance/DokumenInvoice/Detail', [
            'invoiceData' => $invoice
        ]);
    }
}
