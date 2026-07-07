<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Inventori\PajakController;
use App\Http\Controllers\Inventori\StnkController;
use App\Http\Controllers\Inventori\KirController;
use App\Http\Controllers\Inventori\DaftarUnitController;
use App\Http\Controllers\Inventori\DaftarAssetController;
use App\Http\Controllers\Finance\DokumenInvoiceController;
use App\Http\Controllers\Biaya\BiayaController;
use App\Http\Controllers\ProfitUnit\ProfitUnitController;

Route::get('/', function () {
    return redirect('/dashboard');
});

Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('biaya')->name('biaya.')->group(function () {
        Route::get('/', [BiayaController::class, 'index'])->name('index');
        Route::get('/{slug}', [BiayaController::class, 'category'])->name('category');
        Route::get('/{slug}/{id}', [BiayaController::class, 'detail'])->name('detail');
    });

    Route::get('/profit-unit', [ProfitUnitController::class, 'index'])->name('profit-unit.index');
    Route::get('/profit-unit/primary', [ProfitUnitController::class, 'primary'])->name('profit-unit.primary');
    Route::get('/profit-unit/secondary', [ProfitUnitController::class, 'secondary'])->name('profit-unit.secondary');
    Route::get('/profit-unit/rental', [ProfitUnitController::class, 'rental'])->name('profit-unit.rental');
    Route::get('/profit-unit/lcl', [ProfitUnitController::class, 'lcl'])->name('profit-unit.lcl');

    Route::prefix('inventori')->name('inventori.')->group(function () {
        Route::get('/daftar-unit', [DaftarUnitController::class, 'index'])->name('daftar-unit.index');
        Route::get('/daftar-unit/{category}', [DaftarUnitController::class, 'category'])->name('daftar-unit.category');
        Route::get('/daftar-asset', [DaftarAssetController::class, 'index'])->name('daftar-asset.index');
        Route::get('/daftar-asset/asset-ho', [DaftarAssetController::class, 'assetHo'])->name('daftar-asset.asset-ho');
        Route::get('/daftar-asset/asset-ho/{id}', [DaftarAssetController::class, 'assetHoDetail'])->name('daftar-asset.asset-ho.detail');
        Route::get('/daftar-asset/kendaraan-operasional', [DaftarAssetController::class, 'kendaraanOperasional'])->name('daftar-asset.kendaraan-operasional');
        Route::get('/daftar-asset/kendaraan-operasional/{id}', [DaftarAssetController::class, 'kendaraanOperasionalDetail'])->name('daftar-asset.kendaraan-operasional.detail');
        Route::get('/daftar-asset/toolkit', [DaftarAssetController::class, 'toolkit'])->name('daftar-asset.toolkit');
        Route::get('/daftar-asset/toolkit/{id}', [DaftarAssetController::class, 'toolkitDetail'])->name('daftar-asset.toolkit.detail');

        Route::get('/pajak', [PajakController::class, 'index'])->name('pajak.index');
        Route::get('/pajak/{id}', [PajakController::class, 'show'])->name('pajak.detail');

        Route::get('/stnk', [StnkController::class, 'index'])->name('stnk.index');
        Route::get('/stnk/{nopol}', [StnkController::class, 'show'])->name('stnk.detail');

        Route::get('/kir', [KirController::class, 'index'])->name('kir.index');
        Route::get('/kir/{nopol}', [KirController::class, 'show'])->name('kir.detail');
    });

    Route::prefix('finance')->name('finance.')->group(function () {
        Route::get('/dokumen-invoice', [DokumenInvoiceController::class, 'index'])->name('dokumen-invoice.index');
        Route::get('/dokumen-invoice/{id}', [DokumenInvoiceController::class, 'show'])->name('dokumen-invoice.detail');
    });
});

require __DIR__ . '/auth.php';
