import React, { memo, useState } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import {
    TrendingUp, Activity, Truck, FileText, MapPin, DollarSign,
    Clock, ArrowRight, ExternalLink, BarChart3, PieChart, Users,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell,
} from "recharts";

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

const formatNum = (value) => Number(value || 0).toLocaleString("id-ID");

const formatCompactRp = (value) => {
    const nominal = Number(value || 0);
    const absolute = Math.abs(nominal);

    if (absolute >= 1_000_000_000) {
        return `Rp${(nominal / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
    }

    if (absolute >= 1_000_000) {
        return `Rp${(nominal / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} jt`;
    }

    return `Rp${nominal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const CHART_COLORS = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"];

function pctColor(pct) {
    if (pct >= 70) return "#10b981";
    if (pct >= 40) return "#f59e0b";
    return "#ef4444";
}

function pctBg(pct) {
    if (pct >= 70) return "bg-emerald-500";
    if (pct >= 40) return "bg-amber-500";
    return "bg-red-500";
}

const StatCard = memo(function StatCard({ title, value, subtitle, icon: Icon, color = "cyan" }) {
    const colorMap = {
        cyan: "bg-cyan-500/10 text-cyan-600",
        emerald: "bg-emerald-500/10 text-emerald-600",
        orange: "bg-orange-500/10 text-orange-600",
        purple: "bg-purple-500/10 text-purple-600",
    };
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-wide text-slate-500">{title}</p>
                    <p className="text-2xl font-black text-slate-950">{value}</p>
                    {subtitle && <p className="text-xs font-semibold text-slate-400">{subtitle}</p>}
                </div>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${colorMap[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
});

const GaugeChart = memo(function GaugeChart({ value = 0, label = "Health Score", max = 100 }) {
    const pct = Math.min(value / max, 1);
    const r = 36;
    const circumference = 2 * Math.PI * r;
    const half = circumference / 2;
    const offset = half * (1 - pct);
    const color = pctColor(pct * 100);

    return (
        <div className="flex flex-col items-center">
            <svg width="130" height="90" viewBox="0 0 100 70">
                <path d="M8,58 A36,36 0 0,1 92,58" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                <path d="M8,58 A36,36 0 0,1 92,58" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${half} ${circumference}`} strokeDashoffset={offset} />
                <text x="50" y="54" textAnchor="middle" fontSize="18" fontWeight="900" fill="#0f172a">{Math.round(pct * 100)}%</text>
            </svg>
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        </div>
    );
});

const ComplianceBar = memo(function ComplianceBar({ label, value, total }) {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">{label}</span>
                <span className="font-black text-slate-900">{formatNum(value)} / {formatNum(total)}</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-all duration-500 ${pctBg(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <p className="text-right text-[11px] font-bold text-slate-500">{pct.toFixed(1)}%</p>
        </div>
    );
});

const DonutChart = memo(function DonutChart({ data = [], title, colors = CHART_COLORS }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <div className="flex flex-col items-center">
            <ResponsiveContainer width={180} height={180}>
                <RePieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                        {data.map((entry, i) => (
                            <Cell key={entry.name} fill={colors[i % colors.length]} />
                        ))}
                    </Pie>
                </RePieChart>
            </ResponsiveContainer>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {data.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
                        <span className="font-semibold text-slate-600">{d.name}</span>
                        <span className="font-black text-slate-900">{total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

const ActivityChart = memo(function ActivityChart({ dataByYear = [], years = [], title, description, baseRoute }) {
    const cy = new Date().getFullYear();
    const [tahun, setTahun] = useState(
        years.includes(cy) && dataByYear.find((d) => d.tahun === cy)?.months?.some((m) => m.value > 0)
            ? cy : (years[0] || cy)
    );
    const yearData = dataByYear.find((d) => d.tahun === tahun);
    const chartData = yearData?.months?.map((m) => ({ name: MONTHS[m.bulan - 1] || m.bulan, value: m.value })) || [];
    const maxVal = Math.max(...chartData.map((d) => d.value), 1);

    return (
        <div className="font-[Manrope]">
            <div className="mb-2 flex items-center justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{description}</p>
                </div>
                <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}
                    className="h-7 rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <div className="flex h-[160px] min-h-[160px] w-full min-w-0 items-stretch gap-1 border-b border-slate-200 pb-1 min-[360px]:h-[180px] min-[360px]:min-h-[180px]">
                {chartData.map((item, index) => {
                    const height = item.value > 0 ? Math.max((item.value / maxVal) * 100, 4) : 2;

                    return (
                        <button
                            key={item.name}
                            type="button"
                            title={`${item.name}: ${formatNum(item.value)} pengiriman`}
                            aria-label={`Buka data ${item.name} ${tahun}: ${formatNum(item.value)} pengiriman`}
                            onClick={() => router.visit(`${baseRoute}?bulan=${index + 1}&tahun=${tahun}`)}
                            className="group flex min-w-0 flex-1 flex-col justify-end gap-1.5 rounded-t px-0.5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-cyan-500"
                        >
                            <span className="relative flex min-h-0 flex-1 items-end">
                                <span
                                    className={`w-full rounded-t-sm transition-all duration-300 ${item.value > 0 ? "bg-cyan-500 group-hover:bg-cyan-600" : "bg-slate-200"}`}
                                    style={{ height: `${height}%` }}
                                />
                                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block group-focus-visible:block">
                                    {formatNum(item.value)} pengiriman
                                </span>
                            </span>
                            <span className="whitespace-nowrap text-[9px] font-bold text-slate-500 [overflow-wrap:normal]">
                                <span className="min-[360px]:hidden">{item.name.charAt(0)}</span>
                                <span className="hidden min-[360px]:inline">{item.name}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

export default function Performance({ dbChartData }) {
    const {
        pajak = [], stnk = [], kir = [], invoice = [],
        globalProfit = { revenue: 0, cost: 0, profit: 0, margin: 0 },
        profitByArea = [],
        areaHealth = [],
        primaryActivityByYear = [],
        primaryActivityYears = [],
        secondaryActivityByYear = [],
        secondaryActivityYears = [],
        recentActivity = [],
    } = dbChartData || {};

    const totalUnit = pajak.reduce((s, d) => s + d.value, 0);
    const totalInvoice = invoice.reduce((s, d) => s + d.value, 0);
    const marginPct = globalProfit.margin || 0;
    const areaCount = profitByArea.length;
    const pajakAktif = pajak.find((d) => d.name === "AKTIF")?.value || 0;
    const stnkAktif = stnk.find((d) => d.name === "AKTIF")?.value || 0;
    const kirAktif = kir.find((d) => d.name === "AKTIF")?.value || 0;
    const invoiceLunas = invoice.find((d) => d.key === "PAID")?.value || 0;

    const healthScore = totalUnit > 0
        ? Math.round(((pajakAktif / totalUnit) + (stnkAktif / totalUnit) + (kirAktif / totalUnit) + (marginPct / 100)) / 4 * 100)
        : 0;

    const topAreas = [...profitByArea].sort((a, b) => b.profit - a.profit).slice(0, 5);
    const topProfits = [...profitByArea].sort((a, b) => b.profit - a.profit).slice(0, 6);

    return (
        <AdminLayout>
            <Head title="Performance" />

            <div className="mb-6 grid gap-6 lg:grid-cols-2">

                <div className="rounded-xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Kinerja bisnis</h2>
                        <p className="mt-1 text-xs font-medium text-slate-500">Pendapatan, biaya, profit, dan margin secara global.</p>
                    </div>
                    <div className="p-5">
                        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(185px,1fr))] gap-3">
                            <div className="min-w-0 rounded-lg bg-cyan-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Revenue</p>
                                <p className="mt-1 break-words text-[clamp(0.875rem,1.35vw,1.125rem)] font-black leading-tight tabular-nums text-slate-950">{formatRp(globalProfit.revenue)}</p>
                            </div>
                            <div className="min-w-0 rounded-lg bg-emerald-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Profit</p>
                                <p className="mt-1 break-words text-[clamp(0.875rem,1.35vw,1.125rem)] font-black leading-tight tabular-nums text-slate-950">{formatRp(globalProfit.profit)}</p>
                            </div>
                            <div className="min-w-0 rounded-lg bg-orange-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Margin</p>
                                <p className="mt-1 text-[clamp(0.875rem,1.35vw,1.125rem)] font-black leading-tight tabular-nums text-slate-950">{marginPct.toFixed(1)}%</p>
                            </div>
                        </div>
                        {topAreas.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Profit per Area (Top 5)</p>
                                <div className="h-[140px] min-h-[140px] w-full min-w-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topAreas} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                            <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} tickFormatter={formatCompactRp} tickCount={3} minTickGap={18} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="area" tick={{ fontSize: 10, fontWeight: 700, fill: "#475569" }} axisLine={false} tickLine={false} width={80} />
                                            <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600 }}
                                                formatter={(val) => [formatRp(val), "Profit"]} />
                                            <Bar dataKey="profit" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={14} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Total Unit" value={formatNum(totalUnit)} subtitle="Unit terdaftar" icon={Truck} color="cyan" />
                    <StatCard title="Invoice Lunas" value={formatNum(invoiceLunas)} subtitle={`Dari ${formatNum(totalInvoice)} total invoice`} icon={FileText} color="emerald" />
                    <StatCard title="Area Aktif" value={formatNum(areaCount)} subtitle="Area operasional" icon={MapPin} color="orange" />
                    <StatCard title="Margin Global" value={`${marginPct.toFixed(1)}%`} subtitle="Rasio profit" icon={TrendingUp} color="purple" />
                </div>
            </div>

            <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-800">Kepatuhan dokumen</h3>
                    </div>
                    <div className="space-y-4">
                        <ComplianceBar label="Pajak Aktif" value={pajakAktif} total={totalUnit} />
                        <ComplianceBar label="STNK Aktif" value={stnkAktif} total={totalUnit} />
                        <ComplianceBar label="KIR Aktif" value={kirAktif} total={totalUnit} />
                        <ComplianceBar label="Invoice Lunas" value={invoiceLunas} total={totalInvoice} />
                    </div>
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <PieChart size={16} className="text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-800">Sebaran profit</h3>
                    </div>
                    {topProfits.length > 0 ? (
                        <DonutChart data={topProfits.map((d) => ({ name: d.area, value: Math.max(d.profit, 0) }))} title="Top 6 Area" colors={CHART_COLORS} />
                    ) : (
                        <p className="py-8 text-center text-xs font-semibold text-slate-400">Belum ada data</p>
                    )}
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-1 flex items-center gap-2">
                        <BarChart3 size={16} className="text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-800">Aktivitas bulanan</h3>
                    </div>
                    {primaryActivityByYear.length > 0 ? (
                        <ActivityChart dataByYear={primaryActivityByYear} years={primaryActivityYears}
                            title="Pengiriman" description="Per bulan" baseRoute="/profit-unit/primary/table" />
                    ) : (
                        <p className="py-8 text-center text-xs font-semibold text-slate-400">Belum ada data</p>
                    )}
                </div>

                <div className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-slate-500" />
                        <h3 className="text-sm font-bold text-slate-800">Skor kesehatan</h3>
                    </div>
                    <GaugeChart value={healthScore} label="Skor Kesehatan" />
                    <div className="mt-4 space-y-1.5 text-[11px] font-semibold text-slate-500">
                        <div className="flex justify-between"><span>Pajak</span><span>{totalUnit > 0 ? ((pajakAktif / totalUnit) * 100).toFixed(0) : 0}%</span></div>
                        <div className="flex justify-between"><span>STNK</span><span>{totalUnit > 0 ? ((stnkAktif / totalUnit) * 100).toFixed(0) : 0}%</span></div>
                        <div className="flex justify-between"><span>KIR</span><span>{totalUnit > 0 ? ((kirAktif / totalUnit) * 100).toFixed(0) : 0}%</span></div>
                        <div className="flex justify-between"><span>Margin</span><span>{marginPct.toFixed(1)}%</span></div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">

                <div className="rounded-xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-950">Kinerja per area</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Top 5 area berdasarkan profit</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-5 py-3 font-black uppercase tracking-wider text-slate-500">Area</th>
                                    <th className="px-3 py-3 font-black uppercase tracking-wider text-slate-500">Revenue</th>
                                    <th className="px-3 py-3 font-black uppercase tracking-wider text-slate-500">Cost</th>
                                    <th className="px-3 py-3 font-black uppercase tracking-wider text-slate-500">Profit</th>
                                    <th className="px-3 py-3 font-black uppercase tracking-wider text-slate-500">Margin</th>
                                    <th className="px-3 py-3 font-black uppercase tracking-wider text-slate-500">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topAreas.length > 0 ? topAreas.map((a, i) => {
                                    const areaMargin = a.revenue > 0 ? (a.profit / a.revenue) * 100 : 0;
                                    return (
                                        <tr key={a.area} className="border-b border-slate-50 transition hover:bg-slate-50/50">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full`} style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                                    <span className="font-bold text-slate-900">{a.area}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5 font-semibold text-slate-700">{formatRp(a.revenue)}</td>
                                            <td className="px-3 py-3.5 font-semibold text-slate-700">{formatRp(a.cost)}</td>
                                            <td className="px-3 py-3.5 font-black text-slate-900">{formatRp(a.profit)}</td>
                                            <td className="px-3 py-3.5 font-bold" style={{ color: areaMargin >= 0 ? "#10b981" : "#ef4444" }}>
                                                {areaMargin.toFixed(1)}%
                                            </td>
                                            <td className="px-3 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                                        <div className={`h-full rounded-full ${pctBg(areaMargin)}`}
                                                            style={{ width: `${Math.min(Math.abs(areaMargin), 100)}%` }} />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-slate-500">{a.records} record</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={6} className="px-5 py-10 text-center text-xs font-semibold text-slate-400">Belum ada data area</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-xl bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Aktivitas Terbaru</h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">5 record terakhir</p>
                        </div>
                        <Clock size={16} className="text-slate-400" />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {recentActivity.length > 0 ? recentActivity.map((act, i) => (
                            <div key={act.id_key || i} className="flex gap-4 px-5 py-3.5 transition hover:bg-slate-50/50">
                                <div className="flex flex-col items-center">
                                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white ${i === 0 ? "bg-emerald-500" : "bg-slate-300"}`} />
                                    {i < recentActivity.length - 1 && <div className="mt-1 h-full w-px bg-slate-200" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                        {act.area || "—"}
                                    </p>
                                    <p className="truncate text-xs font-semibold text-slate-500">
                                        {act.nopol || "—"} &bull; {act.tanggal || "—"}
                                    </p>
                                </div>
                                <ArrowRight size={14} className="mt-1 shrink-0 text-slate-300" />
                            </div>
                        )) : (
                            <p className="px-5 py-10 text-center text-xs font-semibold text-slate-400">Belum ada aktivitas</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
