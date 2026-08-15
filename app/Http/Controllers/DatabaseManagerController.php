<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DatabaseManagerController extends Controller
{
    private const EXPORT_LIMIT = 10000;
    private const IMPORT_CHUNK_SIZE = 500;
    private const IMPORT_ERROR_LIMIT = 30;
    private const EMPTY_DATA_PROTECTED_TABLES = [
        'users',
        'password_reset_tokens',
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
        'migrations',
        'roles',
        'permissions',
        'model_has_permissions',
        'model_has_roles',
        'role_has_permissions',
        'personal_access_tokens',
    ];

    public function index(Request $request): Response
    {
        $database = DB::getDatabaseName();
        $query = trim((string) $request->query('search', ''));

        $tables = collect(DB::select(
            'SELECT t.table_name AS tableName,
                    t.table_rows AS rowCount,
                    t.table_collation AS collationName,
                    COUNT(c.column_name) AS columnCount
             FROM information_schema.tables t
             LEFT JOIN information_schema.columns c
               ON c.table_schema = t.table_schema AND c.table_name = t.table_name
             WHERE t.table_schema = ? AND t.table_type = ?
             GROUP BY t.table_name, t.table_rows, t.table_collation
             ORDER BY t.table_name',
            [$database, 'BASE TABLE'],
        ))
            ->map(fn ($table) => [
                'name' => $table->tableName,
                'rows' => (int) $table->rowCount,
                'columns' => (int) $table->columnCount,
                'collation' => $table->collationName,
            ])
            ->filter(fn (array $table) => $query === '' || str_contains(strtolower($table['name']), strtolower($query)))
            ->values();

        return Inertia::render('DatabaseManager/Index', [
            'database' => $database,
            'tables' => $tables,
            'filters' => ['search' => $query],
            'canCreateTables' => $request->user()?->hasRole('super-admin') ?? false,
            'createUrl' => route('database-manager.create'),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->guardSuperAdmin($request);

        return Inertia::render('DatabaseManager/Create', [
            'database' => DB::getDatabaseName(),
            'typeGroups' => $this->mysqlTypeGroups(),
            'collations' => $this->collations(),
            'storeUrl' => route('database-manager.store'),
            'indexUrl' => route('database-manager.index'),
        ]);
    }

    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $this->guardSuperAdmin($request);
        $validated = $this->validateCreateTableRequest($request);

        if (Schema::hasTable($validated['name'])) {
            return back()
                ->withInput()
                ->with('error', "Tabel {$validated['name']} sudah ada.");
        }

        try {
            $sql = $this->prepareCreateTableStatement($validated);
            DB::statement($sql);
        } catch (\InvalidArgumentException $exception) {
            return back()
                ->withInput()
                ->with('error', $exception->getMessage());
        } catch (\Throwable) {
            return back()
                ->withInput()
                ->with('error', 'Tabel belum dibuat. Periksa nama tabel, nama kolom, tipe data, dan pilihan primary key.');
        }

        return to_route('database-manager.show', $validated['name'])
            ->with('success', "Tabel {$validated['name']} berhasil dibuat.");
    }

    public function show(Request $request, string $table): Response
    {
        $this->guardTable($table);
        $database = DB::getDatabaseName();
        $columns = $this->columns($table);

        $indexes = collect(DB::select(
            'SELECT index_name AS indexName,
                    non_unique AS nonUnique,
                    seq_in_index AS sequence,
                    column_name AS columnName
             FROM information_schema.statistics
             WHERE table_schema = ? AND table_name = ?
             ORDER BY index_name, seq_in_index',
            [$database, $table],
        ))->map(fn ($index) => [
            'name' => $index->indexName,
            'column' => $index->columnName,
            'sequence' => (int) $index->sequence,
            'unique' => ! (bool) $index->nonUnique,
        ])->values();

        return Inertia::render('DatabaseManager/Detail', [
            'database' => $database,
            'table' => [
                'name' => $table,
                'rows' => DB::table($table)->count(),
                'columns' => $columns,
                'indexes' => $indexes,
                'templateUrl' => route('database-manager.template', $table),
                'exportUrl' => route('database-manager.export', $table),
                'fullExportUrl' => route('database-manager.export-csv', $table),
                'importUrl' => route('database-manager.import', $table),
                'canAlterStructure' => $request->user()?->hasRole('super-admin') ?? false,
                'structureUrl' => route('database-manager.structure', $table),
                'canEmptyData' => ($request->user()?->hasRole('super-admin') ?? false) && ! $this->isEmptyDataProtectedTable($table),
                'prepareEmptyUrl' => route('database-manager.empty.prepare', $table),
                'emptyUrl' => route('database-manager.empty', $table),
            ],
        ]);
    }

    public function prepareEmpty(Request $request, string $table): \Illuminate\Http\JsonResponse
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);
        $this->guardEmptyDataTable($table);

        $token = (string) Str::uuid();
        $rowCount = DB::table($table)->count();
        $request->session()->put("database-manager.empty.{$token}", [
            'table' => $table,
            'row_count' => $rowCount,
            'prepared_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'token' => $token,
            'rowCount' => $rowCount,
        ]);
    }

    public function empty(Request $request, string $table): \Illuminate\Http\RedirectResponse
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);
        $this->guardEmptyDataTable($table);
        $request->validate([
            'token' => ['required', 'uuid'],
            'confirmation_table' => ['required', 'string'],
        ]);

        if ($request->string('confirmation_table')->value() !== $table) {
            return to_route('database-manager.show', $table)
                ->with('error', 'Nama tabel tidak cocok. Data tidak dihapus.');
        }

        $token = $request->string('token')->value();
        $prepared = $request->session()->get("database-manager.empty.{$token}");
        $preparedAt = isset($prepared['prepared_at']) ? Carbon::parse($prepared['prepared_at']) : null;
        if (! $prepared || ($prepared['table'] ?? null) !== $table || ! $preparedAt || $preparedAt->lt(now()->subMinutes(30))) {
            return to_route('database-manager.show', $table)
                ->with('error', 'Sesi unduhan tidak ditemukan atau sudah kedaluwarsa. Unduh data kembali sebelum mengosongkan tabel.');
        }

        try {
            $deleted = DB::table($table)->delete();
        } catch (\Throwable) {
            return to_route('database-manager.show', $table)
                ->with('error', 'Data belum dihapus karena tabel ini masih dipakai oleh relasi data lain.');
        }

        $request->session()->forget("database-manager.empty.{$token}");

        return to_route('database-manager.show', $table)
            ->with('success', "{$deleted} baris dari tabel {$table} berhasil dikosongkan.");
    }

    public function structure(Request $request, string $table): Response
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);

        return Inertia::render('DatabaseManager/Structure', [
            'table' => $this->structurePayload($table),
            'preview' => null,
        ]);
    }

    public function redirectStructurePreview(Request $request, string $table): \Illuminate\Http\RedirectResponse
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);

        return to_route('database-manager.structure', $table);
    }

    public function previewStructure(Request $request, string $table): Response
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);
        $validated = $this->validateStructureRequest($request);

        $payload = $this->structurePayload($table);
        try {
            $change = $this->prepareStructureChange($table, $payload['columns'], $validated);
            $change['analysis'] = $this->analyzeExistingValuesBeforeStructureChange($table, $payload['columns'], $change);
        } catch (\InvalidArgumentException $exception) {
            return Inertia::render('DatabaseManager/Structure', [
                'table' => $payload,
                'preview' => ['error' => $exception->getMessage()],
            ]);
        }

        $token = (string) Str::uuid();
        $request->session()->put("database-manager.structure.{$token}", [
            'table' => $table,
            'change' => $change['request'],
        ]);

        return Inertia::render('DatabaseManager/Structure', [
            'table' => $payload,
            'preview' => [...$change, 'token' => $token],
        ]);
    }

    public function updateStructure(Request $request, string $table): \Illuminate\Http\RedirectResponse
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);
        $request->validate(['token' => ['required', 'uuid']]);

        $token = $request->string('token')->value();
        $pending = $request->session()->get("database-manager.structure.{$token}");
        if (! $pending || ($pending['table'] ?? null) !== $table) {
            return to_route('database-manager.structure', $table)
                ->with('error', 'Preview perubahan sudah tidak tersedia. Periksa kembali sebelum menyimpan.');
        }

        try {
            $columns = $this->columns($table);
            $change = $this->prepareStructureChange($table, $columns, $pending['change'] ?? []);
            $this->analyzeExistingValuesBeforeStructureChange($table, $columns, $change);
            $createStatement = DB::selectOne("SHOW CREATE TABLE `{$table}`");
            Storage::put(
                'database-schema-backups/'.now()->format('Ymd-His')."-{$table}.sql",
                (string) ($createStatement->{'Create Table'} ?? ''),
            );
            $normalization = $this->normalizeExistingValuesBeforeStructureChange($table, $columns, $change);
            DB::statement($change['sql']);
        } catch (\InvalidArgumentException $exception) {
            return to_route('database-manager.structure', $table)
                ->with('error', $exception->getMessage());
        } catch (\Throwable) {
            return to_route('database-manager.structure', $table)
                ->with('error', 'Tipe kolom belum diubah. Pastikan data yang ada cocok dengan tipe yang dipilih.');
        }

        $request->session()->forget("database-manager.structure.{$token}");

        $extraMessage = ($normalization['count'] ?? 0) > 0
            ? " {$normalization['count']} nilai {$normalization['label']} lama dirapikan dulu."
            : '';

        return to_route('database-manager.show', $table)
            ->with('success', "Tipe kolom {$change['column']} berhasil diubah menjadi {$change['type']}.{$extraMessage}");
    }

    public function previewAddColumn(Request $request, string $table): Response
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);
        $validated = $this->validateAddColumnRequest($request);

        $payload = $this->structurePayload($table);
        try {
            $change = $this->prepareAddColumnChange($table, $payload['columns'], $validated);
        } catch (\InvalidArgumentException $exception) {
            return Inertia::render('DatabaseManager/Structure', [
                'table' => $payload,
                'preview' => null,
                'addPreview' => ['error' => $exception->getMessage()],
            ]);
        }

        $token = (string) Str::uuid();
        $request->session()->put("database-manager.structure.add.{$token}", [
            'table' => $table,
            'change' => $change['request'],
        ]);

        return Inertia::render('DatabaseManager/Structure', [
            'table' => $payload,
            'preview' => null,
            'addPreview' => [...$change, 'token' => $token],
        ]);
    }

    public function storeAddColumn(Request $request, string $table): \Illuminate\Http\RedirectResponse
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);
        $request->validate(['token' => ['required', 'uuid']]);

        $token = $request->string('token')->value();
        $pending = $request->session()->get("database-manager.structure.add.{$token}");
        if (! $pending || ($pending['table'] ?? null) !== $table) {
            return to_route('database-manager.structure', $table)
                ->with('error', 'Preview kolom baru sudah tidak tersedia. Periksa kembali sebelum menyimpan.');
        }

        try {
            $change = $this->prepareAddColumnChange($table, $this->columns($table), $pending['change'] ?? []);
            $createStatement = DB::selectOne("SHOW CREATE TABLE `{$table}`");
            Storage::put(
                'database-schema-backups/'.now()->format('Ymd-His')."-{$table}.sql",
                (string) ($createStatement->{'Create Table'} ?? ''),
            );
            DB::statement($change['sql']);
        } catch (\Throwable) {
            return to_route('database-manager.structure', $table)
                ->with('error', 'Kolom baru belum ditambahkan. Pastikan nama, tipe, bawaan, dan posisi kolom masih valid.');
        }

        $request->session()->forget("database-manager.structure.add.{$token}");

        return to_route('database-manager.structure', $table)
            ->with('success', "Kolom {$change['name']} berhasil ditambahkan ke tabel {$table}.");
    }

    public function import(string $table): Response
    {
        $this->guardTable($table);

        return Inertia::render('DatabaseManager/Import', [
            'table' => $this->importTablePayload($table),
            'preview' => null,
        ]);
    }

    public function previewImport(Request $request, string $table): Response
    {
        $this->guardTable($table);
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:51200'],
        ]);

        $definition = $this->importTablePayload($table);
        if ($definition['primaryKey'] === null) {
            return Inertia::render('DatabaseManager/Import', [
                'table' => $definition,
                'preview' => [
                    'errors' => [['row' => 0, 'message' => 'Tabel ini tidak memiliki satu primary key yang dapat dipakai sebagai penanda data. Impor tidak dijalankan agar tidak membuat data ganda.']],
                    'errorCount' => 1,
                    'totalRows' => 0,
                    'newRows' => 0,
                    'updateRows' => 0,
                    'validRows' => 0,
                    'sample' => [],
                    'token' => null,
                ],
            ]);
        }

        $storedPath = $request->file('file')->store('database-imports');

        try {
            $analysis = $this->analyseImport($table, $definition, Storage::path($storedPath));
        } catch (\Throwable $exception) {
            Storage::delete($storedPath);

            return Inertia::render('DatabaseManager/Import', [
                'table' => $definition,
                'preview' => [
                    'errors' => [['row' => 0, 'message' => 'File tidak dapat dibaca. Gunakan template asli dari tabel ini.']],
                    'errorCount' => 1,
                    'totalRows' => 0,
                    'newRows' => 0,
                    'updateRows' => 0,
                    'validRows' => 0,
                    'sample' => [],
                    'token' => null,
                ],
            ]);
        }

        $token = (string) Str::uuid();
        $request->session()->put("database-manager.imports.{$token}", [
            'table' => $table,
            'path' => $storedPath,
            'created_at' => now()->toIso8601String(),
        ]);

        return Inertia::render('DatabaseManager/Import', [
            'table' => $definition,
            'preview' => [...$analysis, 'token' => $token],
        ]);
    }

    public function commitImport(Request $request, string $table): \Illuminate\Http\RedirectResponse
    {
        $this->guardTable($table);
        $request->validate(['token' => ['required', 'uuid']]);

        $token = $request->string('token')->value();
        $import = $request->session()->get("database-manager.imports.{$token}");
        if (! $import || ($import['table'] ?? null) !== $table || ! Storage::exists($import['path'] ?? '')) {
            return to_route('database-manager.import', $table)
                ->with('error', 'Preview sudah tidak tersedia. Unggah file dan periksa kembali.');
        }

        $definition = $this->importTablePayload($table);
        $analysis = $this->analyseImport($table, $definition, Storage::path($import['path']));
        if ($analysis['errorCount'] > 0 || $analysis['validRows'] === 0) {
            return to_route('database-manager.import', $table)
                ->with('error', 'File berubah atau masih memiliki baris yang perlu diperbaiki. Preview ulang sebelum menyimpan.');
        }

        $created = 0;
        $updated = 0;
        try {
            DB::transaction(function () use ($table, $definition, $import, &$created, &$updated) {
                $buffer = [];
                foreach ($this->importRows(Storage::path($import['path']), $definition['columns']) as [$rowNumber, $row]) {
                    if ($rowNumber === 1) {
                        continue;
                    }

                    try {
                        $prepared = $this->prepareImportRow($rowNumber, $row, $definition);
                    } catch (\InvalidArgumentException $exception) {
                        throw new \RuntimeException(
                            "IMPORT_ROW_ERROR:{$rowNumber}:".$exception->getMessage(),
                            previous: $exception,
                        );
                    }
                    if ($prepared === null) {
                        continue;
                    }

                    $buffer[] = [$rowNumber, $prepared];
                    if (count($buffer) >= self::IMPORT_CHUNK_SIZE) {
                        [$createdRows, $updatedRows] = $this->persistImportChunk($table, $definition['primaryKey'], $buffer);
                        $created += $createdRows;
                        $updated += $updatedRows;
                        $buffer = [];
                    }
                }

                if ($buffer !== []) {
                    [$createdRows, $updatedRows] = $this->persistImportChunk($table, $definition['primaryKey'], $buffer);
                    $created += $createdRows;
                    $updated += $updatedRows;
                }
            });
        } catch (\Throwable $exception) {
            return to_route('database-manager.import', $table)
                ->with('error', $this->importFailureMessage($exception));
        }

        Storage::delete($import['path']);
        $request->session()->forget("database-manager.imports.{$token}");

        return to_route('database-manager.show', $table)
            ->with('success', "Impor selesai. {$created} data baru ditambahkan dan {$updated} data diperbarui.");
    }

    public function template(string $table): StreamedResponse
    {
        $this->guardTable($table);
        $columnDefinitions = $this->columns($table);
        $columns = collect($columnDefinitions)->pluck('name')->all();

        return $this->spreadsheet(
            [$columns],
            "template-{$table}.xlsx",
            $table,
            $columnDefinitions,
        );
    }

    public function export(string $table): StreamedResponse
    {
        $this->guardTable($table);
        $columnDefinitions = $this->columns($table);
        $columns = collect($columnDefinitions)->pluck('name')->all();
        $columnsByName = collect($columnDefinitions)->keyBy('name');
        $rows = DB::table($table)
            ->select($columns)
            ->limit(self::EXPORT_LIMIT)
            ->get()
            ->map(fn ($row) => array_map(
                fn ($column) => $this->exportValue(data_get($row, $column), $columnsByName->get($column)),
                $columns,
            ))
            ->all();

        return $this->spreadsheet(
            [$columns, ...$rows],
            "export-{$table}-".now()->format('Ymd-His').'.xlsx',
            $table,
            $columnDefinitions,
        );
    }

    public function exportCsv(string $table): StreamedResponse
    {
        $this->guardTable($table);
        $columnDefinitions = $this->columns($table);
        $columns = collect($columnDefinitions)->pluck('name')->all();
        $columnsByName = collect($columnDefinitions)->keyBy('name');
        $primaryKey = collect($columnDefinitions)->where('key', 'PRI')->pluck('name');
        $primaryKey = $primaryKey->count() === 1 ? $primaryKey->first() : null;

        return response()->streamDownload(function () use ($table, $columns, $columnsByName, $primaryKey) {
            $output = fopen('php://output', 'wb');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, $columns, ';');

            $query = DB::table($table)->select($columns);

            if ($primaryKey !== null) {
                $rows = $query->orderBy($primaryKey)->lazyById(1000, $primaryKey);
            } else {
                $fallbackOrder = $columns[0] ?? null;
                $rows = $fallbackOrder === null
                    ? collect()
                    : $query->orderBy($fallbackOrder)->lazy(1000);
            }

            foreach ($rows as $row) {
                fputcsv(
                    $output,
                    array_map(
                        fn (string $column) => $this->exportValue(data_get($row, $column), $columnsByName->get($column)),
                        $columns,
                    ),
                    ';',
                );
            }

            fclose($output);
        }, "export-{$table}-lengkap-".now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function guardTable(string $table): void
    {
        abort_unless(Schema::hasTable($table), 404);
    }

    private function guardSuperAdmin(Request $request): void
    {
        abort_unless($request->user()?->hasRole('super-admin'), 403);
    }

    private function guardEmptyDataTable(string $table): void
    {
        abort_if($this->isEmptyDataProtectedTable($table), 403, 'Tabel sistem tidak dapat dikosongkan dari halaman ini.');
    }

    private function isEmptyDataProtectedTable(string $table): bool
    {
        return in_array(strtolower($table), self::EMPTY_DATA_PROTECTED_TABLES, true);
    }

    private function columns(string $table): array
    {
        return collect(DB::select(
            'SELECT column_name AS columnName,
                    column_type AS columnType,
                    is_nullable AS isNullable,
                    column_default AS columnDefault,
                    column_key AS columnKey,
                    extra AS extraValue,
                    column_comment AS columnComment,
                    character_set_name AS characterSetName,
                    collation_name AS collationName,
                    srs_id AS srsId,
                    ordinal_position AS ordinalPosition
             FROM information_schema.columns
             WHERE table_schema = ? AND table_name = ?
             ORDER BY ordinal_position',
            [DB::getDatabaseName(), $table],
        ))->map(fn ($column) => [
            'name' => $column->columnName,
            'type' => $column->columnType,
            'nullable' => $column->isNullable === 'YES',
            'default' => $column->columnDefault,
            'key' => $column->columnKey,
            'extra' => $column->extraValue,
            'comment' => $column->columnComment,
            'characterSet' => $column->characterSetName,
            'collation' => $column->collationName,
            'srsId' => $column->srsId === null ? null : (int) $column->srsId,
            'position' => (int) $column->ordinalPosition,
        ])->values()->all();
    }

    private function spreadsheet(array $rows, string $fileName, string $sheetTitle, array $columnDefinitions): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows, $sheetTitle, $columnDefinitions) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle(substr($sheetTitle, 0, 31));

            $columnDefinitionsByIndex = collect($columnDefinitions)->values()->all();
            $columns = collect($columnDefinitionsByIndex)->pluck('name')->all();

            foreach ($rows as $rowNumber => $row) {
                foreach ($row as $columnNumber => $value) {
                    $coordinate = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnNumber + 1).($rowNumber + 1);
                    $sheet->setCellValueExplicit($coordinate, $this->exportValue($value, $columnDefinitionsByIndex[$columnNumber] ?? null), DataType::TYPE_STRING);
                    $sheet->getStyle($coordinate)->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);
                }
            }

            if ($columns !== []) {
                $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($columns));
                $sheet->getStyle("A1:{$lastColumn}1")->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
                $sheet->getStyle("A1:{$lastColumn}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4F46E5');
                $sheet->freezePane('A2');

                foreach (range(1, count($columns)) as $columnNumber) {
                    $sheet->getColumnDimensionByColumn($columnNumber)->setWidth(22);
                }
            }

            (new Xlsx($spreadsheet))->save('php://output');
        }, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function exportValue(mixed $value, ?array $column = null): string
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        $value = (string) $value;

        return $this->formatDateForExport($value, $column);
    }

    private function formatDateForExport(string $value, ?array $column): string
    {
        if ($value === '' || $column === null) {
            return $value;
        }

        if ($this->isTemporalColumn($column)) {
            return $this->normalizeTemporalTextForAppsheet($value, $column, false);
        }

        if ($this->isDateAnnotatedTextColumn($column)) {
            return $this->normalizeLeadingDateForExport($value);
        }

        return $value;
    }

    private function isTemporalColumn(array $column): bool
    {
        $baseType = strtolower((string) preg_replace('/\(.*/', '', (string) ($column['type'] ?? '')));

        return in_array($baseType, ['date', 'datetime', 'timestamp'], true)
            || $this->isAppsheetTemporalTextColumn($column);
    }

    private function importTablePayload(string $table): array
    {
        $columns = $this->columns($table);
        $primaryKeys = collect($columns)->where('key', 'PRI')->pluck('name')->values();

        return [
            'name' => $table,
            'columns' => $columns,
            'primaryKey' => $primaryKeys->count() === 1 ? $primaryKeys->first() : null,
            'templateUrl' => route('database-manager.template', $table),
            'previewUrl' => route('database-manager.import.preview', $table),
            'commitUrl' => route('database-manager.import.commit', $table),
            'detailUrl' => route('database-manager.show', $table),
        ];
    }

    private function structurePayload(string $table): array
    {
        $columns = $this->columns($table);

        return [
            'name' => $table,
            'columns' => $columns,
            'editableColumns' => collect($columns)
            ->filter(fn (array $column) => $column['key'] === '' && ! str_contains(strtolower((string) $column['extra']), 'auto_increment') && ! str_contains(strtolower((string) $column['extra']), 'generated'))
                ->map(fn (array $column) => [
                    'name' => $column['name'],
                    'type' => $column['type'],
                    'nullable' => $column['nullable'],
                    'default' => $column['default'],
                    'defaultMode' => $this->structureDefaultMode($column['default']),
                    'defaultValue' => $this->structureDefaultValue($column['default']),
                    'comment' => $column['comment'],
                    'collation' => $column['collation'],
                    'attribute' => $this->columnAttribute($column['type']),
                    'extra' => $this->editableExtra($column['extra']),
                    'options' => $this->typeOptions($column['type']),
                ])
                ->values()
                ->all(),
            'detailUrl' => route('database-manager.show', $table),
            'previewUrl' => route('database-manager.structure.preview', $table),
            'commitUrl' => route('database-manager.structure.update', $table),
            'addPreviewUrl' => route('database-manager.structure.add.preview', $table),
            'addCommitUrl' => route('database-manager.structure.add.store', $table),
            'typeGroups' => $this->mysqlTypeGroups(),
            'collations' => $this->collations(),
        ];
    }

    private function validateStructureRequest(Request $request): array
    {
        return $request->validate([
            'column' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/'],
            'name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/'],
            'type' => ['required', 'string', 'max:500'],
            'collation' => ['nullable', 'string', 'max:100'],
            'attribute' => ['nullable', 'in:,unsigned,zerofill,unsigned zerofill'],
            'nullable' => ['required', 'boolean'],
            'defaultMode' => ['required', 'in:none,null,value,current_timestamp'],
            'defaultValue' => ['nullable', 'string', 'max:10000'],
            'comment' => ['nullable', 'string', 'max:1024'],
            'extra' => ['nullable', 'in:,on update current_timestamp,on update current_timestamp(6)'],
        ]);
    }

    private function validateAddColumnRequest(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/', 'max:64'],
            'type' => ['required', 'string', 'max:500'],
            'collation' => ['nullable', 'string', 'max:100'],
            'attribute' => ['nullable', 'in:,unsigned,zerofill,unsigned zerofill'],
            'nullable' => ['required', 'boolean'],
            'defaultMode' => ['required', 'in:none,null,value,current_timestamp'],
            'defaultValue' => ['nullable', 'string', 'max:10000'],
            'comment' => ['nullable', 'string', 'max:1024'],
            'extra' => ['nullable', 'in:,on update current_timestamp,on update current_timestamp(6)'],
            'positionMode' => ['required', 'in:last,first,after'],
            'positionColumn' => ['nullable', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/'],
        ]);
    }

    private function validateCreateTableRequest(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/', 'max:64'],
            'columns' => ['required', 'array', 'min:1', 'max:80'],
            'columns.*.name' => ['required', 'string', 'regex:/^[A-Za-z_][A-Za-z0-9_]*$/', 'max:64'],
            'columns.*.type' => ['required', 'string', 'max:500'],
            'columns.*.collation' => ['nullable', 'string', 'max:100'],
            'columns.*.attribute' => ['nullable', 'in:,unsigned,zerofill,unsigned zerofill'],
            'columns.*.nullable' => ['required', 'boolean'],
            'columns.*.defaultMode' => ['required', 'in:none,null,value,current_timestamp'],
            'columns.*.defaultValue' => ['nullable', 'string', 'max:10000'],
            'columns.*.comment' => ['nullable', 'string', 'max:1024'],
            'columns.*.extra' => ['nullable', 'in:,on update current_timestamp,on update current_timestamp(6)'],
            'columns.*.primary' => ['required', 'boolean'],
            'columns.*.autoIncrement' => ['required', 'boolean'],
        ]);
    }

    private function prepareCreateTableStatement(array $request): string
    {
        $tableName = $request['name'];
        $columns = collect($request['columns'])
            ->map(fn (array $column) => [
                ...$column,
                'name' => trim((string) $column['name']),
                'type' => trim((string) $column['type']),
                'attribute' => trim((string) ($column['attribute'] ?? '')),
                'collation' => trim((string) ($column['collation'] ?? '')),
                'comment' => trim((string) ($column['comment'] ?? '')),
                'extra' => strtolower(trim((string) ($column['extra'] ?? ''))),
                'primary' => (bool) ($column['primary'] ?? false),
                'autoIncrement' => (bool) ($column['autoIncrement'] ?? false),
            ])
            ->values();

        $duplicates = $columns->pluck('name')->map(fn (string $name) => strtolower($name))->duplicates();
        if ($duplicates->isNotEmpty()) {
            throw new \InvalidArgumentException('Nama kolom tidak boleh sama dalam satu tabel.');
        }

        $primaryColumns = $columns->filter(fn (array $column) => $column['primary'])->pluck('name')->values();
        $autoIncrementColumns = $columns->filter(fn (array $column) => $column['autoIncrement'])->values();

        if ($autoIncrementColumns->count() > 1) {
            throw new \InvalidArgumentException('Auto increment hanya boleh dipakai pada satu kolom.');
        }

        if ($autoIncrementColumns->isNotEmpty()) {
            $autoColumn = $autoIncrementColumns->first();
            if (! $autoColumn['primary'] || $primaryColumns->count() !== 1) {
                throw new \InvalidArgumentException('Kolom auto increment harus menjadi satu-satunya primary key.');
            }

            if (! in_array($this->baseType($this->withAttribute($autoColumn['type'], $autoColumn['attribute'])), ['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint'], true)) {
                throw new \InvalidArgumentException('Auto increment hanya dapat dipakai pada tipe integer.');
            }
        }

        $definitions = $columns
            ->map(fn (array $column) => $this->createColumnDefinition($column))
            ->all();

        if ($primaryColumns->isNotEmpty()) {
            $definitions[] = 'PRIMARY KEY ('.$primaryColumns->map(fn (string $name) => "`{$name}`")->implode(', ').')';
        }

        $body = implode(",\n  ", $definitions);

        return "CREATE TABLE `{$tableName}` (\n  {$body}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    }

    private function createColumnDefinition(array $column): string
    {
        $type = $this->withAttribute($column['type'], $column['attribute'] ?? '');
        if (! $this->isSupportedMySqlColumnType($type)) {
            throw new \InvalidArgumentException("Tipe kolom {$column['name']} belum valid. Gunakan tipe MySQL seperti varchar(100), int, decimal(15,2), date, datetime, text, atau enum('A','B').");
        }

        $baseType = $this->baseType($type);
        $defaultMode = $column['defaultMode'];
        if ($defaultMode !== 'none' && in_array($baseType, ['tinyblob', 'blob', 'mediumblob', 'longblob', 'tinytext', 'text', 'mediumtext', 'longtext', 'json', 'geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection'], true)) {
            throw new \InvalidArgumentException("Kolom {$column['name']} memakai tipe {$baseType} yang tidak mendukung nilai bawaan.");
        }

        if (! $column['nullable'] && $defaultMode === 'null') {
            throw new \InvalidArgumentException("Kolom {$column['name']} wajib diisi, jadi tidak bisa memakai bawaan NULL.");
        }

        if ($defaultMode === 'current_timestamp' && ! in_array($baseType, ['timestamp', 'datetime'], true)) {
            throw new \InvalidArgumentException("Kolom {$column['name']} hanya bisa memakai CURRENT_TIMESTAMP untuk tipe TIMESTAMP atau DATETIME.");
        }

        if (($column['extra'] ?? '') !== '' && ! in_array($baseType, ['timestamp', 'datetime'], true)) {
            throw new \InvalidArgumentException("Kolom {$column['name']} hanya bisa memakai ON UPDATE untuk tipe TIMESTAMP atau DATETIME.");
        }

        $collation = $this->validCollation($column['collation'] ?? null, $baseType, null);
        $characterClause = $collation ? " CHARACTER SET `{$collation['charset']}` COLLATE `{$collation['name']}`" : '';
        $nullClause = $column['nullable'] && ! $column['autoIncrement'] ? 'NULL' : 'NOT NULL';
        $defaultClause = $column['autoIncrement'] ? '' : $this->requestedDefaultClause($defaultMode, $column['defaultValue'] ?? '');
        $extraClause = $column['autoIncrement'] ? ' AUTO_INCREMENT' : (($column['extra'] ?? '') !== '' ? ' '.strtoupper((string) $column['extra']) : '');
        $commentClause = ($column['comment'] ?? '') !== '' ? ' COMMENT '.DB::getPdo()->quote((string) $column['comment']) : '';

        return "`{$column['name']}` {$type}{$characterClause} {$nullClause}{$defaultClause}{$extraClause}{$commentClause}";
    }

    private function prepareStructureChange(string $table, array $columns, array $request): array
    {
        $columnName = $request['column'] ?? '';
        $column = collect($columns)->firstWhere('name', $columnName);
        if (! $column || $column['key'] !== '' || str_contains(strtolower((string) $column['extra']), 'auto_increment') || str_contains(strtolower((string) $column['extra']), 'generated')) {
            throw new \InvalidArgumentException('Kolom primary key, index, atau auto increment tidak dapat diubah dari halaman ini.');
        }

        $targetName = $request['name'];
        $targetType = $this->withAttribute($request['type'], $request['attribute'] ?? '');
        if (! $this->isSupportedMySqlColumnType($targetType)) {
            throw new \InvalidArgumentException('Definisi tipe tidak didukung. Pilih dari daftar MySQL atau tulis definisi lengkap seperti varchar(100), decimal(15,2), enum(\'A\',\'B\'), atau geometry.');
        }

        $baseType = $this->baseType($targetType);
        $defaultMode = $request['defaultMode'];
        if ($defaultMode !== 'none' && in_array($baseType, ['tinyblob', 'blob', 'mediumblob', 'longblob', 'tinytext', 'text', 'mediumtext', 'longtext', 'json', 'geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection'], true)) {
            throw new \InvalidArgumentException("Tipe {$baseType} tidak mendukung nilai bawaan pada konfigurasi ini.");
        }

        if (! $request['nullable'] && $defaultMode === 'null') {
            throw new \InvalidArgumentException('Kolom NOT NULL tidak dapat menggunakan nilai bawaan NULL.');
        }

        if (! $request['nullable'] && DB::table($table)->whereNull($columnName)->exists()) {
            throw new \InvalidArgumentException('Kolom ini masih memiliki data kosong. Isi atau perbaiki data tersebut sebelum memilih Tak Ternilai: TIDAK.');
        }

        if ($defaultMode === 'current_timestamp' && ! in_array($baseType, ['timestamp', 'datetime'], true)) {
            throw new \InvalidArgumentException('CURRENT_TIMESTAMP hanya dapat digunakan pada kolom TIMESTAMP atau DATETIME.');
        }

        $extra = strtolower(trim((string) ($request['extra'] ?? '')));
        if ($extra !== '' && ! in_array($baseType, ['timestamp', 'datetime'], true)) {
            throw new \InvalidArgumentException('Extra ON UPDATE hanya dapat digunakan pada kolom TIMESTAMP atau DATETIME.');
        }

        $collation = $this->validCollation($request['collation'] ?? null, $baseType, $column['collation']);
        $characterClause = $collation ? " CHARACTER SET `{$collation['charset']}` COLLATE `{$collation['name']}`" : '';
        $sridClause = $column['srsId'] !== null && in_array($baseType, ['geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection'], true)
            ? " SRID {$column['srsId']}"
            : '';
        $nullClause = $request['nullable'] ? 'NULL' : 'NOT NULL';
        $defaultClause = $this->requestedDefaultClause($defaultMode, $request['defaultValue'] ?? '');
        $comment = (string) ($request['comment'] ?? '');
        $commentClause = $comment !== '' ? ' COMMENT '.DB::getPdo()->quote($comment) : '';
        $extraClause = $extra !== '' ? ' '.strtoupper($extra) : '';
        $renameClause = $targetName === $columnName ? "MODIFY COLUMN `{$columnName}`" : "CHANGE COLUMN `{$columnName}` `{$targetName}`";
        $sql = "ALTER TABLE `{$table}` {$renameClause} {$targetType}{$characterClause}{$sridClause} {$nullClause}{$defaultClause}{$extraClause}{$commentClause}";

        return [
            'column' => $columnName,
            'name' => $targetName,
            'currentType' => $column['type'],
            'type' => $targetType,
            'sql' => $sql,
            'request' => [
                'column' => $columnName,
                'name' => $targetName,
                'type' => $request['type'],
                'collation' => $request['collation'] ?? '',
                'attribute' => $request['attribute'] ?? '',
                'nullable' => (bool) $request['nullable'],
                'defaultMode' => $defaultMode,
                'defaultValue' => $request['defaultValue'] ?? '',
                'comment' => $comment,
                'extra' => $extra,
            ],
        ];
    }

    private function normalizeExistingValuesBeforeStructureChange(string $table, array $columns, array $change): array
    {
        $baseType = $this->baseType((string) $change['type']);
        if (! $this->shouldNormalizeBeforeStructureChange($baseType)) {
            return ['count' => 0, 'label' => 'data'];
        }

        $columnName = (string) $change['column'];
        $column = collect($columns)->firstWhere('name', $columnName);
        if (! $column) {
            throw new \InvalidArgumentException("Kolom {$columnName} tidak ditemukan saat validasi data lama.");
        }

        $withTime = in_array($baseType, ['datetime', 'timestamp'], true);
        $isNullableTarget = (bool) data_get($change, 'request.nullable', $column['nullable']);
        $targetColumn = [
            ...$column,
            'type' => $change['type'],
        ];
        $label = $this->normalizationLabel($baseType);

        $normalized = 0;
        $emptyCount = DB::table($table)
            ->whereNotNull($columnName)
            ->whereRaw("TRIM(CAST(`{$columnName}` AS CHAR)) = ''")
            ->count();

        if ($emptyCount > 0) {
            if (! $isNullableTarget) {
                throw new \InvalidArgumentException("Kolom {$columnName} masih memiliki {$emptyCount} nilai kosong. Jadikan kolom boleh NULL dulu, atau isi datanya sebelum mengubah tipe.");
            }

            $normalized += DB::table($table)
                ->whereNotNull($columnName)
                ->whereRaw("TRIM(CAST(`{$columnName}` AS CHAR)) = ''")
                ->update([$columnName => null]);
        }

        $values = DB::table($table)
            ->select($columnName)
            ->whereNotNull($columnName)
            ->distinct()
            ->orderBy($columnName)
            ->lazy(500);

        foreach ($values as $row) {
            $currentValue = trim((string) ($row->{$columnName} ?? ''));
            if ($currentValue === '') {
                continue;
            }

            try {
                $nextValue = $this->normalizeStructureValue($currentValue, $targetColumn, $baseType, $withTime);
            } catch (\InvalidArgumentException $exception) {
                throw new \InvalidArgumentException(
                    "Tipe kolom belum diubah. Kolom {$columnName} masih punya nilai \"{$currentValue}\" yang belum cocok untuk tipe {$change['type']}. ".$this->normalizationHint($baseType, $withTime),
                    previous: $exception,
                );
            }

            if ($nextValue === $currentValue) {
                continue;
            }

            $normalized += DB::table($table)
                ->where($columnName, $currentValue)
                ->update([$columnName => $nextValue]);
        }

        return ['count' => $normalized, 'label' => $label];
    }

    /**
     * Read-only validation before a column is changed. Text columns are never
     * reformatted here: only native SQL targets may require value conversion.
     */
    private function analyzeExistingValuesBeforeStructureChange(string $table, array $columns, array $change): array
    {
        $columnName = (string) $change['column'];
        $column = collect($columns)->firstWhere('name', $columnName);
        if (! $column) {
            throw new \InvalidArgumentException("Kolom {$columnName} tidak ditemukan saat memeriksa data lama.");
        }

        $baseType = $this->baseType((string) $change['type']);
        $targetLength = $this->characterLengthLimit((string) $change['type']);
        $withTime = in_array($baseType, ['datetime', 'timestamp'], true);
        $nullable = (bool) data_get($change, 'request.nullable', $column['nullable']);
        $requiresConversion = $this->shouldNormalizeBeforeStructureChange($baseType);
        $emptyCount = DB::table($table)
            ->whereNotNull($columnName)
            ->whereRaw("TRIM(CAST(`{$columnName}` AS CHAR)) = ''")
            ->count();

        if ($emptyCount > 0 && ! $nullable) {
            throw new \InvalidArgumentException("Kolom {$columnName} masih memiliki {$emptyCount} nilai kosong. Jadikan kolom boleh NULL dulu, atau isi datanya sebelum mengubah tipe.");
        }

        $checked = 0;
        $willNormalize = 0;
        $samples = [];
        $targetColumn = [...$column, 'type' => $change['type']];
        $values = DB::table($table)
            ->select($columnName)
            ->whereNotNull($columnName)
            ->distinct()
            ->orderBy($columnName)
            ->lazy(500);

        foreach ($values as $row) {
            $currentValue = trim((string) ($row->{$columnName} ?? ''));
            if ($currentValue === '') {
                continue;
            }

            $checked++;
            try {
                $nextValue = $requiresConversion
                    ? $this->normalizeStructureValue($currentValue, $targetColumn, $baseType, $withTime)
                    : $currentValue;
            } catch (\InvalidArgumentException $exception) {
                throw new \InvalidArgumentException(
                    "Kolom {$columnName} masih punya nilai \"{$currentValue}\" yang belum cocok untuk tipe {$change['type']}. ".$this->normalizationHint($baseType, $withTime),
                    previous: $exception,
                );
            }

            if ($targetLength !== null && Str::length($nextValue) > $targetLength) {
                throw new \InvalidArgumentException(
                    "Kolom {$columnName} masih punya nilai \"{$currentValue}\" sepanjang ".Str::length($nextValue)." karakter, sedangkan target {$change['type']} hanya {$targetLength} karakter.",
                );
            }

            if ($nextValue !== $currentValue) {
                $willNormalize++;
                if (count($samples) < 5) {
                    $samples[] = ['from' => $currentValue, 'to' => $nextValue];
                }
            }
        }

        return [
            'mode' => $requiresConversion ? 'native' : 'direct',
            'checked' => $checked,
            'empty' => $emptyCount,
            'willNormalize' => $willNormalize,
            'samples' => $samples,
            'message' => $requiresConversion
                ? 'Nilai lama akan dibaca dulu lalu disimpan dalam format internal MySQL.'
                : 'Tidak ada penulisan ulang nilai data. Perubahan hanya diterapkan pada struktur kolom.',
        ];
    }

    private function shouldNormalizeBeforeStructureChange(string $baseType): bool
    {
        return in_array($baseType, [
            'bit',
            'bool',
            'boolean',
            'date',
            'datetime',
            'timestamp',
            'time',
            'year',
            'tinyint',
            'smallint',
            'mediumint',
            'int',
            'integer',
            'bigint',
            'decimal',
            'numeric',
            'fixed',
            'float',
            'double',
            'double precision',
            'real',
        ], true);
    }

    private function normalizationLabel(string $baseType): string
    {
        if (in_array($baseType, ['date', 'datetime', 'timestamp', 'time', 'year'], true)) {
            return 'tanggal/waktu';
        }

        if (in_array($baseType, ['bool', 'boolean', 'bit'], true)) {
            return 'ya/tidak';
        }

        return 'angka';
    }

    private function normalizationHint(string $baseType, bool $withTime): string
    {
        if (in_array($baseType, ['date', 'datetime', 'timestamp'], true)) {
            return 'Pakai format YYYY-MM-DD'.($withTime ? ' atau YYYY-MM-DD HH:mm:ss' : '').'.';
        }

        if ($baseType === 'time') {
            return 'Pakai format HH:mm atau HH:mm:ss.';
        }

        if ($baseType === 'year') {
            return 'Pakai tahun 4 digit, misalnya 2026.';
        }

        if (in_array($baseType, ['bool', 'boolean', 'bit'], true)) {
            return 'Pakai nilai Ya/Tidak, TRUE/FALSE, atau 1/0.';
        }

        return 'Untuk angka, gunakan digit biasa; Rp, titik ribuan, koma desimal, dan persen akan dirapikan otomatis.';
    }

    private function characterLengthLimit(string $type): ?int
    {
        if (preg_match('/^(?:char|varchar)\((\d+)\)$/i', trim($type), $matches) !== 1) {
            return null;
        }

        return (int) $matches[1];
    }

    private function normalizeStructureValue(string $value, array $column, string $baseType, bool $withTime): string
    {
        return match ($baseType) {
            'date' => $this->normalizeImportDate($value, $column, false),
            'datetime', 'timestamp' => $this->normalizeImportDate($value, $column, $withTime),
            'time' => $this->normalizeTimeValue($value, $column),
            'year' => $this->normalizeYearValue($value, $column),
            'bool', 'boolean', 'bit' => $this->normalizeBooleanValue($value, $column),
            'tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint' => $this->normalizeIntegerValue($value, $column),
            'decimal', 'numeric', 'fixed', 'float', 'double', 'double precision', 'real' => $this->normalizeDecimalValue($value, $column),
            default => $value,
        };
    }

    private function prepareAddColumnChange(string $table, array $columns, array $request): array
    {
        $name = trim((string) ($request['name'] ?? ''));
        $existingNames = collect($columns)->pluck('name')->map(fn (string $column) => strtolower($column));
        if ($existingNames->contains(strtolower($name))) {
            throw new \InvalidArgumentException("Kolom {$name} sudah ada di tabel ini.");
        }

        $positionMode = (string) ($request['positionMode'] ?? 'last');
        $positionColumn = trim((string) ($request['positionColumn'] ?? ''));
        if ($positionMode === 'after' && ! collect($columns)->contains(fn (array $column) => $column['name'] === $positionColumn)) {
            throw new \InvalidArgumentException('Kolom tujuan posisi belum valid. Pilih kolom yang masih ada di tabel.');
        }

        $column = [
            'name' => $name,
            'type' => trim((string) ($request['type'] ?? '')),
            'collation' => trim((string) ($request['collation'] ?? '')),
            'attribute' => trim((string) ($request['attribute'] ?? '')),
            'nullable' => (bool) ($request['nullable'] ?? false),
            'defaultMode' => (string) ($request['defaultMode'] ?? 'none'),
            'defaultValue' => (string) ($request['defaultValue'] ?? ''),
            'comment' => trim((string) ($request['comment'] ?? '')),
            'extra' => strtolower(trim((string) ($request['extra'] ?? ''))),
            'autoIncrement' => false,
        ];

        if (! $column['nullable'] && $column['defaultMode'] === 'none' && DB::table($table)->exists()) {
            throw new \InvalidArgumentException('Tabel sudah berisi data. Untuk kolom wajib isi, pilih nilai bawaan dulu agar data lama tetap aman.');
        }

        $definition = $this->createColumnDefinition($column);
        $positionClause = match ($positionMode) {
            'first' => ' FIRST',
            'after' => " AFTER `{$positionColumn}`",
            default => '',
        };
        $sql = "ALTER TABLE `{$table}` ADD COLUMN {$definition}{$positionClause}";

        return [
            'mode' => 'add',
            'name' => $name,
            'type' => $this->withAttribute($column['type'], $column['attribute']),
            'positionMode' => $positionMode,
            'positionColumn' => $positionColumn,
            'sql' => $sql,
            'request' => [
                'name' => $name,
                'type' => $column['type'],
                'collation' => $column['collation'],
                'attribute' => $column['attribute'],
                'nullable' => $column['nullable'],
                'defaultMode' => $column['defaultMode'],
                'defaultValue' => $column['defaultValue'],
                'comment' => $column['comment'],
                'extra' => $column['extra'],
                'positionMode' => $positionMode,
                'positionColumn' => $positionColumn,
            ],
        ];
    }

    private function columnAttribute(string $type): string
    {
        $type = strtolower($type);

        return str_contains($type, 'unsigned') && str_contains($type, 'zerofill') ? 'unsigned zerofill' : (str_contains($type, 'unsigned') ? 'unsigned' : (str_contains($type, 'zerofill') ? 'zerofill' : ''));
    }

    private function editableExtra(string $extra): string
    {
        $extra = strtolower(trim($extra));

        return in_array($extra, ['on update current_timestamp', 'on update current_timestamp(6)'], true) ? $extra : '';
    }

    private function withAttribute(string $type, string $attribute): string
    {
        $type = strtolower(trim(preg_replace('/\s+/', ' ', $type)));
        $type = trim((string) preg_replace('/\s+(?:unsigned|zerofill)(?:\s+(?:unsigned|zerofill))?$/', '', $type));

        return trim($type.' '.trim($attribute));
    }

    private function collations(): array
    {
        return collect(DB::select('SELECT collation_name AS collationName, character_set_name AS characterSetName FROM information_schema.collations ORDER BY character_set_name, collation_name'))
            ->map(fn ($collation) => ['name' => $collation->collationName, 'charset' => $collation->characterSetName])
            ->values()
            ->all();
    }

    private function validCollation(?string $collation, string $baseType, ?string $currentCollation): ?array
    {
        if (! $this->supportsCharacterSet($baseType)) {
            return null;
        }

        $target = trim((string) ($collation ?: $currentCollation));
        if ($target === '') {
            return null;
        }

        $match = collect($this->collations())->firstWhere('name', $target);
        if (! $match) {
            throw new \InvalidArgumentException('Penyortiran/collation yang dipilih tidak tersedia di server MySQL.');
        }

        return $match;
    }

    private function requestedDefaultClause(string $mode, mixed $value): string
    {
        return match ($mode) {
            'null' => ' DEFAULT NULL',
            'value' => ' DEFAULT '.DB::getPdo()->quote((string) $value),
            'current_timestamp' => ' DEFAULT CURRENT_TIMESTAMP',
            default => '',
        };
    }

    private function structureDefaultMode(mixed $default): string
    {
        if ($default === null) {
            return 'none';
        }

        return in_array(strtoupper((string) $default), ['CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()'], true) ? 'current_timestamp' : 'value';
    }

    private function structureDefaultValue(mixed $default): string
    {
        return $default === null || in_array(strtoupper((string) $default), ['CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()'], true) ? '' : (string) $default;
    }

    private function typeOptions(string $currentType): array
    {
        return collect($this->mysqlTypeGroups())
            ->flatMap(fn (array $group) => $group['types'])
            ->pluck('value')
            ->push(strtolower($currentType))
            ->unique()
            ->values()
            ->all();
    }

    private function mysqlTypeGroups(): array
    {
        return [
            ['label' => 'Teks umum', 'types' => $this->typeChoices(['varchar(10)', 'varchar(19)', 'varchar(50)', 'varchar(100)', 'varchar(255)', 'varchar(500)', 'varchar(1000)', 'text', 'mediumtext', 'longtext'])],
            ['label' => 'Angka', 'types' => $this->typeChoices(['tinyint', 'smallint', 'int', 'bigint', 'decimal(10,2)', 'decimal(15,2)', 'decimal(20,2)', 'float', 'double'])],
            ['label' => 'Tanggal native MySQL', 'types' => $this->typeChoices(['date', 'time', 'datetime', 'timestamp', 'year'])],
            ['label' => 'Format khusus', 'types' => $this->typeChoices(['json'], [['label' => "ENUM (pakai kolom jenis sendiri)", 'value' => '__enum__'], ['label' => "SET (pakai kolom jenis sendiri)", 'value' => '__set__'], ['label' => 'Tipe SQL lain: isi lewat Jenis sendiri', 'value' => '__custom__']])],
        ];
    }

    private function typeChoices(array $types, array $disabled = []): array
    {
        return [
            ...array_map(fn (string $type) => ['value' => $type, 'label' => strtoupper($type)], $types),
            ...array_map(fn (array $type) => [...$type, 'disabled' => true], $disabled),
        ];
    }

    private function baseType(string $type): string
    {
        return strtolower((string) preg_replace('/\(.+$/', '', preg_replace('/\s+(?:unsigned|zerofill)(?:\s+(?:unsigned|zerofill))*$/', '', trim($type))));
    }

    private function supportsCharacterSet(string $baseType): bool
    {
        return in_array($baseType, ['char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'enum', 'set'], true);
    }

    private function isSupportedMySqlColumnType(string $type): bool
    {
        $type = strtolower(trim(preg_replace('/\s+/', ' ', $type)));
        $patterns = [
            '/^(?:tinyint|smallint|mediumint|int|integer|bigint)(?:\(\d{1,3}\))?(?: unsigned)?(?: zerofill)?$/',
            '/^(?:decimal|numeric|fixed)\((?:[1-9]|[1-5]\d|6[0-5]),(?:\d|[12]\d|3[0-0])\)(?: unsigned)?$/',
            '/^(?:float|double|double precision|real)(?:\(\d{1,2},\d{1,2}\))?(?: unsigned)?$/',
            '/^bit\((?:[1-9]|[1-5]\d|6[0-4])\)$/',
            '/^(?:bool|boolean)$/',
            '/^(?:char|varchar|binary|varbinary)\((?:[1-9]\d{0,4}|[1-5]\d{5}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])\)$/',
            '/^(?:tinyblob|blob|mediumblob|longblob|tinytext|text|mediumtext|longtext|json)$/',
            '/^(?:date|time(?:\([0-6]\))?|datetime(?:\([0-6]\))?|timestamp(?:\([0-6]\))?|year)$/',
            '/^(?:geometry|point|linestring|polygon|multipoint|multilinestring|multipolygon|geometrycollection)$/',
            "/^(?:enum|set)\\((?:'(?:[^'\\\\]|\\\\.)*')(?:,(?:'(?:[^'\\\\]|\\\\.)*'))*\\)$/",
        ];

        return collect($patterns)->contains(fn (string $pattern) => preg_match($pattern, $type) === 1);
    }

    private function defaultClause(mixed $default): string
    {
        if ($default === null) {
            return '';
        }

        $default = (string) $default;
        if (in_array(strtoupper($default), ['CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()'], true)) {
            return ' DEFAULT CURRENT_TIMESTAMP';
        }

        return ' DEFAULT '.DB::getPdo()->quote($default);
    }

    private function analyseImport(string $table, array $definition, string $path): array
    {
        $expectedColumns = collect($definition['columns'])->pluck('name')->all();
        $primaryKey = $definition['primaryKey'];
        $errors = [];
        $sample = [];
        $totalRows = 0;
        $newRows = 0;
        $updateRows = 0;
        $validRows = 0;
        $buffer = [];

        foreach ($this->importRows($path, $definition['columns']) as [$rowNumber, $row]) {
            if ($rowNumber === 1) {
                if ($row !== $expectedColumns) {
                    return [
                        'errors' => [['row' => 1, 'message' => 'Urutan atau nama kolom tidak sama dengan template asli. Unduh template tabel ini lalu gunakan tanpa mengubah judul kolom.']],
                        'errorCount' => 1,
                        'totalRows' => 0,
                        'newRows' => 0,
                        'updateRows' => 0,
                        'validRows' => 0,
                        'sample' => [],
                    ];
                }
                continue;
            }

            if ($this->isEmptyRow($row)) {
                continue;
            }

            $totalRows++;
            if (count($row) !== count($expectedColumns)) {
                $this->appendImportError($errors, $rowNumber, 'Jumlah kolom pada baris ini tidak sama dengan template.');
                continue;
            }
            try {
                $prepared = $this->prepareImportRow($rowNumber, $row, $definition);
            } catch (\InvalidArgumentException $exception) {
                $this->appendImportError($errors, $rowNumber, $exception->getMessage());
                continue;
            }
            if ($prepared === null) {
                $this->appendImportError($errors, $rowNumber, 'Primary key wajib diisi untuk tabel ini.');
                continue;
            }

            $buffer[] = [$rowNumber, $prepared];
            if (count($buffer) >= self::IMPORT_CHUNK_SIZE) {
                [$newCount, $updateCount, $validCount] = $this->classifyImportChunk($table, $primaryKey, $buffer, $sample);
                $newRows += $newCount;
                $updateRows += $updateCount;
                $validRows += $validCount;
                $buffer = [];
            }
        }

        if ($buffer !== []) {
            [$newCount, $updateCount, $validCount] = $this->classifyImportChunk($table, $primaryKey, $buffer, $sample);
            $newRows += $newCount;
            $updateRows += $updateCount;
            $validRows += $validCount;
        }

        return [
            'errors' => $errors,
            'errorCount' => count($errors),
            'totalRows' => $totalRows,
            'newRows' => $newRows,
            'updateRows' => $updateRows,
            'validRows' => $validRows,
            'sample' => array_slice($sample, 0, 12),
        ];
    }

    private function classifyImportChunk(string $table, string $primaryKey, array $buffer, array &$sample): array
    {
        $keys = collect($buffer)->pluck(1)->pluck($primaryKey)->filter()->unique()->values();
        $existing = $keys->isEmpty()
            ? collect()
            : DB::table($table)->whereIn($primaryKey, $keys)->pluck($primaryKey)->flip();
        $newRows = 0;
        $updateRows = 0;

        foreach ($buffer as [, $row]) {
            $isUpdate = $existing->has($row[$primaryKey]);
            $isUpdate ? $updateRows++ : $newRows++;
            if (count($sample) < 12) {
                $sample[] = [...$row, '__action' => $isUpdate ? 'Perbarui' : 'Baru'];
            }
        }

        return [$newRows, $updateRows, count($buffer)];
    }

    private function persistImportChunk(string $table, string $primaryKey, array $rows): array
    {
        $keys = collect($rows)->pluck(1)->pluck($primaryKey)->filter()->unique()->values();
        $existing = $keys->isEmpty()
            ? collect()
            : DB::table($table)->whereIn($primaryKey, $keys)->pluck($primaryKey)->flip();
        $created = 0;
        $updated = 0;

        foreach ($rows as [$rowNumber, $row]) {
            try {
                $key = $row[$primaryKey];
                if ($existing->has($key)) {
                    $updates = $row;
                    unset($updates[$primaryKey]);
                    if ($updates !== []) {
                        DB::table($table)->where($primaryKey, $key)->update($updates);
                    }
                    $updated++;
                    continue;
                }

                DB::table($table)->insert($row);
                $created++;
            } catch (\Throwable $exception) {
                throw new \RuntimeException(
                    "IMPORT_ROW_ERROR:{$rowNumber}:".$this->databaseImportError($exception),
                    previous: $exception,
                );
            }
        }

        return [$created, $updated];
    }

    private function importFailureMessage(\Throwable $exception): string
    {
        if (preg_match('/^IMPORT_ROW_ERROR:(\d+):(.*)$/', $exception->getMessage(), $matches) === 1) {
            return "Baris {$matches[1]} belum disimpan: {$matches[2]}";
        }

        return 'Data belum disimpan karena ada nilai yang tidak sesuai dengan aturan tabel. Periksa kembali isi file atau gunakan template asli.';
    }

    private function databaseImportError(\Throwable $exception): string
    {
        $message = $exception->getMessage();

        if (preg_match("/Data too long for column '([^']+)'/i", $message, $matches) === 1) {
            return "nilai pada kolom {$matches[1]} terlalu panjang untuk tipe kolomnya.";
        }

        if (preg_match("/Column '([^']+)' cannot be null/i", $message, $matches) === 1) {
            return "kolom {$matches[1]} wajib diisi.";
        }

        if (preg_match("/Incorrect (?:date|datetime|integer|decimal|double) value: .*? for column '([^']+)'/i", $message, $matches) === 1) {
            return "format nilai pada kolom {$matches[1]} tidak sesuai.";
        }

        if (str_contains(strtolower($message), 'duplicate entry')) {
            return 'primary key atau nilai unik sudah dipakai oleh data lain.';
        }

        return 'nilai pada salah satu kolom tidak sesuai dengan aturan tabel.';
    }

    private function prepareImportRow(int $rowNumber, array $row, array $definition): ?array
    {
        $columns = $definition['columns'];
        if (count($row) !== count($columns)) {
            return null;
        }
        $values = array_combine(collect($columns)->pluck('name')->all(), $row);
        $primaryKey = $definition['primaryKey'];
        $prepared = [];

        foreach ($columns as $column) {
            $name = $column['name'];
            $value = trim((string) ($values[$name] ?? ''));
            if ($name === $primaryKey && $value === '') {
                if ($name === 'id_key') {
                    $value = (string) Str::uuid();
                } elseif (str_contains(strtolower((string) $column['extra']), 'auto_increment')) {
                    $prepared[$name] = null;
                    continue;
                } else {
                    return null;
                }
            }

            if ($value === '') {
                if ($column['nullable']) {
                    continue;
                }
                if ($column['default'] !== null || str_contains(strtolower((string) $column['extra']), 'auto_increment')) {
                    continue;
                }
            }

            $prepared[$name] = $this->normalizeImportValue($value, $column);
        }

        return $prepared;
    }

    private function normalizeImportValue(string $value, array $column): string
    {
        $type = strtolower((string) $column['type']);
        $baseType = preg_replace('/\(.*/', '', $type);

        if (in_array($baseType, ['char', 'varchar', 'text', 'tinytext', 'mediumtext', 'longtext'], true)
            && $this->isAppsheetTemporalTextColumn($column)
        ) {
            return $this->normalizeTemporalTextForAppsheet($value, $column, true);
        }

        return match ($baseType) {
            'date' => $this->normalizeImportDate($value, $column, false),
            'datetime', 'timestamp' => $this->normalizeImportDate($value, $column, true),
            'time' => $this->normalizeTimeValue($value, $column),
            'year' => $this->normalizeYearValue($value, $column),
            'bool', 'boolean', 'bit' => $this->normalizeBooleanValue($value, $column),
            'tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint' => $this->normalizeIntegerValue($value, $column),
            'decimal', 'numeric', 'fixed', 'float', 'double', 'double precision', 'real' => $this->normalizeDecimalValue($value, $column),
            default => $value,
        };
    }

    private function isAppsheetTemporalTextColumn(array $column): bool
    {
        $name = strtolower((string) ($column['name'] ?? ''));

        if (preg_match('/(?:selisih|total)_?(?:jam|waktu)|jam_overtime|approval_ovt/', $name) === 1) {
            return false;
        }

        return preg_match('/(?:tanggal|tgl|datetime|waktu|tempo|(?:^|_)date(?:_|$))/', $name) === 1
            || preg_match('/^jam_(?:mulai|selesai|request|proses|isi_bbm_\d+)$/', $name) === 1
            || $name === 'jam';
    }

    private function isAppsheetDateOnlyTextColumn(array $column): bool
    {
        $name = strtolower((string) ($column['name'] ?? ''));

        if ($this->temporalColumnExpectsDateTime($column)) {
            return false;
        }

        return preg_match('/(?:tanggal|tgl|tempo|(?:^|_)date(?:_|$))/', $name) === 1;
    }

    private function isDateAnnotatedTextColumn(array $column): bool
    {
        return in_array(strtolower((string) ($column['name'] ?? '')), ['add_data', 'update_data'], true);
    }

    private function normalizeLeadingDateForExport(string $value): string
    {
        if (preg_match('/^(?<date>\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})(?<suffix>.*)$/', $value, $matches) !== 1) {
            return $value;
        }

        $date = $this->parseTemporalTextValue((string) $matches['date'], false);

        return $date === null ? $value : $date->format('Y-m-d').$matches['suffix'];
    }

    private function normalizeTemporalTextForAppsheet(string $value, array $column, bool $strict, bool $forceDateOnly = false): string
    {
        $value = trim($value);
        if ($value === '') {
            return $value;
        }

        if (preg_match('/^(?:0|0000-00-00|00\/00\/0000|00-00-0000)$/', $value) === 1) {
            return $strict ? '' : $value;
        }

        $name = strtolower((string) ($column['name'] ?? ''));
        $expectsTimeOnly = preg_match('/^jam_(?:request|proses|isi_bbm_\d+)$/', $name) === 1 || $name === 'jam';
        if ($expectsTimeOnly && preg_match('/^\d{1,2}[:.]\d{2}(?::\d{2}|\.\d{2})?$/', $value) === 1) {
            return str_replace('.', ':', strlen($value) <= 5 ? $value.':00' : $value);
        }

        $inputContainsTime = preg_match('/(?:\s|T)\d{1,2}[:.]\d{2}/', $value) === 1;
        $parseWithTime = $this->temporalColumnExpectsDateTime($column)
            || $inputContainsTime;
        $withTime = ! $forceDateOnly && $parseWithTime;
        $normalizedValue = preg_replace('/(\d{1,2})\.(\d{2})(?:\.(\d{2}))?$/', '$1:$2:$3', $value) ?? $value;
        $normalizedValue = rtrim($normalizedValue, ':');
        $normalizedValue = $this->normalizeIndonesianMonthName($normalizedValue);

        $date = $this->parseTemporalTextValue($normalizedValue, $parseWithTime);
        if ($date === null && is_numeric($value) && (float) $value > 0) {
            try {
                $date = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value));
                $withTime = ! $forceDateOnly && ($withTime || $this->temporalColumnExpectsDateTime($column) || ((float) $value !== floor((float) $value)));
            } catch (\Throwable) {
                $date = null;
            }
        }

        if ($date === null) {
            if ($strict) {
                throw new \InvalidArgumentException('kolom '.$column['name'].' berisi "'.$value.'", tetapi belum terbaca sebagai tanggal. Pakai YYYY-MM-DD atau YYYY-MM-DD HH:mm:ss.');
            }

            return $value;
        }

        return $date->format($withTime ? 'Y-m-d H:i:s' : 'Y-m-d');
    }

    private function normalizeIndonesianMonthName(string $value): string
    {
        $months = [
            'januari' => '01',
            'jan' => '01',
            'februari' => '02',
            'feb' => '02',
            'maret' => '03',
            'mar' => '03',
            'april' => '04',
            'apr' => '04',
            'mei' => '05',
            'juni' => '06',
            'jun' => '06',
            'juli' => '07',
            'jul' => '07',
            'agustus' => '08',
            'agu' => '08',
            'aug' => '08',
            'september' => '09',
            'sep' => '09',
            'oktober' => '10',
            'okt' => '10',
            'oct' => '10',
            'november' => '11',
            'nov' => '11',
            'desember' => '12',
            'des' => '12',
            'dec' => '12',
        ];

        return preg_replace_callback(
            '/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(\b(?:\s+\d{1,2}[:.]\d{2}(?::\d{2})?)?)/',
            function (array $matches) use ($months): string {
                $month = $months[strtolower($matches[2])] ?? null;
                if ($month === null) {
                    return $matches[0];
                }

                $time = trim((string) ($matches[4] ?? ''));

                return str_pad($matches[1], 2, '0', STR_PAD_LEFT).'/'.$month.'/'.$matches[3].($time !== '' ? ' '.$time : '');
            },
            $value,
        ) ?? $value;
    }

    private function temporalColumnExpectsDateTime(array $column): bool
    {
        $baseType = strtolower((string) preg_replace('/\(.*/', '', (string) ($column['type'] ?? '')));
        if (in_array($baseType, ['datetime', 'timestamp'], true)) {
            return true;
        }

        $name = strtolower((string) ($column['name'] ?? ''));

        if (preg_match('/^jam_(?:request|proses|isi_bbm_\d+)$/', $name) === 1 || $name === 'jam') {
            return false;
        }

        return preg_match('/(?:datetime|date_time|timestamp|waktu_(?:masuk|pulang|mulai|selesai)|created_at|updated_at)/', $name) === 1;
    }

    private function parseTemporalTextValue(string $value, bool $withTime): ?Carbon
    {
        $formats = $withTime
            ? ['d/m/Y H:i:s', 'd/m/Y H:i', 'd-m-Y H:i:s', 'd-m-Y H:i', 'd.m.Y H:i:s', 'd.m.Y H:i', 'm/d/Y H:i:s', 'm/d/Y H:i', 'm-d-Y H:i:s', 'm-d-Y H:i', 'Y-m-d H:i:s', 'Y-m-d H:i', 'Y/m/d H:i:s', 'Y/m/d H:i', 'Y-m-d\TH:i:s', 'Y-m-d\TH:i', 'd/m/Y', 'd-m-Y', 'd.m.Y', 'm/d/Y', 'm-d-Y', 'Y-m-d', 'Y/m/d']
            : ['d/m/Y', 'd-m-Y', 'd.m.Y', 'm/d/Y', 'm-d-Y', 'Y-m-d', 'Y/m/d'];

        foreach ($formats as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);
                $errors = Carbon::getLastErrors();
                if (is_array($errors) && (($errors['warning_count'] ?? 0) > 0 || ($errors['error_count'] ?? 0) > 0)) {
                    continue;
                }

                if (str_starts_with($format, 'm/') || str_starts_with($format, 'm-')) {
                    [$first, $second] = array_map('intval', preg_split('/[\/-]/', $value, 3));
                    if ($first <= 12 && $second <= 12) {
                        continue;
                    }
                }

                if ($withTime && ! str_contains($format, 'H')) {
                    $date->startOfDay();
                }

                return $date;
            } catch (\Throwable) {
                // Coba format berikutnya.
            }
        }

        return null;
    }

    private function normalizeIntegerValue(string $value, array $column): string
    {
        $number = $this->normalizeLocalizedNumber($value, $column);
        if (fmod((float) $number, 1.0) !== 0.0) {
            throw new \InvalidArgumentException('kolom '.$column['name'].' berisi "'.$value.'", tetapi kolom ini membutuhkan angka bulat.');
        }

        if ($this->isUnsignedType((string) $column['type']) && (float) $number < 0) {
            throw new \InvalidArgumentException('kolom '.$column['name'].' tidak menerima angka negatif.');
        }

        return (string) (int) $number;
    }

    private function normalizeDecimalValue(string $value, array $column): string
    {
        $number = $this->normalizeLocalizedNumber($value, $column);
        if ($this->isUnsignedType((string) $column['type']) && (float) $number < 0) {
            throw new \InvalidArgumentException('kolom '.$column['name'].' tidak menerima angka negatif.');
        }

        return $number;
    }

    private function normalizeLocalizedNumber(string $value, array $column): string
    {
        $original = $value;
        $value = trim(str_ireplace(['rp', 'idr', '%'], '', $value));
        $value = str_replace(["\xc2\xa0", ' '], '', $value);

        $negative = false;
        if (preg_match('/^\((.*)\)$/', $value, $matches) === 1) {
            $negative = true;
            $value = $matches[1];
        }

        $value = preg_replace('/[^\d,.\-]/', '', $value) ?? '';
        if (str_starts_with($value, '-')) {
            $negative = true;
            $value = substr($value, 1);
        }
        $value = str_replace('-', '', $value);

        $lastComma = strrpos($value, ',');
        $lastDot = strrpos($value, '.');
        if ($lastComma !== false && $lastDot !== false) {
            if ($lastComma > $lastDot) {
                $value = str_replace('.', '', $value);
                $value = str_replace(',', '.', $value);
            } else {
                $value = str_replace(',', '', $value);
            }
        } elseif ($lastComma !== false) {
            $commaCount = substr_count($value, ',');
            $digitsAfter = strlen($value) - $lastComma - 1;
            $value = $commaCount === 1 && $digitsAfter > 0 && $digitsAfter <= 2
                ? str_replace(',', '.', $value)
                : str_replace(',', '', $value);
        } elseif ($lastDot !== false) {
            $dotCount = substr_count($value, '.');
            $digitsAfter = strlen($value) - $lastDot - 1;
            if ($dotCount > 1 || $digitsAfter === 3) {
                $value = str_replace('.', '', $value);
            }
        }

        $value = ($negative ? '-' : '').$value;
        if ($value === '' || $value === '-' || ! is_numeric($value)) {
            throw new \InvalidArgumentException('kolom '.$column['name'].' berisi "'.$original.'", tetapi belum terbaca sebagai angka.');
        }

        return rtrim(rtrim(number_format((float) $value, 10, '.', ''), '0'), '.');
    }

    private function normalizeBooleanValue(string $value, array $column): string
    {
        $normalized = strtolower(trim($value));
        $normalized = str_replace([' ', '-', '_'], '', $normalized);

        $truthy = ['1', 'true', 'yes', 'ya', 'y', 'aktif', 'active', 'paid', 'lunas', 'lengkap'];
        $falsy = ['0', 'false', 'no', 'tidak', 'n', 'nonaktif', 'inactive', 'unpaid', 'belum', 'kosong'];

        if (in_array($normalized, $truthy, true)) {
            return '1';
        }

        if (in_array($normalized, $falsy, true)) {
            return '0';
        }

        throw new \InvalidArgumentException('kolom '.$column['name'].' berisi "'.$value.'", tetapi belum terbaca sebagai nilai Ya/Tidak.');
    }

    private function normalizeTimeValue(string $value, array $column): string
    {
        $value = trim($value);
        if (is_numeric($value) && (float) $value >= 0 && (float) $value < 1) {
            $seconds = (int) round((float) $value * 86400);

            return gmdate('H:i:s', $seconds);
        }

        foreach (['H:i:s', 'H:i', 'G:i:s', 'G:i'] as $format) {
            try {
                $time = Carbon::createFromFormat($format, $value);
                $errors = Carbon::getLastErrors();
                if (is_array($errors) && (($errors['warning_count'] ?? 0) > 0 || ($errors['error_count'] ?? 0) > 0)) {
                    continue;
                }

                return $time->format('H:i:s');
            } catch (\Throwable) {
                // Coba format berikutnya.
            }
        }

        throw new \InvalidArgumentException('kolom '.$column['name'].' berisi "'.$value.'", tetapi belum terbaca sebagai jam. Pakai HH:mm atau HH:mm:ss.');
    }

    private function normalizeYearValue(string $value, array $column): string
    {
        $value = trim($value);
        if (preg_match('/^\d{4}$/', $value) === 1) {
            return $value;
        }

        try {
            return $this->normalizeImportDate($value, $column, false)
                ? Carbon::parse($this->normalizeImportDate($value, $column, false))->format('Y')
                : $value;
        } catch (\Throwable) {
            throw new \InvalidArgumentException('kolom '.$column['name'].' berisi "'.$value.'", tetapi belum terbaca sebagai tahun. Pakai format 2026.');
        }
    }

    private function isUnsignedType(string $type): bool
    {
        return str_contains(strtolower($type), 'unsigned');
    }

    private function normalizeImportDate(string $value, array $column, bool $withTime): string
    {
        $value = trim($value);
        if ($value === '') {
            return $value;
        }

        if (is_numeric($value) && (float) $value > 0) {
            try {
                $date = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value));

                return $date->format($withTime ? 'Y-m-d H:i:s' : 'Y-m-d');
            } catch (\Throwable) {
                // Lanjut cek format teks.
            }
        }

        $value = $this->normalizeIndonesianMonthName($value);

        $formats = $withTime
            ? [
                'd/m/Y H:i:s',
                'd/m/Y H:i',
                'd-m-Y H:i:s',
                'd-m-Y H:i',
                'Y-m-d H:i:s',
                'Y-m-d H:i',
                'Y-m-d\TH:i:s',
                'd/m/Y',
                'd-m-Y',
                'Y-m-d',
            ]
            : [
                'd/m/Y',
                'd-m-Y',
                'Y-m-d',
                'd/m/Y H:i:s',
                'd/m/Y H:i',
                'd-m-Y H:i:s',
                'd-m-Y H:i',
                'Y-m-d H:i:s',
                'Y-m-d H:i',
                'Y-m-d\TH:i:s',
            ];

        foreach ($formats as $format) {
            try {
                $date = Carbon::createFromFormat($format, $value);
                $errors = Carbon::getLastErrors();
                if (is_array($errors) && (($errors['warning_count'] ?? 0) > 0 || ($errors['error_count'] ?? 0) > 0)) {
                    continue;
                }

                return $date->format($withTime ? 'Y-m-d H:i:s' : 'Y-m-d');
            } catch (\Throwable) {
                // Coba format berikutnya.
            }
        }

        throw new \InvalidArgumentException(
            'kolom '.$column['name'].' berisi "'.$value.'", tetapi belum terbaca sebagai tanggal. Pakai format YYYY-MM-DD'.($withTime ? ' atau YYYY-MM-DD HH:mm:ss' : '').'.',
        );
    }

    private function importRows(string $path, array $columns = []): \Generator
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if (in_array($extension, ['csv', 'txt'], true)) {
            $handle = fopen($path, 'rb');
            $firstLine = (string) fgets($handle);
            rewind($handle);
            $delimiter = substr_count($firstLine, ';') >= substr_count($firstLine, ',') ? ';' : ',';
            $rowNumber = 0;
            while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
                $rowNumber++;
                $row = array_map(fn ($value) => trim((string) $value), $row);
                if ($rowNumber === 1 && isset($row[0])) {
                    $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', $row[0]);
                }
                yield [$rowNumber, $row];
            }
            fclose($handle);

            return;
        }

        $sheet = IOFactory::load($path)->getActiveSheet();
        foreach ($sheet->getRowIterator() as $row) {
            $rowNumber = $row->getRowIndex();
            $values = [];
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestDataColumn($rowNumber));
            foreach (range(1, max(1, count($columns), $highestColumnIndex)) as $columnIndex) {
                $coordinate = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnIndex).$rowNumber;
                $cell = $sheet->getCell($coordinate);
                $values[] = $this->spreadsheetCellValueForImport($cell, $columns[$columnIndex - 1] ?? null);
            }

            yield [$rowNumber, $values];
        }
    }

    private function spreadsheetCellValueForImport(\PhpOffice\PhpSpreadsheet\Cell\Cell $cell, ?array $column): string
    {
        if ($column !== null && $this->isAppsheetTemporalTextColumn($column)) {
            $rawValue = $cell->getCalculatedValue();
            if (is_numeric($rawValue) && ExcelDate::isDateTime($cell)) {
                try {
                    $date = Carbon::instance(ExcelDate::excelToDateTimeObject((float) $rawValue));
                    $withTime = $this->temporalColumnExpectsDateTime($column) || (float) $rawValue !== floor((float) $rawValue);

                    return $date->format($withTime ? 'Y-m-d H:i:s' : 'Y-m-d');
                } catch (\Throwable) {
                    // Kalau metadata Excel tidak lengkap, lanjut pakai nilai tampilan.
                }
            }
        }

        return trim((string) $cell->getFormattedValue());
    }

    private function isEmptyRow(array $row): bool
    {
        return collect($row)->every(fn ($value) => trim((string) $value) === '');
    }

    private function appendImportError(array &$errors, int $row, string $message): void
    {
        if (count($errors) < self::IMPORT_ERROR_LIMIT) {
            $errors[] = compact('row', 'message');
        }
    }
}
