<?php

namespace App\Http\Controllers\Maintenance;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RiwayatServiceController extends Controller
{
    public function index()
    {
        $totalService = (int) DB::table('maintenance_input_maintenance')->count();
        $totalBan = (int) DB::table('maintenance_monitoring_ban')->count();

        return Inertia::render('Maintenance/RiwayatService/Index', [
            'mode' => 'menu',
            'summary' => [
                'totalService' => $totalService,
                'totalBiayaService' => (float) DB::table('maintenance_input_maintenance')->sum('total_biaya_service'),
                'totalBan' => $totalBan,
                'totalBiayaBan' => (float) DB::table('maintenance_monitoring_ban')->sum('total_harga'),
            ],
            'sourceStatus' => [
                'maintenance_input_maintenance' => $totalService,
                'maintenance_monitoring_ban' => $totalBan,
            ],
        ]);
    }

    public function serviceUmum()
    {
        return $this->historyPage('service');
    }

    public function serviceBan()
    {
        return $this->historyPage('ban');
    }

    public function createServiceUmum()
    {
        return Inertia::render('Maintenance/RiwayatService/Form', [
            'type' => 'service',
            'mode' => 'create',
            'record' => $this->emptyServiceRecord(),
            'options' => $this->formOptions(),
            'submitUrl' => route('riwayat-service-unit.service-umum.store'),
            'backUrl' => route('riwayat-service-unit.service-umum'),
        ]);
    }

    public function storeServiceUmum(Request $request): RedirectResponse
    {
        $data = $this->validateService($request);
        $data['id_key'] = 'SVC-'.now()->format('YmdHis').'-'.Str::upper(Str::random(5));

        DB::table('maintenance_input_maintenance')->insert($data);

        return redirect()
            ->route('riwayat-service-unit.service-umum.detail', $data['id_key'])
            ->with('success', 'Data service umum berhasil ditambahkan.');
    }

    public function editServiceUmum(string $id)
    {
        $record = DB::table('maintenance_input_maintenance')->where('id_key', $id)->first();
        abort_if(! $record, 404);

        return Inertia::render('Maintenance/RiwayatService/Form', [
            'type' => 'service',
            'mode' => 'edit',
            'record' => $record,
            'options' => $this->formOptions(),
            'submitUrl' => route('riwayat-service-unit.service-umum.update', $id),
            'backUrl' => route('riwayat-service-unit.service-umum.detail', $id),
        ]);
    }

    public function updateServiceUmum(Request $request, string $id): RedirectResponse
    {
        abort_if(! DB::table('maintenance_input_maintenance')->where('id_key', $id)->exists(), 404);

        DB::table('maintenance_input_maintenance')
            ->where('id_key', $id)
            ->update($this->validateService($request));

        return redirect()
            ->route('riwayat-service-unit.service-umum.detail', $id)
            ->with('success', 'Data service umum berhasil diperbarui.');
    }

    public function destroyServiceUmum(string $id): RedirectResponse
    {
        DB::table('maintenance_input_maintenance')->where('id_key', $id)->delete();

        return redirect()
            ->route('riwayat-service-unit.service-umum')
            ->with('success', 'Data service umum berhasil dihapus.');
    }

    public function createServiceBan()
    {
        return Inertia::render('Maintenance/RiwayatService/Form', [
            'type' => 'ban',
            'mode' => 'create',
            'record' => $this->emptyBanRecord(),
            'options' => $this->formOptions(),
            'submitUrl' => route('riwayat-service-unit.service-ban.store'),
            'backUrl' => route('riwayat-service-unit.service-ban'),
        ]);
    }

    public function storeServiceBan(Request $request): RedirectResponse
    {
        $data = $this->validateBan($request);
        $data['id_key'] = 'BAN-'.now()->format('YmdHis').'-'.Str::upper(Str::random(5));

        DB::table('maintenance_monitoring_ban')->insert($data);

        return redirect()
            ->route('riwayat-service-unit.service-ban.detail', $data['id_key'])
            ->with('success', 'Data service ban berhasil ditambahkan.');
    }

    public function editServiceBan(string $id)
    {
        $record = DB::table('maintenance_monitoring_ban')->where('id_key', $id)->first();
        abort_if(! $record, 404);

        return Inertia::render('Maintenance/RiwayatService/Form', [
            'type' => 'ban',
            'mode' => 'edit',
            'record' => $record,
            'options' => $this->formOptions(),
            'submitUrl' => route('riwayat-service-unit.service-ban.update', $id),
            'backUrl' => route('riwayat-service-unit.service-ban.detail', $id),
        ]);
    }

    public function updateServiceBan(Request $request, string $id): RedirectResponse
    {
        abort_if(! DB::table('maintenance_monitoring_ban')->where('id_key', $id)->exists(), 404);

        DB::table('maintenance_monitoring_ban')
            ->where('id_key', $id)
            ->update($this->validateBan($request));

        return redirect()
            ->route('riwayat-service-unit.service-ban.detail', $id)
            ->with('success', 'Data service ban berhasil diperbarui.');
    }

    public function destroyServiceBan(string $id): RedirectResponse
    {
        DB::table('maintenance_monitoring_ban')->where('id_key', $id)->delete();

        return redirect()
            ->route('riwayat-service-unit.service-ban')
            ->with('success', 'Data service ban berhasil dihapus.');
    }

    public function serviceUmumDetail(string $id)
    {
        $record = DB::table('maintenance_input_maintenance')->where('id_key', $id)->first();
        abort_if(! $record, 404);

        $unit = DB::table('hr_manager_db_inventori')
            ->where('nopol', $record->nopol)
            ->first();

        $relatedServices = DB::table('maintenance_input_maintenance')
            ->where('nopol', $record->nopol)
            ->orderByDesc('tanggal_services')
            ->limit(12)
            ->get([
                'id_key',
                'tanggal_services',
                'mode_service',
                'tipe_service',
                'keluhan',
                'total_biaya_service',
            ]);

        $relatedBan = DB::table('maintenance_monitoring_ban')
            ->where('nopol', $record->nopol)
            ->orderByDesc('tanggal_ganti_ban')
            ->limit(8)
            ->get([
                'id_key',
                'tanggal_ganti_ban',
                'jenis_pengerjaan',
                'posisi',
                'total_kilometer_pemakaian_ban',
                'total_harga',
            ]);

        return Inertia::render('Maintenance/RiwayatService/Detail', [
            'record' => $record,
            'unit' => $unit,
            'related' => [
                'services' => $relatedServices,
                'ban' => $relatedBan,
                'totalService' => (float) DB::table('maintenance_input_maintenance')->where('nopol', $record->nopol)->sum('total_biaya_service'),
                'totalBan' => (float) DB::table('maintenance_monitoring_ban')->where('nopol', $record->nopol)->sum('total_harga'),
                'serviceCount' => DB::table('maintenance_input_maintenance')->where('nopol', $record->nopol)->count(),
                'banCount' => DB::table('maintenance_monitoring_ban')->where('nopol', $record->nopol)->count(),
            ],
            'backUrl' => url()->previous() ?: route('riwayat-service-unit.service-umum'),
        ]);
    }

    public function serviceBanDetail(string $id)
    {
        $record = DB::table('maintenance_monitoring_ban')->where('id_key', $id)->first();
        abort_if(! $record, 404);

        $unit = DB::table('hr_manager_db_inventori')
            ->where('nopol', $record->nopol)
            ->first();

        $relatedServices = DB::table('maintenance_input_maintenance')
            ->where('nopol', $record->nopol)
            ->orderByDesc('tanggal_services')
            ->limit(8)
            ->get([
                'id_key',
                'tanggal_services',
                'mode_service',
                'tipe_service',
                'keluhan',
                'total_biaya_service',
            ]);

        $relatedBan = DB::table('maintenance_monitoring_ban')
            ->where('nopol', $record->nopol)
            ->orderByDesc('tanggal_ganti_ban')
            ->limit(12)
            ->get([
                'id_key',
                'tanggal_ganti_ban',
                'jenis_pengerjaan',
                'posisi',
                'total_kilometer_pemakaian_ban',
                'total_harga',
            ]);

        return Inertia::render('Maintenance/RiwayatService/BanDetail', [
            'record' => $record,
            'unit' => $unit,
            'related' => [
                'services' => $relatedServices,
                'ban' => $relatedBan,
                'totalService' => (float) DB::table('maintenance_input_maintenance')->where('nopol', $record->nopol)->sum('total_biaya_service'),
                'totalBan' => (float) DB::table('maintenance_monitoring_ban')->where('nopol', $record->nopol)->sum('total_harga'),
                'serviceCount' => DB::table('maintenance_input_maintenance')->where('nopol', $record->nopol)->count(),
                'banCount' => DB::table('maintenance_monitoring_ban')->where('nopol', $record->nopol)->count(),
            ],
            'backUrl' => url()->previous() ?: route('riwayat-service-unit.service-ban'),
        ]);
    }

    private function historyPage(string $mode)
    {
        $filters = [
            'TIPE UNIT' => (string) request()->query('TIPE UNIT', request()->query('tipe_unit', 'ALL')),
            'AREA' => (string) request()->query('AREA', request()->query('area', 'ALL')),
            'NOPOL' => (string) request()->query('NOPOL', request()->query('nopol', 'ALL')),
            'DRIVER' => (string) request()->query('DRIVER', request()->query('driver', 'ALL')),
            'JENIS' => (string) request()->query('JENIS', request()->query('jenis', 'ALL')),
            'STATUS' => (string) request()->query('STATUS', request()->query('status', 'ALL')),
            'HARI' => (string) request()->query('HARI', request()->query('hari', '')),
            'WEEK' => (string) request()->query('WEEK', request()->query('week', 'ALL')),
            'BULAN' => (string) request()->query('BULAN', request()->query('bulan', 'ALL')),
            'TAHUN' => (string) request()->query('TAHUN', request()->query('tahun', 'ALL')),
        ];

        $services = DB::table('maintenance_input_maintenance')
            ->select([
                'id_key',
                'nopol',
                'area',
                'driver',
                'mode_service',
                'tanggal_services',
                'odo_services',
                'keluhan',
                'tipe_service',
                'spare_parts',
                'jenis_spare_parts',
                'harga_parts',
                'nama_bengkel',
                'total_biaya_service',
                'status_penbayaran',
                'keterangan',
            ])
            ->orderByDesc('tanggal_services')
            ->get()
            ->map(fn ($row) => $this->withDateMeta($row, 'tanggal_services'));

        $ban = DB::table('maintenance_monitoring_ban')
            ->select([
                'id_key',
                'nopol',
                'area',
                'driver',
                'tanggal_ganti_ban',
                'jenis_pengerjaan',
                'posisi',
                'kilometer_ganti_ban',
                'kilometer_ganti_ban_sebelumnya',
                'total_kilometer_pemakaian_ban',
                'qty_ban',
                'jenis_ban',
                'tipe_ban',
                'harga_ban',
                'total_harga',
                'nama_toko',
                'keterangan',
            ])
            ->orderByDesc('tanggal_ganti_ban')
            ->get()
            ->map(fn ($row) => $this->withDateMeta($row, 'tanggal_ganti_ban'));

        $this->attachUnitTypes($services);
        $this->attachUnitTypes($ban);

        $filteredServices = $this->applyFilters($services, $filters, 'service');
        $filteredBan = $this->applyFilters($ban, $filters, 'ban');

        return Inertia::render('Maintenance/RiwayatService/Index', [
            'mode' => $mode,
            'services' => $filteredServices->take(1200)->values(),
            'ban' => $filteredBan->take(1200)->values(),
            'summary' => [
                'totalService' => $filteredServices->count(),
                'totalBiayaService' => (float) $filteredServices->sum('total_biaya_service'),
                'totalBan' => $filteredBan->count(),
                'totalBiayaBan' => (float) $filteredBan->sum('total_harga'),
                'totalKeseluruhan' => (float) $filteredServices->sum('total_biaya_service') + (float) $filteredBan->sum('total_harga'),
            ],
            'filters' => $filters,
            'filterOptions' => [
                'TIPE UNIT' => $this->optionList($services->pluck('tipe_unit')->merge($ban->pluck('tipe_unit'))),
                'AREA' => $this->optionList($services->pluck('area')->merge($ban->pluck('area'))),
                'NOPOL' => $this->optionList($services->pluck('nopol')->merge($ban->pluck('nopol'))),
                'DRIVER' => $this->optionList($services->pluck('driver')->merge($ban->pluck('driver'))),
                'JENIS' => $this->optionList($services->pluck('mode_service')->merge($services->pluck('tipe_service'))->merge($ban->pluck('jenis_pengerjaan'))->merge($ban->pluck('tipe_ban'))),
                'STATUS' => $this->optionList($services->pluck('status_penbayaran')),
                'WEEK' => $this->optionList($services->pluck('groupWeek')->merge($ban->pluck('groupWeek'))),
                'BULAN' => $this->optionList($services->pluck('groupMonth')->merge($ban->pluck('groupMonth'))),
                'TAHUN' => $this->optionList($services->pluck('groupYear')->merge($ban->pluck('groupYear'))),
            ],
            'serviceBreakdown' => [
                'byArea' => $this->breakdown($filteredServices, 'area', 'total_biaya_service'),
                'byType' => $this->breakdown($filteredServices, 'tipe_unit', 'total_biaya_service'),
                'byNopol' => $this->breakdown($filteredServices, 'nopol', 'total_biaya_service')->take(10)->values(),
            ],
            'banBreakdown' => [
                'byArea' => $this->breakdown($filteredBan, 'area', 'total_harga'),
                'byType' => $this->breakdown($filteredBan, 'jenis_pengerjaan', 'total_harga'),
                'byNopol' => $this->breakdown($filteredBan, 'nopol', 'total_harga')->take(10)->values(),
            ],
            'sourceStatus' => [
                'maintenance_input_maintenance' => DB::table('maintenance_input_maintenance')->count(),
                'maintenance_monitoring_ban' => DB::table('maintenance_monitoring_ban')->count(),
            ],
        ]);
    }

    private function applyFilters(Collection $rows, array $filters, string $type): Collection
    {
        return $rows->filter(function ($row) use ($filters, $type) {
            $rowType = (string) ($row->tipe_unit ?? '');
            $rowKind = $type === 'service'
                ? [(string) ($row->mode_service ?? ''), (string) ($row->tipe_service ?? '')]
                : [(string) ($row->jenis_pengerjaan ?? ''), (string) ($row->tipe_ban ?? '')];

            return ($filters['AREA'] === 'ALL' || (string) ($row->area ?? '') === $filters['AREA'])
                && ($filters['TIPE UNIT'] === 'ALL' || $rowType === $filters['TIPE UNIT'])
                && ($filters['NOPOL'] === 'ALL' || (string) ($row->nopol ?? '') === $filters['NOPOL'])
                && ($filters['DRIVER'] === 'ALL' || (string) ($row->driver ?? '') === $filters['DRIVER'])
                && ($filters['JENIS'] === 'ALL' || in_array($filters['JENIS'], $rowKind, true))
                && ($filters['STATUS'] === 'ALL' || $type !== 'service' || (string) ($row->status_penbayaran ?? '') === $filters['STATUS'])
                && ($filters['HARI'] === '' || (string) ($row->tanggal_services ?? $row->tanggal_ganti_ban ?? '') === $filters['HARI'])
                && ($filters['WEEK'] === 'ALL' || (string) ($row->groupWeek ?? '') === $filters['WEEK'])
                && ($filters['BULAN'] === 'ALL' || (string) ($row->groupMonth ?? '') === $filters['BULAN'])
                && ($filters['TAHUN'] === 'ALL' || (string) ($row->groupYear ?? '') === $filters['TAHUN']);
        })->values();
    }

    private function withDateMeta(object $row, string $dateColumn): object
    {
        [$year, $month, $week] = $this->dateMeta($row->{$dateColumn} ?? null);
        $row->groupYear = $year;
        $row->groupMonth = $month;
        $row->groupWeek = $week;

        return $row;
    }

    private function attachUnitTypes(Collection $rows): void
    {
        $unitTypes = DB::table('hr_manager_db_inventori')
            ->whereIn('nopol', $rows->pluck('nopol')->filter()->unique()->values())
            ->pluck('tipe', 'nopol');

        $rows->each(function ($row) use ($unitTypes) {
            $row->tipe_unit = $unitTypes[$row->nopol] ?? null;
        });
    }

    private function dateMeta(?string $value): array
    {
        $value = trim((string) $value);

        if ($value === '' || $value === '0000-00-00') {
            return ['0', '0', '0'];
        }

        $formats = ['Y-m-d', 'd/m/Y', 'm/d/Y', 'd-M-Y', 'j-M-Y'];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $value);
            if ($date) {
                return [$date->format('Y'), $this->monthLabel((int) $date->format('n')), 'W'.$date->format('W')];
            }
        }

        if (preg_match('/(\d{4})/', $value, $matches)) {
            return [$matches[1], '0', '0'];
        }

        return ['0', '0', '0'];
    }

    private function monthLabel(int $month): string
    {
        return [
            1 => 'A Januari',
            2 => 'B Februari',
            3 => 'C Maret',
            4 => 'D April',
            5 => 'E Mei',
            6 => 'F Juni',
            7 => 'G Juli',
            8 => 'H Agustus',
            9 => 'I September',
            10 => 'J Oktober',
            11 => 'K November',
            12 => 'L Desember',
        ][$month] ?? '0';
    }

    private function optionList(Collection $values): array
    {
        return array_values(array_unique(array_merge(
            ['ALL'],
            $values
                ->map(fn ($value) => trim((string) $value))
                ->filter(fn ($value) => $value !== '' && $value !== '0')
                ->sort()
                ->values()
                ->all()
        )));
    }

    private function validateService(Request $request): array
    {
        return $request->validate([
            'nopol' => ['nullable', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100'],
            'driver' => ['nullable', 'string', 'max:255'],
            'mode_service' => ['nullable', 'string', 'max:100'],
            'tanggal_services' => ['nullable', 'date'],
            'odo_services' => ['nullable', 'numeric'],
            'keluhan' => ['nullable', 'string'],
            'tipe_service' => ['nullable', 'string', 'max:100'],
            'spare_parts' => ['nullable', 'string', 'max:255'],
            'jenis_spare_parts' => ['nullable', 'string', 'max:100'],
            'harga_parts' => ['nullable', 'numeric'],
            'nama_bengkel' => ['nullable', 'string', 'max:255'],
            'total_biaya_service' => ['nullable', 'numeric'],
            'status_penbayaran' => ['nullable', 'string', 'max:100'],
            'komentar_admin_maintenance' => ['nullable', 'string'],
            'keterangan' => ['nullable', 'string'],
            'nama' => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function validateBan(Request $request): array
    {
        $data = $request->validate([
            'nopol' => ['nullable', 'string', 'max:100'],
            'area' => ['nullable', 'string', 'max:100'],
            'driver' => ['nullable', 'string', 'max:255'],
            'tanggal_ganti_ban' => ['nullable', 'string', 'max:100'],
            'jenis_pengerjaan' => ['nullable', 'string', 'max:100'],
            'posisi' => ['nullable', 'string', 'max:100'],
            'kilometer_ganti_ban' => ['nullable', 'numeric'],
            'kilometer_ganti_ban_sebelumnya' => ['nullable', 'numeric'],
            'total_kilometer_pemakaian_ban' => ['nullable', 'numeric'],
            'qty_ban' => ['nullable', 'integer'],
            'no_seri_ban_lama' => ['nullable', 'string', 'max:100'],
            'no_seri_ban_baru' => ['nullable', 'string', 'max:100'],
            'jenis_ban' => ['nullable', 'string', 'max:100'],
            'tipe_ban' => ['nullable', 'string', 'max:100'],
            'harga_ban' => ['nullable', 'numeric'],
            'tools' => ['nullable', 'string', 'max:255'],
            'ban_dalam' => ['nullable', 'string', 'max:100'],
            'harga_ban_dalam' => ['nullable', 'numeric'],
            'marset' => ['nullable', 'string', 'max:100'],
            'harga_marset' => ['nullable', 'numeric'],
            'total_harga' => ['nullable', 'numeric'],
            'nama_toko' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:100'],
        ]);

        $kmNow = $this->numberOrNull($data['kilometer_ganti_ban'] ?? null);
        $kmBefore = $this->numberOrNull($data['kilometer_ganti_ban_sebelumnya'] ?? null);
        if ($kmNow !== null && $kmBefore !== null) {
            $data['total_kilometer_pemakaian_ban'] = max(0, $kmNow - $kmBefore);
        }

        $data['total_harga'] =
            $this->numberOrZero($data['harga_ban'] ?? null)
            + $this->numberOrZero($data['harga_ban_dalam'] ?? null)
            + $this->numberOrZero($data['harga_marset'] ?? null);

        return $data;
    }

    private function numberOrNull(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) $value;
    }

    private function numberOrZero(mixed $value): float
    {
        return (float) ($value ?: 0);
    }

    private function emptyServiceRecord(): array
    {
        return array_fill_keys([
            'nopol',
            'area',
            'driver',
            'mode_service',
            'tanggal_services',
            'odo_services',
            'keluhan',
            'tipe_service',
            'spare_parts',
            'jenis_spare_parts',
            'harga_parts',
            'nama_bengkel',
            'total_biaya_service',
            'status_penbayaran',
            'komentar_admin_maintenance',
            'keterangan',
            'nama',
        ], '');
    }

    private function emptyBanRecord(): array
    {
        return array_fill_keys([
            'nopol',
            'area',
            'driver',
            'tanggal_ganti_ban',
            'jenis_pengerjaan',
            'posisi',
            'kilometer_ganti_ban',
            'kilometer_ganti_ban_sebelumnya',
            'total_kilometer_pemakaian_ban',
            'qty_ban',
            'no_seri_ban_lama',
            'no_seri_ban_baru',
            'jenis_ban',
            'tipe_ban',
            'harga_ban',
            'tools',
            'ban_dalam',
            'harga_ban_dalam',
            'marset',
            'harga_marset',
            'total_harga',
            'nama_toko',
            'keterangan',
            'email',
        ], '');
    }

    private function formOptions(): array
    {
        return [
            'units' => DB::table('hr_manager_db_inventori')
                ->select('nopol', 'area', 'driver', 'tipe')
                ->whereNotNull('nopol')
                ->orderBy('nopol')
                ->limit(1000)
                ->get(),
        ];
    }

    private function breakdown(Collection $rows, string $groupKey, string $amountKey): Collection
    {
        return $rows
            ->groupBy(fn ($row) => (string) ($row->{$groupKey} ?: 'TIDAK DIKETAHUI'))
            ->map(fn ($items, $name) => [
                'name' => $name,
                'count' => $items->count(),
                'amount' => (float) $items->sum($amountKey),
            ])
            ->sortByDesc('amount')
            ->values();
    }
}
