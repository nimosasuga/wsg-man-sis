<?php

namespace App\Support;

class MonthlyActivity
{
    public static function fromGroupedRows(iterable $rows): array
    {
        $counts = [];

        foreach ($rows as $row) {
            $year = (int) data_get($row, 'tahun');
            $month = (int) data_get($row, 'bulan');
            $value = max(0, (int) data_get($row, 'value', 0));

            if ($year <= 2000 || $month < 1 || $month > 12) {
                continue;
            }

            $counts[$year][$month] = ($counts[$year][$month] ?? 0) + $value;
        }

        krsort($counts, SORT_NUMERIC);

        $data = [];
        foreach ($counts as $year => $months) {
            $values = [];
            foreach (range(1, 12) as $month) {
                $values[] = [
                    'bulan' => $month,
                    'value' => (int) ($months[$month] ?? 0),
                ];
            }

            $data[] = [
                'tahun' => (int) $year,
                'months' => $values,
            ];
        }

        return [
            'data' => $data,
            'years' => array_map('intval', array_keys($counts)),
            'total' => array_sum(array_map('array_sum', $counts)),
        ];
    }
}
