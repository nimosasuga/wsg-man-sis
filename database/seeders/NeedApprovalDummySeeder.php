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

    public function run(): void
    {
        $faker = fake('id_ID');

        for ($i = 1; $i <= 50; $i++) {
            $noInvoice = 'INV-2025-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT);
            $noPayment = 'PAY-2025-' . str_pad((string) $i, 4, '0', STR_PAD_LEFT);
            $regional = $this->regionals[array_rand($this->regionals)];
            $divisi = $this->divisis[array_rand($this->divisis)];
            $vendor = $this->vendors[array_rand($this->vendors)];
            $rekeningTujuan = $this->rekening[array_rand($this->rekening)];
            $namaPenerima = $this->penerima[array_rand($this->penerima)];

            $invoiceAmount = $faker->randomFloat(0, 5000000, 50000000);
            $ppn = round($invoiceAmount * 0.11);
            $pph = round($invoiceAmount * 0.02);
            $biayaLainnya = $faker->randomFloat(0, 0, 500000);
            $totalPayment = $invoiceAmount + $ppn - $pph + $biayaLainnya;
            $invoiceDate = $faker->dateTimeBetween('-3 months', 'now')->format('Y-m-d');
            $dueDate = date('Y-m-d', strtotime($invoiceDate . ' +' . rand(14, 60) . ' days'));
            $daysDiff = (int) date_diff(date_create($dueDate), date_create('now'))->format('%r%a');

            DB::table('finance_accounting_tax_input_fat')->insert([
                'id_key' => 'FAT-' . Str::uuid(),
                'create_date' => $invoiceDate,
                'top' => $faker->randomElement(['14', '30', '45', '60']),
                'due_date' => $dueDate,
                'days' => $daysDiff,
                'pao_week' => 'W' . $faker->numberBetween(1, 52),
                'regional' => $regional,
                'area' => $regional,
                'divisi' => $divisi,
                'invoice_date' => $invoiceDate,
                'no_invoice' => $noInvoice,
                'vendor_supplier' => $vendor,
                'dekripsi_invoice' => $faker->sentence(6),
                'invoice_amount' => $invoiceAmount,
                'ppn' => $ppn,
                'biaya_lainnya' => $biayaLainnya,
                'pph' => $pph,
                'total_payment' => $totalPayment,
                'pengajuan' => 'DISETUJUI',
                'upload_invoice' => null,
                'email' => strtolower(str_replace(' ', '.', $namaPenerima)) . '@washeng.co.id',
                'status_dokumen_asli' => $faker->randomElement(['LENGKAP', 'KURANG', 'BELUM DIUPLOAD']),
            ]);

            DB::table('finance_accounting_tax_mutasi_pembayaran')->insert([
                'id_key' => 'MUT-' . Str::uuid(),
                'no_invoice' => $noInvoice,
                'no_payment' => $noPayment,
                'date_record' => $faker->dateTimeBetween('-2 months', 'now')->format('Y-m-d'),
                'time_record' => $faker->randomElement(['08:30', '09:15', '10:00', '11:30', '13:00', '14:45', '15:30']),
                'pao_week' => 'W' . $faker->numberBetween(1, 52),
                'jenis_pembayaran' => $faker->randomElement(['TRANSFER', 'GIRO', 'TUNAI', 'SETORAN']),
                'sumber_dana' => $this->sumberDana[array_rand($this->sumberDana)],
                'rekening_tujuan' => $rekeningTujuan,
                'nama_penerima' => $namaPenerima,
                'payment_amount' => $totalPayment,
                'biaya_lainnya' => $biayaLainnya,
                'keterangan' => $faker->optional(0.7)->sentence(4),
                'dokumen_diterima' => $faker->randomElement(['LENGKAP', 'KURANG', 'BELUM LENGKAP']),
                'bukti_tf' => $faker->optional(0.5)->uuid(),
                'email' => strtolower(str_replace(' ', '.', $namaPenerima)) . '@washeng.co.id',
            ]);

            $status = $this->statusDoc[array_rand($this->statusDoc)];
            DB::table('finance_accounting_tax_alur_aproval')->insert([
                'id_key' => 'APR-' . Str::uuid(),
                'no_invoice' => $noInvoice,
                'no_payment' => $noPayment,
                'date_time' => $faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d H:i:s'),
                'email' => 'approver@washeng.co.id',
                'status_doc' => $status,
                'diajukan' => $faker->optional(0.6)->name('id_ID'),
            ]);

            if ($faker->boolean(30)) {
                DB::table('finance_accounting_tax_alur_aproval')->insert([
                    'id_key' => 'APR-' . Str::uuid(),
                    'no_invoice' => $noInvoice,
                    'no_payment' => $noPayment,
                    'date_time' => $faker->dateTimeBetween('-1 month', 'now')->format('Y-m-d H:i:s'),
                    'email' => 'approver@washeng.co.id',
                    'status_doc' => 'RE-CHECK',
                    'diajukan' => $faker->optional(0.4)->name('id_ID'),
                ]);
            }
        }
    }
}
