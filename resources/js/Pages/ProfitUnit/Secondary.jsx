import React, { useEffect, useRef } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import Chart from "chart.js/auto";
import { ChevronRight, Eye, Filter, Lightbulb, Maximize2, RotateCcw, TrendingUp } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const COLORS = ["#2563eb", "#14b8a6", "#f97316", "#22c55e", "#e11d48", "#8b5cf6", "#0ea5e9", "#f59e0b"];

const fallbackFilterOptions = {
    "TIPE UNIT": ["ALL"],
    AREA: ["ALL"],
    WEEK: ["ALL"],
    BULAN: ["ALL"],
    TAHUN: ["ALL"],
    KATEGORI: ["ALL"],
};

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

function FilterSelect({ label, value, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                {label}
            </span>
            {options ? (
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type="date"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-cyan-100"
                />
            )}
        </label>
    );
}

function KpiRow({ label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
            <span className="text-xs font-bold text-slate-700">{label}</span>
            <span className="text-right text-sm font-black text-blue-600">{value}</span>
        </div>
    );
}

function ChartJsDoughnutCard({ title, helper, chartData, tooltipFormatter }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return undefined;

        const labels = chartData?.labels ?? [];
        const data = chartData?.data ?? [];
        const colors = chartData?.colors ?? COLORS;

        chartRef.current?.destroy();
        chartRef.current = new Chart(canvasRef.current, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{ data, backgroundColor: colors, borderColor: "#ffffff", borderWidth: 3, hoverOffset: 8 }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            boxWidth: 10,
                            boxHeight: 10,
                            padding: 14,
                            color: "#475569",
                            font: { size: 11, weight: 700 },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label || ""}: ${tooltipFormatter ? tooltipFormatter(context.raw || 0) : context.raw}`,
                        },
                    },
                },
            },
        });

        return () => chartRef.current?.destroy();
    }, [chartData, tooltipFormatter]);

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
            </div>
            <div className="p-5">
                <div className="mx-auto h-[280px] w-full max-w-[300px]">
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </section>
    );
}

function DecisionBox({ record, byArea, byType, topUnits }) {
    const topArea = byArea[0];
    const topType = byType[0];
    const topUnit = topUnits[0];
    const notes = [];

    if (topArea) notes.push(`${topArea.name} sedang memberi profit secondary paling besar: ${formatRp(topArea.profit)}.`);
    if (topType) notes.push(`Tipe ${topType.name} paling kuat kontribusinya. Cek dulu biaya jalannya sebelum volume dinaikkan.`);
    if (topUnit) notes.push(`Unit ${topUnit.nopol} terlihat paling menonjol di secondary. Bagus untuk dicek ritase dan beban operasionalnya.`);
    if (Number(record.count || 0) === 0) {
        notes.push("Data secondary belum masuk untuk filter ini. Coba longgarkan area, bulan, atau kategori.");
    } else {
        notes.push("Keputusan hari ini: jaga rute yang profitnya sehat, lalu cek biaya BBM, tol, dan biaya tambahan yang paling besar.");
    }

    return (
        <section className="rounded-xl border border-cyan-100 bg-white p-5 shadow-sm shadow-slate-950/5">
            <div className="mb-4 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                    <Lightbulb size={19} />
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Catatan kerja</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Poin singkat untuk menentukan apa yang dicek dulu.</p>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                {notes.slice(0, 4).map((note) => (
                    <div key={note} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                        {note}
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function Secondary({
    filters: initialFilters,
    record = {},
    byArea = [],
    byType = [],
    byYear = [],
    byRegional = [],
    topUnits = [],
    typeCompositionChart = { labels: [], data: [], colors: [] },
    typeValueChart = { labels: [], data: [], colors: [] },
    rataProfit,
    rataTarif,
    rataBiaya,
    kunjungan,
    filterOptions = fallbackFilterOptions,
}) {
    const defaultFilters = {
        "TIPE UNIT": "ALL",
        AREA: "ALL",
        HARI: "",
        WEEK: "ALL",
        BULAN: "ALL",
        TAHUN: "ALL",
        KATEGORI: "ALL",
    };

    const filters = initialFilters ?? defaultFilters;

    const applyFilter = (key, value) => {
        router.get("/profit-unit/secondary", { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        router.get("/profit-unit/secondary", defaultFilters, { preserveState: true, preserveScroll: true });
    };

    const kpiData = [
        { label: "TOTAL PROFIT SECONDARY", value: formatRp(record.profit) },
        { label: "TOTAL TARIF SECONDARY", value: formatRp(record.revenue) },
        { label: "TOTAL BIAYA SECONDARY", value: formatRp(record.cost) },
        { label: "RATA-RATA PROFIT", value: formatRp(rataProfit ?? 0) },
        { label: "RATA-RATA TARIF", value: formatRp(rataTarif ?? 0) },
        { label: "RATA-RATA BIAYA", value: formatRp(rataBiaya ?? 0) },
        { label: "JUMLAH RECORD", value: formatNumber(kunjungan ?? record.count) },
    ];

    return (
        <AdminLayout>
            <Head title="Profit Secondary" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/profit-unit" className="transition hover:text-cyan-600">Profit Unit</Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">Profit Secondary</span>
                </div>

                <div className="flex flex-col gap-6 xl:flex-row">
                    <div className="w-full shrink-0 xl:w-96">
                        <div className="space-y-6">
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-700">
                                        <TrendingUp size={15} />
                                        Profit Secondary
                                    </div>
                                    <h1 className="mt-4 text-2xl font-black text-slate-950">{formatRp(record.profit)}</h1>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                                        Profit secondary dari tarif, biaya jalan, area, dan tipe unit yang sudah masuk.
                                    </p>
                                    <Link
                                        href="/profit-unit/secondary/table"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700"
                                    >
                                        <Eye size={15} />
                                        Lihat Data Secondary
                                    </Link>
                                </div>
                                <div className="px-5">
                                    {kpiData.map((item) => <KpiRow key={item.label} label={item.label} value={item.value} />)}
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                                <div className="mb-5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                                            <Filter size={17} />
                                        </div>
                                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Saring Data</h2>
                                    </div>
                                    <button onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                                        <RotateCcw size={14} />
                                        Reset
                                    </button>
                                </div>

                                <div className="grid gap-4">
                                    <FilterSelect label="TIPE UNIT" value={filters["TIPE UNIT"]} options={filterOptions["TIPE UNIT"]} onChange={(value) => applyFilter("TIPE UNIT", value)} />
                                    <FilterSelect label="AREA" value={filters.AREA} options={filterOptions.AREA} onChange={(value) => applyFilter("AREA", value)} />
                                    <FilterSelect label="HARI" value={filters.HARI} onChange={(value) => applyFilter("HARI", value)} />
                                    <FilterSelect label="WEEK" value={filters.WEEK} options={filterOptions.WEEK} onChange={(value) => applyFilter("WEEK", value)} />
                                    <FilterSelect label="BULAN" value={filters.BULAN} options={filterOptions.BULAN} onChange={(value) => applyFilter("BULAN", value)} />
                                    <FilterSelect label="TAHUN" value={filters.TAHUN} options={filterOptions.TAHUN} onChange={(value) => applyFilter("TAHUN", value)} />
                                    <FilterSelect label="KATEGORI" value={filters.KATEGORI} options={filterOptions.KATEGORI} onChange={(value) => applyFilter("KATEGORI", value)} />
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Unit penyumbang terbesar</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Unit dengan profit secondary paling besar.</p>
                                </div>
                                <div className="divide-y divide-slate-100 px-5">
                                    {topUnits.length ? topUnits.map((unit) => (
                                        <div key={`${unit.nopol}-${unit.area}-${unit.tipe}`} className="flex items-center justify-between gap-3 py-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-black text-slate-900">{unit.nopol}</p>
                                                <p className="truncate text-[11px] font-semibold text-slate-500">{unit.area} - {unit.tipe}</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="text-right text-sm font-black text-blue-600">{formatRp(unit.profit)}</span>
                                                <Link href={`/profit-unit/secondary/table?nopol=${encodeURIComponent(unit.nopol)}&area=${encodeURIComponent(unit.area)}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-700">
                                                    <Eye size={15} />
                                                </Link>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-5 text-sm font-semibold text-slate-500">Belum ada unit yang cocok dengan filter ini.</div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <DecisionBox record={record} byArea={byArea} byType={byType} topUnits={topUnits} />

                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Profit Secondary per Area</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">{byArea.length} area ditampilkan</p>
                                </div>
                                <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                    <Maximize2 size={14} />
                                    Expand
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="h-[380px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={byArea} layout="vertical" margin={{ top: 6, right: 30, left: 92, bottom: 6 }} barCategoryGap="20%">
                                            <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" tickFormatter={(v) => Number(v || 0).toLocaleString("id-ID")} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} width={92} />
                                            <Tooltip formatter={(value) => formatRp(value)} />
                                            <Bar dataKey="profit" name="Profit Secondary" fill="#2563eb" maxBarSize={22} isAnimationActive={false} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <ChartJsDoughnutCard title="Komposisi tipe unit" helper="Perbandingan jumlah record per tipe unit." chartData={typeCompositionChart} tooltipFormatter={(value) => `${formatNumber(value)} record`} />
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Profit per tahun</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Tren profit secondary yang tersedia di data.</p>
                                </div>
                                <div className="p-5">
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={byYear} margin={{ top: 10, right: 16, left: 12, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                                                <YAxis tickFormatter={(v) => Number(v || 0).toLocaleString("id-ID")} tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                                <Tooltip formatter={(value) => formatRp(value)} />
                                                <Bar dataKey="profit" name="Profit Secondary" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={54} isAnimationActive={false} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <ChartJsDoughnutCard title="Nilai profit per tipe" helper="Melihat tipe unit mana yang paling banyak membawa profit secondary." chartData={typeValueChart} tooltipFormatter={formatRp} />
                            <ChartJsDoughnutCard
                                title="Sebaran profit per regional"
                                helper="Membantu membaca wilayah yang paling aktif menghasilkan secondary."
                                chartData={{
                                    labels: byRegional.map((item) => item.name),
                                    data: byRegional.map((item) => Number(item.profit || 0)),
                                    colors: byRegional.map((_, index) => COLORS[index % COLORS.length]),
                                }}
                                tooltipFormatter={formatRp}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
