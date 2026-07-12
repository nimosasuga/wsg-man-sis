<?php

namespace App\Http\Controllers\System;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DataHealthController extends Controller
{
    private array $moduleMap = [
        'Dashboard' => [
            'hr_manager_db_inventori',
            'finance_accounting_tax_input_fat',
            'operasional_primary_input',
            'operasional_secondary_input',
        ],
        'Biaya' => [
            'hr_manager_db_inventori',
            'maintenance_input_maintenance',
            'maintenance_monitoring_ban',
            'operasional_primary_input',
            'operasional_secondary_input',
        ],
        'Profit Unit' => [
            'operasional_primary_input',
            'operasional_secondary_input',
            'operasional_rental_unit_input',
        ],
        'Daftar Unit' => [
            'hr_manager_db_inventori',
        ],
        'Daftar Asset' => [
            'hr_manager_inventaris_laptop',
            'hr_manager_db_inventori',
            'operasional_checklist',
        ],
        'Finance Invoice' => [
            'finance_accounting_tax_input_fat',
            'finance_accounting_tax_alur_aproval',
            'finance_accounting_tax_mutasi_pembayaran',
        ],
        'Daftar Karyawan' => [
            'hr_manager_db_pegawai',
            'hr_manager_data_mitra',
        ],
        'Riwayat Service' => [
            'maintenance_input_maintenance',
            'maintenance_monitoring_ban',
            'maintenance_pengajuan_service',
        ],
        'On The Road' => [
            'operasional_primary_input',
            'operasional_secondary_input',
            'operasional_rental_unit_input',
            'operasional_checklist',
        ],
        'Need Approval' => [
            'finance_accounting_tax_alur_aproval',
            'maintenance_pengajuan_service',
            'form_download_form_maintenance',
        ],
        'System Activity Log' => [
            'operasional_catatan_update',
        ],
    ];

    private array $relationColumns = [
        'id_key',
        'nopol',
        'nopol_driver',
        'no_bap',
        'key_primary_input',
        'id_record',
        'no_po',
        'no_si',
        'no_invoice',
        'no_payment',
        'email',
        'email_driver',
        'area',
        'driver',
        'nama',
        'nama_karyawan',
        'id_manifest',
        'no_stt',
    ];

    public function index()
    {
        $tables = $this->tables();
        $tableLookup = $tables->keyBy('name');

        return Inertia::render('System/DataHealth/Index', [
            'summary' => [
                'database' => DB::connection()->getDatabaseName(),
                'tableCount' => $tables->count(),
                'filledTables' => $tables->where('rows', '>', 0)->count(),
                'emptyTables' => $tables->where('rows', 0)->count(),
                'totalRows' => $tables->sum('rows'),
            ],
            'modules' => $this->modules($tableLookup),
            'tables' => $tables->values(),
            'relations' => $this->relations($tables),
        ]);
    }

    private function tables()
    {
        $tables = collect(DB::select(
            'SELECT TABLE_NAME AS name
             FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = DATABASE()
             ORDER BY TABLE_NAME'
        ));

        return $tables
            ->filter(fn ($table) => $this->isLegacyTable($table->name))
            ->map(function ($table) {
                $columns = collect(DB::select("SHOW COLUMNS FROM `{$table->name}`"));
                $primaryColumns = $columns
                    ->filter(fn ($column) => $column->Key === 'PRI')
                    ->pluck('Field')
                    ->values();
                $columnNames = $columns->pluck('Field')->values();
                $relationColumns = $columnNames
                    ->filter(fn ($column) => in_array($column, $this->relationColumns, true))
                    ->values();

                return [
                    'name' => $table->name,
                    'rows' => (int) DB::table($table->name)->count(),
                    'primaryColumns' => $primaryColumns,
                    'columnCount' => $columns->count(),
                    'columns' => $columnNames,
                    'relationColumns' => $relationColumns,
                    'status' => $this->statusFor((int) DB::table($table->name)->count()),
                    'moduleHints' => $this->moduleHintsFor($table->name),
                ];
            })
            ->sortBy([
                ['rows', 'desc'],
                ['name', 'asc'],
            ])
            ->values();
    }

    private function modules($tableLookup): array
    {
        return collect($this->moduleMap)
            ->map(function ($tables, $module) use ($tableLookup) {
                $details = collect($tables)->map(function ($table) use ($tableLookup) {
                    $meta = $tableLookup->get($table);

                    return [
                        'name' => $table,
                        'rows' => $meta['rows'] ?? 0,
                        'exists' => (bool) $meta,
                        'status' => $meta['status'] ?? 'missing',
                    ];
                });

                $filled = $details->where('rows', '>', 0)->count();
                $missing = $details->where('exists', false)->count();
                $empty = $details->where('exists', true)->where('rows', 0)->count();

                return [
                    'name' => $module,
                    'tables' => $details->values(),
                    'filled' => $filled,
                    'empty' => $empty,
                    'missing' => $missing,
                    'status' => $missing > 0
                        ? 'missing'
                        : ($empty > 0 ? 'needs-data' : 'ready'),
                ];
            })
            ->values()
            ->all();
    }

    private function relations($tables): array
    {
        return collect($this->relationColumns)
            ->map(function ($column) use ($tables) {
                $matches = $tables
                    ->filter(fn ($table) => collect($table['columns'])->contains($column))
                    ->map(fn ($table) => [
                        'table' => $table['name'],
                        'rows' => $table['rows'],
                    ])
                    ->values();

                return [
                    'column' => $column,
                    'tables' => $matches,
                    'tableCount' => $matches->count(),
                ];
            })
            ->filter(fn ($relation) => $relation['tableCount'] > 1)
            ->sortByDesc('tableCount')
            ->values()
            ->all();
    }

    private function isLegacyTable(string $table): bool
    {
        return preg_match('/^(hr_manager|operasional|finance|db_chargo|maintenance|db_form|menu_|dropdownlist|form_download)/', $table) === 1;
    }

    private function statusFor(int $rows): string
    {
        return $rows > 0 ? 'filled' : 'empty';
    }

    private function moduleHintsFor(string $table): array
    {
        return collect($this->moduleMap)
            ->filter(fn ($tables) => in_array($table, $tables, true))
            ->keys()
            ->values()
            ->all();
    }
}
