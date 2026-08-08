<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ModuleCrudController extends Controller
{
    public function modules(Request $request): Response
    {
        $modules = collect(config('module_crud'))
            ->map(function ($config, $key) use ($request) {
                if (! $request->user()?->can($config['permission']) || ! Schema::hasTable($config['table'])) {
                    return null;
                }

                return [
                    'key' => $key,
                    'label' => $config['label'],
                    'permission' => $config['permission'],
                    'href' => '/module-records/'.$key,
                    ...$this->moduleGroup($key),
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('Crud/Modules', [
            'modules' => $modules,
            'canManageDatabase' => $request->user()?->can('database.manage') ?? false,
        ]);
    }

    /**
     * Kelompok ini hanya untuk navigasi katalog CRUD, bukan pembatasan akses.
     * Otorisasi tetap ditentukan oleh permission pada konfigurasi modul.
     */
    private function moduleGroup(string $key): array
    {
        return match (true) {
            str_starts_with($key, 'profit-') => [
                'group' => 'Profit Unit',
                'group_key' => 'profit',
            ],
            in_array($key, ['biaya-inventori', 'pajak-inventori'], true) => [
                'group' => 'Biaya & Legalitas',
                'group_key' => 'biaya',
            ],
            in_array($key, ['unit-inventori', 'kendaraan-operasional', 'asset-ho', 'toolkit'], true) => [
                'group' => 'Inventori',
                'group_key' => 'inventori',
            ],
            in_array($key, ['monitoring-unit', 'upload-dokumen-operasional'], true) => [
                'group' => 'Operasional',
                'group_key' => 'operasional',
            ],
            $key === 'finance-fat' => [
                'group' => 'Finance',
                'group_key' => 'finance',
            ],
            str_starts_with($key, 'dropdown-') || in_array($key, ['kategori-barang-cargo', 'daftar-ongkir-cargo'], true) => [
                'group' => 'Master Data',
                'group_key' => 'master-data',
            ],
            default => [
                'group' => 'Administrasi',
                'group_key' => 'administrasi',
            ],
        };
    }

    public function index(Request $request, string $module): Response
    {
        $config = $this->config($module);
        $search = trim((string) $request->query('search', ''));
        $fields = $this->fields($config);

        $query = DB::table($config['table'])->select($fields);

        if ($search !== '') {
            $query->where(function ($q) use ($fields, $search) {
                foreach ($fields as $field) {
                    $q->orWhere($field, 'like', '%'.$search.'%');
                }
            });
        }

        return Inertia::render('Crud/Index', [
            'module' => $module,
            'config' => $this->payloadConfig($config, $module),
            'records' => $query
                ->orderBy($config['key'])
                ->limit(300)
                ->get(),
            'filters' => ['search' => $search],
        ]);
    }

    public function create(string $module): Response
    {
        $config = $this->config($module);

        return Inertia::render('Crud/Form', [
            'mode' => 'create',
            'module' => $module,
            'config' => $this->payloadConfig($config, $module),
            'record' => $this->blankRecord($config),
        ]);
    }

    public function store(Request $request, string $module): RedirectResponse
    {
        $config = $this->config($module);
        $data = $this->validatedData($request, $config);
        $key = $config['key'];

        if (in_array($key, Schema::getColumnListing($config['table']), true)) {
            $data[$key] = $this->newKey($config);
        }

        foreach (($config['defaults'] ?? []) as $field => $value) {
            if (array_key_exists($field, $data) && blank($data[$field])) {
                $data[$field] = $value;
            }
        }

        DB::table($config['table'])->insert($data);

        return redirect($config['back'])->with('success', "{$config['label']} berhasil ditambahkan.");
    }

    public function edit(string $module, string $id): Response
    {
        $config = $this->config($module);
        $record = $this->record($config, $id);

        abort_if(! $record, 404);

        return Inertia::render('Crud/Form', [
            'mode' => 'edit',
            'module' => $module,
            'config' => $this->payloadConfig($config, $module),
            'record' => $record,
        ]);
    }

    public function update(Request $request, string $module, string $id): RedirectResponse
    {
        $config = $this->config($module);
        abort_if(! $this->record($config, $id), 404);

        $data = $this->validatedData($request, $config);
        unset($data[$config['key']]);

        DB::table($config['table'])
            ->where($config['key'], $id)
            ->update($data);

        return redirect($config['back'])->with('success', "{$config['label']} berhasil diperbarui.");
    }

    public function destroy(string $module, string $id): RedirectResponse
    {
        $config = $this->config($module);

        DB::table($config['table'])
            ->where($config['key'], $id)
            ->delete();

        return redirect($config['back'])->with('success', "{$config['label']} berhasil dihapus.");
    }

    private function config(string $module): array
    {
        $config = config("module_crud.{$module}");

        abort_if(! $config, 404);
        abort_unless(request()->user()?->can($config['permission']), 403);
        abort_unless(Schema::hasTable($config['table']), 404);

        return $config;
    }

    private function payloadConfig(array $config, string $module): array
    {
        return [
            'label' => $config['label'],
            'key' => $config['key'],
            'back' => $config['back'],
            'index' => '/module-records/'.$module,
            'fields' => $this->fields($config),
            'importEnabled' => (bool) ($config['import_enabled'] ?? false),
        ];
    }

    private function fields(array $config): array
    {
        $columns = Schema::getColumnListing($config['table']);

        return collect([$config['key'], ...$config['fields']])
            ->filter(fn ($column) => in_array($column, $columns, true))
            ->unique()
            ->values()
            ->all();
    }

    private function blankRecord(array $config): array
    {
        $defaults = $config['defaults'] ?? [];

        return collect($this->fields($config))
            ->mapWithKeys(fn ($field) => [$field => ''])
            ->merge($defaults)
            ->all();
    }

    private function record(array $config, string $id): ?object
    {
        return DB::table($config['table'])
            ->select($this->fields($config))
            ->where($config['key'], $id)
            ->first();
    }

    private function validatedData(Request $request, array $config): array
    {
        // Kunci record dibuat di server dan tidak pernah diterima dari form.
        $fields = array_values(array_filter(
            $this->fields($config),
            fn ($field) => $field !== $config['key'],
        ));

        return $request->validate(
            collect($fields)
                ->mapWithKeys(fn ($field) => [$field => ['nullable', 'string']])
                ->all()
        );
    }

    private function newKey(array $config): string
    {
        do {
            $key = (string) Str::uuid();
        } while (DB::table($config['table'])->where($config['key'], $key)->exists());

        return $key;
    }
}
