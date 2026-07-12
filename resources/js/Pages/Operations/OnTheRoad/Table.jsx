import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CircleDollarSign, Route, Truck } from "lucide-react";
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
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600"><Icon size={19} /></div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

export default function Table({ category, title, date, dateOptions = [], rows = [], summary = {}, tablePath, backHref }) {
    const isStandby = category === "standby";
    const changeDate = (value) => router.get(tablePath || `/on-the-road/${category}`, { tanggal: value }, { preserveScroll: true });
    const visitRow = (row) => {
        const href = row.detail_href || `/on-the-road/${category}/${row.id_key}`;
        if (!href || href.endsWith("/undefined") || href.endsWith("/null")) return;
        router.visit(href);
    };

    return (
        <AdminLayout>
            <Head title={`On The Road - ${title}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link href={backHref || `/on-the-road?tanggal=${encodeURIComponent(date)}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"><ArrowLeft size={19} /></Link>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">On The Road</p>
                                <h1 className="truncate text-xl font-black uppercase text-slate-950">{title}</h1>
                            </div>
                        </div>
                        <select value={date} onChange={(event) => changeDate(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                            {dateOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Unit" value={formatNumber(summary.count)} helper={isStandby ? "Unit standby" : "Unit berjalan"} icon={Truck} />
                    <StatCard title="Tarif" value={formatRp(summary.tarif)} helper="Total tarif/tagihan" icon={CircleDollarSign} />
                    <StatCard title="Biaya" value={formatRp(summary.biaya)} helper="Biaya operasional" icon={Route} />
                    <StatCard title="Profit" value={formatRp(summary.profit)} helper="Tarif dikurangi biaya" icon={CircleDollarSign} />
                </div>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Tabel {title}</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Row bisa diklik untuk membuka detail.</p>
                    </div>
                    <div className="custom-scrollbar max-h-[720px] overflow-auto">
                        <table className="w-full border-collapse text-left whitespace-nowrap">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr>
                                    {(isStandby
                                        ? ["Nopol", "Tipe", "Area", "Driver", "Project", "Status STNK", "Status Pajak", "Status KIR"]
                                        : ["Tanggal", "Project", "Nopol", "Tipe", "Area", "Driver", "Helper", "Rute", "Status", "Tarif", "Biaya", "Profit"]
                                    ).map((head) => <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">{head}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.length ? rows.map((row, index) => (
                                    <tr
                                        key={row.id_key || row.nopol || index}
                                        onClick={() => visitRow(row)}
                                        onKeyDown={(event) => {
                                            if (!["Enter", " "].includes(event.key)) return;
                                            event.preventDefault();
                                            visitRow(row);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className="cursor-pointer hover:bg-cyan-50/40 focus:bg-cyan-50/60 focus:outline-none"
                                    >
                                        {isStandby ? (
                                            <>
                                                <td className="px-4 py-3 text-xs font-black text-slate-950">{row.nopol || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tipe || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.area || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.driver || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.project || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.status_stnk || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.status_pajak || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.status_kir || "-"}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_normalized || row.tanggal || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.project || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-black text-slate-950">{row.nopol || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tipe_unit || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.area || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.driver || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.helper || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.rute || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.status || "-"}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.tagihan)}</td>
                                                <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.total_biaya_operasional)}</td>
                                                <td className="px-4 py-3 text-xs font-black text-blue-600">{formatRp(row.profit_trip)}</td>
                                            </>
                                        )}
                                    </tr>
                                )) : <tr><td colSpan={12} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Tidak ada data untuk tanggal ini.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
