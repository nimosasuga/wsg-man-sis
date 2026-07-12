import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CheckSquare, Clock, FileText, RotateCcw, Search } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

function StatCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
                    <p className="mt-2 break-words text-2xl font-black text-slate-950">{value}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

function StatusPill({ status }) {
    const tone = status === "SUBMIT"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tone}`}>{status || "-"}</span>;
}

export default function Outstanding({ rows = [], summary = {}, filters = {}, filterOptions = {} }) {
    const [search, setSearch] = useState(filters.search || "");
    const [status, setStatus] = useState(filters.status || "ALL");
    const [divisi, setDivisi] = useState(filters.divisi || "ALL");
    const [regional, setRegional] = useState(filters.regional || "ALL");

    const topNotes = useMemo(() => {
        if (!rows.length) return ["Belum ada data outstanding untuk filter ini."];
        const first = rows[0];
        return [
            `${summary.totalShown} data sedang menunggu keputusan. Mulai dari status RE-CHECK karena biasanya ada hal yang perlu dibereskan dulu.`,
            `Nominal yang sedang antre sekitar ${formatRp(summary.paymentAmount)}. Jangan hanya lihat nominal besar, cek juga due date yang paling dekat.`,
            first?.no_invoice ? `Invoice terbaru di daftar ini: ${first.no_invoice}, vendor ${first.vendor_supplier || "-"}.` : "Data invoice terbaru belum lengkap.",
        ];
    }, [rows, summary]);

    const applyFilters = (event) => {
        event.preventDefault();
        router.get("/need-approval/outstanding", { search, status, divisi, regional }, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setSearch("");
        setStatus("ALL");
        setDivisi("ALL");
        setRegional("ALL");
        router.get("/need-approval/outstanding", {}, { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="Inputan Data Outstanding" />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link href="/need-approval" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50">
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Need Approval</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">Inputan Data Outstanding</h1>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Ditampilkan" value={formatNumber(summary.totalShown)} helper="Data sesuai filter aktif" icon={FileText} />
                    <StatCard title="Submit" value={formatNumber(summary.submitCount)} helper="Menunggu keputusan" icon={Clock} />
                    <StatCard title="Re-Check" value={formatNumber(summary.recheckCount)} helper="Perlu dicek ulang" icon={CheckSquare} />
                    <StatCard title="Nominal" value={formatRp(summary.paymentAmount)} helper="Total payment amount" icon={FileText} />
                </div>

                <section className="rounded-xl border border-cyan-100 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Catatan kerja</h2>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {topNotes.map((note) => (
                            <div key={note} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">{note}</div>
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-3 lg:grid-cols-[1fr_160px_190px_190px_auto_auto] lg:items-end">
                        <label>
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">Cari</span>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Invoice, vendor, rekening..." className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
                            </div>
                        </label>
                        {[["Status", status, setStatus, filterOptions.status], ["Divisi", divisi, setDivisi, filterOptions.divisi], ["Regional", regional, setRegional, filterOptions.regional]].map(([label, value, setter, options]) => (
                            <label key={label}>
                                <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
                                <select value={value} onChange={(event) => setter(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100">
                                    {(options || ["ALL"]).map((option) => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </label>
                        ))}
                        <button type="submit" className="h-11 rounded-lg bg-cyan-600 px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700">Terapkan</button>
                        <button type="button" onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50">
                            <RotateCcw size={15} />
                            Reset
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Tabel Outstanding Submit</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Klik baris untuk membuka detail invoice dan payment.</p>
                    </div>
                    <div className="custom-scrollbar max-h-[720px] overflow-auto">
                        <table className="w-full border-collapse text-left whitespace-nowrap">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr>
                                    {["Tanggal Invoice", "Due Date", "Days Left", "Regional", "Divisi", "No Invoice", "Vendor", "Invoice Amount", "PPN", "PPh", "Biaya Lainnya", "Payment Amount", "Rekening Tujuan", "Nama Penerima", "Status"].map((head) => (
                                        <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.length ? rows.map((row) => (
                                    <tr
                                        key={row.id_key}
                                        onClick={() => router.visit(`/need-approval/outstanding/${row.id_key}`)}
                                        onKeyDown={(event) => {
                                            if (!["Enter", " "].includes(event.key)) return;
                                            event.preventDefault();
                                            router.visit(`/need-approval/outstanding/${row.id_key}`);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className="cursor-pointer hover:bg-cyan-50/40 focus:bg-cyan-50/60 focus:outline-none"
                                    >
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_invoice || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.due_date || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.days_left ?? "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.regional || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.divisi || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.no_invoice || "-"}</td>
                                        <td className="max-w-sm px-4 py-3 text-xs font-semibold text-slate-600"><span className="block truncate">{row.vendor_supplier || "-"}</span></td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.invoice_amount)}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.ppn)}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.pph)}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.biaya_lainnya)}</td>
                                        <td className="px-4 py-3 text-xs font-black text-blue-600">{formatRp(row.payment_amount)}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.rekening_tujuan || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.nama_penerima || "-"}</td>
                                        <td className="px-4 py-3"><StatusPill status={row.status_pengajuan} /></td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={15} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Tidak ada data outstanding untuk filter ini.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
