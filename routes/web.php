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
use App\Http\Controllers\Approval\NeedApprovalController;
use App\Http\Controllers\Operations\OnTheRoadController;
use App\Http\Controllers\Maintenance\RiwayatServiceController;
use App\Http\Controllers\System\DataHealthController;
use App\Http\Controllers\System\SystemActivityLogController;
use App\Http\Controllers\Karyawan\DaftarKaryawanController;

Route::redirect('/', '/dashboard');

Route::middleware(['auth'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('biaya')->name('biaya.')->group(function () {
        Route::get('/', [BiayaController::class, 'index'])->name('index');
        Route::get('/{slug}', [BiayaController::class, 'category'])->name('category');
        Route::get('/{slug}/{id}', [BiayaController::class, 'detail'])->name('detail');
    });

    Route::get('/profit-unit', [ProfitUnitController::class, 'index'])->name('profit-unit.index');
    Route::get('/profit-unit/primary', [ProfitUnitController::class, 'primary'])->name('profit-unit.primary');
    Route::get('/profit-unit/primary/table', [ProfitUnitController::class, 'primaryTable'])->name('profit-unit.primary.table');
    Route::get('/profit-unit/primary/table/{id}', [ProfitUnitController::class, 'primaryDetail'])->name('profit-unit.primary.detail');
    Route::get('/profit-unit/secondary', [ProfitUnitController::class, 'secondary'])->name('profit-unit.secondary');
    Route::get('/profit-unit/secondary/table', [ProfitUnitController::class, 'secondaryTable'])->name('profit-unit.secondary.table');
    Route::get('/profit-unit/secondary/table/{id}', [ProfitUnitController::class, 'secondaryDetail'])->name('profit-unit.secondary.detail');
    Route::get('/profit-unit/rental', [ProfitUnitController::class, 'rental'])->name('profit-unit.rental');
    Route::get('/profit-unit/rental/table', [ProfitUnitController::class, 'rentalTable'])->name('profit-unit.rental.table');
    Route::get('/profit-unit/rental/table/{id}', [ProfitUnitController::class, 'rentalDetail'])->name('profit-unit.rental.detail');
    Route::get('/profit-unit/lcl', [ProfitUnitController::class, 'lcl'])->name('profit-unit.lcl');
    Route::get('/profit-unit/lcl/table', [ProfitUnitController::class, 'lclTable'])->name('profit-unit.lcl.table');
    Route::get('/profit-unit/lcl/table/{id}', [ProfitUnitController::class, 'lclDetail'])->name('profit-unit.lcl.detail');

    Route::get('/need-approval', [NeedApprovalController::class, 'index'])->name('need-approval.index');
    Route::get('/need-approval/outstanding', [NeedApprovalController::class, 'outstanding'])->name('need-approval.outstanding');
    Route::get('/need-approval/outstanding/{id}', [NeedApprovalController::class, 'outstandingDetail'])->name('need-approval.outstanding.detail');

    Route::get('/on-the-road', [OnTheRoadController::class, 'index'])->name('on-the-road.index');
    Route::get('/on-the-road/breakdown/{field}/{value}', [OnTheRoadController::class, 'breakdownTable'])->name('on-the-road.breakdown');
    Route::get('/on-the-road/{category}', [OnTheRoadController::class, 'table'])->name('on-the-road.table');
    Route::get('/on-the-road/{category}/{id}', [OnTheRoadController::class, 'detail'])->name('on-the-road.detail');

    Route::get('/riwayat-service-unit', [RiwayatServiceController::class, 'index'])->name('riwayat-service-unit.index');
    Route::get('/riwayat-service-unit/service-umum', [RiwayatServiceController::class, 'serviceUmum'])->name('riwayat-service-unit.service-umum');
    Route::get('/riwayat-service-unit/service-umum/create', [RiwayatServiceController::class, 'createServiceUmum'])->name('riwayat-service-unit.service-umum.create');
    Route::post('/riwayat-service-unit/service-umum', [RiwayatServiceController::class, 'storeServiceUmum'])->name('riwayat-service-unit.service-umum.store');
    Route::get('/riwayat-service-unit/service-umum/{id}/edit', [RiwayatServiceController::class, 'editServiceUmum'])->name('riwayat-service-unit.service-umum.edit');
    Route::put('/riwayat-service-unit/service-umum/{id}', [RiwayatServiceController::class, 'updateServiceUmum'])->name('riwayat-service-unit.service-umum.update');
    Route::delete('/riwayat-service-unit/service-umum/{id}', [RiwayatServiceController::class, 'destroyServiceUmum'])->name('riwayat-service-unit.service-umum.destroy');
    Route::get('/riwayat-service-unit/service-umum/{id}', [RiwayatServiceController::class, 'serviceUmumDetail'])->name('riwayat-service-unit.service-umum.detail');
    Route::get('/riwayat-service-unit/service-ban', [RiwayatServiceController::class, 'serviceBan'])->name('riwayat-service-unit.service-ban');
    Route::get('/riwayat-service-unit/service-ban/create', [RiwayatServiceController::class, 'createServiceBan'])->name('riwayat-service-unit.service-ban.create');
    Route::post('/riwayat-service-unit/service-ban', [RiwayatServiceController::class, 'storeServiceBan'])->name('riwayat-service-unit.service-ban.store');
    Route::get('/riwayat-service-unit/service-ban/{id}/edit', [RiwayatServiceController::class, 'editServiceBan'])->name('riwayat-service-unit.service-ban.edit');
    Route::put('/riwayat-service-unit/service-ban/{id}', [RiwayatServiceController::class, 'updateServiceBan'])->name('riwayat-service-unit.service-ban.update');
    Route::delete('/riwayat-service-unit/service-ban/{id}', [RiwayatServiceController::class, 'destroyServiceBan'])->name('riwayat-service-unit.service-ban.destroy');
    Route::get('/riwayat-service-unit/service-ban/{id}', [RiwayatServiceController::class, 'serviceBanDetail'])->name('riwayat-service-unit.service-ban.detail');
    Route::get('/system/activity-log', [SystemActivityLogController::class, 'index'])->name('system.activity-log.index');
    Route::get('/system/activity-log/user', [SystemActivityLogController::class, 'userActivity'])->name('system.activity-log.user');
    Route::get('/system/activity-log/user/{id}', [SystemActivityLogController::class, 'userActivityDetail'])->name('system.activity-log.user.detail');
    Route::get('/system/data-health', [DataHealthController::class, 'index'])->name('system.data-health');
    Route::get('/daftar-karyawan', [DaftarKaryawanController::class, 'index'])->name('daftar-karyawan.index');
    Route::get('/daftar-karyawan/create', [DaftarKaryawanController::class, 'create'])->name('daftar-karyawan.create');
    Route::post('/daftar-karyawan', [DaftarKaryawanController::class, 'store'])->name('daftar-karyawan.store');
    Route::get('/daftar-karyawan/{id}', [DaftarKaryawanController::class, 'show'])->name('daftar-karyawan.show');
    Route::get('/daftar-karyawan/{id}/edit', [DaftarKaryawanController::class, 'edit'])->name('daftar-karyawan.edit');
    Route::put('/daftar-karyawan/{id}', [DaftarKaryawanController::class, 'update'])->name('daftar-karyawan.update');
    Route::delete('/daftar-karyawan/{id}', [DaftarKaryawanController::class, 'destroy'])->name('daftar-karyawan.destroy');

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
