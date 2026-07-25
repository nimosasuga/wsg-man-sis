<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('operasional_rental_unit_input', function (Blueprint $table) {
            $table->decimal('biaya_legalitas', 15, 2)->default(0)->after('tarif_sewa_unit_bln');
        });
    }

    public function down(): void
    {
        Schema::table('operasional_rental_unit_input', function (Blueprint $table) {
            $table->dropColumn('biaya_legalitas');
        });
    }
};
