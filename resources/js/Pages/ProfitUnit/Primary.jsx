import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    PieChart,
    Pie,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChevronRight, Filter, Maximize2, RotateCcw, TrendingUp } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const DONUT_COLORS = [
    "#2563eb", "#14b8a6", "#f97316", "#22c55e", "#e11d48",
    "#8b5cf6", "#0ea5e9", "#f59e0b", "#64748b", "#db2777",
    "#84cc16", "#06b6d4",
];

const filterOptions = {
    "TIPE UNIT": ["ALL", "40 Ft", "Bak terbuka", "Banda", "Berau", "Box", "CDD", "CDE"],
    AREA: ["ALL", "AIR MOLEK", "BALIKPAPAN", "BATAM", "GORONTALO", "KUPANG", "SAMARINDA"],
    WEEK: ["ALL", "W31", "W32", "W33", "W34", "W35"],
    BULAN: ["ALL", "F Juni", "G Juli", "H Agustus", "I September"],
    TAHUN: ["ALL", "2024", "2025", "2026"],
    KATEGORI: ["ALL", "ON DEMAND", "FULL SERVICE", "PROJECT", "RENTAL"],
};

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function FilterSelect({ label, value, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                {label}
            </span>
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
        </label>
    );
}

function KpiRow({ label, value }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0">
            <span className="text-xs font-bold text-slate-700">{label}</span>
            <span className="text-sm font-black text-blue-600">{value}</span>
        </div>
    );
}

function DonutChartCard({ data }) {
    const [page, setPage] = useState(0);
    const perPage = 4;
    const totalPages = Math.ceil(data.length / perPage);
    const paginated = data.slice(page * perPage, (page + 1) * perPage);
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="mx-auto h-[260px] w-full shrink-0 lg:mx-0 lg:w-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={105}
                            dataKey="value"
                            paddingAngle={2}
                        >
                            {data.map((_, index) => (
                                <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRp(value)} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {paginated.map((item, index) => {
                        const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
                        return (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded"
                                    style={{
                                        backgroundColor:
                                            DONUT_COLORS[(page * perPage + index) % DONUT_COLORS.length],
                                    }}
                                />
                                <span className="font-semibold text-slate-600">{item.name}</span>
                                <span className="ml-auto font-black text-slate-900">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
                {totalPages > 1 && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="rounded px-1.5 py-0.5 transition hover:bg-slate-100 disabled:opacity-30"
                        >
                            Prev
                        </button>
                        <span>
                            {page + 1}/{totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            className="rounded px-1.5 py-0.5 transition hover:bg-slate-100 disabled:opacity-30"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Primary({
    filters: initialFilters,
    record = {},
    byArea = [],
    byType = [],
    sumProfit,
    rataProfit,
    rataTarif,
    rataBiaya,
    kunjungan,
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
        router.get("/profit-unit/primary", {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        router.get("/profit-unit/primary", defaultFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const kpiData = [
        { label: "TOTAL TARIF PRIMARY", value: formatRp(record.revenue) },
        { label: "TOTAL BIAYA PRIMARY", value: formatRp(record.cost) },
        { label: "TOTAL PROFIT PRIMARY", value: formatRp(record.profit) },
        { label: "TOTAL SUM PROFIT", value: formatRp(sumProfit ?? record.profit) },
        { label: "TOTAL RATA RATA PROFIT", value: formatRp(rataProfit ?? 0) },
        { label: "TOTAL RATA RATA TARIF PRIMARY", value: formatRp(rataTarif ?? record.revenue) },
        { label: "TOTAL RATA RATA BIAYA PRIMARY", value: formatRp(rataBiaya ?? record.cost) },
        { label: "TOTAL KUNJUNGAN PRIMARY", value: formatRp(kunjungan ?? 0) },
    ];

    return (
        <AdminLayout>
            <Head title="Profit Primary" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/profit-unit" className="transition hover:text-cyan-600">
                        Profit Unit
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">Profit Primary</span>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-700">
                                <TrendingUp size={15} />
                                Profit Record
                            </div>
                            <h1 className="mt-4 text-2xl font-black text-slate-950">
                                Analitik Profit Primary
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                                Ringkasan profit, biaya, tarif, area, dan tipe unit untuk kebutuhan
                                monitoring operasional.
                            </p>
                        </div>
                        <div className="grid w-full shrink-0 gap-3 sm:grid-cols-3 xl:w-auto xl:max-w-lg">
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                                    Total Tarif Primary
                                </p>
                                <p className="mt-2 break-words text-sm font-black text-blue-600">
                                    {formatRp(record.revenue)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                                    Total Biaya Primary
                                </p>
                                <p className="mt-2 break-words text-sm font-black text-blue-600">
                                    {formatRp(record.cost)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                                    Total Profit Primary
                                </p>
                                <p className="mt-2 break-words text-sm font-black text-blue-600">
                                    {formatRp(record.profit)}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="mb-5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                                <Filter size={17} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                    Filter Profit Record
                                </h2>
                                <p className="text-xs font-semibold text-slate-500">
                    Data dummy tersedia untuk pilihan list.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <FilterSelect
                            label="Tipe Unit"
                            value={filters["TIPE UNIT"]}
                            options={filterOptions["TIPE UNIT"]}
                            onChange={(value) => applyFilter("TIPE UNIT", value)}
                        />
                        <FilterSelect
                            label="Area"
                            value={filters.AREA}
                            options={filterOptions.AREA}
                            onChange={(value) => applyFilter("AREA", value)}
                        />
                        <label className="block">
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                                Hari
                            </span>
                            <input
                                type="date"
                                value={filters.HARI}
                                onChange={(event) => applyFilter("HARI", event.target.value)}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                            />
                        </label>
                        <FilterSelect
                            label="Week"
                            value={filters.WEEK}
                            options={filterOptions.WEEK}
                            onChange={(value) => applyFilter("WEEK", value)}
                        />
                        <FilterSelect
                            label="Bulan"
                            value={filters.BULAN}
                            options={filterOptions.BULAN}
                            onChange={(value) => applyFilter("BULAN", value)}
                        />
                        <FilterSelect
                            label="Tahun"
                            value={filters.TAHUN}
                            options={filterOptions.TAHUN}
                            onChange={(value) => applyFilter("TAHUN", value)}
                        />
                        <FilterSelect
                            label="Kategori"
                            value={filters.KATEGORI}
                            options={filterOptions.KATEGORI}
                            onChange={(value) => applyFilter("KATEGORI", value)}
                        />
                    </div>
                </section>

                <div className="flex flex-col gap-6 xl:flex-row">
                    <div className="w-full shrink-0 xl:w-80">
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                    PROFIT RECORD
                                </h2>
                            </div>
                            <div className="px-5">
                                {kpiData.map((item) => (
                                    <KpiRow key={item.label} label={item.label} value={item.value} />
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="flex-1 space-y-6">
                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                        TABEL PROFIT PRIMARY BY AREA
                                    </h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {byArea.length} data ditampilkan
                                    </p>
                                </div>
                                <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                    <Maximize2 size={14} />
                                    Expand
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={byArea}
                                            margin={{ top: 18, right: 18, left: 12, bottom: 90 }}
                                            barCategoryGap="28%"
                                        >
                                            <CartesianGrid vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                interval={0}
                                                height={100}
                                                tick={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    fill: "#64748b",
                                                }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={(v) =>
                                                    Number(v || 0).toLocaleString("id-ID")
                                                }
                                                tick={{
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    fill: "#64748b",
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip formatter={(value) => formatRp(value)} />
                                            <Bar
                                                dataKey="profit"
                                                name="SUM PROFIT"
                                                fill="#2563eb"
                                                maxBarSize={34}
                                                isAnimationActive={false}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                        VIEW PROFIT PRIMARY BY TIPE UNIT
                                    </h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {byType.length} data ditampilkan
                                    </p>
                                </div>
                                <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                    <Maximize2 size={14} />
                                    Expand
                                </button>
                            </div>
                            <div className="p-5">
                                <DonutChartCard data={byType} />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
