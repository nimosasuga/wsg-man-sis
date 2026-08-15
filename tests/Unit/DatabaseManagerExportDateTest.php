<?php

namespace Tests\Unit;

use App\Http\Controllers\DatabaseManagerController;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class DatabaseManagerExportDateTest extends TestCase
{
    #[DataProvider('temporalValues')]
    public function test_temporal_values_are_exported_in_sql_iso_format(
        string $value,
        array $column,
        string $expected,
    ): void {
        $controller = new DatabaseManagerController;
        $method = new ReflectionMethod($controller, 'formatDateForExport');

        $this->assertSame($expected, $method->invoke($controller, $value, $column));
    }

    public static function temporalValues(): array
    {
        return [
            'native date from Indonesian format' => [
                '15/08/2026',
                ['name' => 'tanggal', 'type' => 'date'],
                '2026-08-15',
            ],
            'native datetime with dot separator' => [
                '15/08/2026 07.13',
                ['name' => 'waktu_masuk', 'type' => 'datetime'],
                '2026-08-15 07:13:00',
            ],
            'date-like varchar' => [
                '15 Agustus 2026',
                ['name' => 'tanggal_invoice', 'type' => 'varchar(50)'],
                '2026-08-15',
            ],
            'datetime-like varchar' => [
                '15/08/2026 07:13:45',
                ['name' => 'waktu_pulang', 'type' => 'varchar(50)'],
                '2026-08-15 07:13:45',
            ],
            'ISO date remains unchanged' => [
                '2026-08-15',
                ['name' => 'tanggal', 'type' => 'date'],
                '2026-08-15',
            ],
            'ISO datetime remains unchanged' => [
                '2026-08-15 07:13:00',
                ['name' => 'waktu_masuk', 'type' => 'datetime'],
                '2026-08-15 07:13:00',
            ],
            'annotated date prefix' => [
                '08/15/2026: HERY: BALIKPAPAN',
                ['name' => 'add_data', 'type' => 'varchar(255)'],
                '2026-08-15: HERY: BALIKPAPAN',
            ],
        ];
    }
}
