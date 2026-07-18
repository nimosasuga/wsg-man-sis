// resources/js/Pages/Inventori/Pajak/Detail.jsx
import React, { useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ChevronRight,
    ArrowLeft,
    Truck,
    PenTool,
    AlertCircle,
    DollarSign,
    Calendar,
    MapPin,
    Wrench,
    Image as ImageIcon,
} from "lucide-react";

const DataItem = ({
    label,
    value,
    isBold = false,
    isBadge = false,
    badgeColor = "bg-gray-100 text-gray-700",
}) => (
    <div className="min-w-0 flex flex-col py-2 border-b border-gray-50 last:border-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {label}
        </span>
        {isBadge ? (
            <span
                className={`inline-flex w-fit px-2 py-0.5 rounded text-[11px] font-bold ${badgeColor}`}
            >
                {value || "-"}
            </span>
        ) : (
            <span
                className={`break-words text-xs text-gray-800 ${isBold ? "font-black" : "font-medium"}`}
            >
                {value || "-"}
            </span>
        )}
    </div>
);

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
        <div className={`shrink-0 p-2.5 rounded-lg sm:p-3 ${colorClass}`}>
            <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {title}
            </p>
            <h4 className="break-words text-base font-black leading-tight text-gray-800 sm:text-lg">
                {value || "0"}
            </h4>
        </div>
    </div>
);

// Tambahkan props riwayatService, riwayatBan, dan aggregates
export default function Detail({
    unitData,
    riwayatService = [],
    riwayatBan = [],
    riwayatPrimary = [],
    riwayatSecondary = [],
    aggregates = {},
    vehicleCost = {},
}) {
    const [activeTab, setActiveTab] = useState("spesifikasi");

    if (!unitData) return <div>Data tidak ditemukan...</div>;

    const stnkColor =
        unitData.status_stnk === "AKTIF"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700";
    const pajakColor =
        unitData.status_pajak === "AKTIF"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700";
    const kirColor =
        unitData.status_kir === "AKTIF"
            ? "bg-green-100 text-green-700"
            : unitData.status_kir === "EXPIRED"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700";

    // Format Rupiah standar
    const formatRp = (angka) =>
        `Rp ${Number(angka || 0).toLocaleString("id-ID")}`;
    const formatDate = (value) => {
        const date = String(value || "").trim();
        const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : date || "-";
    };
    const historyRowProps = (path, id) => {
        const href = `${path}/${encodeURIComponent(id)}`;

        return {
            role: "link",
            tabIndex: 0,
            className: "cursor-pointer transition-colors hover:bg-cyan-50/70 focus-visible:bg-cyan-50 focus-visible:outline-none",
            onClick: () => router.visit(href),
            onKeyDown: (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.visit(href);
                }
            },
        };
    };

    return (
        <AdminLayout>
            <Head title={`Detail Unit - ${unitData.nopol}`} />

            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">
                        <Link
                            href="/inventori/stnk"
                            className="hover:text-blue-600"
                        >
                            STATUS STNK
                        </Link>
                        <ChevronRight size={12} className="mx-1" />
                        <Link
                            href="/inventori/pajak"
                            className="hover:text-blue-600"
                        >
                            PAJAK STNK
                        </Link>
                        <ChevronRight size={12} className="mx-1" />
                        <span className="text-gray-800">DETAIL UNIT</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/inventori/pajak"
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="flex min-w-0 flex-wrap items-center gap-2 text-xl font-black tracking-tight text-gray-800 sm:gap-3 sm:text-2xl">
                                {unitData.nopol}{" "}
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md border border-blue-200">
                                    {unitData.status}
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kumpulan KPI Atas menggunakan data unit dan biaya kendaraan */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 2xl:gap-4">
                <StatCard
                    title="Total Biaya Kendaraan"
                    value={formatRp(vehicleCost.total)}
                    icon={DollarSign}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Biaya Legalitas"
                    value={formatRp(vehicleCost.legalitasTotal)}
                    icon={Calendar}
                    colorClass="bg-cyan-50 text-cyan-600"
                />
                <StatCard
                    title="Total Biaya Service"
                    value={formatRp(aggregates.biayaService)}
                    icon={Wrench}
                    colorClass="bg-amber-50 text-amber-600"
                />
                <StatCard
                    title="Total Biaya Ban"
                    value={formatRp(aggregates.biayaBan)}
                    icon={AlertCircle}
                    colorClass="bg-rose-50 text-rose-600"
                />
                <StatCard
                    title="Biaya Primary"
                    value={formatRp(vehicleCost.primaryTotal)}
                    icon={Truck}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Biaya Secondary"
                    value={formatRp(vehicleCost.secondaryTotal)}
                    icon={MapPin}
                    colorClass="bg-sky-50 text-sky-600"
                />
            </div>

            <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
                    <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 px-3 pt-2 sm:px-6">
                        {["spesifikasi", "operasional", "legalitas"].map(
                            (tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`shrink-0 whitespace-nowrap px-3 py-3 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors sm:px-4 sm:text-xs ${activeTab === tab ? "border-blue-600 text-blue-700 bg-white rounded-t-lg" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                                >
                                    {tab}
                                </button>
                            ),
                        )}
                    </div>

                    <div className="flex-1 bg-white p-4 sm:p-6">
                        {activeTab === "spesifikasi" && (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                                <DataItem
                                    label="ID Database"
                                    value={unitData.id_key}
                                />
                                <DataItem
                                    label="Tipe Unit"
                                    value={unitData.tipe}
                                />
                                <DataItem
                                    label="Pabrikan"
                                    value={unitData.pabrikan}
                                />
                                <DataItem
                                    label="Model"
                                    value={unitData.model}
                                />
                                <DataItem
                                    label="Jenis Kendaraan"
                                    value={unitData.jenis}
                                />
                                <DataItem
                                    label="No. Mesin"
                                    value={unitData.no_mesin}
                                    isBold
                                />
                                <DataItem
                                    label="No. Rangka"
                                    value={unitData.no_rangka}
                                    isBold
                                />
                                <DataItem
                                    label="Tahun Perakitan"
                                    value={unitData.tahun}
                                />
                                <DataItem
                                    label="Tahun Pembelian"
                                    value={unitData.tahun_pembelian}
                                />
                            </div>
                        )}

                        {activeTab === "operasional" && (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                                <DataItem
                                    label="Region"
                                    value={unitData.region}
                                />
                                <DataItem
                                    label="Area Operasional"
                                    value={unitData.area}
                                    isBold
                                />
                                <DataItem
                                    label="Area Asal"
                                    value={unitData.area_asal}
                                />
                                <DataItem
                                    label="Driver Aktif"
                                    value={unitData.driver}
                                    isBold
                                />
                                <DataItem
                                    label="Inventaris"
                                    value={unitData.inventaris}
                                />
                                <DataItem
                                    label="Nama Project"
                                    value={unitData.project}
                                />
                                <DataItem
                                    label="Distribusi"
                                    value={unitData.distribusi}
                                    isBadge
                                    badgeColor="bg-blue-100 text-blue-700"
                                />
                                <DataItem
                                    label="My Pertamina"
                                    value={unitData.my_pertamina}
                                />
                                <DataItem
                                    label="GPS Tracking"
                                    value={unitData.gps}
                                />
                                <DataItem
                                    label="Ad-Hock"
                                    value={unitData.ad_hock}
                                />
                            </div>
                        )}

                        {activeTab === "legalitas" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-black text-xs text-gray-800">
                                            DATA STNK
                                        </h4>
                                    </div>
                                    <DataItem
                                        label="Status STNK"
                                        value={unitData.status_stnk}
                                        isBadge
                                        badgeColor={stnkColor}
                                    />
                                    <DataItem
                                        label="Jatuh Tempo"
                                        value={unitData.jatuh_tempo_stnk}
                                        isBold
                                    />
                                    <DataItem
                                        label="Sisa Masa Aktif"
                                        value={unitData.masa_aktif_stnk}
                                    />
                                    <DataItem
                                        label="No BPKB"
                                        value={unitData.bpkb}
                                    />
                                    <DataItem
                                        label="Keterangan"
                                        value={unitData.keterangan_stnk}
                                    />
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-black text-xs text-gray-800">
                                            DATA PAJAK
                                        </h4>
                                    </div>
                                    <DataItem
                                        label="Status Pajak"
                                        value={unitData.status_pajak}
                                        isBadge
                                        badgeColor={pajakColor}
                                    />
                                    <DataItem
                                        label="Jatuh Tempo"
                                        value={unitData.jatuh_tempo_pajak}
                                        isBold
                                    />
                                    <DataItem
                                        label="Sisa Masa Aktif"
                                        value={unitData.masa_aktif_pajak}
                                    />
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-black text-xs text-gray-800">
                                            DATA KIR
                                        </h4>
                                    </div>
                                    <DataItem
                                        label="Status KIR"
                                        value={unitData.status_kir}
                                        isBadge
                                        badgeColor={kirColor}
                                    />
                                    <DataItem
                                        label="Jatuh Tempo"
                                        value={unitData.jatuh_tempo_kir}
                                        isBold
                                    />
                                    <DataItem
                                        label="Sisa Masa Aktif"
                                        value={unitData.masa_aktif_kir}
                                    />
                                    <DataItem
                                        label="Ijin Muatan"
                                        value={unitData.ijin_muatan}
                                    />
                                    <DataItem
                                        label="Proses KEUR"
                                        value={unitData.keterangan_proses_keur}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4 xl:gap-6">
                    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-500" />{" "}
                            BIAYA KENDARAAN INI
                        </h3>
                        <p className="text-xs font-semibold leading-5 text-gray-500 mb-4">
                            Semua biaya diikat ke nopol unit ini, bukan dibaca sebagai kategori terpisah.
                        </p>
                        <div className="divide-y divide-gray-100">
                            {(vehicleCost.items || []).map((item) => (
                                <div key={item.key} className="py-3">
                                    <div className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-gray-800">
                                                {item.label}
                                            </p>
                                            <p className="mt-0.5 text-[10px] font-semibold text-gray-400">
                                                {item.count ? `${item.count} data` : "Belum ada biaya"}{item.date ? ` | ${item.date}` : ""}
                                            </p>
                                        </div>
                                        <p className="break-words text-xs font-black text-blue-600 sm:text-right">
                                            {formatRp(item.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-lg bg-slate-950 px-4 py-3 text-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Total beban unit
                            </p>
                            <p className="mt-1 text-lg font-black">
                                {formatRp(vehicleCost.total)}
                            </p>
                        </div>
                    </div>

                    <div className="h-full min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2">
                            <MapPin size={16} className="text-emerald-500" />{" "}
                            KETERANGAN TAMBAHAN
                        </h3>
                        <p className="text-sm text-gray-600">
                            {unitData.keterangan ||
                                "Tidak ada catatan tambahan untuk unit ini."}
                        </p>
                    </div>
                </div>
            </div>

            {/* TABEL RIWAYAT DINAMIS */}
            <div className="grid min-w-0 grid-cols-1 gap-4 pb-10 2xl:grid-cols-2 2xl:gap-6">
                {/* RIWAYAT SERVICE */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-96">
                    <div className="flex flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                            <Wrench size={16} className="text-amber-500" />{" "}
                            RIWAYAT SERVICE
                        </h3>
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                            TOTAL: {aggregates.qtyService}x
                        </span>
                    </div>
                    <div className="custom-scrollbar overflow-auto p-3 sm:p-4">
                        <table className="w-full min-w-[680px] table-fixed text-left text-xs lg:min-w-full">
                            <thead className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100 sticky top-0 bg-white">
                                <tr>
                                    <th className="pb-2">Tanggal</th>
                                    <th className="pb-2">
                                        Jenis Pekerjaan / Keluhan
                                    </th>
                                    <th className="pb-2 text-right">Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {riwayatService.length > 0 ? (
                                    riwayatService.map((rs) => (
                                        <tr key={rs.id_key} {...historyRowProps("/riwayat-service-unit/service-umum", rs.id_key)}>
                                            <td className="py-2.5 font-medium whitespace-nowrap">
                                                {rs.tanggal_services || "-"}
                                            </td>
                                            <td className="py-2.5">
                                                <span className="block font-bold text-gray-800">
                                                    {rs.tipe_service ||
                                                        "Service Berkala"}
                                                </span>
                                                <span className="block text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                                                    {rs.keluhan || "-"}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right font-bold text-gray-700 whitespace-nowrap">
                                                {formatRp(
                                                    rs.total_biaya_service,
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="py-4 text-center text-gray-400"
                                        >
                                            Belum ada riwayat service.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIWAYAT GANTI BAN */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-96">
                    <div className="flex flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                            <PenTool size={16} className="text-blue-500" />{" "}
                            RIWAYAT GANTI BAN
                        </h3>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            TOTAL: {aggregates.qtyBan} Ban
                        </span>
                    </div>
                    <div className="custom-scrollbar overflow-auto p-3 sm:p-4">
                        <table className="w-full min-w-[560px] text-left text-xs">
                            <thead className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100 sticky top-0 bg-white">
                                <tr>
                                    <th className="pb-2">Tanggal</th>
                                    <th className="pb-2">Posisi Ban</th>
                                    <th className="pb-2">Merk / Seri</th>
                                    <th className="pb-2 text-right">Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {riwayatBan.length > 0 ? (
                                    riwayatBan.map((rb) => (
                                        <tr key={rb.id_key} {...historyRowProps("/riwayat-service-unit/service-ban", rb.id_key)}>
                                            <td className="py-2.5 font-medium whitespace-nowrap">
                                                {rb.tanggal_ganti_ban || "-"}
                                            </td>
                                            <td className="py-2.5 font-bold">
                                                {rb.posisi || "-"}
                                            </td>
                                            <td className="py-2.5">
                                                <span className="block text-gray-800">
                                                    {rb.jenis_ban || "-"}
                                                </span>
                                                <span className="block text-[10px] text-gray-500 mt-0.5">
                                                    {rb.tipe_ban || "-"}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right font-bold text-gray-700 whitespace-nowrap">
                                                {formatRp(rb.total_harga)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="py-4 text-center text-gray-400"
                                        >
                                            Belum ada riwayat ganti ban.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIWAYAT OPERASIONAL PRIMARY */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-96">
                    <div className="flex flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                            <Truck size={16} className="text-blue-500" />{" "}
                            RIWAYAT PRIMARY
                        </h3>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            TOTAL: {aggregates.qtyPrimary || 0}x
                        </span>
                    </div>
                    <div className="custom-scrollbar overflow-auto">
                        <table className="w-full min-w-[680px] table-fixed border-separate border-spacing-0 text-left text-xs lg:min-w-full">
                            <thead className="sticky top-0 z-10 bg-gray-50 text-[10px] font-bold uppercase text-gray-400 shadow-[0_1px_0_#e5e7eb]">
                                <tr>
                                    <th scope="col" className="w-[18%] px-4 py-3">Tanggal Muat</th>
                                    <th scope="col" className="w-[22%] px-3 py-3">Area</th>
                                    <th scope="col" className="w-[38%] px-3 py-3">Rute / Jenis</th>
                                    <th scope="col" className="w-[22%] px-4 py-3 text-right">Total Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {riwayatPrimary.length > 0 ? (
                                    riwayatPrimary.map((row, index) => (
                                        <tr key={`${row.id_key || "primary"}-${index}`} {...historyRowProps("/profit-unit/primary/table", row.id_key)}>
                                             <td className="px-4 py-2.5 font-medium whitespace-nowrap">{formatDate(row.tanggal_muat)}</td>
                                             <td className="px-3 py-2.5 font-bold text-gray-800">{row.area || "-"}</td>
                                             <td className="px-3 py-2.5 text-gray-600">
                                                <span className="block break-words">{[row.rute_asal, row.rute_tujuan].filter(Boolean).join(" - ") || "-"}</span>
                                                {row.jenis && <span className="mt-0.5 block text-[10px] text-gray-400">{row.jenis}</span>}
                                            </td>
                                             <td className="px-4 py-2.5 text-right font-bold text-gray-700 whitespace-nowrap">{formatRp(row.total_biaya)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="py-4 text-center text-gray-400">Belum ada riwayat Primary.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIWAYAT OPERASIONAL SECONDARY */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-96">
                    <div className="flex flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                            <MapPin size={16} className="text-sky-500" />{" "}
                            RIWAYAT SECONDARY
                        </h3>
                        <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2 py-1 rounded">
                            TOTAL: {aggregates.qtySecondary || 0}x
                        </span>
                    </div>
                    <div className="custom-scrollbar overflow-auto">
                        <table className="w-full min-w-[680px] table-fixed border-separate border-spacing-0 text-left text-xs lg:min-w-full">
                            <thead className="sticky top-0 z-10 bg-gray-50 text-[10px] font-bold uppercase text-gray-400 shadow-[0_1px_0_#e5e7eb]">
                                <tr>
                                    <th scope="col" className="w-[18%] px-4 py-3">Tanggal</th>
                                    <th scope="col" className="w-[22%] px-3 py-3">Area</th>
                                    <th scope="col" className="w-[38%] px-3 py-3">Rute / Order</th>
                                    <th scope="col" className="w-[22%] px-4 py-3 text-right">Total Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {riwayatSecondary.length > 0 ? (
                                    riwayatSecondary.map((row, index) => (
                                        <tr key={`${row.id_key || "secondary"}-${index}`} {...historyRowProps("/profit-unit/secondary/table", row.id_key)}>
                                             <td className="px-4 py-2.5 font-medium whitespace-nowrap">{formatDate(row.tanggal)}</td>
                                             <td className="px-3 py-2.5 font-bold text-gray-800">{row.area || "-"}</td>
                                             <td className="px-3 py-2.5 text-gray-600">
                                                <span className="block break-words">{row.rute || "-"}</span>
                                                <span className="mt-0.5 block text-[10px] text-gray-400">{[row.order_type, row.tipe_unit].filter(Boolean).join(" | ") || "-"}</span>
                                            </td>
                                             <td className="px-4 py-2.5 text-right font-bold text-gray-700 whitespace-nowrap">{formatRp(row.total_biaya_operasional)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="py-4 text-center text-gray-400">Belum ada riwayat Secondary.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
