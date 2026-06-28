<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Inventori\PajakController; // 1. Pastikan import ini ditambahkan

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    // 2. Ubah struktur route ini menggunakan Controller
    Route::prefix('inventori')->name('inventori.')->group(function () {
        Route::get('/pajak', [PajakController::class, 'index'])->name('pajak.index');
        Route::get('/pajak/{id}', [PajakController::class, 'show'])->name('pajak.detail');
    });
});

require __DIR__ . '/auth.php';
