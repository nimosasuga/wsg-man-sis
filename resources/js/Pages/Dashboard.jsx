import React, { memo, useState, useEffect } from "react";
import AdminLayout from "../Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import {
    AlertTriangle, CheckCircle, Clock, FileText, Truck,
    ArrowUpRight, Activity,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const formatNum = (value) => Number(value || 0).toLocaleString("id-ID");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const COLORS_PALETTE = { AKTIF: "#16a34a", "HAMPIR EXPIRED": "#f59e0b", EXPIRED: "#ef4444" };
const STATUS_LABELS = { AKTIF: "Aktif", "HAMPIR EXPIRED": "Perlu diperhatikan", EXPIRED: "Lewat jatuh tempo" };

const pct = (val, total) => (total > 0 ? ((val / total) * 100).toFixed(1) : 0);

const ColorDot = memo(function ColorDot({ color }) {
    return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: color }} />;
});

const StatCard = memo(function StatCard({ icon: Icon, label, value, sub, color }) {
    const dot = { emerald: "bg-emerald-700/10 text-emerald-700", amber: "bg-amber-600/10 text-amber-600", rose: "bg-red-600/10 text-red-600", neutral: "bg-neutral-100 text-neutral-700" };
    return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-200/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${dot[color]}`}>
                <Icon size={17} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-wide text-slate-500">{label}</p>
                <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
                {sub && <p className="mt-0.5 text-xs font-medium text-slate-500">{sub}</p>}
            </div>
        </div>
    );
});

const MiniDonut = memo(function MiniDonut({ data = [], total, label, basePath, color }) {
    const [hovered, setHovered] = useState(null);
    const goToStatus = (status) => router.visit(`${basePath}?status=${encodeURIComponent(status)}`);
    const active = data.find((d) => d.name === "AKTIF")?.value || 0;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative">
                <ResponsiveContainer width={110} height={110}>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={34} outerRadius={50}
                            dataKey="value" paddingAngle={2}
                            activeIndex={hovered !== null ? data.findIndex((d) => d.name === hovered) : undefined}
                            activeShape={{ outerRadius: 54 }}
                            cursor="pointer"
                            onClick={(entry) => goToStatus(entry.name)}
                            onMouseEnter={(entry) => setHovered(entry.name)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            {data.map((entry) => <Cell key={entry.name} fill={COLORS_PALETTE[entry.name] || "#94a3b8"} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="text-xs font-bold text-neutral-900">{total}</p>
                </div>
            </div>
            <div className="w-full space-y-1">
                {data.map((item) => {
                    const c = COLORS_PALETTE[item.name] || "#94a3b8";
                    return (
                        <button key={item.name} onClick={() => goToStatus(item.name)}
                            onMouseEnter={() => setHovered(item.name)} onMouseLeave={() => setHovered(null)}
                            className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition ${
                                hovered === item.name ? "bg-neutral-100" : "hover:bg-neutral-50"
                            }`}
                        >
                            <ColorDot color={c} />
                            <span className="flex-1 text-[11px] font-medium text-neutral-500">{STATUS_LABELS[item.name] || item.name}</span>
                            <span className="text-[11px] font-bold text-neutral-900">{item.value}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

const ActivityChart = memo(function ActivityChart({ dataByYear = [], years = [], baseRoute }) {
    const cy = new Date().getFullYear();
    const [tahun, setTahun] = useState(
        years.includes(cy) && dataByYear.find((d) => d.tahun === cy)?.months?.some((m) => m.value > 0)
            ? cy : (years[0] || cy)
    );
    const yearData = dataByYear.find((d) => d.tahun === tahun);
    const chartData = yearData?.months?.map((m) => ({ name: MONTHS[m.bulan - 1] || m.bulan, value: m.value })) || [];
    const totalYear = chartData.reduce((s, d) => s + d.value, 0);
    const maxVal = Math.max(...chartData.map((d) => d.value), 1);

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-medium text-neutral-500">
                    Total: <span className="font-bold text-neutral-900">{formatNum(totalYear)}</span> pengiriman
                </p>
                <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}
                    className="h-8 rounded-md border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-600 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 6, right: 4, left: -16, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: "#737373" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, maxVal]} />
                    <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #e5e5e5", fontSize: 11, fontWeight: 600, boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}
                        formatter={(val) => [val, "Pengiriman"]} />
                    <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={22}
                        cursor="pointer" onClick={(entry, index) => router.visit(`${baseRoute}?bulan=${index + 1}&tahun=${tahun}`)} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});

const FAT_PALETTE = {
    "DITERIMA FAT": "#047857",
    "BELUM NAIK": "#d97706",
    "N/A": "#737373",
};

const FAT_LABELS = {
    "DITERIMA FAT": "Diterima",
    "BELUM NAIK": "Belum Naik",
    "N/A": "N/A",
};

const FatStatusCard = memo(function FatStatusCard({ title, icon: Icon, data: rawData, total: rawTotal, basePath, loading }) {
    const items = Array.isArray(rawData) ? rawData : [];
    const total = Number(rawTotal) || 0;
    const [hovered, setHovered] = useState(null);

    if (loading) {
        return (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex animate-pulse items-center gap-3 border-b border-neutral-200 px-5 py-4">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-neutral-200 text-neutral-400">
                        <Icon size={16} className="text-neutral-300" />
                    </div>
                    <div className="flex-1">
                        <div className="h-3 w-32 rounded bg-neutral-200" />
                        <div className="mt-2 h-2.5 w-20 rounded bg-neutral-100" />
                    </div>
                </div>
                <div className="space-y-3 p-5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
                            <div className="h-10 w-10 shrink-0 rounded-md bg-neutral-200" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="h-3 w-16 rounded bg-neutral-200" />
                                    <div className="h-3 w-8 rounded bg-neutral-100" />
                                </div>
                                <div className="mt-2 h-2 w-full rounded-sm bg-neutral-100" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!total || items.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-neutral-100 text-neutral-400">
                        <Icon size={16} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">{title}</h3>
                        <p className="mt-0.5 text-sm text-neutral-400">Belum ada data</p>
                    </div>
                </div>
            </div>
        );
    }

    const mainStatus = items[0]?.name || "";
    const tint = mainStatus === "DITERIMA FAT" || mainStatus === "LENGKAP" ? "emerald"
        : mainStatus === "BELUM NAIK" || mainStatus === "BELUM DIUPLOAD" ? "amber"
        : "indigo";
    const tintBg = tint === "emerald" ? "bg-emerald-50/40" : tint === "amber" ? "bg-amber-50/40" : "bg-indigo-50/40";

    const goToStatus = (status) => router.visit(`${basePath}?status=${encodeURIComponent(status)}`);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
                    <Icon size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">{total} dokumen tercatat</p>
                </div>
            </div>
            <div className="space-y-2 p-5 sm:p-6">
                {items.map((item) => {
                    const c = FAT_PALETTE[item.name] || "#737373";
                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                    const isHovered = hovered === item.name;
                    return (
                        <button key={item.name}
                            onClick={() => goToStatus(item.name)}
                            onMouseEnter={() => setHovered(item.name)}
                            onMouseLeave={() => setHovered(null)}
                            className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition ${
                                isHovered ? "bg-slate-100" : "hover:bg-slate-50"
                            }`}
                        >
                            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md text-xs font-bold transition ${
                                isHovered ? "scale-110" : ""
                            }`} style={{ backgroundColor: c + "25", color: c }}>
                                {item.value}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-neutral-600">{FAT_LABELS[item.name] || item.name}</span>
                                    <span className="text-sm font-bold text-neutral-900">{pct.toFixed(0)}%</span>
                                </div>
                                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-neutral-100">
                                    <div className="h-full rounded-sm transition-all duration-300"
                                        style={{ width: `${pct}%`, backgroundColor: c }} />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

export default function Dashboard({ dbChartData }) {
    const {
        pajak = [], stnk = [], kir = [],
        primaryActivityByYear = [], primaryActivityYears = [],
        secondaryActivityByYear = [], secondaryActivityYears = [],
    } = dbChartData || {};

    const [fatData, setFatData] = useState(null);
    const [fatLoading, setFatLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard/fat-status")
            .then((r) => r.json())
            .then((data) => {
                setFatData(data);
                setFatLoading(false);
            })
            .catch(() => {
                setFatData(null);
                setFatLoading(false);
            });
    }, []);

    const [tab, setTab] = useState("primary");

    const totalUnit = pajak.reduce((s, d) => s + d.value, 0);
    const pajakActive = pajak.find((d) => d.name === "AKTIF")?.value || 0;
    const stnkActive = stnk.find((d) => d.name === "AKTIF")?.value || 0;
    const kirActive = kir.find((d) => d.name === "AKTIF")?.value || 0;
    const totalExpired = [pajak, stnk, kir].reduce((s, arr) => s + (arr.find((d) => d.name === "EXPIRED")?.value || 0), 0);
    const totalHampir = [pajak, stnk, kir].reduce((s, arr) => s + (arr.find((d) => d.name === "HAMPIR EXPIRED")?.value || 0), 0);
    const totalDocEntries = totalUnit * 3;
    const totalActive = pajakActive + stnkActive + kirActive;
    const complianceRate = totalDocEntries > 0 ? Math.round((totalActive / totalDocEntries) * 100) : 0;

    // Overall status distribution across all docs
    const overallStatus = [
        { name: "AKTIF", value: totalActive },
        { name: "HAMPIR EXPIRED", value: totalHampir },
        { name: "EXPIRED", value: totalExpired },
    ];

    return (
        <AdminLayout>
            <Head title="Dashboard" />

            {/* ── Hero + Quick Stats ── */}
            <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="grid gap-5 p-5 lg:grid-cols-[1.3fr_1fr] lg:gap-8 lg:p-7">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">
                                <Activity size={13} /> Pusat kendali
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                                Periode berjalan
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                            Kendali operasional, dalam satu layar
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                            Lihat kondisi armada, kelengkapan dokumen, dan aktivitas pengiriman sebelum pekerjaan menumpuk.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {[
                                { label: "Fleet" },
                                { label: "Finance" },
                                { label: "Tax" },
                            ].map((b) => (
                                <span key={b.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                                    {b.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={Truck} label="Total Unit" value={formatNum(totalUnit)} sub="Unit terdaftar" color="neutral" />
                        <StatCard icon={CheckCircle} label={`Kepatuhan`} value={`${complianceRate}%`} sub={`${formatNum(totalActive)} dokumen aktif`} color="emerald" />
                        <StatCard icon={AlertTriangle} label="Expired" value={formatNum(totalExpired)} sub="Perlu tindakan segera" color="rose" />
                        <StatCard icon={Clock} label="Hampir Expired" value={formatNum(totalHampir)} sub="Jatuh tempo dekat" color="amber" />
                    </div>
                </div>
            </section>

            {/* ── Compliance Overview ── */}
            <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                            <FileText size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Kepatuhan dokumen armada</h2>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Status Pajak, STNK, dan KIR per unit
                            </p>
                        </div>
                    </div>
                    <div className="hidden items-center gap-1.5 text-xs font-medium text-neutral-500 sm:flex">
                        <ColorDot color={COLORS_PALETTE.AKTIF} /> {STATUS_LABELS.AKTIF}
                        <ColorDot color={COLORS_PALETTE["HAMPIR EXPIRED"]} /> {STATUS_LABELS["HAMPIR EXPIRED"]}
                        <ColorDot color={COLORS_PALETTE.EXPIRED} /> {STATUS_LABELS.EXPIRED}
                    </div>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="mb-3 text-center text-sm font-bold text-slate-800">Pajak kendaraan</p>
                        <MiniDonut data={pajak} total={totalUnit} basePath="/inventori/pajak" />
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="mb-3 text-center text-sm font-bold text-slate-800">STNK</p>
                        <MiniDonut data={stnk} total={totalUnit} basePath="/inventori/stnk" />
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                        <p className="mb-3 text-center text-sm font-bold text-slate-800">KIR</p>
                        <MiniDonut data={kir} total={totalUnit} basePath="/inventori/kir" />
                    </div>
                </div>
                <div className="border-t border-neutral-200 px-5 py-4">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Status Keseluruhan</span>
                        <div className="flex h-3 flex-1 overflow-hidden rounded-sm bg-neutral-100">
                            {overallStatus.map((item) => {
                                const w = totalDocEntries > 0 ? (item.value / totalDocEntries) * 100 : 0;
                                return w > 0 ? <div key={item.name} className="h-full transition-all" style={{ width: `${w}%`, backgroundColor: COLORS_PALETTE[item.name] || "#737373" }} /> : null;
                            })}
                        </div>
                        <div className="flex shrink-0 gap-3">
                            {overallStatus.map((item) => {
                                const w = totalDocEntries > 0 ? (item.value / totalDocEntries) * 100 : 0;
                                return (
                                    <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                                        <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: COLORS_PALETTE[item.name] || "#737373" }} />
                                        <span className="font-medium text-neutral-500">{STATUS_LABELS[item.name]}</span>
                                        <span className="font-bold text-neutral-900">{w.toFixed(0)}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAT Document Status ── */}
            <section className="mb-6 grid gap-6 lg:grid-cols-2">
                <FatStatusCard
                    title="FAT Document Primary"
                    icon={FileText}
                    data={fatData?.fatPrimaryStatus?.data || []}
                    total={fatData?.fatPrimaryStatus?.total || 0}
                    basePath="/business-control/fat-primary"
                    loading={fatLoading}
                />
                <FatStatusCard
                    title="FAT Document Secondary"
                    icon={FileText}
                    data={fatData?.fatSecondaryStatus?.data || []}
                    total={fatData?.fatSecondaryStatus?.total || 0}
                    basePath="/business-control/fat-secondary"
                    loading={fatLoading}
                />
            </section>

            {/* ── Activity Overview ── */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
                            <Activity size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Pergerakan pengiriman</h2>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                                Volume perjalanan per bulan
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                        <button onClick={() => setTab("primary")}
                            className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                                tab === "primary" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                            }`}
                        >Primary</button>
                        <button onClick={() => setTab("secondary")}
                            className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                                tab === "secondary" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                            }`}
                        >Secondary</button>
                    </div>
                </div>
                <div className="px-5 pb-5 pt-4">
                    {tab === "primary" ? (
                        <ActivityChart dataByYear={primaryActivityByYear} years={primaryActivityYears}
                            baseRoute="/profit-unit/primary/table" />
                    ) : (
                        <ActivityChart dataByYear={secondaryActivityByYear} years={secondaryActivityYears}
                            baseRoute="/profit-unit/secondary/table" />
                    )}
                </div>
            </section>
        </AdminLayout>
    );
}
