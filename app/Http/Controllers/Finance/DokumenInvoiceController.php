<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DokumenInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $status = strtoupper(trim((string) $request->query('status', 'ALL')));
        $area = trim((string) $request->query('area', 'ALL'));
        $allowedStatuses = ['ALL', 'PAID', 'UNPAID', 'PARTIAL PAID', 'REFUND'];

        if (! in_array($status, $allowedStatuses, true)) {
            $status = 'ALL';
        }

        $latestApprovals = DB::table('finance_accounting_tax_alur_aproval')
            ->selectRaw('no_invoice, no_payment, MAX(date_time) as last_update')
            ->groupBy('no_invoice', 'no_payment');

        $approvedPayments = DB::table('finance_accounting_tax_mutasi_pembayaran as payment')
            ->joinSub($latestApprovals, 'latest_approval', function ($join) {
                $join->on('latest_approval.no_invoice', '=', 'payment.no_invoice')
                    ->on('latest_approval.no_payment', '=', 'payment.no_payment');
            })
            ->join('finance_accounting_tax_alur_aproval as approval', function ($join) {
                $join->on('approval.no_invoice', '=', 'latest_approval.no_invoice')
                    ->on('approval.no_payment', '=', 'latest_approval.no_payment')
                    ->on('approval.date_time', '=', 'latest_approval.last_update');
            })
            ->whereRaw("UPPER(TRIM(COALESCE(approval.status_doc, ''))) = 'APPROVED'")
            ->whereNotNull('payment.bukti_tf')
            ->where('payment.bukti_tf', '!=', '')
            ->selectRaw('payment.no_invoice, SUM(COALESCE(payment.payment_amount, 0) + COALESCE(payment.biaya_lainnya, 0)) as total_pembayaran_invoice')
            ->groupBy('payment.no_invoice');

        $statusExpression = "CASE
            WHEN COALESCE(approved_payment.total_pembayaran_invoice, 0) = 0 THEN 'UNPAID'
            WHEN COALESCE(approved_payment.total_pembayaran_invoice, 0) = COALESCE(invoice.total_payment, 0) THEN 'PAID'
            WHEN COALESCE(approved_payment.total_pembayaran_invoice, 0) < COALESCE(invoice.total_payment, 0) THEN 'PARTIAL PAID'
            ELSE 'REFUND'
        END";

        $invoiceQuery = DB::table('finance_accounting_tax_input_fat as invoice')
            ->leftJoinSub($approvedPayments, 'approved_payment', function ($join) {
                $join->on('approved_payment.no_invoice', '=', 'invoice.no_invoice');
            })
            ->select(
                'invoice.id_key',
                'invoice.create_date',
                'invoice.due_date',
                'invoice.regional',
                'invoice.area',
                'invoice.divisi',
                'invoice.invoice_date',
                'invoice.no_invoice',
                'invoice.vendor_supplier',
                'invoice.dekripsi_invoice',
                'invoice.invoice_amount',
                'invoice.ppn',
                'invoice.pph',
                'invoice.total_payment',
                'invoice.pengajuan',
                'invoice.upload_invoice',
                'invoice.status_dokumen_asli'
            )
            ->selectRaw('COALESCE(approved_payment.total_pembayaran_invoice, 0) as total_pembayaran_invoice')
            ->selectRaw("{$statusExpression} as status_invoice");

        if ($status !== 'ALL') {
            $invoiceQuery->whereRaw("{$statusExpression} = ?", [$status]);
        }

        if ($area !== '' && strtoupper($area) !== 'ALL') {
            $invoiceQuery->where('invoice.area', $area);
        }

        // Gunakan simple pagination supaya klik status tidak didahului COUNT seluruh invoice.
        $invoiceData = $invoiceQuery
            ->orderByDesc('invoice.invoice_date')
            ->orderByDesc('invoice.create_date')
            ->simplePaginate(100)
            ->withQueryString();

        $invoiceIds = collect($invoiceData->items())->pluck('id_key')->filter()->values();
        $editors = collect();

        if ($invoiceIds->isNotEmpty()) {
            $latestEditorTimes = DB::table('operasional_catatan_update')
                ->whereIn('id_record', $invoiceIds)
                ->selectRaw('id_record, MAX(tgl_cek_admin) as edit_time')
                ->groupBy('id_record');

            $editors = DB::table('operasional_catatan_update as update_log')
                ->joinSub($latestEditorTimes, 'latest_editor_time', function ($join) {
                    $join->on('latest_editor_time.id_record', '=', 'update_log.id_record')
                        ->on('latest_editor_time.edit_time', '=', 'update_log.tgl_cek_admin');
                })
                ->get(['update_log.id_record', 'update_log.nama_admin', 'update_log.tgl_cek_admin'])
                ->keyBy('id_record');
        }

        $invoiceData->getCollection()->transform(function ($invoice) use ($editors) {
            $editor = $editors->get($invoice->id_key);
            $invoice->editor = $editor->nama_admin ?? null;
            $invoice->edit_time = $editor->tgl_cek_admin ?? null;

            return $invoice;
        });

        $areas = DB::table('finance_accounting_tax_input_fat')
            ->whereNotNull('area')
            ->where('area', '!=', '')
            ->distinct()
            ->orderBy('area')
            ->pluck('area')
            ->values();

        return Inertia::render('Finance/DokumenInvoice/Index', [
            'invoiceData' => $invoiceData,
            'filters' => [
                'status' => $status,
                'area' => $area === '' ? 'ALL' : $area,
            ],
            'areas' => $areas,
        ]);
    }

    public function show(string $id)
    {
        $invoice = DB::table('finance_accounting_tax_input_fat')
            ->where('id_key', $id)
            ->first();

        abort_if(!$invoice, 404);

        $editor = DB::table('operasional_catatan_update')
            ->where('id_record', $invoice->id_key)
            ->orderByDesc('tgl_cek_admin')
            ->first(['nama_admin', 'tgl_cek_admin']);

        $invoice->editor = $editor->nama_admin ?? null;
        $invoice->edit_time = $editor->tgl_cek_admin ?? null;

        return Inertia::render('Finance/DokumenInvoice/Detail', [
            'invoiceData' => $invoice
        ]);
    }
}
