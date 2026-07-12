import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowRight, CircleDollarSign, Map, Route, Truck } from "lucide-react";
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

function UnitCard({ item }) {
    return (
        <Link href={item.href} className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-200/80">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-cyan-700">{item.label}</p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">{formatNumber(item.count)}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">unit berjalan pada tanggal ini</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-cyan-600"><ArrowRight size={19} /></div>
            </div>
            <div className="mt-5 grid gap-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between gap-3"><span>Tarif</span><span className="font-black text-slate-950">{formatRp(item.tarif)}</span></div>
                <div className="flex justify-between gap-3"><span>Biaya</span><span className="font-black text-slate-950">{formatRp(item.biaya)}</span></div>
                <div className="flex justify-between gap-3"><span>Profit</span><span className="font-black text-blue-600">{formatRp(item.profit)}</span></div>
            </div>
        </Link>
    );
}

function Breakdown({ title, items = [] }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            <div className="mt-4 divide-y divide-slate-100">
                {items.length ? items.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center justify-between gap-3 py-3 transition hover:bg-cyan-50/60"
                    >
                        <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-blue-600">{formatNumber(item.value)}</p>
                            <ArrowRight size={15} className="text-slate-300" />
                        </div>
                    </Link>
                )) : <p className="py-4 text-sm font-semibold text-slate-500">Belum ada data.</p>}
            </div>
        </section>
    );
}

export default function Index({ date, dateOptions = [], summary = {}, cards = [], standbyHref, typeBreakdown = [], areaBreakdown = [], sampleRows = [] }) {
    const changeDate = (value) => router.get("/on-the-road", { tanggal: value }, { preserveScroll: true });

    return (
        <AdminLayout>
            <Head title="On The Road" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200"><Map size={15} /> On The Road</div>
                            <h1 className="mt-4 text-2xl font-black tracking-tight">Unit yang sedang jalan</h1>
                            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">Cek unit jalan, unit standby, tarif, biaya, dan profit untuk tanggal yang dipilih.</p>
                        </div>
                        <label className="block w-full max-w-xs">
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-400">Tanggal</span>
                            <select value={date} onChange={(event) => changeDate(event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-bold text-white outline-none">
                                {dateOptions.map((option) => <option key={option} value={option} className="text-slate-900">{option}</option>)}
                            </select>
                        </label>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatCard title="Total Unit" value={formatNumber(summary.totalUnit)} helper="Armada terdaftar" icon={Truck} />
                    <StatCard title="Unit Jalan" value={formatNumber(summary.runningCount)} helper="Masuk data jalan tanggal ini" icon={Route} />
                    <StatCard title="Unit Standby" value={formatNumber(summary.standbyCount)} helper="Belum muncul di data jalan" icon={Truck} />
                    <StatCard title="Total Tarif" value={formatRp(summary.totalTarif)} helper="Tagihan dari unit yang jalan" icon={CircleDollarSign} />
                    <StatCard title="Profit Hari Ini" value={formatRp(summary.totalProfit)} helper="Tarif dikurangi biaya" icon={CircleDollarSign} />
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                    {cards.map((item) => <UnitCard key={item.slug} item={item} />)}
                    <Link href={standbyHref} className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-200/80">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-cyan-700">UNIT STANDBY</p>
                                <h2 className="mt-2 text-3xl font-black text-slate-950">{formatNumber(summary.standbyCount)}</h2>
                                <p className="mt-1 text-xs font-semibold text-slate-500">unit siap jalan</p>
                            </div>
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-cyan-600"><ArrowRight size={19} /></div>
                        </div>
                    </Link>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <Breakdown title="Jenis Unit Yang Jalan Hari Ini" items={typeBreakdown} />
                    <Breakdown title="Area Unit Jalan" items={areaBreakdown} />
                </div>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Cuplikan Unit Jalan</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Beberapa data unit yang jalan pada tanggal ini.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-slate-50">
                                <tr>{["Tanggal", "Project", "Nopol", "Tipe", "Area", "Driver", "Rute", "Tarif", "Biaya", "Profit"].map((head) => <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">{head}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sampleRows.map((row) => (
                                    <tr key={row.id_key} className="hover:bg-cyan-50/40">
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_normalized || row.tanggal}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.project || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.nopol || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tipe_unit || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.area || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.driver || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.rute || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.tagihan)}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.total_biaya_operasional)}</td>
                                        <td className="px-4 py-3 text-xs font-black text-blue-600">{formatRp(row.profit_trip)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
