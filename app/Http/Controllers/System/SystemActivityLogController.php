<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class SystemActivityLogController extends Controller
{
    public function index()
    {
        $hasTable = Schema::hasTable('operasional_catatan_update');
        $totalRows = $hasTable ? DB::table('operasional_catatan_update')->count() : 0;
        $latest = $hasTable
            ? DB::table('operasional_catatan_update')->orderByDesc('tgl_cek_admin')->value('tgl_cek_admin')
            : null;

        return Inertia::render('System/ActivityLog/Index', [
            'summary' => [
                'totalUserLogs' => $totalRows,
                'latestUserLog' => $latest,
                'sourceTable' => 'operasional_catatan_update',
                'sourceStatus' => $hasTable ? 'ready' : 'missing',
            ],
        ]);
    }

    public function userActivity()
    {
        $filters = [
            'search' => (string) request()->query('search', ''),
            'tanggal' => (string) request()->query('tanggal', ''),
        ];

        $hasTable = Schema::hasTable('operasional_catatan_update');
        $logs = collect();

        if ($hasTable) {
            $query = DB::table('operasional_catatan_update')
                ->select('id_key', 'nama_admin', 'tgl_cek_admin', 'id_record')
                ->orderByDesc('tgl_cek_admin');

            if ($filters['search'] !== '') {
                $keyword = '%'.$filters['search'].'%';
                $query->where(function ($builder) use ($keyword) {
                    $builder
                        ->where('nama_admin', 'like', $keyword)
                        ->orWhere('id_key', 'like', $keyword)
                        ->orWhere('id_record', 'like', $keyword);
                });
            }

            if ($filters['tanggal'] !== '') {
                $query->where('tgl_cek_admin', 'like', $filters['tanggal'].'%');
            }

            $logs = $query
                ->limit(1500)
                ->get()
                ->map(fn ($row) => $this->mapLogRow($row));
        }

        return Inertia::render('System/ActivityLog/User', [
            'logs' => $logs,
            'summary' => [
                'totalShown' => $logs->count(),
                'totalRows' => $hasTable ? DB::table('operasional_catatan_update')->count() : 0,
                'sourceTable' => 'operasional_catatan_update',
                'sourceStatus' => $hasTable ? 'ready' : 'missing',
            ],
            'filters' => $filters,
        ]);
    }

    public function userActivityDetail(string $id)
    {
        abort_if(! Schema::hasTable('operasional_catatan_update'), 404);

        $row = DB::table('operasional_catatan_update')
            ->select('id_key', 'nama_admin', 'tgl_cek_admin', 'id_record')
            ->where('id_key', $id)
            ->first();

        abort_if(! $row, 404);

        return Inertia::render('System/ActivityLog/UserDetail', [
            'log' => $this->mapLogRow($row),
            'backUrl' => url()->previous() ?: route('system.activity-log.user'),
        ]);
    }

    private function mapLogRow(object $row): array
    {
        $parsed = $this->parseActivity((string) $row->nama_admin);

        return [
            'id_key' => $row->id_key,
            'nama_admin' => $row->nama_admin,
            'tgl_cek_admin' => $row->tgl_cek_admin,
            'tanggal' => $this->dateOnly($row->tgl_cek_admin),
            'id_record' => $row->id_record,
            'action' => $parsed['action'],
            'actor' => $parsed['actor'],
            'app' => $parsed['app'],
            'table' => $parsed['table'],
            'description' => $parsed['description'],
        ];
    }

    private function parseActivity(string $value): array
    {
        $parts = explode('.', $value);

        return [
            'action' => $parts[0] ?? '-',
            'actor' => $parts[1] ?? '-',
            'app' => $parts[2] ?? '-',
            'table' => $parts[3] ?? '-',
            'description' => $value,
        ];
    }

    private function dateOnly(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return substr($value, 0, 10);
        }
    }
}
