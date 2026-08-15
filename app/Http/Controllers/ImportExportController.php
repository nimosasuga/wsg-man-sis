<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ImportExportController extends Controller
{
    public function index(Request $request): Response
    {
        $modules = $this->availableModules($request);
        $selected = (string) $request->query('module', $modules->first()['key'] ?? '');
        abort_unless($modules->contains('key', $selected), 404);

        $preview = session("import-export.preview.{$selected}");

        return Inertia::render('ImportExport/Index', [
            'modules' => $modules->values(),
            'selectedModule' => $selected,
            'preview' => $preview ? [
                'rowCount' => count($preview['rows']),
                'errors' => $preview['errors'],
                'totalRows' => $preview['totalRows'],
                'sample' => $preview['sample'],
                'createdAt' => $preview['createdAt'],
                'mode' => $preview['mode'],
            ] : null,
            'logs' => $this->recentLogs(),
        ]);
    }

    public function template(Request $request, string $module): StreamedResponse
    {
        $config = $this->config($request, $module);

        return $this->downloadTemplate($config, "template-{$module}.xlsx");
    }

    public function export(Request $request, string $module): StreamedResponse
    {
        $config = $this->config($request, $module);
        $fields = array_values(array_unique([$config['key'], ...$config['fields']]));
        $search = trim((string) $request->query('search', ''));
        $query = DB::table($config['table'])->select($fields);

        if ($search !== '') {
            $query->where(function ($builder) use ($fields, $search) {
                foreach ($fields as $field) {
                    $builder->orWhere($field, 'like', '%'.$search.'%');
                }
            });
        }

        $rows = $query
            ->orderBy($config['key'])
            ->limit(10000)
            ->get()
            ->map(fn ($row) => array_map(fn ($field) => data_get($row, $field), $fields))
            ->all();

        return $this->downloadSpreadsheet(
            [$this->labels($fields), ...$rows],
            "export-{$module}".($search !== '' ? '-hasil-pencarian' : '').'-'.now()->format('Ymd-His').'.xlsx',
            $config['label'],
            $config['import_text'] ?? [],
            $fields,
        );
    }

    public function preview(Request $request, string $module): RedirectResponse
    {
        $config = $this->config($request, $module);
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv,txt', 'max:10240'],
            'mode' => ['required', 'in:create,update'],
        ]);
        $mode = $request->string('mode')->value();

        try {
            $rows = IOFactory::load($request->file('file')->getRealPath())
                ->getActiveSheet()
                ->toArray('', true, true, false);
        } catch (Throwable) {
            return back()->with('error', 'File tidak dapat dibaca. Gunakan template Excel yang tersedia.');
        }

        if (count($rows) < 2) {
            return back()->with('error', 'File belum memiliki baris data untuk diperiksa.');
        }

        $expectedFields = $config['fields'];
        $keyField = $config['key'];
        $headers = array_map(fn ($value) => $this->normalizeHeader((string) $value), array_shift($rows));
        $missing = array_values(array_diff($expectedFields, $headers));

        if ($missing) {
            return back()->with('error', 'Kolom template belum lengkap: '.implode(', ', $this->labels($missing)).'.');
        }

        if ($mode === 'update' && ! in_array($keyField, $headers, true)) {
            return back()->with('error', 'Mode perbarui membutuhkan kolom '.strtoupper(str_replace('_', ' ', $keyField)).'.');
        }

        $headerIndex = array_flip($headers);
        $required = $config['import_required'] ?? [];
        $validRows = [];
        $errors = [];
        $uniqueRows = [];
        $referenceCounts = collect($config['import_references'] ?? [])
            ->mapWithKeys(fn ($reference, $field) => [$field => DB::table($reference['table'])->count()])
            ->all();

        foreach ($rows as $index => $row) {
            $data = collect($expectedFields)->mapWithKeys(fn ($field) => [
                $field => trim((string) ($row[$headerIndex[$field]] ?? '')),
            ])->all();
            $recordKey = trim((string) ($row[$headerIndex[$keyField] ?? -1] ?? ''));

            if (! collect($data)->filter(fn ($value) => $value !== '')->isNotEmpty()) {
                continue;
            }

            $emptyRequired = array_values(array_filter($required, fn ($field) => blank($data[$field] ?? null)));
            if ($emptyRequired) {
                $errors[] = [
                    'row' => $index + 2,
                    'message' => 'Kolom wajib kosong: '.implode(', ', $this->labels($emptyRequired)),
                ];
                continue;
            }

            foreach (($config['import_uppercase'] ?? []) as $field) {
                if (! blank($data[$field] ?? null)) {
                    $data[$field] = Str::upper($data[$field]);
                }
            }

            foreach (($config['import_map'] ?? []) as $field => $mapping) {
                if (! blank($data[$field] ?? null) && array_key_exists($data[$field], $mapping)) {
                    $data[$field] = $mapping[$data[$field]];
                }
            }

            foreach (($config['import_datetime'] ?? []) as $field) {
                if (blank($data[$field] ?? null)) {
                    continue;
                }

                $dateTime = $this->normalizeDateTime($row[$headerIndex[$field]] ?? $data[$field]);
                if ($dateTime === null) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Format tanggal dan waktu tidak valid: '.strtoupper(str_replace('_', ' ', $field))];
                    continue 2;
                }

                $data[$field] = $dateTime;
            }

            foreach (($config['import_date'] ?? []) as $field) {
                if (blank($data[$field] ?? null)) {
                    continue;
                }

                $date = $this->normalizeDate(
                    $row[$headerIndex[$field]] ?? $data[$field],
                    $config['import_date_formats'][$field] ?? null,
                );
                if ($date === null) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Format tanggal tidak valid: '.strtoupper(str_replace('_', ' ', $field))];
                    continue 2;
                }

                $data[$field] = $date;
            }

            foreach (($config['import_latlong'] ?? []) as $field) {
                if (blank($data[$field] ?? null)) {
                    continue;
                }

                if (! $this->isValidLatLong($data[$field])) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Format koordinat tidak valid: '.strtoupper(str_replace('_', ' ', $field)).'. Gunakan latitude,longitude'];
                    continue 2;
                }
            }

            foreach (($config['import_email'] ?? []) as $field) {
                if (! blank($data[$field] ?? null) && ! filter_var($data[$field], FILTER_VALIDATE_EMAIL)) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Format email tidak valid: '.strtoupper(str_replace('_', ' ', $field))];
                    continue 2;
                }
            }

            foreach (($config['import_phone'] ?? []) as $field) {
                if (! blank($data[$field] ?? null) && ! preg_match('/^[0-9+()\-\s]{8,25}$/', $data[$field])) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Format nomor telepon tidak valid: '.strtoupper(str_replace('_', ' ', $field))];
                    continue 2;
                }
            }

            foreach (($config['import_in'] ?? []) as $field => $allowed) {
                if (! blank($data[$field] ?? null) && ! in_array($data[$field], $allowed, true)) {
                    $errors[] = ['row' => $index + 2, 'message' => strtoupper(str_replace('_', ' ', $field)).' harus bernilai: '.implode(', ', $allowed)];
                    continue 2;
                }
            }

            foreach (($config['import_numeric'] ?? []) as $field) {
                if (blank($data[$field] ?? null)) {
                    continue;
                }

                $number = $this->normalizeNumber($data[$field]);
                if ($number === null) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Format angka tidak valid: '.strtoupper(str_replace('_', ' ', $field))];
                    continue 2;
                }

                $data[$field] = $number;
            }

            foreach (($config['import_integer'] ?? []) as $field) {
                if (blank($data[$field] ?? null)) {
                    continue;
                }

                $number = $this->normalizeNumber($data[$field]);
                if ($number === null || floor((float) $number) !== (float) $number) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Format bilangan bulat tidak valid: '.strtoupper(str_replace('_', ' ', $field))];
                    continue 2;
                }

                $data[$field] = (int) $number;
            }

            foreach (($config['import_calculations'] ?? []) as $field => $calculation) {
                $data[$field] = match ($calculation['operation'] ?? null) {
                    'subtract' => max(0, $this->numberOrZero($data[$calculation['left']] ?? null) - $this->numberOrZero($data[$calculation['right']] ?? null)),
                    'difference' => $this->numberOrZero($data[$calculation['left']] ?? null) - $this->numberOrZero($data[$calculation['right']] ?? null),
                    'sum' => array_sum(array_map(fn ($source) => $this->numberOrZero($data[$source] ?? null), $calculation['fields'] ?? [])),
                    'sum_minus' => array_sum(array_map(fn ($source) => $this->numberOrZero($data[$source] ?? null), $calculation['add'] ?? [])) - array_sum(array_map(fn ($source) => $this->numberOrZero($data[$source] ?? null), $calculation['subtract'] ?? [])),
                    default => $data[$field] ?? null,
                };
            }

            foreach (($config['import_references'] ?? []) as $field => $reference) {
                if (blank($data[$field] ?? null)) {
                    continue;
                }

                if (($referenceCounts[$field] ?? 0) === 0) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Master '.$reference['label'].' belum memiliki data. Isi master data terlebih dahulu'];
                    continue 2;
                }

                $exists = DB::table($reference['table'])
                    ->where($reference['column'], $data[$field])
                    ->exists();
                if (! $exists) {
                    $errors[] = ['row' => $index + 2, 'message' => ($reference['label'] ?? strtoupper($field)).' tidak ditemukan pada data referensi'];
                    continue 2;
                }
            }

            foreach (($config['import_unique'] ?? []) as $uniqueFields) {
                $signature = implode('|', array_map(fn ($field) => Str::lower((string) ($data[$field] ?? '')), $uniqueFields));
                if (isset($uniqueRows[$signature])) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Data duplikat dengan baris '.$uniqueRows[$signature].' untuk '.implode(' + ', $this->labels($uniqueFields))];
                    continue 2;
                }

                $duplicateQuery = DB::table($config['table']);
                foreach ($uniqueFields as $field) {
                    $value = $data[$field] ?? null;
                    if (blank($value)) {
                        $duplicateQuery->where(function ($query) use ($field) {
                            $query->whereNull($field)->orWhere($field, '');
                        });
                        continue;
                    }

                    if (in_array($field, $config['import_unique_dates'] ?? [], true)) {
                        $duplicateQuery->whereIn($field, $this->dateStorageVariants((string) $value));
                        continue;
                    }

                    $duplicateQuery->where($field, $value);
                }
                if ($mode === 'update' && $recordKey !== '') {
                    $duplicateQuery->where($keyField, '!=', $recordKey);
                }
                if ($duplicateQuery->exists()) {
                    $errors[] = ['row' => $index + 2, 'message' => 'Data dengan '.implode(' + ', $this->labels($uniqueFields)).' sudah ada'];
                    continue 2;
                }

                $uniqueRows[$signature] = $index + 2;
            }

            if ($mode === 'update') {
                if ($recordKey === '' || ! DB::table($config['table'])->where($keyField, $recordKey)->exists()) {
                    $errors[] = ['row' => $index + 2, 'message' => 'ID KEY tidak ditemukan untuk diperbarui'];
                    continue;
                }
            }

            $validRows[] = [...$data, '__key' => $recordKey];
        }

        if (count($validRows) > 5000) {
            return back()->with('error', 'Maksimal 5.000 baris per proses impor.');
        }

        session([
            "import-export.preview.{$module}" => [
                'rows' => $validRows,
                'errors' => $errors,
                'totalRows' => count($validRows) + count($errors),
                'sample' => array_slice($validRows, 0, 20),
                'createdAt' => now()->toIso8601String(),
                'fileName' => $request->file('file')->getClientOriginalName(),
                'mode' => $mode,
            ],
        ]);

        if ($errors) {
            $this->storeLog($request, $module, $config, [
                'fileName' => $request->file('file')->getClientOriginalName(),
                'status' => 'validation_failed',
                'totalRows' => count($validRows) + count($errors),
                'successfulRows' => 0,
                'failedRows' => count($errors),
                'errorSummary' => collect($errors)->take(3)->map(fn ($error) => "Baris {$error['row']}: {$error['message']}")->implode('; '),
            ]);
        }

        return to_route('import-export.index', ['module' => $module])
            ->with('success', 'File sudah diperiksa. Tinjau preview sebelum menyimpan data.');
    }

    public function commit(Request $request, string $module): RedirectResponse
    {
        $config = $this->config($request, $module);
        $preview = session("import-export.preview.{$module}");

        if (! $preview || empty($preview['rows'])) {
            return to_route('import-export.index', ['module' => $module])
                ->with('error', 'Tidak ada hasil preview yang dapat disimpan. Unggah file terlebih dahulu.');
        }

        if (! empty($preview['errors'])) {
            return to_route('import-export.index', ['module' => $module])
                ->with('error', 'Perbaiki semua error pada preview sebelum menyimpan data.');
        }

        DB::transaction(function () use ($config, $preview) {
            foreach ($preview['rows'] as $row) {
                $key = Arr::pull($row, '__key');
                if (($preview['mode'] ?? 'create') === 'update') {
                    DB::table($config['table'])->where($config['key'], $key)->update($row);
                    continue;
                }

                DB::table($config['table'])->insert([$config['key'] => (string) Str::uuid(), ...$row]);
            }
        });

        $this->storeLog($request, $module, $config, [
            'fileName' => $preview['fileName'] ?? null,
            'status' => 'completed',
            'totalRows' => $preview['totalRows'],
            'successfulRows' => count($preview['rows']),
            'failedRows' => 0,
            'errorSummary' => null,
        ]);

        session()->forget("import-export.preview.{$module}");

        $action = ($preview['mode'] ?? 'create') === 'update' ? 'diperbarui' : 'ditambahkan';

        return to_route('import-export.index', ['module' => $module])
            ->with('success', count($preview['rows'])." data berhasil {$action}.");
    }

    private function availableModules(Request $request)
    {
        return collect(config('module_crud'))
            ->filter(fn ($config) => ($config['import_enabled'] ?? false) && $request->user()?->can($config['permission']) && Schema::hasTable($config['table']))
            ->map(fn ($config, $key) => [
                'key' => $key,
                'label' => $config['label'],
                'fields' => $config['fields'],
                'fieldLabels' => $this->labels($config['fields']),
                'templateUrl' => route('import-export.template', $key),
                'exportUrl' => route('import-export.export', $key),
            ]);
    }

    private function recentLogs()
    {
        if (! Schema::hasTable('import_export_logs')) {
            return [];
        }

        return DB::table('import_export_logs')
            ->leftJoin('users', 'users.id', '=', 'import_export_logs.user_id')
            ->select([
                'import_export_logs.id',
                'import_export_logs.module_label',
                'import_export_logs.file_name',
                'import_export_logs.status',
                'import_export_logs.total_rows',
                'import_export_logs.successful_rows',
                'import_export_logs.failed_rows',
                'import_export_logs.error_summary',
                'import_export_logs.created_at',
                'users.nik as user_nik',
            ])
            ->latest('import_export_logs.created_at')
            ->limit(20)
            ->get();
    }

    private function storeLog(Request $request, string $module, array $config, array $data): void
    {
        if (! Schema::hasTable('import_export_logs')) {
            return;
        }

        DB::table('import_export_logs')->insert([
            'user_id' => $request->user()?->id,
            'module_key' => $module,
            'module_label' => $config['label'],
            'file_name' => $data['fileName'],
            'status' => $data['status'],
            'total_rows' => $data['totalRows'],
            'successful_rows' => $data['successfulRows'],
            'failed_rows' => $data['failedRows'],
            'error_summary' => $data['errorSummary'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function config(Request $request, string $module): array
    {
        $config = config("module_crud.{$module}");
        abort_if(! $config || ! ($config['import_enabled'] ?? false) || ! Schema::hasTable($config['table']), 404);
        abort_unless($request->user()?->can($config['permission']), 403);

        return $config;
    }

    private function labels(array $fields): array
    {
        return array_map(fn ($field) => strtoupper(str_replace('_', ' ', $field)), $fields);
    }

    private function normalizeHeader(string $header): string
    {
        return Str::of($header)->lower()->trim()->replace([' ', '-'], '_')->replaceMatches('/[^a-z0-9_]/', '')->value();
    }

    private function normalizeNumber(string $value): ?string
    {
        $value = preg_replace('/[^0-9,.-]/', '', $value);
        if ($value === '' || $value === null) {
            return null;
        }

        if (str_contains($value, ',') && str_contains($value, '.')) {
            $value = str_replace('.', '', $value);
            $value = str_replace(',', '.', $value);
        } elseif (str_contains($value, ',')) {
            $value = str_replace(',', '.', $value);
        }

        return is_numeric($value) ? $value : null;
    }

    private function numberOrZero(mixed $value): float
    {
        return is_numeric($value) ? (float) $value : 0;
    }

    private function normalizeDateTime(mixed $value): ?string
    {
        try {
            if (is_numeric($value) && (float) $value > 1) {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d H:i:s');
            }

            foreach (['Y-m-d H:i:s', 'Y-m-d H:i', 'd/m/Y H:i:s', 'd/m/Y H:i', 'd-m-Y H:i:s', 'd-m-Y H:i'] as $format) {
                try {
                    return \Carbon\Carbon::createFromFormat($format, (string) $value)->format('Y-m-d H:i:s');
                } catch (Throwable) {
                    continue;
                }
            }

            return \Carbon\Carbon::parse((string) $value)->format('Y-m-d H:i:s');
        } catch (Throwable) {
            return null;
        }
    }

    private function normalizeDate(mixed $value, ?array $formats = null): ?string
    {
        try {
            if (is_numeric($value) && (float) $value > 1) {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            }

            foreach ($formats ?? ['Y-m-d', 'd/m/Y', 'd-m-Y', 'm/d/Y', 'm-d-Y'] as $format) {
                try {
                    $date = \Carbon\Carbon::createFromFormat('!'.$format, (string) $value);
                    if ($date->format($format) === (string) $value) {
                        return $date->format('Y-m-d');
                    }
                } catch (Throwable) {
                    continue;
                }
            }

            return \Carbon\Carbon::parse((string) $value)->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }

    private function dateStorageVariants(string $value): array
    {
        $date = $this->normalizeDate($value);
        if (! $date) {
            return [$value];
        }

        $carbon = \Carbon\Carbon::createFromFormat('!Y-m-d', $date);

        return array_values(array_unique([
            $value,
            $date,
            $carbon->format('d/m/Y'),
            $carbon->format('d-m-Y'),
            $carbon->format('m/d/Y'),
            $carbon->format('m-d-Y'),
            $carbon->format('n/j/Y'),
            $carbon->format('n-j-Y'),
        ]));
    }

    private function isValidLatLong(string $value): bool
    {
        $parts = array_map('trim', explode(',', $value));
        if (count($parts) !== 2 || ! is_numeric($parts[0]) || ! is_numeric($parts[1])) {
            return false;
        }

        return (float) $parts[0] >= -90 && (float) $parts[0] <= 90
            && (float) $parts[1] >= -180 && (float) $parts[1] <= 180;
    }

    private function downloadTemplate(array $config, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($config) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Data');
            $fields = array_values(array_unique([$config['key'], ...$config['fields']]));
            $sheet->fromArray([$this->labels($fields)], null, 'A1');
            $highestColumn = $sheet->getHighestColumn();
            $sheet->getStyle("A1:{$highestColumn}1")->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $sheet->getStyle("A1:{$highestColumn}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F46E5');

            for ($column = 1; $column <= Coordinate::columnIndexFromString($highestColumn); $column++) {
                $sheet->getColumnDimensionByColumn($column)->setAutoSize(true);
            }
            $this->formatTextColumns($sheet, $fields, $config['import_text'] ?? []);

            $guide = $spreadsheet->createSheet();
            $guide->setTitle('Petunjuk');
            $guide->fromArray([
                ['PANDUAN IMPOR '.$config['label']],
                ['1. Untuk tambah data baru, kosongkan kolom ID KEY. Sistem akan membuat ID otomatis.'],
                ['2. Untuk memperbarui data, ekspor data terlebih dahulu lalu pertahankan nilai ID KEY.'],
                ['3. Isi data mulai dari sheet Data. Jangan mengubah judul kolom.'],
                ['4. Gunakan format angka Indonesia, misalnya 1.250.000 atau 1250000.'],
                [$config['import_instruction'] ?? 'Periksa kembali data sebelum memilih Simpan data.'],
            ], null, 'A1');
            $guide->getColumnDimension('A')->setWidth(110);
            $guide->getStyle('A1')->getFont()->setBold(true)->setSize(14);

            (new Xlsx($spreadsheet))->save('php://output');
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    private function downloadSpreadsheet(array $rows, string $filename, string $sheetTitle, array $textFields = [], array $fieldOrder = []): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows, $sheetTitle, $textFields, $fieldOrder) {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle(Str::limit($sheetTitle, 31, ''));
            $sheet->fromArray($rows, null, 'A1');
            $this->forceTextCells($sheet, $rows, $fieldOrder, $textFields);
            $highestColumn = $sheet->getHighestColumn();
            $sheet->getStyle("A1:{$highestColumn}1")->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
            $sheet->getStyle("A1:{$highestColumn}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F46E5');
            $highestColumnIndex = Coordinate::columnIndexFromString($highestColumn);
            for ($column = 1; $column <= $highestColumnIndex; $column++) {
                $sheet->getColumnDimensionByColumn($column)->setAutoSize(true);
            }
            $this->formatTextColumns($sheet, $fieldOrder, $textFields);
            (new Xlsx($spreadsheet))->save('php://output');
        }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
    }

    private function formatTextColumns($sheet, array $fieldOrder, array $textFields): void
    {
        foreach ($textFields as $field) {
            $position = array_search($field, $fieldOrder, true);
            if ($position === false) {
                continue;
            }

            $column = Coordinate::stringFromColumnIndex($position + 1);
            $sheet->getStyle("{$column}:{$column}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_TEXT);
        }
    }

    private function forceTextCells($sheet, array $rows, array $fieldOrder, array $textFields): void
    {
        if ($fieldOrder === [] || $textFields === []) {
            return;
        }

        foreach ($textFields as $field) {
            $position = array_search($field, $fieldOrder, true);
            if ($position === false) {
                continue;
            }

            $column = Coordinate::stringFromColumnIndex($position + 1);
            foreach (array_slice($rows, 1) as $index => $row) {
                $value = $row[$position] ?? '';
                $sheet->setCellValueExplicit("{$column}".($index + 2), (string) $value, DataType::TYPE_STRING);
            }
        }
    }
}
