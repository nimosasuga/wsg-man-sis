import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, CalendarDays, MapPin, Truck, FileText, DollarSign, Shield } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;

const formatTanggal = (value) => {
    if (!value) return "-";

    const parts = String(value).split("-");
    if (parts.length === 3) {
        return `${Number(parts[1])}/${Number(parts[0])}/${parts[2]}`;
    }

    return value;
};

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-900">{value || "-"}</p>
        </div>
    );
}

function DataItem({ label, value, isBold = false, isBadge = false, badgeColor = "bg-gray-100 text-gray-700" }) {
    return (
        <div className="flex min-w-0 flex-col border-b border-gray-50 py-2 last:border-0">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
            {isBadge ? (
                <span className={`inline-flex w-fit rounded px-2 py-0.5 text-[11px] font-bold ${badgeColor}`}>{value || "-"}</span>
            ) : (
                <span className={`break-words text-xs text-gray-800 ${isBold ? "font-black" : "font-medium"}`}>{value || "-"}</span>
            )}
        </div>
    );
}

function statusColor(status) {
    if (!status) return "bg-gray-100 text-gray-700";
    const upper = String(status).toUpperCase();
    if (upper === "AKTIF") return "bg-green-100 text-green-700";
    if (upper === "EXPIRED") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
}

export default function RentalDetail({ detail = {}, legalitas = {}, backUrl = "/profit-unit/rental/table" }) {
    const [activeTab, setActiveTab] = useState("stnk");
    return (
        <AdminLayout>
            <Head title={`Detail Rental - ${detail.nopol || detail.id_key || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href={backUrl}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                            title="Kembali"
                        >
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">
                                Tabel Profit Rental
                            </p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">
                                Detail Rental Unit
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200">
                                <Truck size={15} />
                                Unit Rental
                            </div>
                            <h2 className="mt-4 text-3xl font-black">{detail.nopol || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">
                                {detail.tipe || "-"} di area {detail.area || "-"}.
                            </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <CalendarDays size={15} />
                                Tanggal
                            </div>
                            <p className="mt-2 text-lg font-black">{formatTanggal(detail.tanggal)}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">{detail.week || "-"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <MapPin size={15} />
                                Nilai Sewa
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(detail.tarif_sewa_unit_bln)}</p>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-blue-950/40 p-4">
                            <p className="text-[11px] font-black uppercase tracking-wide text-blue-300">Pendapatan</p>
                            <p className="mt-1 text-xl font-black text-blue-300">{formatRp(detail.tarif_sewa_unit_bln)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-amber-950/40 p-4">
                            <p className="text-[11px] font-black uppercase tracking-wide text-amber-300">Biaya Legalitas</p>
                            <p className="mt-1 text-xl font-black text-amber-300">{formatRp(detail.biaya_legalitas)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-emerald-950/40 p-4">
                            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-300">Profit</p>
                            <p className="mt-1 text-xl font-black text-emerald-300">{formatRp((detail.tarif_sewa_unit_bln || 0) - (detail.biaya_legalitas || 0))}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                            Rincian Biaya
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Rincian pendapatan dan biaya dari record rental ini.
                        </p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2">
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Pendapatan (Tarif Sewa)</p>
                            <p className="mt-1 text-lg font-black text-blue-900">{formatRp(detail.tarif_sewa_unit_bln)}</p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Biaya Legalitas</p>
                            <p className="mt-1 text-lg font-black text-amber-900">{formatRp(detail.biaya_legalitas)}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Profit Bersih</p>
                                    <p className="mt-1 text-lg font-black text-emerald-900">{formatRp((detail.tarif_sewa_unit_bln || 0) - (detail.biaya_legalitas || 0))}</p>
                                </div>
                                <div className="text-right text-xs font-bold text-emerald-600">
                                    {(detail.tarif_sewa_unit_bln || 0) > 0
                                        ? `Margin ${((((detail.tarif_sewa_unit_bln || 0) - (detail.biaya_legalitas || 0)) / (detail.tarif_sewa_unit_bln || 1)) * 100).toFixed(1)}%`
                                        : "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {legalitas.stnk && (
                    <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-950">
                                <Shield size={16} className="text-cyan-600" />
                                Riwayat Legalitas Unit
                            </h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Status STNK, pajak, dan KIR untuk unit {detail.nopol}.
                            </p>
                        </div>
                        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-3 pt-2 sm:px-6">
                            {[
                                { key: "stnk", label: "STNK", icon: FileText },
                                { key: "pajak", label: "Pajak", icon: DollarSign },
                                { key: "kir", label: "KIR", icon: Shield },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors sm:px-4 sm:text-xs ${activeTab === tab.key ? "border-blue-600 bg-white text-blue-700" : "border-transparent text-slate-400 hover:text-slate-700"}`}
                                    >
                                        <Icon size={14} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="p-5">
                            {activeTab === "stnk" && (
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <h4 className="mb-4 text-xs font-black text-gray-800">DATA STNK</h4>
                                    <DataItem label="Status STNK" value={legalitas.stnk.status} isBadge badgeColor={statusColor(legalitas.stnk.status)} />
                                    <DataItem label="Jatuh Tempo" value={legalitas.stnk.jatuh_tempo} isBold />
                                    <DataItem label="Sisa Masa Aktif" value={legalitas.stnk.masa_aktif} />
                                    <DataItem label="No BPKB" value={legalitas.stnk.no_bpkb} />
                                    <DataItem label="Keterangan" value={legalitas.stnk.keterangan} />
                                </div>
                            )}
                            {activeTab === "pajak" && (
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <h4 className="mb-4 text-xs font-black text-gray-800">DATA PAJAK</h4>
                                    <DataItem label="Status Pajak" value={legalitas.pajak.status} isBadge badgeColor={statusColor(legalitas.pajak.status)} />
                                    <DataItem label="Jatuh Tempo" value={legalitas.pajak.jatuh_tempo} isBold />
                                    <DataItem label="Sisa Masa Aktif" value={legalitas.pajak.masa_aktif} />
                                </div>
                            )}
                            {activeTab === "kir" && (
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                    <h4 className="mb-4 text-xs font-black text-gray-800">DATA KIR</h4>
                                    <DataItem label="Status KIR" value={legalitas.kir.status} isBadge badgeColor={statusColor(legalitas.kir.status)} />
                                    <DataItem label="Jatuh Tempo" value={legalitas.kir.jatuh_tempo} isBold />
                                    <DataItem label="Sisa Masa Aktif" value={legalitas.kir.masa_aktif} />
                                    <DataItem label="Ijin Muatan" value={legalitas.kir.ijin_muatan} />
                                    <DataItem label="Proses KEUR" value={legalitas.kir.proses_keur} />
                                </div>
                            )}
                        </div>
                        <div className="mt-4 rounded-lg bg-slate-950 px-4 py-3 text-white">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Biaya Legalitas (dari rental)</p>
                            <p className="mt-1 text-lg font-black">{formatRp(detail.biaya_legalitas)}</p>
                        </div>
                    </section>
                )}

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                            Data Detail
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Ini data asli dari record rental yang dipilih.
                        </p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                        <InfoItem label="ID_KEY" value={detail.id_key} />
                        <InfoItem label="TANGGAL" value={formatTanggal(detail.tanggal)} />
                        <InfoItem label="AREA" value={detail.area} />
                        <InfoItem label="NOPOL" value={detail.nopol} />
                        <InfoItem label="TIPE UNIT" value={detail.tipe} />
                        <InfoItem label="TARIF_SEWA_UNIT_BLN" value={formatRp(detail.tarif_sewa_unit_bln)} />
                        <InfoItem label="BIAYA LEGALITAS" value={formatRp(detail.biaya_legalitas)} />
                        <InfoItem label="PROFIT TRIP" value={formatRp((detail.tarif_sewa_unit_bln || 0) - (detail.biaya_legalitas || 0))} />
                        <InfoItem label="WEEK" value={detail.week} />
                        <InfoItem label="TAHUN" value={detail.tahun} />
                        <InfoItem label="BULAN" value={detail.bulan} />
                        <InfoItem label="REGIONAL" value={detail.regional} />
                        <InfoItem label="NO_BAP" value={detail.no_bap} />
                        <InfoItem label="NO_PO" value={detail.no_po} />
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
