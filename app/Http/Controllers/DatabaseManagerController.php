<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DatabaseManagerController extends Controller
{
    private const EXPORT_LIMIT = 10000;
    private const IMPORT_CHUNK_SIZE = 500;
    private const IMPORT_ERROR_LIMIT = 30;

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
        ]);
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
            ],
        ]);
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

    public function previewStructure(Request $request, string $table): Response
    {
        $this->guardTable($table);
        $this->guardSuperAdmin($request);
        $validated = $request->validate([
            'column' => ['required', 'string'],
            'type' => ['required', 'string'],
        ]);

        $payload = $this->structurePayload($table);
        try {
            $change = $this->prepareStructureChange($table, $payload['columns'], $validated['column'], $validated['type']);
        } catch (\InvalidArgumentException $exception) {
            return Inertia::render('DatabaseManager/Structure', [
                'table' => $payload,
                'preview' => ['error' => $exception->getMessage()],
            ]);
        }

        $token = (string) Str::uuid();
        $request->session()->put("database-manager.structure.{$token}", [
            'table' => $table,
            'column' => $change['column'],
            'type' => $change['type'],
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
            $change = $this->prepareStructureChange($table, $this->columns($table), $pending['column'], $pending['type']);
            $createStatement = DB::selectOne("SHOW CREATE TABLE `{$table}`");
            Storage::put(
                'database-schema-backups/'.now()->format('Ymd-His')."-{$table}.sql",
                (string) ($createStatement->{'Create Table'} ?? ''),
            );
            DB::statement($change['sql']);
        } catch (\Throwable) {
            return to_route('database-manager.structure', $table)
                ->with('error', 'Tipe kolom belum diubah. Pastikan data yang ada cocok dengan tipe yang dipilih.');
        }

        $request->session()->forget("database-manager.structure.{$token}");

        return to_route('database-manager.show', $table)
            ->with('success', "Tipe kolom {$change['column']} berhasil diubah menjadi {$change['type']}.");
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
                foreach ($this->importRows(Storage::path($import['path'])) as [$rowNumber, $row]) {
                    if ($rowNumber === 1) {
                        continue;
                    }

                    $prepared = $this->prepareImportRow($rowNumber, $row, $definition);
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
        $columns = collect($this->columns($table))->pluck('name')->all();

        return $this->spreadsheet(
            [$columns],
            "template-{$table}.xlsx",
            $table,
            $columns,
        );
    }

    public function export(string $table): StreamedResponse
    {
        $this->guardTable($table);
        $columns = collect($this->columns($table))->pluck('name')->all();
        $rows = DB::table($table)
            ->select($columns)
            ->limit(self::EXPORT_LIMIT)
            ->get()
            ->map(fn ($row) => array_map(fn ($column) => data_get($row, $column), $columns))
            ->all();

        return $this->spreadsheet(
            [$columns, ...$rows],
            "export-{$table}-".now()->format('Ymd-His').'.xlsx',
            $table,
            $columns,
        );
    }

    public function exportCsv(string $table): StreamedResponse
    {
        $this->guardTable($table);
        $columnDefinitions = $this->columns($table);
        $columns = collect($columnDefinitions)->pluck('name')->all();
        $primaryKey = collect($columnDefinitions)->where('key', 'PRI')->pluck('name');
        $primaryKey = $primaryKey->count() === 1 ? $primaryKey->first() : null;

        return response()->streamDownload(function () use ($table, $columns, $primaryKey) {
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
                    array_map(fn (string $column) => $this->exportValue(data_get($row, $column)), $columns),
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

    private function spreadsheet(array $rows, string $fileName, string $sheetTitle, array $columns): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows, $sheetTitle, $columns) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle(substr($sheetTitle, 0, 31));

            foreach ($rows as $rowNumber => $row) {
                foreach ($row as $columnNumber => $value) {
                    $coordinate = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($columnNumber + 1).($rowNumber + 1);
                    $sheet->setCellValueExplicit($coordinate, $this->exportValue($value), DataType::TYPE_STRING);
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

    private function exportValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
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
                    'options' => $this->typeOptions($column['type']),
                ])
                ->values()
                ->all(),
            'detailUrl' => route('database-manager.show', $table),
            'previewUrl' => route('database-manager.structure.preview', $table),
            'commitUrl' => route('database-manager.structure.update', $table),
            'typeGroups' => $this->mysqlTypeGroups(),
        ];
    }

    private function prepareStructureChange(string $table, array $columns, string $columnName, string $targetType): array
    {
        $column = collect($columns)->firstWhere('name', $columnName);
        if (! $column || $column['key'] !== '' || str_contains(strtolower((string) $column['extra']), 'auto_increment') || str_contains(strtolower((string) $column['extra']), 'generated')) {
            throw new \InvalidArgumentException('Kolom primary key, index, atau auto increment tidak dapat diubah dari halaman ini.');
        }

        $targetType = strtolower(trim($targetType));
        if (! $this->isSupportedMySqlColumnType($targetType)) {
            throw new \InvalidArgumentException('Definisi tipe tidak didukung. Pilih dari daftar MySQL atau tulis definisi lengkap seperti varchar(100), decimal(15,2), enum(\'A\',\'B\'), atau geometry.');
        }

        if (preg_match('/^(?:var)?char\((\d+)\)$/', $targetType, $matches)) {
            $maxLength = (int) DB::table($table)->selectRaw("MAX(CHAR_LENGTH(`{$columnName}`)) AS max_length")->value('max_length');
            if ($maxLength > (int) $matches[1]) {
                throw new \InvalidArgumentException("Data terpanjang saat ini memiliki {$maxLength} karakter. Pilih kapasitas yang lebih besar agar data tidak terpotong.");
            }
        }

        $baseType = $this->baseType($targetType);
        if ($column['default'] !== null && in_array($baseType, ['tinyblob', 'blob', 'mediumblob', 'longblob', 'tinytext', 'text', 'mediumtext', 'longtext', 'json', 'geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection'], true)) {
            throw new \InvalidArgumentException("Kolom ini memiliki nilai default. Tipe {$baseType} tidak dapat memakai nilai default yang sama, sehingga perubahan tidak diterapkan.");
        }

        $characterClause = $column['characterSet'] && $this->supportsCharacterSet($baseType)
            ? " CHARACTER SET `{$column['characterSet']}`".($column['collation'] ? " COLLATE `{$column['collation']}`" : '')
            : '';
        $sridClause = $column['srsId'] !== null && in_array($baseType, ['geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection'], true)
            ? " SRID {$column['srsId']}"
            : '';
        $nullClause = $column['nullable'] ? 'NULL' : 'NOT NULL';
        $defaultClause = $this->defaultClause($column['default']);
        $commentClause = $column['comment'] !== '' ? ' COMMENT '.DB::getPdo()->quote($column['comment']) : '';
        $sql = "ALTER TABLE `{$table}` MODIFY COLUMN `{$columnName}` {$targetType}{$characterClause}{$sridClause} {$nullClause}{$defaultClause}{$commentClause}";

        return [
            'column' => $columnName,
            'currentType' => $column['type'],
            'type' => $targetType,
            'sql' => $sql,
        ];
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
            ['label' => 'Numerik', 'types' => $this->typeChoices(['bit(1)', 'tinyint', 'tinyint unsigned', 'smallint', 'smallint unsigned', 'mediumint', 'mediumint unsigned', 'int', 'int unsigned', 'integer', 'integer unsigned', 'bigint', 'bigint unsigned', 'decimal(10,2)', 'decimal(15,2)', 'decimal(20,2)', 'numeric(10,2)', 'fixed(10,2)', 'float', 'double', 'double precision', 'real', 'bool', 'boolean'], [['label' => 'SERIAL (dikunci: membuat auto increment)', 'value' => '__serial__']])],
            ['label' => 'Tanggal dan waktu', 'types' => $this->typeChoices(['date', 'time', 'time(6)', 'datetime', 'datetime(6)', 'timestamp', 'timestamp(6)', 'year'])],
            ['label' => 'Teks dan biner', 'types' => $this->typeChoices(['char(1)', 'char(255)', 'varchar(50)', 'varchar(100)', 'varchar(255)', 'varchar(500)', 'varchar(1000)', 'binary(1)', 'binary(255)', 'varbinary(255)', 'tinytext', 'text', 'mediumtext', 'longtext', 'tinyblob', 'blob', 'mediumblob', 'longblob'])],
            ['label' => 'Pilihan dan dokumen', 'types' => $this->typeChoices(['json'], [['label' => "ENUM (tulis sendiri, contoh: enum('A','B'))", 'value' => '__enum__'], ['label' => "SET (tulis sendiri, contoh: set('A','B'))", 'value' => '__set__']])],
            ['label' => 'Spasial', 'types' => $this->typeChoices(['geometry', 'point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon', 'geometrycollection'])],
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
        return strtolower((string) preg_replace('/\(.+$/', '', preg_replace('/\s+(unsigned|zerofill)$/', '', $type)));
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

        foreach ($this->importRows($path) as [$rowNumber, $row]) {
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
            $prepared = $this->prepareImportRow($rowNumber, $row, $definition);
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

            $prepared[$name] = $value;
        }

        return $prepared;
    }

    private function importRows(string $path): \Generator
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
        foreach ($sheet->toArray('', true, true, false) as $index => $row) {
            yield [$index + 1, array_map(fn ($value) => trim((string) $value), $row)];
        }
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
