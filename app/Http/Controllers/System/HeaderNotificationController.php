<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class HeaderNotificationController extends Controller
{
    public function index(): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        if (! Schema::hasTable('notifications')) {
            return response()->json([
                'items' => [],
                'unreadCount' => 0,
                'requiresMigration' => true,
            ]);
        }

        $this->syncOperationalAlerts($user);

        $items = $user->notifications()
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'title' => (string) ($notification->data['title'] ?? 'Notifikasi sistem'),
                'message' => (string) ($notification->data['message'] ?? ''),
                'url' => (string) ($notification->data['url'] ?? '/dashboard'),
                'severity' => (string) ($notification->data['severity'] ?? 'info'),
                'createdAt' => optional($notification->created_at)?->toIso8601String(),
                'readAt' => optional($notification->read_at)?->toIso8601String(),
            ])
            ->values();

        return response()->json([
            'items' => $items,
            'unreadCount' => $user->unreadNotifications()->count(),
            'requiresMigration' => false,
        ]);
    }

    public function markAllRead(): RedirectResponse
    {
        auth()->user()->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }

    public function markRead(string $notification): RedirectResponse
    {
        auth()->user()->unreadNotifications()->whereKey($notification)->update(['read_at' => now()]);

        return back();
    }

    private function syncOperationalAlerts(User $user): void
    {
        $dashboard = Cache::get('dashboard.db_chart_data.v3', []);

        if ($user->can('approval.view') && Schema::hasTable('finance_accounting_tax_alur_aproval')) {
            $pending = DB::table('finance_accounting_tax_alur_aproval')
                ->whereIn(DB::raw("UPPER(TRIM(COALESCE(status_doc, '')) )"), ['SUBMIT', 'RE-CHECK'])
                ->count();

            if ($pending > 0) {
                $this->upsertAlert($user, 'header.approval-pending', [
                    'title' => 'Approval perlu ditindaklanjuti',
                    'message' => "{$pending} pengajuan masih berstatus SUBMIT atau RE-CHECK.",
                    'url' => '/need-approval/outstanding',
                    'severity' => 'warning',
                ]);
            } else {
                $this->removeAlert($user, 'header.approval-pending');
            }
        }

        if ($user->can('dashboard.view')) {
            $invoice = collect($dashboard['invoiceProgress'] ?? []);
            $unpaid = (int) (($invoice->firstWhere('key', 'UNPAID')['value'] ?? 0));
            $partial = (int) (($invoice->firstWhere('key', 'PARTIAL PAID')['value'] ?? 0));
            if (($unpaid + $partial) > 0) {
                $this->upsertAlert($user, 'header.invoice-progress', [
                    'title' => 'Status dokumen invoice',
                    'message' => "{$unpaid} invoice belum dibayar dan {$partial} invoice dibayar sebagian.",
                    'url' => '/business-control/health',
                    'severity' => 'warning',
                ]);
            } else {
                $this->removeAlert($user, 'header.invoice-progress');
            }

            $pajak = collect($dashboard['pajak'] ?? []);
            $stnk = collect($dashboard['stnk'] ?? []);
            $kir = collect($dashboard['kir'] ?? []);
            $expired = $this->statusCount($pajak, 'EXPIRED') + $this->statusCount($stnk, 'EXPIRED') + $this->statusCount($kir, 'EXPIRED');
            $nearExpiry = $this->statusCount($pajak, 'HAMPIR EXPIRED') + $this->statusCount($stnk, 'HAMPIR EXPIRED') + $this->statusCount($kir, 'HAMPIR EXPIRED');
            if (($expired + $nearExpiry) > 0) {
                $this->upsertAlert($user, 'header.legalitas-unit', [
                    'title' => 'Legalitas unit perlu dicek',
                    'message' => "{$expired} status expired dan {$nearExpiry} status hampir expired pada pajak, STNK, atau KIR.",
                    'url' => '/inventori/pajak',
                    'severity' => $expired > 0 ? 'danger' : 'warning',
                ]);
            } else {
                $this->removeAlert($user, 'header.legalitas-unit');
            }
        }
    }

    private function statusCount($items, string $status): int
    {
        return (int) (($items->firstWhere('name', $status)['value'] ?? 0));
    }

    private function upsertAlert(User $user, string $type, array $data): void
    {
        $existing = $user->notifications()->where('type', $type)->first();

        if ($existing) {
            $existing->update(['data' => $data]);
            return;
        }

        $user->notifications()->create([
            'id' => (string) Str::uuid(),
            'type' => $type,
            'data' => $data,
        ]);
    }

    private function removeAlert(User $user, string $type): void
    {
        $user->notifications()->where('type', $type)->delete();
    }
}
