<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DaftarKaryawanCsvExportTest extends TestCase
{
    public function test_csv_export_uses_utf8_headers_and_active_filters(): void
    {
        Schema::create('hr_manager_db_pegawai', function (Blueprint $table) {
            foreach (['status', 'nama_karyawan', 'nama_panggilan', 'nip', 'area', 'nama_bank', 'rekening', 'divisi', 'jabatan', 'no_ponsel', 'email'] as $column) {
                $table->string($column)->nullable();
            }
        });

        DB::table('hr_manager_db_pegawai')->insert([
            ['status' => 'AKTIF', 'nama_karyawan' => 'Ana Washeng', 'nip' => '001', 'area' => 'JAKARTA', 'divisi' => 'LCL', 'jabatan' => 'ADMIN'],
            ['status' => 'AKTIF', 'nama_karyawan' => 'Cici Washeng', 'nip' => '002', 'area' => 'SURABAYA', 'divisi' => 'LCL', 'jabatan' => 'ADMIN'],
            ['status' => 'EXPIRED', 'nama_karyawan' => 'Ana Lama', 'nip' => '003', 'area' => 'JAKARTA', 'divisi' => 'LCL', 'jabatan' => 'ADMIN'],
        ]);

        $response = $this->withoutMiddleware()
            ->get('/daftar-karyawan/export.csv?search=Ana&area=JAKARTA');

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $response->assertDownload();

        $content = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);

        $lines = preg_split('/\r\n|\n|\r/', trim(substr($content, 3)));
        $headers = str_getcsv($lines[0], ';');
        $row = str_getcsv($lines[1], ';');

        $this->assertCount(69, $headers);
        $this->assertSame(['STATUS', 'nama_karyawan', 'nip', 'area', 'nama_bank'], array_slice($headers, 0, 5));
        $this->assertSame(['foto_sim', 'foto_profil', 'keterangan', 'Related ABSENs'], array_slice($headers, -4));
        $this->assertSame('tanggal_lahir_anak_kedua', $headers[50]);
        $this->assertSame('tanggal_lahir_anak_kedua', $headers[53]);
        $this->assertCount(2, $lines);
        $this->assertSame('AKTIF', $row[0]);
        $this->assertSame('Ana Washeng', $row[1]);
    }
}
