<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

// Struktur Route ter-group untuk modul Inventori
Route::prefix('inventori')->name('inventori.')->group(function () {

    // Route untuk Detail Pajak
    Route::get('/pajak', function () {
        return Inertia::render('Inventori/Pajak/Index'); // Memanggil file di struktur folder baru
    })->name('pajak.index');
});
