<?php

namespace App\Http\Controllers\Karyawan;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DaftarKaryawanController extends Controller
{
    private array $inactiveStatuses = [
        'EXPIRED',
        'NON AKTIF',
        'NON-AKTIF',
        'TIDAK AKTIF',
        'INACTIVE',
        'RESIGN',
        'KELUAR',
    ];

    private array $detailColumns = [
        'id_key',
        'nama_karyawan',
        'nama_panggilan',
        'nip',
        'divisi',
        'jabatan',
        'level',
        'area',
        'agama',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'umur',
        'no_ponsel',
        'no_ktp',
        'no_kartu_keluarga',
        'alamat_sesuai_ktp',
        'alamat_domisili',
        'status_pernikahan',
        'email',
        'tanggal_bergabung',
        'awal_pkwt',
        'status_pkwt',
        'akhir_pkwt',
        'masa_aktif',
        'hari_aktif',
        'jenis_sim',
        'no_sim',
        'masa_berlaku',
        'status',
        'nama_bank',
        'rekening',
        'nama_pemilik_rekening',
        'pendidikan',
        'nama_sekolah_universitas',
        'fakultas',
        'jurusan',
        'no_npwp',
        'bpjk_kes',
        'bpjs_tk',
        'ukuran_baju',
        'ukuran_sepatu',
        'keterangan',
    ];

    private array $csvColumns = [
        ['STATUS', 'status'],
        ['nama_karyawan', 'nama_karyawan'],
        ['nip', 'nip'],
        ['area', 'area'],
        ['nama_bank', 'nama_bank'],
        ['rekening', 'rekening'],
        ['divisi', 'divisi'],
        ['jabatan', 'jabatan'],
        ['agama', 'agama'],
        ['tanggal_lahir', 'tanggal_lahir'],
        ['tanggal_bergabung', 'tanggal_bergabung'],
        ['awal_pkwt', 'awal_pkwt'],
        ['akhir_pkwt', 'akhir_pkwt'],
        ['masa_aktif', 'masa_aktif'],
        ['status_pkwt', 'status_pkwt'],
        ['jenis_sim', 'jenis_sim'],
        ['no_sim', 'no_sim'],
        ['masa_berlaku', 'masa_berlaku'],
        ['hari_aktif', 'hari_aktif'],
        ['status__20', 'status__20'],
        ['no_ponsel', 'no_ponsel'],
        ['no_ktp', 'no_ktp'],
        ['bpjk_kes', 'bpjk_kes'],
        ['bpjs_tk', 'bpjs_tk'],
        ['email', 'email'],
        ['tarif_ovt', 'tarif_ovt'],
        ['nama_panggilan', 'nama_panggilan'],
        ['jenis_kelamin', 'jenis_kelamin'],
        ['tempat_lahir', 'tempat_lahir'],
        ['umur', 'umur'],
        ['no_kartu_keluarga', 'no_kartu_keluarga'],
        ['alamat_sesuai_ktp', 'alamat_sesuai_ktp'],
        ['alamat_domisili', 'alamat_domisili'],
        ['status_pernikahan', 'status_pernikahan'],
        ['nama_pemilik_rekening', 'nama_pemilik_rekening'],
        ['no_npwp', 'no_npwp'],
        ['pendidikan', 'pendidikan'],
        ['nama_sekolah_universitas', 'nama_sekolah_universitas'],
        ['fakultas', 'fakultas'],
        ['jurusan', 'jurusan'],
        ['nama_ayah_kandung', 'nama_ayah_kandung'],
        ['nama_ibu_kandung', 'nama_ibu_kandung'],
        ['nama_istri', 'nama_istri'],
        ['nama_suami', 'nama_suami'],
        ['jumlah_anak', 'jumlah_anak'],
        ['nama_anak_pertama', 'nama_anak_pertama'],
        ['jenis_kelamin_anak_pertama', 'jenis_kelamin_anak_pertama'],
        ['tanggal_lahir_anak_pertama', 'tanggal_lahir_anak_pertama'],
        ['nama_anak_kedua', 'nama_anak_kedua'],
        ['jenis_kelamin_anak_kedua', 'jenis_kelamin_anak_kedua'],
        ['tanggal_lahir_anak_kedua', 'tanggal_lahir_anak_kedua'],
        ['nama_anak_ketiga', 'nama_anak_ketiga'],
        ['jenis_kelamin_anak_ketiga', 'jenis_kelamin_anak_ketiga'],
        ['tanggal_lahir_anak_kedua', 'tanggal_lahir_anak_ketiga'],
        ['nama_kerabat_1', 'nama_kerabat_1'],
        ['hubungan_dengan_pekerja_1', 'hubungan_dengan_pekerja_1'],
        ['nomor_telepon_atau_wa_1', 'nomor_telepon_atau_wa_1'],
        ['nama_kerabat_2', 'nama_kerabat_2'],
        ['hubungan_dengan_pekerja_2', 'hubungan_dengan_pekerja_2'],
        ['nomor_handphone_wa_2', 'nomor_handphone_wa_2'],
        ['ukuran_baju', 'ukuran_baju'],
        ['ukuran_sepatu', 'ukuran_sepatu'],
        ['level', 'level'],
        ['foto_ktp', 'foto_ktp'],
        ['foto_kartu_keluarga', 'foto_kartu_keluarga'],
        ['foto_sim', 'foto_sim'],
        ['foto_profil', 'foto_profil'],
        ['keterangan', 'keterangan'],
        ['Related ABSENs', 'Related ABSENs'],
    ];

    public function index(): Response
    {
        $rows = DB::table('hr_manager_db_pegawai')
            ->select([
                'id_key',
                'nama_karyawan',
                'nama_panggilan',
                'nip',
                'divisi',
                'jabatan',
                'level',
                'area',
                'jenis_kelamin',
                'no_ponsel',
                'email',
                'tanggal_bergabung',
                'status',
                'status_pkwt',
                'akhir_pkwt',
                'masa_aktif',
                'hari_aktif',
                'jenis_sim',
                'masa_berlaku',
            ])
            ->orderByRaw("CASE WHEN nama_karyawan IS NULL OR nama_karyawan = '' THEN 1 ELSE 0 END")
            ->orderBy('nama_karyawan')
            ->get()
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'nama_karyawan' => $row->nama_karyawan,
                'nama_panggilan' => $row->nama_panggilan,
                'nip' => $row->nip,
                'divisi' => $row->divisi,
                'jabatan' => $row->jabatan,
                'level' => $row->level,
                'area' => $row->area,
                'jenis_kelamin' => $row->jenis_kelamin,
                'no_ponsel' => $row->no_ponsel,
                'email' => $row->email,
                'tanggal_bergabung' => $row->tanggal_bergabung,
                'status' => $row->status,
                'status_pkwt' => $row->status_pkwt,
                'akhir_pkwt' => $row->akhir_pkwt,
                'masa_aktif' => $row->masa_aktif,
                'hari_aktif' => $row->hari_aktif,
                'jenis_sim' => $row->jenis_sim,
                'masa_berlaku' => $row->masa_berlaku,
            ]);

        $filled = fn (string $column) => DB::table('hr_manager_db_pegawai')
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->count();

        $countBy = fn (string $column) => DB::table('hr_manager_db_pegawai')
            ->selectRaw("COALESCE(NULLIF($column, ''), 'BELUM DIISI') as label, COUNT(*) as value")
            ->groupBy('label')
            ->orderByDesc('value')
            ->limit(12)
            ->get();

        return Inertia::render('Karyawan/DaftarKaryawan/Index', [
            'employees' => $rows,
            'summary' => [
                'total' => $rows->count(),
                'aktif' => $rows->where('status', 'AKTIF')->count(),
                'expired' => $rows->where('status', 'EXPIRED')->count(),
                'driver' => $rows->where('jabatan', 'DRIVER')->count(),
                'helper' => $rows->where('jabatan', 'HELPER')->count(),
                'kontakTerisi' => $filled('no_ponsel'),
            ],
            'distributions' => [
                'divisi' => $countBy('divisi'),
                'jabatan' => $countBy('jabatan'),
                'area' => $countBy('area'),
                'status' => $countBy('status'),
            ],
            'filters' => [
                'divisi' => $this->distinctValues('divisi'),
                'jabatan' => $this->distinctValues('jabatan'),
                'area' => $this->distinctValues('area'),
                'status' => $this->distinctValues('status'),
                'status_pkwt' => $this->distinctValues('status_pkwt'),
            ],
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $availableColumns = Schema::getColumnListing('hr_manager_db_pegawai');
        $selectedColumns = collect($this->csvColumns)
            ->pluck(1)
            ->filter(fn (string $column) => in_array($column, $availableColumns, true))
            ->unique()
            ->values()
            ->all();

        $query = DB::table('hr_manager_db_pegawai')
            ->select($selectedColumns)
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhereNotIn(DB::raw('UPPER(TRIM(status))'), $this->inactiveStatuses);
            });

        $search = trim((string) $request->query('search', ''));

        if ($search !== '') {
            $query->where(function ($query) use ($search) {
                foreach (['nama_karyawan', 'nama_panggilan', 'nip', 'divisi', 'jabatan', 'area', 'no_ponsel', 'email'] as $column) {
                    $query->orWhere($column, 'like', "%{$search}%");
                }
            });
        }

        foreach (['divisi', 'jabatan', 'area', 'status'] as $filter) {
            $value = trim((string) $request->query($filter, 'all'));

            if ($value !== '' && strtolower($value) !== 'all') {
                $query->where($filter, $value);
            }
        }

        $headers = collect($this->csvColumns)->pluck(0)->all();
        $columns = $this->csvColumns;

        return response()->streamDownload(function () use ($query, $headers, $columns) {
            $output = fopen('php://output', 'wb');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, $headers, ';');

            foreach ($query->orderBy('nama_karyawan')->lazy(500) as $row) {
                $values = (array) $row;
                fputcsv($output, array_map(
                    fn (array $column) => $values[$column[1]] ?? '',
                    $columns,
                ), ';');
            }

            fclose($output);
        }, 'data-karyawan-'.now()->format('Ymd-His').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'X-Accel-Buffering' => 'no',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function archive(): Response
    {
        $rows = DB::table('hr_manager_db_pegawai')
            ->select([
                'id_key',
                'nama_karyawan',
                'nama_panggilan',
                'nip',
                'divisi',
                'jabatan',
                'level',
                'area',
                'jenis_kelamin',
                'no_ponsel',
                'email',
                'tanggal_bergabung',
                'status',
                'status_pkwt',
                'akhir_pkwt',
                'masa_aktif',
                'hari_aktif',
                'jenis_sim',
                'masa_berlaku',
            ])
            ->where(function ($query) {
                foreach ($this->inactiveStatuses as $status) {
                    $query->orWhereRaw('UPPER(TRIM(status)) = ?', [$status]);
                }
            })
            ->orderByRaw("CASE WHEN nama_karyawan IS NULL OR nama_karyawan = '' THEN 1 ELSE 0 END")
            ->orderBy('nama_karyawan')
            ->get()
            ->map(fn ($row) => [
                'id_key' => $row->id_key,
                'nama_karyawan' => $row->nama_karyawan,
                'nama_panggilan' => $row->nama_panggilan,
                'nip' => $row->nip,
                'divisi' => $row->divisi,
                'jabatan' => $row->jabatan,
                'level' => $row->level,
                'area' => $row->area,
                'jenis_kelamin' => $row->jenis_kelamin,
                'no_ponsel' => $row->no_ponsel,
                'email' => $row->email,
                'tanggal_bergabung' => $row->tanggal_bergabung,
                'status' => $row->status,
                'status_pkwt' => $row->status_pkwt,
                'akhir_pkwt' => $row->akhir_pkwt,
                'masa_aktif' => $row->masa_aktif,
                'hari_aktif' => $row->hari_aktif,
                'jenis_sim' => $row->jenis_sim,
                'masa_berlaku' => $row->masa_berlaku,
            ]);

        return Inertia::render('Karyawan/DaftarKaryawan/Archive', [
            'employees' => $rows,
            'filters' => [
                'divisi' => $this->distinctValues('divisi'),
                'jabatan' => $this->distinctValues('jabatan'),
                'area' => $this->distinctValues('area'),
                'status' => $rows->pluck('status')->filter()->unique()->sort()->values()->all(),
            ],
        ]);
    }

    public function show(string $id): Response
    {
        $employee = DB::table('hr_manager_db_pegawai')
            ->select($this->detailColumns)
            ->where('id_key', $id)
            ->first();

        abort_if(! $employee, 404);

        return Inertia::render('Karyawan/DaftarKaryawan/Detail', [
            'employee' => $employee,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Karyawan/DaftarKaryawan/Form', [
            'mode' => 'create',
            'employee' => $this->blankEmployee(),
            'options' => $this->formOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['id_key'] = $this->newEmployeeKey();

        DB::table('hr_manager_db_pegawai')->insert($data);

        return redirect()
            ->route('daftar-karyawan.show', $data['id_key'])
            ->with('success', 'Data karyawan berhasil ditambahkan.');
    }

    public function edit(string $id): Response
    {
        $employee = DB::table('hr_manager_db_pegawai')
            ->select($this->detailColumns)
            ->where('id_key', $id)
            ->first();

        abort_if(! $employee, 404);

        return Inertia::render('Karyawan/DaftarKaryawan/Form', [
            'mode' => 'edit',
            'employee' => $employee,
            'options' => $this->formOptions(),
        ]);
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        abort_unless(DB::table('hr_manager_db_pegawai')->where('id_key', $id)->exists(), 404);

        $data = $this->validatedData($request);
        unset($data['id_key']);

        DB::table('hr_manager_db_pegawai')
            ->where('id_key', $id)
            ->update($data);

        return redirect()
            ->route('daftar-karyawan.show', $id)
            ->with('success', 'Data karyawan berhasil diperbarui.');
    }

    public function destroy(string $id): RedirectResponse
    {
        DB::table('hr_manager_db_pegawai')
            ->where('id_key', $id)
            ->delete();

        return redirect()
            ->route('daftar-karyawan.index')
            ->with('success', 'Data karyawan berhasil dihapus.');
    }

    private function distinctValues(string $column): array
    {
        return DB::table('hr_manager_db_pegawai')
            ->whereNotNull($column)
            ->where($column, '!=', '')
            ->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->values()
            ->all();
    }

    private function validatedData(Request $request): array
    {
        return $request->validate([
            'nama_karyawan' => ['nullable', 'string', 'max:255'],
            'nama_panggilan' => ['nullable', 'string', 'max:255'],
            'nip' => ['nullable', 'string', 'max:255'],
            'divisi' => ['nullable', 'string', 'max:255'],
            'jabatan' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'agama' => ['nullable', 'string', 'max:255'],
            'jenis_kelamin' => ['nullable', 'string', 'max:255'],
            'tempat_lahir' => ['nullable', 'string', 'max:255'],
            'tanggal_lahir' => ['nullable', 'string', 'max:255'],
            'umur' => ['nullable', 'string', 'max:255'],
            'no_ponsel' => ['nullable', 'string', 'max:255'],
            'no_ktp' => ['nullable', 'string', 'max:255'],
            'no_kartu_keluarga' => ['nullable', 'string', 'max:255'],
            'alamat_sesuai_ktp' => ['nullable', 'string'],
            'alamat_domisili' => ['nullable', 'string'],
            'status_pernikahan' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'tanggal_bergabung' => ['nullable', 'string', 'max:255'],
            'awal_pkwt' => ['nullable', 'string', 'max:255'],
            'status_pkwt' => ['nullable', 'string', 'max:255'],
            'akhir_pkwt' => ['nullable', 'string', 'max:255'],
            'masa_aktif' => ['nullable', 'string', 'max:255'],
            'hari_aktif' => ['nullable', 'string', 'max:255'],
            'jenis_sim' => ['nullable', 'string', 'max:255'],
            'no_sim' => ['nullable', 'string', 'max:255'],
            'masa_berlaku' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'nama_bank' => ['nullable', 'string', 'max:255'],
            'rekening' => ['nullable', 'string', 'max:255'],
            'nama_pemilik_rekening' => ['nullable', 'string', 'max:255'],
            'pendidikan' => ['nullable', 'string', 'max:255'],
            'nama_sekolah_universitas' => ['nullable', 'string', 'max:255'],
            'fakultas' => ['nullable', 'string', 'max:255'],
            'jurusan' => ['nullable', 'string', 'max:255'],
            'no_npwp' => ['nullable', 'string', 'max:255'],
            'bpjk_kes' => ['nullable', 'string', 'max:255'],
            'bpjs_tk' => ['nullable', 'string', 'max:255'],
            'ukuran_baju' => ['nullable', 'string', 'max:255'],
            'ukuran_sepatu' => ['nullable', 'string', 'max:255'],
            'keterangan' => ['nullable', 'string'],
        ]);
    }

    private function newEmployeeKey(): string
    {
        do {
            $key = (string) Str::uuid();
        } while (DB::table('hr_manager_db_pegawai')->where('id_key', $key)->exists());

        return $key;
    }

    private function blankEmployee(): array
    {
        return collect($this->detailColumns)
            ->mapWithKeys(fn ($column) => [$column => ''])
            ->all();
    }

    private function formOptions(): array
    {
        return [
            'divisi' => $this->distinctValues('divisi'),
            'jabatan' => $this->distinctValues('jabatan'),
            'level' => $this->distinctValues('level'),
            'area' => $this->distinctValues('area'),
            'agama' => $this->distinctValues('agama'),
            'jenis_kelamin' => $this->distinctValues('jenis_kelamin'),
            'status_pernikahan' => $this->distinctValues('status_pernikahan'),
            'status_pkwt' => $this->distinctValues('status_pkwt'),
            'status' => $this->distinctValues('status'),
            'jenis_sim' => $this->distinctValues('jenis_sim'),
            'nama_bank' => $this->distinctValues('nama_bank'),
            'pendidikan' => $this->distinctValues('pendidikan'),
        ];
    }
}
