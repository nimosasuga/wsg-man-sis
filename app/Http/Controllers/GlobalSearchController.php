<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class GlobalSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $keyword = trim((string) $request->query('q', ''));

        if (mb_strlen($keyword) < 2) {
            return response()->json(['results' => []]);
        }

        $permissions = $request->user()?->getAllPermissions()->pluck('name')->all() ?? [];
        $results = collect();

        foreach ($this->sources() as $source) {
            if (! in_array($source['permission'], $permissions, true)) {
                continue;
            }

            $results = $results->merge($this->searchSource($source, $keyword));

            if ($results->count() >= 12) {
                break;
            }
        }

        return response()->json([
            'results' => $results->take(12)->values(),
        ]);
    }

    private function sources(): array
    {
        return [
            [
                'table' => 'hr_manager_db_pegawai',
                'permission' => 'employees.view',
                'module' => 'Daftar Karyawan',
                'title' => 'nama_karyawan',
                'subtitle' => ['nip', 'jabatan', 'area'],
                'search' => ['nama_karyawan', 'nama_panggilan', 'nip', 'jabatan', 'divisi', 'area', 'no_ponsel', 'email'],
                'url' => fn ($row) => '/daftar-karyawan/'.rawurlencode((string) $row->id_key),
            ],
            [
                'table' => 'hr_manager_db_inventori',
                'permission' => 'inventory.view',
                'module' => 'Daftar Unit',
                'title' => 'nopol',
                'subtitle' => ['area', 'tipe', 'project'],
                'search' => ['nopol', 'area', 'tipe', 'pabrikan', 'model', 'project', 'status'],
                'url' => fn ($row) => '/inventori/pajak/'.rawurlencode((string) $row->nopol),
            ],
            [
                'table' => 'operasional_update_posisi_unit',
                'permission' => 'on-the-road.view',
                'module' => 'On The Road / Monitoring Unit',
                'title' => 'nopol',
                'subtitle' => ['nama_driver', 'tanggal_jam', 'keterangan'],
                'search' => ['nopol', 'nama_driver', 'location', 'keterangan', 'tanggal_jam'],
                'url' => fn ($row) => '/on-the-road/position/'.rawurlencode((string) $row->id),
            ],
            [
                'table' => 'operasional_primary_input',
                'permission' => 'profit-unit.view',
                'module' => 'Profit Unit / Primary',
                'title' => 'nopol_driver',
                'subtitle' => ['area', 'jenis', 'tanggal_muat'],
                'search' => ['id_key', 'nopol_driver', 'area', 'jenis', 'tanggal_muat', 'tanggal_terima'],
                'url' => fn ($row) => '/profit-unit/primary/table/'.rawurlencode((string) $row->id_key),
            ],
            [
                'table' => 'operasional_secondary_input',
                'permission' => 'profit-unit.view',
                'module' => 'Profit Unit / Secondary',
                'title' => 'nopol',
                'subtitle' => ['area', 'tipe_unit', 'tanggal'],
                'search' => ['id_key', 'nopol', 'area', 'tipe_unit', 'tanggal', 'project'],
                'url' => fn ($row) => '/profit-unit/secondary/table/'.rawurlencode((string) $row->id_key),
            ],
            [
                'table' => 'operasional_rental_unit_input',
                'permission' => 'profit-unit.view',
                'module' => 'Profit Unit / Rental',
                'title' => 'nopol',
                'subtitle' => ['area', 'tipe', 'tanggal'],
                'search' => ['id_key', 'nopol', 'area', 'tipe', 'tanggal', 'regional', 'no_bap', 'no_po'],
                'url' => fn ($row) => '/profit-unit/rental/table/'.rawurlencode((string) $row->id_key),
            ],
            [
                'table' => 'db_chargo_data_paket_masuk',
                'permission' => 'profit-unit.view',
                'module' => 'Profit Unit / LCL',
                'title' => 'no_stt',
                'subtitle' => ['nama_pengirim', 'kota_tujuan', 'kode_pesanan'],
                'search' => ['id_key', 'no_stt', 'nama_pengirim', 'nama_penerima', 'kota_asal', 'kota_tujuan', 'kode_pesanan'],
                'url' => fn ($row) => '/profit-unit/lcl/table/'.rawurlencode((string) $row->id_key),
            ],
        ];
    }

    private function searchSource(array $source, string $keyword)
    {
        if (! Schema::hasTable($source['table'])) {
            return collect();
        }

        $columns = Schema::getColumnListing($source['table']);
        $searchable = array_values(array_intersect($source['search'], $columns));

        if (! $searchable || ! in_array('id_key', $columns, true) && ! in_array('id', $columns, true)) {
            return collect();
        }

        $select = array_values(array_unique(array_filter(array_merge(
            ['id', 'id_key'],
            [$source['title']],
            $source['subtitle'],
            $searchable,
        ), fn ($column) => in_array($column, $columns, true))));

        $rows = DB::table($source['table'])
            ->select($select)
            ->where(function ($query) use ($searchable, $keyword) {
                foreach ($searchable as $column) {
                    $query->orWhere($column, 'like', '%'.$keyword.'%');
                }
            })
            ->limit(4)
            ->get();

        return $rows->map(function ($row) use ($source) {
            $titleColumn = $source['title'];
            $title = trim((string) ($row->{$titleColumn} ?? ''));

            return [
                'module' => $source['module'],
                'title' => $title !== '' ? $title : 'Tanpa judul',
                'subtitle' => $this->subtitle($row, $source['subtitle']),
                'url' => $source['url']($row),
            ];
        });
    }

    private function subtitle(object $row, array $columns): string
    {
        return collect($columns)
            ->map(fn ($column) => trim((string) ($row->{$column} ?? '')))
            ->filter()
            ->map(fn ($value) => Str::limit($value, 42))
            ->implode(' - ');
    }
}
