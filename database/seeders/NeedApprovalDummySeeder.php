<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NeedApprovalDummySeeder extends Seeder
{
    private array $regionals = ['JAKARTA', 'SURABAYA', 'MEDAN', 'MAKASSAR', 'BALIKPAPAN', 'BANDUNG', 'SEMARANG', 'PALEMBANG'];
    private array $divisis = ['Primary - Operasional', 'Secondary - Operasional', 'Rental - Operasional', 'LCL - Operasional', 'Finance', 'General Affair'];
    private array $vendors = ['PT BUMI SENTOSA', 'CV KARYA ABADI', 'PT MAJU JAYA', 'CV NIAGA SEJAHTERA', 'PT MITRA MANDIRI', 'CV SUMBER BERKAH', 'PT PUSAKA NUSA', 'CV ANEKA ILMU', 'PT DAYA CIPTA', 'CV BINTANG TIMUR'];
    private array $rekening = ['1234567890', '2345678901', '3456789012', '4567890123', '5678901234', '6789012345', '7890123456', '8901234567'];
    private array $penerima = ['Budi Santoso', 'Siti Rahmawati', 'Ahmad Hidayat', 'Dewi Lestari', 'Rudi Hartono', 'Mega Sari', 'Agus Wijaya', 'Rina Marlina'];
    private array $sumberDana = ['DANA OPERASIONAL', 'DANA INVESTASI', 'DANA CADANGAN', 'DANA PROYEK'];
    private array $statusDoc = ['SUBMIT', 'RE-CHECK'];
    private array $deskripsi = [
        'Pembayaran tagihan transportasi bulan Maret',
        'Pelunasan sewa alat berat untuk proyek A',
        'Biaya operasional harian cabang Surabaya',
        'Pembelian material bangunan untuk gudang baru',
        'Tagihan listrik dan air bulan berjalan',
        'Biaya perawatan kendaraan operasional',
        'Pengadaan ATK dan perlengkapan kantor',
        'Pembayaran jasa konsultan pajak',
        'Biaya pengiriman dan logistik',
        'Pelunasan faktur supplier bahan baku',
        'Biaya pemasangan jaringan internet baru',
        'Pembayaran premi asuransi kendaraan',
        'Biaya renovasi ruang meeting lantai 2',
        'Pembelian sparepart unit excavator',
        'Tagihan telepon dan komunikasi',
        'Biaya legalitas dan perizinan usaha',
        'Pembayaran royalti lisensi software',
        'Biaya training dan sertifikasi karyawan',
        'Pengadaan seragam dan APD lapangan',
        'Pelunasan hutang dagang kepada supplier',
    ];

    public function run(): void
    {
        $words = explode(' ', 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua');

        for ($i = 1; $i <= 50; $i++) {
            $noInvoice = 'INV-2025-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT);
            $noPayment = 'PAY-2025-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT);
            $regional = $this->regionals[array_rand($this->regionals)];
            $divisi = $this->divisis[array_rand($this->divisis)];
            $vendor = $this->vendors[array_rand($this->vendors)];
            $rekeningTujuan = $this->rekening[array_rand($this->rekening)];
            $namaPenerima = $this->penerima[array_rand($this->penerima)];

            $invoiceAmount = rand(5000000, 50000000);
            $ppn = round($invoiceAmount * 0.11);
            $pph = round($invoiceAmount * 0.02);
            $biayaLainnya = rand(0, 500000);
            $totalPayment = $invoiceAmount + $ppn - $pph + $biayaLainnya;
            $invoiceDate = date('Y-m-d', strtotime('-' . rand(1, 90) . ' days'));
            $dueDate = date('Y-m-d', strtotime($invoiceDate . ' +' . rand(14, 60) . ' days'));
            $daysDiff = (int) date_diff(date_create($dueDate), date_create('now'))->format('%r%a');
            $topList = ['14', '30', '45', '60'];
            $timeList = ['08:30', '09:15', '10:00', '11:30', '13:00', '14:45', '15:30'];
            $jenisBayarList = ['TRANSFER', 'GIRO', 'TUNAI', 'SETORAN'];
            $dokumenList = ['LENGKAP', 'KURANG', 'BELUM LENGKAP'];
            $dokumenAsliList = ['LENGKAP', 'KURANG', 'BELUM DIUPLOAD'];

            $topVal = $topList[array_rand($topList)];
            $timeVal = $timeList[array_rand($timeList)];
            $jenisBayar = $jenisBayarList[array_rand($jenisBayarList)];
            $dokumen = $dokumenList[array_rand($dokumenList)];
            $dokumenAsli = $dokumenAsliList[array_rand($dokumenAsliList)];
            $paoWeek = 'W' . rand(1, 52);

            $kalimat = $this->deskripsi[array_rand($this->deskripsi)];

            DB::table('finance_accounting_tax_input_fat')->insert([
                'id_key' => 'FAT-' . Str::uuid(),
                'create_date' => $invoiceDate,
                'top' => $topVal,
                'due_date' => $dueDate,
                'days' => $daysDiff,
                'pao_week' => $paoWeek,
                'regional' => $regional,
                'area' => $regional,
                'divisi' => $divisi,
                'invoice_date' => $invoiceDate,
                'no_invoice' => $noInvoice,
                'vendor_supplier' => $vendor,
                'dekripsi_invoice' => $kalimat,
                'invoice_amount' => $invoiceAmount,
                'ppn' => $ppn,
                'biaya_lainnya' => $biayaLainnya,
                'pph' => $pph,
                'total_payment' => $totalPayment,
                'pengajuan' => 'DISETUJUI',
                'upload_invoice' => null,
                'email' => strtolower(str_replace(' ', '.', $namaPenerima)) . '@washeng.co.id',
                'status_dokumen_asli' => $dokumenAsli,
            ]);

            DB::table('finance_accounting_tax_mutasi_pembayaran')->insert([
                'id_key' => 'MUT-' . Str::uuid(),
                'no_invoice' => $noInvoice,
                'no_payment' => $noPayment,
                'date_record' => date('Y-m-d', strtotime('-' . rand(1, 60) . ' days')),
                'time_record' => $timeVal,
                'pao_week' => $paoWeek,
                'jenis_pembayaran' => $jenisBayar,
                'sumber_dana' => $this->sumberDana[array_rand($this->sumberDana)],
                'rekening_tujuan' => $rekeningTujuan,
                'nama_penerima' => $namaPenerima,
                'payment_amount' => $totalPayment,
                'biaya_lainnya' => $biayaLainnya,
                'keterangan' => rand(0, 100) > 30 ? $kalimat : null,
                'dokumen_diterima' => $dokumen,
                'bukti_tf' => rand(0, 100) > 50 ? Str::uuid()->toString() : null,
                'email' => strtolower(str_replace(' ', '.', $namaPenerima)) . '@washeng.co.id',
            ]);

            $status = $this->statusDoc[array_rand($this->statusDoc)];
            $namaDiajukan = $this->penerima[array_rand($this->penerima)];
            $tanggalAlur = date('Y-m-d H:i:s', strtotime('-' . rand(1, 30) . ' days'));

            DB::table('finance_accounting_tax_alur_aproval')->insert([
                'id_key' => 'APR-' . Str::uuid(),
                'no_invoice' => $noInvoice,
                'no_payment' => $noPayment,
                'date_time' => $tanggalAlur,
                'email' => 'approver@washeng.co.id',
                'status_doc' => $status,
                'diajukan' => rand(0, 100) > 40 ? $namaDiajukan : null,
            ]);

            if (rand(1, 100) <= 30) {
                DB::table('finance_accounting_tax_alur_aproval')->insert([
                    'id_key' => 'APR-' . Str::uuid(),
                    'no_invoice' => $noInvoice,
                    'no_payment' => $noPayment,
                    'date_time' => date('Y-m-d H:i:s', strtotime('-' . rand(1, 15) . ' days')),
                    'email' => 'approver@washeng.co.id',
                    'status_doc' => 'RE-CHECK',
                    'diajukan' => rand(0, 100) > 60 ? $this->penerima[array_rand($this->penerima)] : null,
                ]);
            }
        }
    }
}
