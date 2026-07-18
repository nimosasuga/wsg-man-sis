<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('operasional_update_posisi_unit')) {
            return;
        }

        Schema::create('operasional_update_posisi_unit', function (Blueprint $table) {
            $table->string('id', 50)->primary();
            $table->dateTime('tanggal_jam')->nullable()->index();
            $table->string('nopol', 30)->nullable()->index();
            $table->string('nama_driver', 255)->nullable();
            $table->string('location', 100)->nullable();
            $table->text('keterangan')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operasional_update_posisi_unit');
    }
};
