<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Support\LegacyDate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DokumenInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $status = strtoupper(trim((string) $request->query('status', 'ALL')));
        $area = trim((string) $request->query('area', 'ALL'));
        $vendor = trim((string) $request->query('vendor', 'ALL'));
        $defaultDivision = $this->userDivision($request);
        $divisi = trim((string) $request->query('divisi', $defaultDivision ?: 'ALL'));
        $allowedStatuses = ['ALL', 'PAID', 'UNPAID', 'PARTIAL PAID', 'REFUND'];

        if (! in_array($status, $allowedStatuses, true)) {
            $status = 'ALL';
        }

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

        if ($vendor !== '' && strtoupper($vendor) !== 'ALL') {
            $invoiceQuery->where('invoice.vendor_supplier', $vendor);
        }

        if ($divisi === 'Tanpa divisi') {
            $invoiceQuery->where(function ($query) {
                $query->whereNull('invoice.divisi')
                    ->orWhere('invoice.divisi', '');
            });
        } elseif ($divisi !== '' && strtoupper($divisi) !== 'ALL') {
            $invoiceQuery->where('invoice.divisi', $divisi);
        }

        // Gunakan simple pagination supaya klik status tidak didahului COUNT seluruh invoice.
        $invoiceData = $invoiceQuery
            ->orderByRaw(LegacyDate::sql('invoice.invoice_date').' desc')
            ->orderByRaw(LegacyDate::sql('invoice.create_date').' desc')
            ->simplePaginate(100)
            ->withQueryString();

        $invoiceIds = collect($invoiceData->items())->pluck('id_key')->filter()->values();
        $editors = collect();

        if ($invoiceIds->isNotEmpty()) {
            $latestEditorTimes = DB::table('operasional_catatan_update')
                ->whereIn('id_record', $invoiceIds)
                ->selectRaw('id_record, MAX('.LegacyDate::sql('tgl_cek_admin').') as edit_time')
                ->groupBy('id_record');

            $editors = DB::table('operasional_catatan_update as update_log')
                ->joinSub($latestEditorTimes, 'latest_editor_time', function ($join) {
                    $join->on('latest_editor_time.id_record', '=', 'update_log.id_record')
                        ->whereRaw('latest_editor_time.edit_time = '.LegacyDate::sql('update_log.tgl_cek_admin'));
                })
                ->get(['update_log.id_record', 'update_log.nama_admin', 'update_log.tgl_cek_admin'])
                ->keyBy('id_record');
        }

        $invoiceData->getCollection()->transform(function ($invoice) use ($editors) {
            $editor = $editors->get($invoice->id_key);
            $invoice->editor = $editor->nama_admin ?? null;
            $invoice->edit_time = $editor->tgl_cek_admin ?? null;
            $invoice->invoice_date = $this->displayDate($invoice->invoice_date);
            $invoice->due_date = $this->displayDate($invoice->due_date);

            return $invoice;
        });

        $areas = DB::table('finance_accounting_tax_input_fat')
            ->whereNotNull('area')
            ->where('area', '!=', '')
            ->distinct()
            ->orderBy('area')
            ->pluck('area')
            ->values();

        $divisions = DB::table('finance_accounting_tax_input_fat')
            ->whereNotNull('divisi')
            ->where('divisi', '!=', '')
            ->distinct()
            ->orderBy('divisi')
            ->pluck('divisi')
            ->values();

        $vendors = DB::table('finance_accounting_tax_input_fat')
            ->whereNotNull('vendor_supplier')
            ->where('vendor_supplier', '!=', '')
            ->distinct()
            ->orderBy('vendor_supplier')
            ->pluck('vendor_supplier')
            ->values();

        return Inertia::render('Finance/DokumenInvoice/Index', [
            'invoiceData' => $invoiceData,
            'filters' => [
                'status' => $status,
                'area' => $area === '' ? 'ALL' : $area,
                'divisi' => $divisi === '' ? 'ALL' : $divisi,
                'vendor' => $vendor === '' ? 'ALL' : $vendor,
            ],
            'areas' => $areas,
            'divisions' => $divisions,
            'vendors' => $vendors,
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
            ->orderByRaw(LegacyDate::sql('tgl_cek_admin').' desc')
            ->first(['nama_admin', 'tgl_cek_admin']);

        $invoice->editor = $editor->nama_admin ?? null;
        $invoice->edit_time = $editor->tgl_cek_admin ?? null;
        $invoice->invoice_date = $this->displayDate($invoice->invoice_date);
        $invoice->due_date = $this->displayDate($invoice->due_date);
        $invoice->create_date = $this->displayDate($invoice->create_date, true);

        return Inertia::render('Finance/DokumenInvoice/Detail', [
            'invoiceData' => $invoice
        ]);
    }

    private function userDivision(Request $request): ?string
    {
        $email = trim((string) $request->user()?->email);

        if ($email === '') {
            return null;
        }

        $division = DB::table('hr_manager_db_pegawai')
            ->whereRaw('LOWER(TRIM(email)) = ?', [strtolower($email)])
            ->whereNotNull('divisi')
            ->where('divisi', '!=', '')
            ->value('divisi');

        return ($division = trim((string) $division)) !== '' ? $division : null;
    }

    private function displayDate(mixed $value, bool $withTime = false): ?string
    {
        $value = trim((string) $value);

        if ($value === '' || $value === '0000-00-00') {
            return null;
        }

        return LegacyDate::parse($value)?->format($withTime ? 'd/m/Y H:i:s' : 'd/m/Y') ?? $value;
    }
}
