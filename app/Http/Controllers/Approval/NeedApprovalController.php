<?php

namespace App\Http\Controllers\Approval;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class NeedApprovalController extends Controller
{
    public function index()
    {
        $outstanding = $this->outstandingRows();

        return Inertia::render('Approval/NeedApproval/Index', [
            'summary' => [
                'outstandingCount' => $outstanding->count(),
                'submitCount' => $outstanding->where('status_pengajuan', 'SUBMIT')->count(),
                'recheckCount' => $outstanding->where('status_pengajuan', 'RE-CHECK')->count(),
                'paymentAmount' => (float) $outstanding->sum('payment_amount'),
            ],
            'sourceStatus' => [
                'finance_accounting_tax_mutasi_pembayaran' => DB::table('finance_accounting_tax_mutasi_pembayaran')->count(),
                'finance_accounting_tax_alur_aproval' => DB::table('finance_accounting_tax_alur_aproval')->count(),
                'finance_accounting_tax_input_fat' => DB::table('finance_accounting_tax_input_fat')->count(),
            ],
        ]);
    }

    public function outstanding()
    {
        $filters = [
            'search' => (string) request()->query('search', ''),
            'status' => (string) request()->query('status', 'ALL'),
            'divisi' => (string) request()->query('divisi', 'ALL'),
            'regional' => (string) request()->query('regional', 'ALL'),
        ];

        $rows = $this->outstandingRows();
        $filtered = $rows->filter(function ($row) use ($filters) {
            $keyword = strtolower(trim($filters['search']));
            $matchSearch = $keyword === '' || collect([
                $row['no_invoice'],
                $row['no_payment'],
                $row['vendor_supplier'],
                $row['rekening_tujuan'],
                $row['nama_penerima'],
                $row['keterangan'],
            ])->filter()->contains(fn ($value) => str_contains(strtolower((string) $value), $keyword));

            return $matchSearch
                && ($filters['status'] === 'ALL' || $row['status_pengajuan'] === $filters['status'])
                && ($filters['divisi'] === 'ALL' || $row['divisi'] === $filters['divisi'])
                && ($filters['regional'] === 'ALL' || $row['regional'] === $filters['regional']);
        })->values();

        return Inertia::render('Approval/NeedApproval/Outstanding', [
            'rows' => $filtered->take(1500)->values(),
            'summary' => [
                'totalShown' => $filtered->count(),
                'submitCount' => $filtered->where('status_pengajuan', 'SUBMIT')->count(),
                'recheckCount' => $filtered->where('status_pengajuan', 'RE-CHECK')->count(),
                'paymentAmount' => (float) $filtered->sum('payment_amount'),
            ],
            'filters' => $filters,
            'filterOptions' => [
                'status' => ['ALL', 'SUBMIT', 'RE-CHECK'],
                'divisi' => $this->optionList($rows->pluck('divisi')),
                'regional' => $this->optionList($rows->pluck('regional')),
            ],
        ]);
    }

    public function outstandingDetail(string $id)
    {
        $row = $this->outstandingRows()
            ->firstWhere('id_key', $id);

        abort_if(! $row, 404);

        $approvalHistory = DB::table('finance_accounting_tax_alur_aproval')
            ->where('no_invoice', $row['no_invoice'])
            ->where('no_payment', $row['no_payment'])
            ->orderByDesc('date_time')
            ->limit(20)
            ->get();

        return Inertia::render('Approval/NeedApproval/OutstandingDetail', [
            'record' => $row,
            'approvalHistory' => $approvalHistory,
            'backUrl' => url()->previous() ?: route('need-approval.outstanding'),
        ]);
    }

    private function outstandingRows(): Collection
    {
        $latestApproval = DB::table('finance_accounting_tax_alur_aproval')
            ->get()
            ->groupBy(fn ($row) => $this->approvalKey($row->no_invoice, $row->no_payment))
            ->map(fn ($items) => $items->sortByDesc(fn ($item) => $this->dateScore($item->date_time))->first());

        $invoiceLookup = DB::table('finance_accounting_tax_input_fat')
            ->get()
            ->keyBy('no_invoice');

        return DB::table('finance_accounting_tax_mutasi_pembayaran')
            ->get()
            ->map(function ($row) use ($latestApproval, $invoiceLookup) {
                $approval = $latestApproval->get($this->approvalKey($row->no_invoice, $row->no_payment));
                $invoice = $invoiceLookup->get($row->no_invoice);
                $status = strtoupper(trim((string) ($approval->status_doc ?? '')));

                return [
                    'id_key' => $row->id_key,
                    'no_invoice' => $row->no_invoice,
                    'no_payment' => $row->no_payment,
                    'tanggal_invoice' => $invoice->invoice_date ?? null,
                    'due_date' => $invoice->due_date ?? null,
                    'days_left' => $invoice->days ?? null,
                    'regional' => $invoice->regional ?? null,
                    'divisi' => $invoice->divisi ?? null,
                    'vendor_supplier' => $invoice->vendor_supplier ?? null,
                    'invoice_amount' => (float) ($invoice->invoice_amount ?? 0),
                    'ppn' => (float) ($invoice->ppn ?? 0),
                    'pph' => (float) ($invoice->pph ?? 0),
                    'biaya_lainnya' => (float) ($row->biaya_lainnya ?? 0),
                    'payment_amount' => (float) ($row->payment_amount ?? 0),
                    'rekening_tujuan' => $row->rekening_tujuan,
                    'nama_penerima' => $row->nama_penerima,
                    'keterangan' => $row->keterangan,
                    'date_record' => $row->date_record,
                    'time_record' => $row->time_record,
                    'pao_week' => $row->pao_week,
                    'jenis_pembayaran' => $row->jenis_pembayaran,
                    'sumber_dana' => $row->sumber_dana,
                    'dokumen_diterima' => $row->dokumen_diterima,
                    'bukti_tf' => $row->bukti_tf,
                    'email' => $row->email,
                    'tgl_update_inv' => $approval->date_time ?? null,
                    'status_pengajuan' => $status ?: 'BELUM ADA STATUS',
                    'diajukan' => $approval->diajukan ?? null,
                ];
            })
            ->filter(fn ($row) => in_array($row['status_pengajuan'], ['SUBMIT', 'RE-CHECK'], true))
            ->sortByDesc(fn ($row) => $this->dateScore($row['tanggal_invoice']))
            ->values();
    }

    private function approvalKey(?string $invoice, ?string $payment): string
    {
        return trim((string) $invoice).'|'.trim((string) $payment);
    }

    private function dateScore(?string $value): int
    {
        if (! $value) {
            return 0;
        }

        try {
            return Carbon::parse(str_replace('.', ':', $value))->timestamp;
        } catch (\Throwable) {
            return strtotime(str_replace('/', '-', $value)) ?: 0;
        }
    }

    private function optionList(Collection $values): array
    {
        return array_values(array_unique(array_merge(
            ['ALL'],
            $values
                ->map(fn ($value) => trim((string) $value))
                ->filter()
                ->sort()
                ->values()
                ->all()
        )));
    }
}
