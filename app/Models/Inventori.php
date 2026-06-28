<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventori extends Model
{
    // Arahkan ke tabel AppSheet Anda
    protected $table = 'hr_manager_db_inventori';

    // Primary key bukan 'id' melainkan 'id_key'
    protected $primaryKey = 'id_key';

    // Karena id_key berupa varchar, matikan auto-increment
    public $incrementing = false;
    protected $keyType = 'string';

    // Matikan timestamps otomatis karena tabel ini hasil dump AppSheet
    public $timestamps = false;

    // Izinkan semua kolom untuk diisi (Mass Assignment)
    protected $guarded = [];
}
