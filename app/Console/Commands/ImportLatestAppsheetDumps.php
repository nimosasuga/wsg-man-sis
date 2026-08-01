<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

class ImportLatestAppsheetDumps extends Command
{
    protected $signature = 'appsheet:import-latest-dumps {--dry-run : Validasi dump tanpa menulis data}';

    protected $description = 'Upsert dump AppSheet terbaru tanpa menghapus tabel atau data legacy.';

    private const DUMPS = [
        'db_chargo_data_paket_masuk' => 'data_db/Db_SQL_Appsheet/db_chargo_data_paket_masuk.sql',
        'form_download_dashboard_manajemen' => 'data_db/Db_SQL_Appsheet/form_download_dashboard_manajemen.sql',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $jobs = [];

        foreach (self::DUMPS as $table => $relativePath) {
            $path = base_path($relativePath);
            if (! is_file($path)) {
                $this->error("Dump tidak ditemukan: {$relativePath}");

                return self::FAILURE;
            }
            if (! Schema::hasTable($table)) {
                $this->error("Tabel tujuan tidak ditemukan: {$table}");

                return self::FAILURE;
            }

            $statements = $this->insertStatements((string) file_get_contents($path), $table);
            if ($statements === []) {
                $this->error("Tidak ada statement INSERT untuk {$table}.");

                return self::FAILURE;
            }

            $this->validateColumns($table, $statements[0]);
            $jobs[] = compact('table', 'relativePath', 'statements');
        }

        foreach ($jobs as $job) {
            $this->line(sprintf('%s: %d statement upsert, %d record sebelum impor.', $job['table'], count($job['statements']), DB::table($job['table'])->count()));
        }

        if ($dryRun) {
            $this->info('Validasi selesai. Tidak ada data yang ditulis.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($jobs) {
            foreach ($jobs as $job) {
                foreach ($job['statements'] as $statement) {
                    DB::unprepared($statement);
                }
            }
        });

        foreach ($jobs as $job) {
            $this->info(sprintf('%s: %d record setelah impor.', $job['table'], DB::table($job['table'])->count()));
        }

        $duplicateStt = (int) (DB::selectOne(
            "SELECT COUNT(*) AS total FROM (
                SELECT no_stt
                FROM db_chargo_data_paket_masuk
                WHERE no_stt IS NOT NULL AND no_stt != ''
                GROUP BY no_stt
                HAVING COUNT(*) > 1
            ) AS duplicate_stt"
        )->total ?? 0);

        Cache::forget('dashboard.db_chart_data');
        $this->info("Validasi LCL: {$duplicateStt} no_stt duplikat.");
        $this->info('Impor aman selesai. Data yang tidak ada di dump lama tidak dihapus.');

        return self::SUCCESS;
    }

    private function insertStatements(string $sql, string $table): array
    {
        $statements = [];

        foreach ($this->splitStatements($sql) as $statement) {
            if (! preg_match('/INSERT\s+INTO\s+`?'.preg_quote($table, '/').'`?\s*\((?<columns>.*?)\)\s*VALUES\s*(?<values>.+)$/is', trim($statement), $matches)) {
                continue;
            }

            $columns = array_values(array_filter(array_map(
                static fn ($column) => trim($column, " `\t\r\n"),
                explode(',', $matches['columns'])
            )));
            if ($columns === [] || ! in_array('id_key', $columns, true)) {
                throw new RuntimeException("Statement {$table} tidak memiliki id_key untuk upsert.");
            }

            $updates = implode(', ', array_map(
                static fn ($column) => "`{$column}` = VALUES(`{$column}`)",
                array_filter($columns, static fn ($column) => $column !== 'id_key')
            ));
            $statements[] = sprintf(
                'INSERT INTO `%s` (%s) VALUES %s ON DUPLICATE KEY UPDATE %s',
                $table,
                implode(', ', array_map(static fn ($column) => "`{$column}`", $columns)),
                trim($matches['values']),
                $updates
            );
        }

        return $statements;
    }

    private function validateColumns(string $table, string $statement): void
    {
        preg_match('/INSERT\s+INTO\s+`?'.preg_quote($table, '/').'`?\s*\((?<columns>.*?)\)/is', $statement, $matches);
        $dumpColumns = array_values(array_filter(array_map(
            static fn ($column) => trim($column, " `\t\r\n"),
            explode(',', $matches['columns'] ?? '')
        )));
        $missing = array_diff($dumpColumns, Schema::getColumnListing($table));

        if ($missing !== []) {
            throw new RuntimeException("Kolom dump tidak ada di {$table}: ".implode(', ', $missing));
        }
    }

    private function splitStatements(string $sql): array
    {
        $statements = [];
        $buffer = '';
        $quote = null;
        $length = strlen($sql);

        for ($index = 0; $index < $length; $index++) {
            $character = $sql[$index];
            $buffer .= $character;

            if ($quote !== null) {
                if ($character === $quote && ($index === 0 || $sql[$index - 1] !== '\\')) {
                    $quote = null;
                }
                continue;
            }

            if (in_array($character, ["'", '"', '`'], true)) {
                $quote = $character;
                continue;
            }

            if ($character === ';') {
                $statements[] = rtrim(substr($buffer, 0, -1));
                $buffer = '';
            }
        }

        return $statements;
    }
}
