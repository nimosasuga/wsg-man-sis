<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NeedApprovalApproveTest extends TestCase
{
    public function test_approve_writes_sql_datetime_to_approval_history(): void
    {
        Schema::create('finance_accounting_tax_mutasi_pembayaran', function (Blueprint $table) {
            $table->string('id_key')->primary();
            $table->string('no_invoice');
            $table->string('no_payment');
        });

        Schema::create('finance_accounting_tax_alur_aproval', function (Blueprint $table) {
            $table->string('id_key')->primary();
            $table->string('no_invoice');
            $table->string('no_payment');
            $table->dateTime('date_time');
            $table->string('email');
            $table->string('status_doc');
            $table->string('diajukan');
        });

        DB::table('finance_accounting_tax_mutasi_pembayaran')->insert([
            'id_key' => 'MUT-TEST-001',
            'no_invoice' => 'INV-TEST-001',
            'no_payment' => 'PAY-TEST-001',
        ]);

        $user = new User([
            'nik' => 'APPROVER-001',
            'email' => 'approver@example.test',
        ]);
        $user->id = 1;
        $user->exists = true;
        $user->name = 'Approver Test';

        $this->actingAs($user)
            ->withoutMiddleware()
            ->post('/need-approval/outstanding/MUT-TEST-001/approve')
            ->assertRedirect('/need-approval/outstanding');

        $approval = DB::table('finance_accounting_tax_alur_aproval')->first();

        $this->assertSame('APPROVED', $approval->status_doc);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $approval->date_time);
    }
}
