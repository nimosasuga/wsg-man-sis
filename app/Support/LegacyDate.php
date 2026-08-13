<?php

namespace App\Support;

use DateTimeImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class LegacyDate
{
    private const FORMATS = [
        'd/m/Y H:i:s',
        'd/m/Y H:i',
        'd/m/Y',
        'Y-m-d H:i:s',
        'Y-m-d H:i',
        'Y-m-d',
        'm-d-Y',
        'm/d/Y',
        'd-m-Y',
    ];

    public static function parse(mixed $value): ?DateTimeImmutable
    {
        $value = trim((string) $value);

        if ($value === '' || $value === '0000-00-00') {
            return null;
        }

        foreach (self::FORMATS as $format) {
            $date = DateTimeImmutable::createFromFormat('!'.$format, $value);

            if ($date === false) {
                continue;
            }

            $errors = DateTimeImmutable::getLastErrors();
            if (is_array($errors) && (($errors['warning_count'] ?? 0) > 0 || ($errors['error_count'] ?? 0) > 0)) {
                continue;
            }

            if ($date->format($format) === $value) {
                return $date;
            }
        }

        return null;
    }

    public static function iso(mixed $value): ?string
    {
        return self::parse($value)?->format('Y-m-d');
    }

    public static function display(mixed $value, bool $withTime = false): string
    {
        $date = self::parse($value);

        if (! $date) {
            return trim((string) $value);
        }

        return $date->format($withTime ? 'd/m/Y H:i:s' : 'd/m/Y');
    }

    public static function sql(string $column): string
    {
        $safeColumn = self::quoteColumn($column);

        return "COALESCE("
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%d/%m/%Y %H:%i:%s'),"
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%d/%m/%Y %H:%i'),"
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%d/%m/%Y'),"
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%Y-%m-%d %H:%i:%s'),"
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%Y-%m-%d %H:%i'),"
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%Y-%m-%d'),"
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%m-%d-%Y'),"
            ."STR_TO_DATE(NULLIF(TRIM($safeColumn), ''), '%m/%d/%Y')"
            .")";
    }

    private static function quoteColumn(string $column): string
    {
        return collect(explode('.', $column))
            ->map(fn ($part) => '`'.str_replace('`', '``', $part).'`')
            ->implode('.');
    }

    public static function orderBy(Builder $query, string $column, string $direction = 'asc'): Builder
    {
        $direction = strtolower($direction) === 'desc' ? 'desc' : 'asc';

        return $query->orderByRaw(self::sql($column)." {$direction}");
    }

    public static function whereDate(Builder $query, string $column, mixed $date): Builder
    {
        $parsed = self::parse($date);

        if (! $parsed) {
            return $query->where($column, $date);
        }

        return $query->whereRaw('DATE('.self::sql($column).') = ?', [$parsed->format('Y-m-d')]);
    }

    public static function whereFrom(Builder $query, string $column, mixed $date): Builder
    {
        $parsed = self::parse($date);

        if (! $parsed) {
            return $query;
        }

        return $query->whereRaw('DATE('.self::sql($column).') >= ?', [$parsed->format('Y-m-d')]);
    }

    public static function whereTo(Builder $query, string $column, mixed $date): Builder
    {
        $parsed = self::parse($date);

        if (! $parsed) {
            return $query;
        }

        return $query->whereRaw('DATE('.self::sql($column).') <= ?', [$parsed->format('Y-m-d')]);
    }

    public static function whereYear(Builder $query, string $column, string|int $year): Builder
    {
        return $query->whereRaw('YEAR('.self::sql($column).') = ?', [(int) $year]);
    }

    public static function yearOptions(string $table, string $column): array
    {
        $yearExpression = 'YEAR('.self::sql($column).')';

        return array_values(array_unique(array_merge(
            ['ALL'],
            DB::table($table)
                ->whereNotNull($column)
                ->where($column, '!=', '')
                ->selectRaw("{$yearExpression} as tahun")
                ->distinct()
                ->orderBy('tahun')
                ->pluck('tahun')
                ->filter()
                ->map(fn ($value) => (string) $value)
                ->all()
        )));
    }

    public static function latestValue(Builder $query, string $column): mixed
    {
        return self::orderBy($query->whereNotNull($column)->where($column, '!=', ''), $column, 'desc')
            ->value($column);
    }
}
