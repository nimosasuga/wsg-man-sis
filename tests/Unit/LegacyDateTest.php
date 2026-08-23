<?php

namespace Tests\Unit;

use App\Support\LegacyDate;
use PHPUnit\Framework\TestCase;

class LegacyDateTest extends TestCase
{
    public function test_php_and_sql_parsers_support_day_month_year_with_dashes(): void
    {
        $this->assertSame('2026-08-15', LegacyDate::iso('15-08-2026'));
        $this->assertStringContainsString("'%d-%m-%Y'", LegacyDate::sql('tanggal'));
    }
}
