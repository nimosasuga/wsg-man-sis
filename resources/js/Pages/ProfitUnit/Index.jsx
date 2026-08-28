import React, { useMemo, useState, useEffect } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
    ChevronRight,
    RefreshCw,
    TrendingUp,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
})}`;

const formatCompactRp = (value) => {
    const nominal = Number(value || 0);
    const absolute = Math.abs(nominal);
    if (absolute >= 1_000_000_000) return `Rp${(nominal / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
    if (absolute >= 1_000_000) return `Rp${(nominal / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
    return formatRp(nominal);
};

const fmtTimestamp = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} • ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
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
        chart: "#2563eb",
    },
    secondary: {
        short: "Secondary",
        source: "operasional_secondary_input",
        accent: "text-violet-700",
        icon: "bg-violet-600",
        soft: "bg-violet-50",
        line: "bg-violet-500",
        chart: "#7c3aed",
    },
    rental: {
        short: "Rental",
        source: "operasional_rental_unit_input",
        accent: "text-amber-700",
        icon: "bg-amber-500",
        soft: "bg-amber-50",
        line: "bg-amber-500",
        chart: "#d97706",
    },
    lcl: {
        short: "LCL",
        source: "db_chargo_data_paket_masuk",
        accent: "text-emerald-700",
        icon: "bg-emerald-600",
        soft: "bg-emerald-50",
        line: "bg-emerald-500",
        chart: "#059669",
    },
};

const getConfig = (item) => moduleConfig[item.slug] || moduleConfig.primary;
const hasCostFormula = (item) => !["rental", "lcl"].includes(item.slug);

const marginOf = (item) => {
    if (!hasCostFormula(item)) return null;
    const revenue = Number(item.revenue || 0);
    if (revenue <= 0) return null;
    return (Number(item.profit || 0) / revenue) * 100;
};

const statusOf = (item) => (Number(item.profit || 0) < 0 ? "Perhatian" : "Normal");

function KpiCard({ label, value, sub, accent }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`mt-1.5 truncate text-xl font-black tabular-nums text-slate-950 ${accent || ""}`}>{value}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">{sub}</p>
        </div>
    );
}

function ComparisonChart({ rows }) {
    const data = useMemo(
        () => [...rows]
            .sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0))
            .map((item) => ({
                slug: item.slug,
                name: getConfig(item).short,
                profit: Number(item.profit || 0),
            })),
        [rows],
    );

    if (data.length === 0) return null;

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-violet-700">Perbandingan</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Profit per Modul</h2>
                </div>
                <p className="text-xs font-semibold text-slate-500">Hanya perbandingan visual, bukan total gabungan</p>
            </div>
            <div className="mt-4 w-full min-w-0" style={{ height: data.length * 52 + 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={84}
                            tick={{ fontSize: 11, fontWeight: 700, fill: "#475569" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(148,163,184,0.12)" }}
                            contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600 }}
                            formatter={(val) => [formatRp(val), "Profit"]}
                        />
                        <Bar dataKey="profit" radius={[0, 6, 6, 0]} barSize={20}>
                            {data.map((d) => (
                                <Cell key={d.slug} fill={moduleConfig[d.slug].chart} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

function ModuleCard({ item }) {
    const config = getConfig(item);
    const hasCost = hasCostFormula(item);
    const profit = Number(item.profit || 0);
    const margin = marginOf(item);

    return (
        <Link key={item.slug} href={categoryHref(item)} className="group block min-w-0">
            <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70">
                <div className={`absolute inset-x-0 top-0 h-1 ${config.line}`} />
                <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-extrabold ${config.soft} ${config.accent}`}>
                        <span className={`grid h-4 w-4 shrink-0 place-items-center rounded text-white ${config.icon}`}><TrendingUp size={11} strokeWidth={2.5} /></span>
                        <span className="truncate">{item.title}</span>
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold text-slate-400">{Number(item.count || 0).toLocaleString("id-ID")} record</span>
                </div>

                <p className="mt-3 text-[9px] font-extrabold uppercase tracking-wide text-slate-500">Net Profit</p>
                <p title={formatRp(profit)} className="mt-0.5 whitespace-nowrap text-[clamp(1.1rem,1.6vw,1.4rem)] font-black leading-tight tracking-tight text-slate-950">{formatRp(profit)}</p>

                {hasCost ? (
                    <>
                        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                            <div className="min-w-0">
                                <p className="text-[8px] font-extrabold uppercase leading-3 text-slate-500">Revenue</p>
                                <p title={formatRp(item.revenue)} className="mt-0.5 whitespace-nowrap text-[10px] font-bold tabular-nums text-slate-700">{formatRp(item.revenue)}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[8px] font-extrabold uppercase leading-3 text-slate-500">Cost</p>
                                <p title={formatRp(item.cost)} className="mt-0.5 whitespace-nowrap text-[10px] font-bold tabular-nums text-slate-700">{formatRp(item.cost)}</p>
                            </div>
                        </div>
                        <p className="mt-2 text-[10px] font-bold tabular-nums text-slate-500">Margin {margin === null ? "-" : `${margin.toFixed(2)}%`}</p>
                    </>
                ) : (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                        <p className="text-[8px] font-extrabold uppercase leading-3 text-slate-500">{item.revenueLabel || "Revenue"}</p>
                        <p title={formatRp(item.revenue)} className="mt-0.5 whitespace-nowrap text-[10px] font-bold tabular-nums text-slate-700">{formatRp(item.revenue)}</p>
                        <p className="mt-2 text-[10px] font-semibold text-slate-400">Biaya tidak dihitung</p>
                    </div>
                )}

                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-700 group-hover:text-slate-950">
                    Lihat Detail <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </span>
            </article>
        </Link>
    );
}

function AnalysisTable({ rows }) {
    const desktop = (
        <div className="hidden md:block">
            <table className="w-full border-collapse text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <tr>
                        <th className="px-5 py-3">Modul</th>
                        <th className="px-5 py-3 text-right">Record</th>
                        <th className="px-5 py-3 text-right">Margin</th>
                        <th className="px-5 py-3 text-right">Profit</th>
                        <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((item) => {
                        const config = getConfig(item);
                        const margin = marginOf(item);
                        const status = statusOf(item);
                        const isAlert = status === "Perhatian";
                        return (
                            <tr key={item.slug} className="hover:bg-slate-50/60">
                                <td className="px-5 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-extrabold ${config.soft} ${config.accent}`}>{item.title}</span></td>
                                <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-slate-600">{Number(item.count || 0).toLocaleString("id-ID")}</td>
                                <td className="px-5 py-4 text-right text-sm font-bold tabular-nums text-slate-700">{margin === null ? "-" : `${margin.toFixed(2)}%`}</td>
                                <td className="px-5 py-4 text-right text-sm font-black tabular-nums text-slate-950">{formatRp(item.profit)}</td>
                                <td className="px-5 py-4 text-right">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${isAlert ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                        {isAlert ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />} {status}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const mobile = (
        <div className="space-y-3 md:hidden">
            {rows.map((item) => {
                const config = getConfig(item);
                const margin = marginOf(item);
                const status = statusOf(item);
                const isAlert = status === "Perhatian";
                return (
                    <div key={item.slug} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-extrabold ${config.soft} ${config.accent}`}>{item.title}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${isAlert ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                                {isAlert ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />} {status}
                            </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                            <div>
                                <p className="text-[9px] font-extrabold uppercase text-slate-500">Record</p>
                                <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-700">{Number(item.count || 0).toLocaleString("id-ID")}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-extrabold uppercase text-slate-500">Margin</p>
                                <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-700">{margin === null ? "-" : `${margin.toFixed(2)}%`}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-extrabold uppercase text-slate-500">Profit</p>
                                <p className="mt-0.5 whitespace-nowrap text-sm font-black tabular-nums text-slate-950">{formatCompactRp(item.profit)}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-violet-700">Detail &amp; Analisis</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Ringkasan Modul</h2>
            </div>
            {desktop}
            {mobile}
        </section>
    );
}

export default function Index({ summaryData = [] }) {
    const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
    const recordTotal = useMemo(() => summaryData.reduce((total, item) => total + Number(item.count || 0), 0), [summaryData]);
    const topProfit = useMemo(() => [...summaryData].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0))[0] || null, [summaryData]);
    const topRecord = useMemo(() => [...summaryData].sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0] || null, [summaryData]);

    useEffect(() => setLastUpdated(new Date().toISOString()), [summaryData]);

    const reload = () => router.reload({ only: ["summaryData"], onSuccess: () => setLastUpdated(new Date().toISOString()) });

    return (
        <AdminLayout>
            <Head title="Profit Unit" />

            <div className="mb-5 flex items-center text-xs font-bold tracking-wide text-slate-500">
                <span>Profit Unit</span>
                <ChevronRight size={14} className="mx-1" />
                <span className="text-slate-900">Ringkasan</span>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-extrabold tracking-wide text-violet-700">
                        <TrendingUp size={15} /> PROFIT UNIT
                    </div>
                    <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.2rem)] font-black tracking-tight text-slate-950">Ringkasan performa profit per modul</h1>
                    <p className="mt-1.5 text-sm font-medium text-slate-500">
                        Primary, Secondary, Rental, dan LCL dibaca menurut formula AppSheet masing-masing.
                    </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <button type="button" onClick={reload} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-slate-800">
                        <RefreshCw size={16} /> Muat ulang
                    </button>
                    <p className="text-[11px] font-semibold text-slate-400">Terakhir diperbarui: {fmtTimestamp(lastUpdated)}</p>
                </div>
            </div>

            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard label="Total Record" value={recordTotal.toLocaleString("id-ID")} sub="Seluruh modul" />
                {topProfit && (
                    <KpiCard
                        label="Profit Tertinggi"
                        value={formatCompactRp(topProfit.profit)}
                        sub={getConfig(topProfit).short}
                        accent={getConfig(topProfit).accent}
                    />
                )}
                {topRecord && (
                    <KpiCard
                        label="Record Terbanyak"
                        value={Number(topRecord.count || 0).toLocaleString("id-ID")}
                        sub={`${getConfig(topRecord).short} record`}
                    />
                )}
            </section>

            <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <ComparisonChart rows={summaryData} />
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-violet-700">Catatan Formula</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Dasar Perhitungan</h2>
                    <ul className="mt-4 space-y-3">
                        {summaryData.map((item) => (
                            <li key={item.slug} className="border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                                <p className={`text-sm font-extrabold ${getConfig(item).accent}`}>{item.title}</p>
                                <p className="mt-0.5 text-xs leading-5 text-slate-500">{item.formulaNote || "-"}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {summaryData.map((item) => <ModuleCard key={item.slug} item={item} />)}
            </section>

            <AnalysisTable rows={summaryData} />
        </AdminLayout>
    );
}
