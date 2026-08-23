<?php

namespace Tests\Unit;

use App\Support\MonthlyActivity;
use PHPUnit\Framework\TestCase;

class MonthlyActivityTest extends TestCase
{
    public function test_it_builds_sorted_years_and_fills_missing_months_with_zero(): void
    {
        $result = MonthlyActivity::fromGroupedRows([
            (object) ['tahun' => '2025', 'bulan' => '12', 'value' => '4'],
            (object) ['tahun' => '2026', 'bulan' => '2', 'value' => '7'],
            (object) ['tahun' => '2026', 'bulan' => '1', 'value' => '5'],
            (object) ['tahun' => '0', 'bulan' => '1', 'value' => '99'],
            (object) ['tahun' => '2026', 'bulan' => '13', 'value' => '99'],
        ]);

        $this->assertSame([2026, 2025], $result['years']);
        $this->assertSame(16, $result['total']);
        $this->assertCount(12, $result['data'][0]['months']);
        $this->assertSame(['bulan' => 1, 'value' => 5], $result['data'][0]['months'][0]);
        $this->assertSame(['bulan' => 2, 'value' => 7], $result['data'][0]['months'][1]);
        $this->assertSame(['bulan' => 3, 'value' => 0], $result['data'][0]['months'][2]);
        $this->assertSame(['bulan' => 12, 'value' => 4], $result['data'][1]['months'][11]);
    }
}
