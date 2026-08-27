import React, { useState } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
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
} from "lucide-react";

const DataItem = ({
    label,
    value,
    isBold = false,
    isBadge = false,
    badgeColor = "bg-gray-100 text-gray-700",
}) => (
    <div className="min-w-0 flex flex-col border-b border-gray-50 py-2 last:border-0">
        <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {label}
        </span>
        {isBadge ? (
            <span className={`inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-bold ${badgeColor}`}>
                {value || "-"}
            </span>
        ) : (
            <span className={`break-words text-xs text-gray-800 ${isBold ? "font-black" : "font-medium"}`}>
                {value || "-"}
            </span>
        )}
    </div>
);

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
        <div className={`shrink-0 rounded-lg p-2.5 sm:p-3 ${colorClass}`}>
            <Icon size={20} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{title}</p>
            <h4 className="break-words text-base font-black leading-tight text-gray-800 sm:text-lg">{value || "0"}</h4>
        </div>
    </div>
);

const formatRp = (angka) => `Rp ${Number(angka || 0).toLocaleString("id-ID")}`;
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
        className: "cursor-pointer transition-colors hover:bg-violet-50/70 focus-visible:bg-violet-50 focus-visible:outline-none",
        onClick: () => router.visit(href),
        onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.visit(href);
            }
        },
    };
};

export default function UnitDetail({ unitData, riwayatService = [], riwayatBan = [], riwayatPrimary = [], riwayatSecondary = [], aggregates = {}, vehicleCost = {} }) {
    const [activeTab, setActiveTab] = useState("spesifikasi");

    if (!unitData) return <div>Data tidak ditemukan...</div>;

    const stnkColor = unitData.status_stnk === "AKTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    const pajakColor = unitData.status_pajak === "AKTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    const kirColor = unitData.status_kir === "AKTIF" ? "bg-green-100 text-green-700" : unitData.status_kir === "EXPIRED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";

    return (
        <AdminLayout>
            <Head title={`Detail Unit - ${unitData.nopol}`} />

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div>
                    <div className="mb-2 flex flex-wrap items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <Link href="/biaya" className="hover:text-violet-600">BIAYA</Link>
                        <ChevronRight size={12} className="mx-1" />
                        <span className="text-gray-800">DETAIL UNIT</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/biaya" className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="flex min-w-0 flex-wrap items-center gap-2 text-xl font-black tracking-tight text-gray-800 sm:gap-3 sm:text-2xl">
                                {unitData.nopol} <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">{unitData.status}</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 2xl:gap-4">
                <StatCard title="Total Biaya Kendaraan" value={formatRp(vehicleCost.total)} icon={DollarSign} colorClass="bg-emerald-50 text-emerald-600" />
                <StatCard title="Biaya Legalitas" value={formatRp(vehicleCost.legalitasTotal)} icon={Calendar} colorClass="bg-cyan-50 text-cyan-600" />
                <StatCard title="Total Biaya Service" value={formatRp(aggregates.biayaService)} icon={Wrench} colorClass="bg-amber-50 text-amber-600" />
                <StatCard title="Total Biaya Ban" value={formatRp(aggregates.biayaBan)} icon={AlertCircle} colorClass="bg-rose-50 text-rose-600" />
                <StatCard title="Biaya Primary" value={formatRp(vehicleCost.primaryTotal)} icon={Truck} colorClass="bg-violet-50 text-violet-600" />
                <StatCard title="Biaya Secondary" value={formatRp(vehicleCost.secondaryTotal)} icon={MapPin} colorClass="bg-indigo-50 text-indigo-600" />
            </div>

            <div className="mb-6 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2">
                    <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50 px-3 pt-2 sm:px-6">
                        {["spesifikasi", "operasional", "legalitas"].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors sm:px-4 sm:text-xs ${activeTab === tab ? "rounded-t-lg border-violet-600 bg-violet-50/60 text-violet-700" : "border-transparent text-slate-400 hover:text-slate-700"}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 bg-white p-4 sm:p-6">
                        {activeTab === "spesifikasi" && (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                                <DataItem label="ID Database" value={unitData.id_key} />
                                <DataItem label="Tipe Unit" value={unitData.tipe} />
                                <DataItem label="Pabrikan" value={unitData.pabrikan} />
                                <DataItem label="Model" value={unitData.model} />
                                <DataItem label="Jenis Kendaraan" value={unitData.jenis} />
                                <DataItem label="No. Mesin" value={unitData.no_mesin} isBold />
                                <DataItem label="No. Rangka" value={unitData.no_rangka} isBold />
                                <DataItem label="Tahun Perakitan" value={unitData.tahun} />
                                <DataItem label="Tahun Pembelian" value={unitData.tahun_pembelian} />
                            </div>
                        )}
                        {activeTab === "operasional" && (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                                <DataItem label="Region" value={unitData.region} />
                                <DataItem label="Area Operasional" value={unitData.area} isBold />
                                <DataItem label="Area Asal" value={unitData.area_asal} />
                                <DataItem label="Driver Aktif" value={unitData.driver} isBold />
                                <DataItem label="Inventaris" value={unitData.inventaris} />
                                <DataItem label="Nama Project" value={unitData.project} />
                                <DataItem label="Distribusi" value={unitData.distribusi} isBadge badgeColor="bg-blue-100 text-blue-700" />
                                <DataItem label="My Pertamina" value={unitData.my_pertamina} />
                                <DataItem label="GPS Tracking" value={unitData.gps} />
                                <DataItem label="Ad-Hock" value={unitData.ad_hock} />
                            </div>
                        )}
                        {activeTab === "legalitas" && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="text-xs font-black text-gray-800">DATA STNK</h4>
                                    </div>
                                    <DataItem label="Status STNK" value={unitData.status_stnk} isBadge badgeColor={stnkColor} />
                                    <DataItem label="Jatuh Tempo" value={unitData.jatuh_tempo_stnk} isBold />
                                    <DataItem label="Sisa Masa Aktif" value={unitData.masa_aktif_stnk} />
                                    <DataItem label="No BPKB" value={unitData.no_bpkb} />
                                    <DataItem label="Keterangan" value={unitData.keterangan_stnk} />
                                </div>
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="text-xs font-black text-gray-800">DATA PAJAK</h4>
                                    </div>
                                    <DataItem label="Status Pajak" value={unitData.status_pajak} isBadge badgeColor={pajakColor} />
                                    <DataItem label="Jatuh Tempo" value={unitData.jatuh_tempo_pajak} isBold />
                                    <DataItem label="Sisa Masa Aktif" value={unitData.masa_aktif_pajak} />
                                </div>
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="text-xs font-black text-gray-800">DATA KIR</h4>
                                    </div>
                                    <DataItem label="Status KIR" value={unitData.status_kir} isBadge badgeColor={kirColor} />
                                    <DataItem label="Jatuh Tempo" value={unitData.jatuh_tempo_kir} isBold />
                                    <DataItem label="Sisa Masa Aktif" value={unitData.masa_aktif_kir} />
                                    <DataItem label="Ijin Muatan" value={unitData.ijin_muatan} />
                                    <DataItem label="Proses KEUR" value={unitData.keterangan_proses_keur} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-col gap-4 xl:gap-6">
                    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-800">
                            <DollarSign size={16} className="text-emerald-500" /> BIAYA KENDARAAN INI
                        </h3>
                        <p className="mb-4 text-xs font-semibold leading-5 text-gray-500">
                            Semua biaya diikat ke nopol unit ini, bukan dibaca sebagai kategori terpisah.
                        </p>
                        <div className="divide-y divide-gray-100">
                            {(vehicleCost.items || []).map((item) => (
                                <div key={item.key} className="py-3">
                                    <div className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-gray-800">{item.label}</p>
                                            <p className="mt-0.5 text-[10px] font-semibold text-gray-400">{item.count ? `${item.count} data` : "Belum ada biaya"}{item.date ? ` | ${item.date}` : ""}</p>
                                        </div>
                                        <p className="break-words text-xs font-black text-blue-600 sm:text-right">{formatRp(item.amount)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 rounded-lg bg-slate-950 px-4 py-3 text-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total beban unit</p>
                            <p className="mt-1 text-lg font-black">{formatRp(vehicleCost.total)}</p>
                        </div>
                    </div>

                    <div className="h-full min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-gray-800">
                            <MapPin size={16} className="text-emerald-500" /> KETERANGAN TAMBAHAN
                        </h3>
                        <p className="text-sm text-gray-600">{unitData.keterangan || "Tidak ada catatan tambahan untuk unit ini."}</p>
                    </div>
                </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 pb-10 2xl:grid-cols-2 2xl:gap-6">
                <div className="flex max-h-96 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex shrink-0 flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="flex items-center gap-2 text-sm font-black text-gray-800">
                            <Wrench size={16} className="text-amber-500" /> RIWAYAT SERVICE
                        </h3>
                        <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">TOTAL: {aggregates.qtyService}x</span>
                    </div>
                    <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
                        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-xs">
                            <thead className="sticky top-0 z-20 bg-gray-50 text-[10px] font-bold uppercase text-gray-500 shadow-[0_1px_0_#e5e7eb]">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Tanggal</th>
                                    <th scope="col" className="px-3 py-3">Jenis Pekerjaan / Keluhan</th>
                                    <th scope="col" className="px-4 py-3 text-right">Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {riwayatService.length > 0 ? riwayatService.map((rs) => (
                                    <tr key={rs.id_key} {...historyRowProps("/riwayat-service-unit/service-umum", rs.id_key)}>
                                        <td className="whitespace-nowrap px-4 py-2.5 font-medium">{rs.tanggal_services || "-"}</td>
                                        <td className="px-3 py-2.5">
                                            <span className="block font-bold text-gray-800">{rs.tipe_service || "Service Berkala"}</span>
                                            <span className="mt-0.5 block line-clamp-1 text-[10px] text-gray-500">{rs.keluhan || "-"}</span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold text-gray-700">{formatRp(rs.total_biaya_service)}</td>
                                    </tr>
                                )) : <tr><td colSpan="3" className="px-4 py-4 text-center text-gray-400">Belum ada riwayat service.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex max-h-96 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex shrink-0 flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="flex items-center gap-2 text-sm font-black text-gray-800"><PenTool size={16} className="text-blue-500" /> RIWAYAT GANTI BAN</h3>
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">TOTAL: {aggregates.qtyBan} Ban</span>
                    </div>
                    <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
                        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left text-xs">
                            <thead className="sticky top-0 z-20 bg-gray-50 text-[10px] font-bold uppercase text-gray-500 shadow-[0_1px_0_#e5e7eb]">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Tanggal</th>
                                    <th scope="col" className="px-3 py-3">Posisi Ban</th>
                                    <th scope="col" className="px-3 py-3">Merk / Seri</th>
                                    <th scope="col" className="px-4 py-3 text-right">Biaya</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {riwayatBan.length > 0 ? riwayatBan.map((rb) => (
                                    <tr key={rb.id_key} {...historyRowProps("/riwayat-service-unit/service-ban", rb.id_key)}>
                                        <td className="whitespace-nowrap px-4 py-2.5 font-medium">{rb.tanggal_ganti_ban || "-"}</td>
                                        <td className="px-3 py-2.5 font-bold">{rb.posisi || "-"}</td>
                                        <td className="px-3 py-2.5"><span className="block text-gray-800">{rb.jenis_ban || "-"}</span><span className="mt-0.5 block text-[10px] text-gray-500">{rb.tipe_ban || "-"}</span></td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold text-gray-700">{formatRp(rb.total_harga)}</td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="px-4 py-4 text-center text-gray-400">Belum ada riwayat ganti ban.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex max-h-96 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="flex items-center gap-2 text-sm font-black text-gray-800"><Truck size={16} className="text-blue-500" /> RIWAYAT PRIMARY</h3>
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">TOTAL: {aggregates.qtyPrimary || 0}x</span>
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
                                {riwayatPrimary.length > 0 ? riwayatPrimary.map((row, index) => (
                                    <tr key={`${row.id_key || "primary"}-${index}`} {...historyRowProps("/profit-unit/primary/table", row.id_key)}>
                                        <td className="whitespace-nowrap px-4 py-2.5 font-medium">{formatDate(row.tanggal_muat)}</td>
                                        <td className="px-3 py-2.5 font-bold text-gray-800">{row.area || "-"}</td>
                                        <td className="px-3 py-2.5 text-gray-600"><span className="block break-words">{[row.rute_asal, row.rute_tujuan].filter(Boolean).join(" - ") || "-"}</span>{row.jenis && <span className="mt-0.5 block text-[10px] text-gray-400">{row.jenis}</span>}</td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold text-gray-700">{formatRp(row.total_biaya)}</td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="py-4 text-center text-gray-400">Belum ada riwayat Primary.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex max-h-96 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col items-start gap-2 border-b border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                        <h3 className="flex items-center gap-2 text-sm font-black text-gray-800"><MapPin size={16} className="text-sky-500" /> RIWAYAT SECONDARY</h3>
                        <span className="rounded bg-sky-100 px-2 py-1 text-xs font-bold text-sky-700">TOTAL: {aggregates.qtySecondary || 0}x</span>
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
                                {riwayatSecondary.length > 0 ? riwayatSecondary.map((row, index) => (
                                    <tr key={`${row.id_key || "secondary"}-${index}`} {...historyRowProps("/profit-unit/secondary/table", row.id_key)}>
                                        <td className="whitespace-nowrap px-4 py-2.5 font-medium">{formatDate(row.tanggal)}</td>
                                        <td className="px-3 py-2.5 font-bold text-gray-800">{row.area || "-"}</td>
                                        <td className="px-3 py-2.5 text-gray-600"><span className="block break-words">{row.rute || "-"}</span><span className="mt-0.5 block text-[10px] text-gray-400">{[row.order_type, row.tipe_unit].filter(Boolean).join(" | ") || "-"}</span></td>
                                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-bold text-gray-700">{formatRp(row.total_biaya_operasional)}</td>
                                    </tr>
                                )) : <tr><td colSpan="4" className="py-4 text-center text-gray-400">Belum ada riwayat Secondary.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
