import React, { useMemo } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowDownRight,
    ArrowUpRight,
    ChevronRight,
    Database,
    Info,
    RefreshCw,
    TrendingUp,
} from "lucide-react";

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
})}`;

const formatCompactRp = (value) => {
    const nominal = Number(value || 0);
    const absolute = Math.abs(nominal);

    if (absolute >= 1_000_000_000) return `Rp${(nominal / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
    if (absolute >= 1_000_000) return `Rp${(nominal / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} jt`;

    return formatRp(nominal);
};

const categoryHref = (item) => ({
    primary: "/profit-unit/primary",
    secondary: "/profit-unit/secondary",
    rental: "/profit-unit/rental",
    lcl: "/profit-unit/lcl",
}[item.slug] || "#");

const moduleConfig = {
    primary: {
        short: "Primary",
        source: "operasional_primary_input",
        accent: "text-blue-700",
        icon: "bg-blue-600",
        soft: "bg-blue-50",
        line: "bg-blue-500",
    },
    secondary: {
        short: "Secondary",
        source: "operasional_secondary_input",
        accent: "text-violet-700",
        icon: "bg-violet-600",
        soft: "bg-violet-50",
        line: "bg-violet-500",
    },
    rental: {
        short: "Rental",
        source: "operasional_rental_unit_input",
        accent: "text-amber-700",
        icon: "bg-amber-500",
        soft: "bg-amber-50",
        line: "bg-amber-500",
    },
    lcl: {
        short: "LCL",
        source: "db_chargo_data_paket_masuk",
        accent: "text-emerald-700",
        icon: "bg-emerald-600",
        soft: "bg-emerald-50",
        line: "bg-emerald-500",
    },
};

const getConfig = (item) => moduleConfig[item.slug] || moduleConfig.primary;
const hasCostFormula = (item) => item.slug !== "rental";

function ProfitCard({ item }) {
    const config = getConfig(item);
    const profit = Number(item.profit || 0);
    const revenue = Number(item.revenue || 0);
    const cost = Number(item.cost || 0);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const hasCost = hasCostFormula(item);
    const positive = profit >= 0;

    return (
        <Link href={categoryHref(item)} className="group block min-w-0">
            <article className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
                <div className={`absolute inset-x-0 top-0 h-1 ${config.line}`} />
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-extrabold tracking-wide text-slate-500">{item.title}</p>
                        <p title={formatRp(profit)} className="mt-2 break-words text-[clamp(1.4rem,2.2vw,2rem)] font-black leading-tight tracking-tight text-slate-950">{formatCompactRp(profit)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">Nilai profit sesuai rumus</p>
                    </div>
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm ${config.icon}`}>
                        <TrendingUp size={21} strokeWidth={2.5} />
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className={`min-w-0 rounded-xl p-3 ${config.soft}`}>
                        <p className="text-[10px] font-extrabold leading-4 text-slate-500">{item.revenueLabel || "Nilai sumber"}</p>
                        <p title={formatRp(revenue)} className="mt-1 break-words text-sm font-black leading-tight text-slate-900">{formatCompactRp(revenue)}</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-extrabold leading-4 text-slate-500">{item.costLabel || "Biaya"}</p>
                        <p title={formatRp(cost)} className="mt-1 break-words text-sm font-black leading-tight text-slate-900">{hasCost ? formatCompactRp(cost) : "Tidak dihitung"}</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-bold">
                    {hasCost ? (
                        <span className={`inline-flex items-center gap-1 ${positive ? "text-emerald-600" : "text-rose-600"}`}>
                            {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            Margin {margin.toFixed(1)}%
                        </span>
                    ) : (
                        <span className={`inline-flex items-center gap-1 ${config.accent}`}>Nilai sumber AppSheet</span>
                    )}
                    <span className="shrink-0 text-slate-400">{Number(item.count || 0).toLocaleString("id-ID")} record</span>
                </div>
            </article>
        </Link>
    );
}

function ModuleComparison({ rows }) {
    const maximum = Math.max(...rows.map((item) => Math.abs(Number(item.profit || 0))), 1);

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold tracking-wide text-violet-700">PERBANDINGAN MODUL</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Pembacaan nilai antar modul</h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">Perbandingan visual per modul, bukan total gabungan.</p>
                </div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-extrabold text-violet-700"><Info size={14} /> Tidak dijumlahkan</span>
            </div>

            <div className="mt-6 space-y-4">
                {rows.map((item) => {
                    const config = getConfig(item);
                    const value = Math.abs(Number(item.profit || 0));
                    const width = Math.max((value / maximum) * 100, value > 0 ? 3 : 0);

                    return (
                        <div key={item.slug} className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)_150px] sm:items-center sm:gap-4">
                            <div className="flex items-center justify-between gap-2 sm:block">
                                <p className="text-sm font-black text-slate-800">{config.short}</p>
                                <p className="text-xs font-semibold text-slate-400">{Number(item.count || 0).toLocaleString("id-ID")} record</p>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full transition-all duration-500 ${config.line}`} style={{ width: `${width}%` }} />
                            </div>
                            <p title={formatRp(item.profit)} className="text-right text-sm font-black tabular-nums text-slate-950">{formatCompactRp(item.profit)}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default function Index({ summaryData = [] }) {
    const recordTotal = useMemo(() => summaryData.reduce((total, item) => total + Number(item.count || 0), 0), [summaryData]);

    return (
        <AdminLayout>
            <Head title="Profit Unit" />

            <div className="mb-5 flex items-center text-xs font-bold tracking-wide text-slate-500">
                <span>Profit Unit</span>
                <ChevronRight size={14} className="mx-1" />
                <span className="text-slate-900">Ringkasan</span>
            </div>

            <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-7">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-extrabold tracking-wide text-violet-700">
                            <TrendingUp size={15} /> PROFIT UNIT
                        </div>
                        <h1 className="mt-4 text-[clamp(1.7rem,3vw,2.45rem)] font-black tracking-tight text-slate-950">Ringkasan nilai per modul</h1>
                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">Primary, Secondary, Rental, dan LCL dibaca menurut formula AppSheet masing-masing. Gunakan kartu atau tabel untuk masuk ke rincian modul.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-[290px]">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-extrabold tracking-wide text-slate-500">MODUL AKTIF</p>
                            <p className="mt-1 text-2xl font-black text-slate-950">{summaryData.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[10px] font-extrabold tracking-wide text-slate-500">TOTAL RECORD</p>
                            <p className="mt-1 text-2xl font-black text-slate-950">{recordTotal.toLocaleString("id-ID")}</p>
                        </div>
                        <button type="button" onClick={() => router.reload({ only: ["summaryData"] })} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800">
                            <RefreshCw size={16} /> Muat ulang data
                        </button>
                    </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold leading-5 text-slate-500 lg:px-7">
Nilai setiap modul memakai formula AppSheet masing-masing, sehingga tidak dijumlahkan sebagai satu total gabungan. Baca keterangan pada tabel untuk dasar perhitungannya.
                </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryData.map((item) => <ProfitCard key={item.slug} item={item} />)}
            </section>

            <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
                <ModuleComparison rows={summaryData} />
                <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-cyan-200"><Database size={20} /></div>
                        <div>
                            <p className="text-xs font-extrabold tracking-wide text-cyan-200">SUMBER PERHITUNGAN</p>
                            <h2 className="mt-1 text-lg font-black">Formula tetap terpisah</h2>
                        </div>
                    </div>
                    <div className="mt-5 space-y-3">
                        {summaryData.map((item) => {
                            const config = getConfig(item);
                            return <div key={item.slug} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"><span className="text-sm font-bold">{config.short}</span><span className="min-w-0 truncate text-right text-xs font-semibold text-slate-300">{config.source}</span></div>;
                        })}
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-extrabold tracking-wide text-violet-700">RINGKASAN TABEL</p>
                        <h2 className="mt-1 text-lg font-black text-slate-950">Data profit per modul</h2>
                    </div>
                    <p className="text-xs font-semibold text-slate-500">Klik baris untuk membuka detail modul.</p>
                </div>
                <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full min-w-[1280px] border-collapse text-left">
                        <thead className="bg-slate-50 text-[10px] font-extrabold tracking-wide text-slate-500">
                            <tr>
                                <th className="px-5 py-3">MODUL</th>
                                <th className="px-5 py-3">SUMBER DATA</th>
                                <th className="px-5 py-3 text-right">TOTAL TARIF</th>
                                <th className="px-5 py-3 text-right">TOTAL BIAYA</th>
                                <th className="px-5 py-3 text-right">TOTAL PROFIT</th>
                                <th className="px-5 py-3 text-right">RECORD</th>
                                <th className="px-5 py-3">KETERANGAN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {summaryData.map((item) => {
                                const config = getConfig(item);
                                const href = categoryHref(item);
                                return (
                                    <tr key={item.slug} role="button" tabIndex={0} onClick={() => router.visit(href)} onKeyDown={(event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); router.visit(href); } }} className="cursor-pointer transition hover:bg-violet-50/50 focus:bg-violet-50 focus:outline-none">
                                        <td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-extrabold ${config.soft} ${config.accent}`}>{item.title}</span></td>
                                        <td className="px-5 py-4 text-xs font-semibold text-slate-500">{config.source}</td>
                                        <td className="px-5 py-4 text-right text-sm font-bold tabular-nums text-slate-700">{formatRp(item.revenue)}</td>
                                        <td className="px-5 py-4 text-right text-sm font-bold tabular-nums text-slate-700">{hasCostFormula(item) ? formatRp(item.cost) : "Tidak dihitung"}</td>
                                        <td className="px-5 py-4 text-right text-sm font-black tabular-nums text-slate-950">{formatRp(item.profit)}</td>
                                        <td className="px-5 py-4 text-right text-sm font-semibold text-slate-500">{Number(item.count || 0).toLocaleString("id-ID")}</td>
                                        <td className="px-5 py-4 text-xs font-medium leading-5 text-slate-500">{item.formulaNote || "-"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}
