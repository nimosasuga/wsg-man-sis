import React, { useId, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, CheckCircle, ClipboardList, ChevronDown } from "lucide-react";
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

const monthLabels = {
    "01": "A Januari", "02": "B Februari", "03": "C Maret", "04": "D April",
    "05": "E Mei", "06": "F Juni", "07": "G Juli", "08": "H Agustus",
    "09": "I September", "10": "J Oktober", "11": "K November", "12": "L Desember",
};

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-900">{value || "-"}</p>
        </div>
    );
}

function KpiCard({ label, value, tone = "border-slate-200 bg-white" }) {
    return (
        <div className={`rounded-xl border p-4 shadow-sm ${tone}`}>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 whitespace-nowrap text-lg font-black tabular-nums text-slate-900">{value}</p>
        </div>
    );
}

function Badge({ children, tone = "bg-slate-100 text-slate-700" }) {
    return <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-bold ${tone}`}>{children}</span>;
}

function DataCompleteness({ detail }) {
    const required = [
        { key: "tanggal", label: "TANGGAL" },
        { key: "no_bap", label: "NO BAP" },
        { key: "no_po", label: "NO PO" },
        { key: "area", label: "AREA" },
        { key: "regional", label: "REGIONAL" },
        { key: "nopol", label: "NOPOL" },
        { key: "tipe", label: "TIPE" },
        { key: "tarif_sewa_unit_bln", label: "TARIF SEWA" },
    ];
    const missing = required.filter((f) => !detail[f.key] || String(detail[f.key]).trim() === "" || detail[f.key] === 0);
    const allOk = missing.length === 0;

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Data Completeness / Quality</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Kelengkapan field wajib dari RENTAL UNIT INPUT.</p>
            </div>
            <div className="p-5">
                {allOk ? (
                    <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
                        <CheckCircle size={16} /> Data utama lengkap
                    </div>
                ) : (
                    <div className="text-sm font-semibold text-amber-700">
                        <p className="mb-2">Data perlu dilengkapi:</p>
                        <ul className="list-disc list-inside space-y-1">
                            {missing.map((f) => <li key={f.key}>{f.label} kosong</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}

function CollapsibleSection({ title = "Data Mentah / Advanced", subtitle = "Opsional • Untuk audit/admin", children }) {
    const [open, setOpen] = useState(false);
    const contentId = useId();

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <button
                type="button"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() => setOpen((value) => !value)}
                className="flex min-h-[68px] w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
            >
                <span className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><ClipboardList size={16} /></span>
                    <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-950">
                            {title}
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black tracking-normal text-slate-500">Opsional</span>
                        </span>
                        <span className="mt-1 block text-xs font-semibold normal-case tracking-normal text-slate-500">{subtitle}</span>
                        <span className="mt-0.5 block text-xs font-semibold normal-case tracking-normal text-cyan-700">{open ? "Klik untuk menyembunyikan" : "Klik untuk melihat payload lengkap"}</span>
                    </span>
                </span>
                <ChevronDown size={20} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            <div id={contentId} hidden={!open} className="border-t border-slate-100">
                {children}
            </div>
        </section>
    );
}

export default function RentalDetail({ detail = {}, backUrl = "/profit-unit/rental/table" }) {
    const profit = Number(detail.tarif_sewa_unit_bln || 0) - Number(detail.biaya_legalitas || 0);
    const margin = Number(detail.tarif_sewa_unit_bln || 0) > 0
        ? ((profit / Number(detail.tarif_sewa_unit_bln)) * 100).toFixed(1) + "%"
        : "-";
    const profitTone = profit >= 0
        ? "border-emerald-200 bg-emerald-50"
        : "border-red-200 bg-red-50";
    const monthNum = String(detail.bulan || "").padStart(2, "0");
    const monthLabel = monthLabels[monthNum] || "-";

    return (
        <AdminLayout>
            <Head title={`Detail Profit Rental - ${detail.nopol || detail.id_key || ""}`} />

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
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Profit Unit</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">Detail Profit Rental</h1>
                        </div>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Ringkasan data rental unit dari operasional_rental_unit_input</p>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-slate-950">{detail.nopol || "-"}</h2>
                                <Badge tone="bg-cyan-100 text-cyan-700">RENTAL</Badge>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-slate-600">
                                {detail.tipe || "-"} • {detail.area || "-"} • {detail.regional ? detail.regional + " Regional" : "Regional -"}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Tanggal</p>
                                <p className="text-lg font-black">{formatTanggal(detail.tanggal)}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Week</p>
                                <p className="text-lg font-black">{detail.week || "-"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Bulan</p>
                                <p className="text-lg font-black">{monthLabel}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Tahun</p>
                                <p className="text-lg font-black">{detail.tahun || "-"}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard label="Tarif Sewa Bulanan" value={formatRp(detail.tarif_sewa_unit_bln)} tone="border-slate-200 bg-white text-blue-700" />
                    <KpiCard label="Profit Rental" value={formatRp(profit)} tone={profitTone} />
                    <KpiCard label="Margin" value={margin} tone="border-slate-200 bg-white text-slate-700" />
                    <KpiCard label="Biaya Legalitas (Existing)" value={formatRp(detail.biaya_legalitas)} tone="border-amber-100 bg-amber-50 text-amber-700" />
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Dokumen Transaksi Rental</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Identitas dokumen rental dari AppSheet RENTAL UNIT INPUT.</p>
                    </div>
                    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoItem label="NO BAP" value={detail.no_bap} />
                        <InfoItem label="NO PO" value={detail.no_po} />
                        <InfoItem label="ID Key" value={detail.id_key} />
                        <InfoItem label="Tanggal" value={formatTanggal(detail.tanggal)} />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Periode Rental</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Virtual columns dari AppSheet (WEEKNUM, YEAR, SWITCH MONTH).</p>
                    </div>
                    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                        <InfoItem label="TANGGAL" value={formatTanggal(detail.tanggal)} />
                        <InfoItem label="WEEK" value={detail.week || "-"} />
                        <InfoItem label="BULAN" value={monthLabel} />
                        <InfoItem label="TAHUN" value={detail.tahun || "-"} />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Ringkasan Finansial Rental</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Nilai sewa, biaya existing, dan profit sesuai logic Profit Unit existing.</p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-blue-700">Pendapatan / Nilai Sewa</p>
                            <p className="mt-1 text-lg font-black text-blue-900">{formatRp(detail.tarif_sewa_unit_bln)}</p>
                        </div>
                        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Biaya Legalitas (Existing)</p>
                            <p className="mt-1 text-lg font-black text-amber-900">{formatRp(detail.biaya_legalitas)}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Profit Rental</p>
                                    <p className="mt-1 text-lg font-black text-emerald-900">{formatRp(profit)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Margin</p>
                                    <p className="mt-1 text-lg font-black text-emerald-900">{margin}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <DataCompleteness detail={detail} />

                <CollapsibleSection>
                    <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                        {Object.entries(detail).map(([key, value]) => (
                            <InfoItem key={key} label={key} value={value === null || value === undefined || value === "" ? "-" : value} />
                        ))}
                    </div>
                </CollapsibleSection>
            </div>
        </AdminLayout>
    );
}