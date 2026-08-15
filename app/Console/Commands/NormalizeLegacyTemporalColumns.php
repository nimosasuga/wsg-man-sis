<?php

namespace App\Console\Commands;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class NormalizeLegacyTemporalColumns extends Command
{
    protected $signature = 'washeng:normalize-legacy-temporal
                            {--execute : Terapkan perubahan setelah preflight berhasil}
                            {--table=* : Batasi ke nama tabel tertentu}
                            {--chunk=300 : Jumlah baris setiap pembaruan SQL}';

    protected $description = 'Normalisasi kolom tanggal legacy VARCHAR menjadi DATE/DATETIME tanpa menghapus data yang tidak valid.';

    private const EXCLUDED_NAMES = '/(?:selisih|total)_?(?:jam|waktu)|jam_overtime|approval_ovt|^jam_(?:request|proses|isi_bbm_\d+)$/i';

    public function handle(): int
    {
        $execute = (bool) $this->option('execute');
        $tables = collect($this->option('table'))->filter()->values();
        $chunkSize = max(50, min(1000, (int) $this->option('chunk')));

        $columns = collect(DB::select(<<<'SQL'
            SELECT
                c.table_name AS table_name,
                c.column_name AS column_name,
                c.column_type AS column_type,
                c.is_nullable AS is_nullable,
                c.column_default AS column_default,
                c.column_comment AS column_comment,
                c.extra AS extra,
                k.column_name AS primary_key,
                COALESCE(pk.primary_key_count, 0) AS primary_key_count
            FROM information_schema.columns c
            LEFT JOIN information_schema.key_column_usage k
                ON k.table_schema = c.table_schema
                AND k.table_name = c.table_name
                AND k.constraint_name = 'PRIMARY'
                AND k.ordinal_position = 1
            LEFT JOIN (
                SELECT table_schema, table_name, COUNT(*) AS primary_key_count
                FROM information_schema.key_column_usage
                WHERE constraint_name = 'PRIMARY'
                GROUP BY table_schema, table_name
            ) pk
                ON pk.table_schema = c.table_schema
                AND pk.table_name = c.table_name
            WHERE c.table_schema = DATABASE()
                AND c.data_type IN ('char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext')
            ORDER BY c.table_name, c.ordinal_position
        SQL))
            ->map(fn ($column) => (array) $column)
            ->filter(fn (array $column) => $this->isTemporalCandidate($column['column_name']))
            ->when($tables->isNotEmpty(), fn ($items) => $items->whereIn('table_name', $tables))
            ->values();

        if ($columns->isEmpty()) {
            $this->info('Tidak ada kolom temporal legacy yang sesuai untuk diperiksa.');

            return self::SUCCESS;
        }

        $report = [
            'mode' => $execute ? 'execute' : 'dry-run',
            'generated_at' => now()->toIso8601String(),
            'database' => DB::connection()->getDatabaseName(),
            'columns' => [],
        ];

        $this->info(($execute ? 'Menerapkan' : 'Memeriksa').' '.$columns->count().' kolom temporal legacy.');
        $this->newLine();

        foreach ($columns as $column) {
            $result = $this->inspectAndNormalize($column, $execute, $chunkSize);
            $report['columns'][] = $result;

            $label = $column['table_name'].'.'.$column['column_name'];
            if ($result['status'] === 'converted') {
                $this->line("<info>OK</info> {$label} -> {$result['target_type']} ({$result['changed_rows']} nilai dinormalisasi)");
            } elseif ($result['status'] === 'ready') {
                $this->line("<comment>SIAP</comment> {$label} -> {$result['target_type']} ({$result['changed_rows']} nilai akan dinormalisasi)");
            } else {
                $this->line("<error>LEWATI</error> {$label}: {$result['reason']}");
            }
        }

        $directory = storage_path('app/temporal-normalization');
        File::ensureDirectoryExists($directory);
        $path = $directory.'/'.now()->format('Ymd_His').'-'.($execute ? 'execute' : 'dry-run').'.json';
        File::put($path, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $summary = collect($report['columns'])->countBy('status');
        $this->newLine();
        $this->info('Laporan: '.$path);
        $this->line('Ringkasan: '.$summary->map(fn ($count, $status) => "{$status}={$count}")->implode(', '));

        return self::SUCCESS;
    }

    private function inspectAndNormalize(array $column, bool $execute, int $chunkSize): array
    {
        $table = $column['table_name'];
        $name = $column['column_name'];
        $primaryKey = $column['primary_key'];
        $base = [
            'table' => $table,
            'column' => $name,
            'source_type' => $column['column_type'],
            'status' => 'skipped',
            'changed_rows' => 0,
            'invalid_samples' => [],
        ];

        if ($primaryKey === null || $primaryKey === '') {
            return [...$base, 'reason' => 'tabel tidak memiliki primary key tunggal untuk pembaruan aman.'];
        }

        if ((int) ($column['primary_key_count'] ?? 0) !== 1) {
            return [...$base, 'reason' => 'primary key gabungan; dilewati agar pembaruan tidak mengenai lebih dari satu baris.'];
        }

        if (Str::contains(strtolower((string) $column['extra']), ['generated', 'auto_increment'])) {
            return [...$base, 'reason' => 'kolom terkunci (generated/auto increment).'];
        }

        $rows = DB::table($table)
            ->select([$primaryKey, $name])
            ->whereNotNull($name)
            ->where($name, '!=', '')
            ->orderBy($primaryKey)
            ->get();

        $targetType = $this->expectsDateTime($name) || $this->rowsContainTime($rows, $name)
            ? 'datetime'
            : 'date';

        $updates = [];
        $invalid = [];
        foreach ($rows as $row) {
            $raw = trim((string) $row->{$name});
            $normalized = $this->normalize($raw, $targetType === 'datetime');
            if ($normalized === null) {
                if (count($invalid) < 12) {
                    $invalid[] = $raw;
                }
                continue;
            }

            if ($normalized !== $raw) {
                $updates[] = ['key' => $row->{$primaryKey}, 'value' => $normalized];
            }
        }

        if ($invalid !== []) {
            return [...$base, 'reason' => 'masih ada nilai yang tidak dapat dibaca.', 'invalid_samples' => $invalid];
        }

        $blankCount = DB::table($table)->where(function ($query) use ($name) {
            $query->whereNull($name)->orWhere($name, '');
        })->count();

        if ($blankCount > 0 && strtoupper((string) $column['is_nullable']) !== 'YES') {
            return [...$base, 'reason' => 'ada nilai kosong pada kolom NOT NULL; perlu ditangani tanpa menghapus data.'];
        }

        $default = $this->normalizedDefault($column['column_default'], $targetType === 'datetime');
        if ($default === false) {
            return [...$base, 'reason' => 'default kolom tidak cocok untuk tipe '.$targetType.'.'];
        }

        $result = [...$base, 'status' => $execute ? 'converted' : 'ready', 'target_type' => $targetType, 'changed_rows' => count($updates)];

        if (! $execute) {
            return $result;
        }

        DB::transaction(function () use ($table, $name, $primaryKey, $updates, $chunkSize, $column, $targetType, $default) {
            foreach (array_chunk($updates, $chunkSize) as $chunk) {
                $bindings = [];
                $when = [];
                $keys = [];
                foreach ($chunk as $update) {
                    $when[] = 'WHEN ? THEN ?';
                    $bindings[] = $update['key'];
                    $bindings[] = $update['value'];
                    $keys[] = $update['key'];
                }

                $quotedTable = $this->quoteIdentifier($table);
                $quotedColumn = $this->quoteIdentifier($name);
                $quotedKey = $this->quoteIdentifier($primaryKey);
                $placeholders = implode(', ', array_fill(0, count($keys), '?'));
                DB::update(
                    "UPDATE {$quotedTable} SET {$quotedColumn} = CASE {$quotedKey} ".implode(' ', $when)." ELSE {$quotedColumn} END WHERE {$quotedKey} IN ({$placeholders})",
                    [...$bindings, ...$keys],
                );
            }

            if (strtoupper((string) $column['is_nullable']) === 'YES') {
                DB::table($table)->where($name, '')->update([$name => null]);
            }

            $this->alterColumn($table, $name, $targetType, $column, $default);
        });

        return $result;
    }

    private function alterColumn(string $table, string $name, string $targetType, array $column, string|null $default): void
    {
        $nullable = strtoupper((string) $column['is_nullable']) === 'YES' ? 'NULL' : 'NOT NULL';
        $defaultClause = match ($default) {
            null => '',
            'CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()' => ' DEFAULT '.$default,
            default => ' DEFAULT '.DB::getPdo()->quote($default),
        };
        $comment = (string) ($column['column_comment'] ?? '');
        $commentClause = $comment === '' ? '' : ' COMMENT '.DB::getPdo()->quote($comment);
        $extra = strtolower(trim((string) ($column['extra'] ?? '')));
        $extraClause = $targetType === 'datetime' && in_array($extra, ['on update current_timestamp', 'on update current_timestamp(6)'], true)
            ? ' '.strtoupper($extra)
            : '';

        DB::statement('ALTER TABLE '.$this->quoteIdentifier($table)
            .' MODIFY COLUMN '.$this->quoteIdentifier($name)
            .' '.strtoupper($targetType).' '.$nullable.$defaultClause.$extraClause.$commentClause);
    }

    private function normalizedDefault(mixed $value, bool $withTime): string|false|null
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (in_array(strtoupper((string) $value), ['CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP()'], true)) {
            return $withTime ? strtoupper((string) $value) : false;
        }

        return $this->normalize((string) $value, $withTime);
    }

    private function isTemporalCandidate(string $name): bool
    {
        if (preg_match(self::EXCLUDED_NAMES, $name) === 1) {
            return false;
        }

        return preg_match('/(?:tanggal|tgl|datetime|date_time|timestamp|waktu_(?:masuk|pulang|mulai|selesai)|tempo|^date$)/i', $name) === 1;
    }

    private function expectsDateTime(string $name): bool
    {
        return preg_match('/(?:datetime|date_time|timestamp|waktu_(?:masuk|pulang|mulai|selesai)|created_at|updated_at)/i', $name) === 1;
    }

    private function normalize(string $value, bool $withTime): ?string
    {
        $value = trim($value);
        if ($value === '' || preg_match('/^(?:0|0000-00-00(?: 00:00:00)?|00[\/-]00[\/-]0000)$/', $value) === 1) {
            return null;
        }

        $value = preg_replace('/(\d{1,2})\.(\d{2})(?:\.(\d{2}))?$/', '$1:$2:$3', $value) ?? $value;
        $value = rtrim($value, ':');
        $value = $this->normalizeIndonesianMonth($value);

        if (is_numeric($value) && (float) $value > 0) {
            try {
                $excelDate = CarbonImmutable::create(1899, 12, 30)->addSeconds((int) round(((float) $value) * 86400));

                return $excelDate->format($withTime ? 'Y-m-d H:i:s' : 'Y-m-d');
            } catch (\Throwable) {
                return null;
            }
        }

        $formats = $withTime
            ? ['!d/m/Y H:i:s', '!d/m/Y H:i', '!d-m-Y H:i:s', '!d-m-Y H:i', '!d.m.Y H:i:s', '!d.m.Y H:i', '!Y-m-d H:i:s', '!Y-m-d H:i', '!Y/m/d H:i:s', '!Y/m/d H:i', '!Y-m-d\\TH:i:s', '!Y-m-d\\TH:i', '!d/m/Y', '!d-m-Y', '!d.m.Y', '!Y-m-d', '!Y/m/d']
            : ['!d/m/Y', '!d-m-Y', '!d.m.Y', '!Y-m-d', '!Y/m/d'];

        foreach ($formats as $format) {
            try {
                $date = CarbonImmutable::createFromFormat($format, $value);
                $errors = CarbonImmutable::getLastErrors();
                if (is_array($errors) && (($errors['warning_count'] ?? 0) > 0 || ($errors['error_count'] ?? 0) > 0)) {
                    continue;
                }

                return $date->format($withTime ? 'Y-m-d H:i:s' : 'Y-m-d');
            } catch (\Throwable) {
                // Try the next known format.
            }
        }

        return null;
    }

    private function rowsContainTime(iterable $rows, string $name): bool
    {
        if ($this->expectsDateTime($name)) {
            return true;
        }

        foreach ($rows as $row) {
            $value = trim((string) $row->{$name});
            if (preg_match('/(?:\s|T)\d{1,2}[:.]\d{2}(?::\d{2}|\.\d{2})?$/', $value) === 1) {
                return true;
            }
        }

        return false;
    }

    private function normalizeIndonesianMonth(string $value): string
    {
        $months = ['januari' => '01', 'jan' => '01', 'februari' => '02', 'feb' => '02', 'maret' => '03', 'mar' => '03', 'april' => '04', 'apr' => '04', 'mei' => '05', 'juni' => '06', 'jun' => '06', 'juli' => '07', 'jul' => '07', 'agustus' => '08', 'agu' => '08', 'aug' => '08', 'september' => '09', 'sep' => '09', 'oktober' => '10', 'okt' => '10', 'oct' => '10', 'november' => '11', 'nov' => '11', 'desember' => '12', 'des' => '12', 'dec' => '12'];

        return preg_replace_callback('/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(\b(?:\s+\d{1,2}[:.]\d{2}(?::\d{2})?)?)/', function (array $matches) use ($months): string {
            $month = $months[strtolower($matches[2])] ?? null;
            if ($month === null) {
                return $matches[0];
            }

            return str_pad($matches[1], 2, '0', STR_PAD_LEFT).'/'.$month.'/'.$matches[3].trim((string) ($matches[4] ?? ''));
        }, $value) ?? $value;
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '`'.str_replace('`', '``', $identifier).'`';
    }
}
