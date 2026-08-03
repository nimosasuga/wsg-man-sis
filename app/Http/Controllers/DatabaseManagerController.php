<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DatabaseManagerController extends Controller
{
    private const EXPORT_LIMIT = 10000;

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

    public function show(string $table): Response
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
            ],
        ]);
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
}
