<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// 1. Root URL diarahkan ke dashboard (Nanti middleware akan melempar ke Login jika belum masuk)
Route::get('/', function () {
    return redirect('/dashboard');
});

// 2. Kumpulan Route yang DILINDUNGI (Hanya bisa diakses jika sudah Login)
Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::prefix('inventori')->name('inventori.')->group(function () {
        Route::get('/pajak', function () {
            return Inertia::render('Inventori/Pajak/Index');
        })->name('pajak.index');

        Route::get('/pajak/{id}', function ($id) {
            return Inertia::render('Inventori/Pajak/Detail', ['id' => $id]);
        })->name('pajak.detail');
    });
});

// 3. Panggil kumpulan Route Autentikasi bawaan Breeze (Termasuk /login, /register, /logout)
require __DIR__ . '/auth.php';
