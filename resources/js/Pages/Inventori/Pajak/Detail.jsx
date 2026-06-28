// resources/js/Pages/Inventori/Pajak/Detail.jsx
import React, { useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import {
    ChevronRight,
    ArrowLeft,
    Truck,
    FileCheck,
    PenTool,
    AlertCircle,
    DollarSign,
    Calendar,
    MapPin,
    Wrench,
    ShieldCheck,
    Image as ImageIcon,
} from "lucide-react";

// Komponen Reusable untuk Menampilkan Label & Nilai Data
const DataItem = ({
    label,
    value,
    isBold = false,
    isBadge = false,
    badgeColor = "bg-gray-100 text-gray-700",
}) => (
    <div className="flex flex-col py-2 border-b border-gray-50 last:border-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {label}
        </span>
        {isBadge ? (
            <span
                className={`inline-flex w-fit px-2 py-0.5 rounded text-[11px] font-bold ${badgeColor}`}
            >
                {value}
            </span>
        ) : (
            <span
                className={`text-xs text-gray-800 ${isBold ? "font-black" : "font-medium"}`}
            >
                {value || "-"}
            </span>
        )}
    </div>
);

// Komponen KPI Kecil
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
            <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {title}
            </p>
            <h4 className="text-lg font-black text-gray-800 leading-tight">
                {value}
            </h4>
        </div>
    </div>
);

export default function Detail({ id = "DH-9709-AJ" }) {
    // Menerima ID/Nopol dari URL (Dummy via default props sementara)
    const [activeTab, setActiveTab] = useState("spesifikasi");

    // DUMMY DATA AGREGAT (Card 4 Metrics)
    const stats = {
        profitHariIni: "Rp 1.450.000",
        totalBiayaOp: "Rp 850.000",
        totalTarifBerjalan: "Rp 2.300.000",
        qtyService: 4,
        biayaService: "Rp 3.200.000",
        qtyBan: 2,
        biayaBan: "Rp 5.600.000",
        jmlBerjalan: "1 Unit",
        tglOtr: "24 Jun 2026",
        primary: 12,
        secondary: 3,
        lcl: 0,
        rental: 0,
        standby: 1,
    };

    return (
        <AdminLayout>
            <Head title={`Detail Unit - ${id}`} />

            {/* 1. BREADCRUMB & HEADER */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600">
                            DASHBOARD
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
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                                {id}{" "}
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md border border-green-200">
                                    AKTIF OPERASIONAL
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. TOP METRICS ROW (Finansial & Status OTR) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    title="Total Profit (Hari Ini)"
                    value={stats.profitHariIni}
                    icon={DollarSign}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Total Biaya Operasional"
                    value={stats.totalBiayaOp}
                    icon={AlertCircle}
                    colorClass="bg-rose-50 text-rose-600"
                />
                <StatCard
                    title="Total Biaya Service"
                    value={stats.biayaService}
                    icon={Wrench}
                    colorClass="bg-amber-50 text-amber-600"
                />
                <StatCard
                    title="Qty Ganti Ban"
                    value={`${stats.qtyBan} Ban (${stats.biayaBan})`}
                    icon={PenTool}
                    colorClass="bg-blue-50 text-blue-600"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                {/* 3. CARD 1: INFORMASI UTAMA UNIT (Kiri - Makan 2 Kolom) */}
                <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                            <Truck size={16} className="text-blue-600" /> PROFIL
                            KENDARAAN & LEGALITAS
                        </h3>
                    </div>

                    {/* Internal Tabs */}
                    <div className="flex border-b border-gray-100 px-6 pt-2 bg-white">
                        {["spesifikasi", "operasional", "legalitas"].map(
                            (tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-700"}`}
                                >
                                    {tab}
                                </button>
                            ),
                        )}
                    </div>

                    <div className="p-6 bg-white flex-1">
                        {activeTab === "spesifikasi" && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                                <DataItem
                                    label="NOPOL"
                                    value="DH-9709-AJ"
                                    isBold
                                />
                                <DataItem
                                    label="ID Unit"
                                    value="UNT-2024-001"
                                />
                                <DataItem label="Tipe" value="HEAD" />
                                <DataItem label="Pabrikan" value="HINO" />
                                <DataItem label="Model" value="HEAD 500" />
                                <DataItem label="Jenis" value="TRUCK TRAILER" />
                                <DataItem
                                    label="No. Mesin"
                                    value="J08EUGJ41831"
                                    isBold
                                />
                                <DataItem
                                    label="No. Rangka"
                                    value="MJEFC8JJKEJT16680"
                                    isBold
                                />
                                <DataItem
                                    label="Tahun Perakitan"
                                    value="2020"
                                />
                                <DataItem
                                    label="Tahun Pembelian"
                                    value="2021"
                                />
                                <DataItem
                                    label="Status Pembelian"
                                    value="LUNAS"
                                    isBadge
                                    badgeColor="bg-green-100 text-green-700"
                                />
                            </div>
                        )}

                        {activeTab === "operasional" && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                                <DataItem
                                    label="Region"
                                    value="JATIM & BALI NUSRA"
                                />
                                <DataItem label="Area" value="KUPANG" isBold />
                                <DataItem label="Area Asal" value="SURABAYA" />
                                <DataItem
                                    label="Inventaris"
                                    value="MILIK PERUSAHAAN"
                                />
                                <DataItem
                                    label="Project"
                                    value="DISTRIBUSI SEMEN"
                                />
                                <DataItem
                                    label="Distribusi"
                                    value="PRIMARY"
                                    isBadge
                                    badgeColor="bg-blue-100 text-blue-700"
                                />
                                <DataItem
                                    label="My Pertamina"
                                    value="TERDAFTAR (QR-8829)"
                                    isBadge
                                    badgeColor="bg-red-100 text-red-700"
                                />
                                <DataItem
                                    label="GPS"
                                    value="TERPASANG (TK-103)"
                                />
                                <DataItem
                                    label="Tarif Unit"
                                    value="Rp 2.500.000 / Trip"
                                    isBold
                                />
                                <DataItem label="Ad-Hock" value="TIDAK ADA" />
                            </div>
                        )}

                        {activeTab === "legalitas" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Blok STNK */}
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-black text-xs text-gray-800">
                                            DATA STNK
                                        </h4>
                                        <ImageIcon
                                            size={16}
                                            className="text-blue-500 cursor-pointer hover:scale-110 transition-transform"
                                            title="Lihat Foto STNK"
                                        />
                                    </div>
                                    <DataItem
                                        label="Status"
                                        value="BERLAKU"
                                        isBadge
                                        badgeColor="bg-green-100 text-green-700"
                                    />
                                    <DataItem
                                        label="Jatuh Tempo"
                                        value="14 Okt 2030"
                                        isBold
                                    />
                                    <DataItem
                                        label="Masa Aktif"
                                        value="1.564 Hari Lagi"
                                    />
                                    <DataItem
                                        label="Biaya"
                                        value="Rp 1.250.000"
                                    />
                                    <DataItem
                                        label="Keterangan"
                                        value="Pajak 5 Tahunan"
                                    />
                                </div>
                                {/* Blok PAJAK */}
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-black text-xs text-gray-800">
                                            DATA PAJAK 1 THN
                                        </h4>
                                        <ImageIcon
                                            size={16}
                                            className="text-blue-500 cursor-pointer hover:scale-110"
                                            title="Lihat Foto Pajak"
                                        />
                                    </div>
                                    <DataItem
                                        label="Status"
                                        value="BERLAKU"
                                        isBadge
                                        badgeColor="bg-green-100 text-green-700"
                                    />
                                    <DataItem
                                        label="Jatuh Tempo"
                                        value="14 Okt 2026"
                                        isBold
                                    />
                                    <DataItem
                                        label="Masa Aktif"
                                        value="112 Hari Lagi"
                                    />
                                </div>
                                {/* Blok KIR */}
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-black text-xs text-gray-800">
                                            DATA KIR
                                        </h4>
                                        <ImageIcon
                                            size={16}
                                            className="text-blue-500 cursor-pointer hover:scale-110"
                                            title="Lihat Foto KIR"
                                        />
                                    </div>
                                    <DataItem
                                        label="Status"
                                        value="HAMPIR EXPIRED"
                                        isBadge
                                        badgeColor="bg-amber-100 text-amber-700"
                                    />
                                    <DataItem
                                        label="Jatuh Tempo"
                                        value="10 Jul 2026"
                                        isBold
                                    />
                                    <DataItem
                                        label="Masa Aktif"
                                        value="16 Hari Lagi"
                                    />
                                    <DataItem
                                        label="Biaya"
                                        value="Rp 350.000"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. SIDEBAR METRICS (Kanan - Makan 1 Kolom) */}
                <div className="flex flex-col gap-6">
                    {/* Masa Aktif Analytics */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2">
                            <Calendar size={16} className="text-red-500" />{" "}
                            ANALITIK JATUH TEMPO
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-xs font-bold text-gray-500">
                                    MASUK BULAN PAJAK (1 THN)
                                </span>
                                <span className="text-xs font-black text-gray-800">
                                    OKTOBER
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-xs font-bold text-gray-500">
                                    MASUK TAHUN PAJAK (1 THN)
                                </span>
                                <span className="text-xs font-black text-gray-800">
                                    2026
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-xs font-bold text-gray-500">
                                    MASUK BULAN STNK (5 THN)
                                </span>
                                <span className="text-xs font-black text-gray-800">
                                    OKTOBER
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-xs font-bold text-gray-500">
                                    MASUK TAHUN STNK (5 THN)
                                </span>
                                <span className="text-xs font-black text-gray-800">
                                    2030
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-xs font-bold text-gray-500">
                                    MASUK BULAN KIR
                                </span>
                                <span className="text-xs font-black text-rose-600">
                                    JULI
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                <span className="text-xs font-bold text-gray-500">
                                    MASUK TAHUN KIR
                                </span>
                                <span className="text-xs font-black text-rose-600">
                                    2026
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Distribusi OTR Analytics */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-black text-gray-800 text-sm mb-4 flex items-center gap-2">
                            <MapPin size={16} className="text-emerald-500" />{" "}
                            HISTORI DISTRIBUSI
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                <div className="text-2xl font-black text-gray-800">
                                    {stats.primary}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                    PRIMARY
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                <div className="text-2xl font-black text-gray-800">
                                    {stats.secondary}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                    SECONDARY
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                <div className="text-2xl font-black text-gray-800">
                                    {stats.lcl}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                    LCL
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                                <div className="text-2xl font-black text-gray-800">
                                    {stats.standby}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                    STANDBY
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. CARD 2 & 3: RIWAYAT SERVICE & GANTI BAN (Tabel Bawah) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                {/* RIWAYAT SERVICE */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                            <Wrench size={16} className="text-amber-500" />{" "}
                            RIWAYAT SERVICE
                        </h3>
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                            TOTAL: {stats.qtyService}x
                        </span>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left text-xs">
                            <thead className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
                                <tr>
                                    <th className="pb-2">Tanggal</th>
                                    <th className="pb-2">Jenis Pekerjaan</th>
                                    <th className="pb-2 text-right">Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr>
                                    <td className="py-2.5 font-medium">
                                        10 Jun 2026
                                    </td>
                                    <td className="py-2.5">
                                        Ganti Oli Mesin & Filter
                                    </td>
                                    <td className="py-2.5 text-right font-bold text-gray-700">
                                        Rp 850.000
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 font-medium">
                                        15 Mei 2026
                                    </td>
                                    <td className="py-2.5">
                                        Service Rem Cakram
                                    </td>
                                    <td className="py-2.5 text-right font-bold text-gray-700">
                                        Rp 1.200.000
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 font-medium">
                                        02 Apr 2026
                                    </td>
                                    <td className="py-2.5">
                                        Perbaikan Kelistrikan Lampu
                                    </td>
                                    <td className="py-2.5 text-right font-bold text-gray-700">
                                        Rp 350.000
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIWAYAT GANTI BAN */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                            <PenTool size={16} className="text-blue-500" />{" "}
                            RIWAYAT GANTI BAN
                        </h3>
                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            TOTAL: {stats.qtyBan} Ban
                        </span>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left text-xs">
                            <thead className="text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100">
                                <tr>
                                    <th className="pb-2">Tanggal</th>
                                    <th className="pb-2">Posisi Ban</th>
                                    <th className="pb-2">Merk / Seri</th>
                                    <th className="pb-2 text-right">Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr>
                                    <td className="py-2.5 font-medium">
                                        20 Mei 2026
                                    </td>
                                    <td className="py-2.5 font-bold">
                                        Kanan Belakang (Luar)
                                    </td>
                                    <td className="py-2.5">Bridgestone EMSA</td>
                                    <td className="py-2.5 text-right font-bold text-gray-700">
                                        Rp 2.800.000
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 font-medium">
                                        20 Mei 2026
                                    </td>
                                    <td className="py-2.5 font-bold">
                                        Kiri Belakang (Luar)
                                    </td>
                                    <td className="py-2.5">Bridgestone EMSA</td>
                                    <td className="py-2.5 text-right font-bold text-gray-700">
                                        Rp 2.800.000
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
