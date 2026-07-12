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
import { ChevronRight, Eye, Filter, Lightbulb, Maximize2, RotateCcw, Ship, TrendingUp } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const COLORS = ["#2563eb", "#14b8a6", "#f97316", "#22c55e", "#e11d48", "#8b5cf6", "#0ea5e9", "#f59e0b"];

const fallbackFilterOptions = {
    SALES: ["ALL"],
    AREA: ["ALL"],
    KATEGORI: ["ALL"],
    WEEK: ["ALL"],
    BULAN: ["ALL"],
    TAHUN: ["ALL"],
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
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
            {options ? (
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            ) : (
                <input
                    type="date"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
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

function DoughnutCard({ title, helper, chartData, tooltipFormatter }) {
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
                        labels: { boxWidth: 10, boxHeight: 10, padding: 14, color: "#475569", font: { size: 11, weight: 700 } },
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

function DecisionBox({ record, byArea, byKapal, paymentStatus }) {
    const topArea = byArea[0];
    const topKapal = byKapal[0];
    const notes = [];

    if (topArea) notes.push(`${topArea.name} paling kuat di LCL dengan profit ${formatRp(topArea.profit)}.`);
    if (topKapal) notes.push(`${topKapal.name} menjadi jalur/unit dengan nilai ongkir paling besar. Pantau supaya biaya kirimnya tetap terkendali.`);
    if (Number(paymentStatus.belum_lunas || 0) > 0) notes.push(`Masih ada ${formatRp(paymentStatus.belum_lunas)} yang belum lunas. Ini bagus dijadikan daftar follow up hari ini.`);
    if (Number(record.count || 0) === 0) {
        notes.push("Belum ada data LCL untuk filter ini. Coba longgarkan area, minggu, atau bulan.");
    } else {
        notes.push("Keputusan praktis: amankan pembayaran, lalu cek pengiriman yang belum selesai sebelum tambah beban baru.");
    }

    return (
        <section className="rounded-xl border border-cyan-100 bg-white p-5 shadow-sm shadow-slate-950/5">
            <div className="mb-4 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                    <Lightbulb size={19} />
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Catatan kerja</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Supaya data LCL langsung bisa dipakai untuk follow up.</p>
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

export default function Lcl({
    filters: initialFilters,
    record = {},
    byArea = [],
    byType = [],
    byKapal = [],
    byBulan = [],
    byDeparture = [],
    byYear = [],
    byRegional = [],
    topUnits = [],
    cityRecords = { kupang: 0, surabaya: 0 },
    typeCompositionChart = { labels: [], data: [], colors: [] },
    typeValueChart = { labels: [], data: [], colors: [] },
    paymentStatus = { lunas: 0, belum_lunas: 0 },
    deliveryStatus = { dlv: { count: 0, nominal: 0 }, sent: { count: 0, nominal: 0 } },
    rataProfit,
    rataTarif,
    rataBiaya,
    kunjungan,
    filterOptions = fallbackFilterOptions,
}) {
    const defaultFilters = {
        SALES: "ALL",
        AREA: "ALL",
        KATEGORI: "ALL",
        HARI: "",
        WEEK: "ALL",
        BULAN: "ALL",
        TAHUN: "ALL",
    };

    const filters = initialFilters ?? defaultFilters;

    const applyFilter = (key, value) => {
        router.get("/profit-unit/lcl", { ...filters, [key]: value }, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        router.get("/profit-unit/lcl", defaultFilters, { preserveState: true, preserveScroll: true });
    };

    const kpiData = [
        { label: "TOTAL PROFIT LCL", value: formatRp(record.profit) },
        { label: "TOTAL COD DELIVERY", value: formatRp(record.revenue) },
        { label: "TOTAL BIAYA OPERASIONAL", value: formatRp(record.cost) },
        { label: "RATA-RATA PROFIT", value: formatRp(rataProfit ?? 0) },
        { label: "RATA-RATA COD", value: formatRp(rataTarif ?? 0) },
        { label: "RATA-RATA BIAYA", value: formatRp(rataBiaya ?? 0) },
        { label: "JUMLAH RECORD", value: formatNumber(kunjungan ?? record.count) },
    ];

    const paymentChart = {
        labels: ["Lunas", "Belum lunas"],
        data: [paymentStatus.lunas, paymentStatus.belum_lunas],
        colors: ["#22c55e", "#ef4444"],
    };

    const deliveryChart = {
        labels: ["Diterima", "Belum diterima"],
        data: [deliveryStatus.dlv.nominal, deliveryStatus.sent.nominal],
        colors: ["#22c55e", "#f97316"],
    };

    return (
        <AdminLayout>
            <Head title="Profit LCL" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/profit-unit" className="transition hover:text-cyan-600">Profit Unit</Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">Profit LCL</span>
                </div>

                <div className="flex flex-col gap-6 xl:flex-row">
                    <div className="w-full shrink-0 xl:w-96">
                        <div className="space-y-6">
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-700">
                                        <Ship size={15} />
                                        Profit LCL
                                    </div>
                                    <h1 className="mt-4 text-2xl font-black text-slate-950">{formatRp(record.profit)}</h1>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                                        Ringkasan LCL dari COD delivery, ongkir kota, pembayaran, dan status pengiriman.
                                    </p>
                                    <Link
                                        href="/profit-unit/lcl/table"
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700"
                                    >
                                        <Eye size={15} />
                                        Lihat Data LCL
                                    </Link>
                                </div>
                                <div className="px-5">
                                    {kpiData.map((item) => <KpiRow key={item.label} label={item.label} value={item.value} />)}
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Record profit kota</h2>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Pembacaan singkat dari data LCL yang tersedia.</p>
                                <div className="mt-4 grid gap-3">
                                    <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                                        <p className="text-[11px] font-black uppercase tracking-wide text-orange-600">Record Profit Kupang</p>
                                        <p className="mt-2 break-words text-lg font-black text-slate-950">{formatRp(cityRecords.kupang)}</p>
                                    </div>
                                    <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
                                        <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Record Profit Surabaya</p>
                                        <p className="mt-2 break-words text-lg font-black text-slate-950">{formatRp(cityRecords.surabaya)}</p>
                                    </div>
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
                                    <FilterSelect label="SALES" value={filters.SALES} options={filterOptions.SALES} onChange={(value) => applyFilter("SALES", value)} />
                                    <FilterSelect label="AREA" value={filters.AREA} options={filterOptions.AREA} onChange={(value) => applyFilter("AREA", value)} />
                                    <FilterSelect label="KATEGORI" value={filters.KATEGORI} options={filterOptions.KATEGORI} onChange={(value) => applyFilter("KATEGORI", value)} />
                                    <FilterSelect label="HARI" value={filters.HARI} onChange={(value) => applyFilter("HARI", value)} />
                                    <FilterSelect label="WEEK" value={filters.WEEK} options={filterOptions.WEEK} onChange={(value) => applyFilter("WEEK", value)} />
                                    <FilterSelect label="BULAN" value={filters.BULAN} options={filterOptions.BULAN} onChange={(value) => applyFilter("BULAN", value)} />
                                    <FilterSelect label="TAHUN" value={filters.TAHUN} options={filterOptions.TAHUN} onChange={(value) => applyFilter("TAHUN", value)} />
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Unit penyumbang terbesar</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Unit LCL dengan profit paling besar.</p>
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
                                                <Link href={`/profit-unit/lcl/table?nopol=${encodeURIComponent(unit.nopol)}&area=${encodeURIComponent(unit.area)}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-700">
                                                    <Eye size={15} />
                                                </Link>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-5 text-sm font-semibold text-slate-500">Belum ada unit LCL yang cocok dengan filter ini.</div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <DecisionBox record={record} byArea={byArea} byKapal={byKapal} paymentStatus={paymentStatus} />

                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">View profit by kapal</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Total COD berdasarkan nama kapal.</p>
                                </div>
                                <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                    <Maximize2 size={14} />
                                    Expand
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="h-[360px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={byKapal} layout="vertical" margin={{ top: 6, right: 30, left: 120, bottom: 6 }} barCategoryGap="20%">
                                            <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                                            <XAxis type="number" tickFormatter={(v) => Number(v || 0).toLocaleString("id-ID")} tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} width={120} />
                                            <Tooltip formatter={(value) => formatRp(value)} />
                                            <Bar dataKey="ongkir" name="Total COD" fill="#f97316" maxBarSize={22} isAnimationActive={false} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Profit LCL per Area</h2>
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
                                            <Bar dataKey="profit" name="Profit LCL" fill="#2563eb" maxBarSize={22} isAnimationActive={false} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <DoughnutCard title="Komposisi tipe unit" helper="Perbandingan jumlah record LCL per tipe unit." chartData={typeCompositionChart} tooltipFormatter={(value) => `${formatNumber(value)} record`} />
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">View profit tgl kapal berangkat</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Total COD berdasarkan tanggal kapal berangkat.</p>
                                </div>
                                <div className="p-5">
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={byDeparture.length ? byDeparture : byBulan} margin={{ top: 10, right: 16, left: 12, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                                                <YAxis tickFormatter={(v) => Number(v || 0).toLocaleString("id-ID")} tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                                <Tooltip formatter={(value) => formatRp(value)} />
                                                <Bar dataKey="total" name="Total COD" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={54} isAnimationActive={false} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <DoughnutCard title="Nilai profit per tipe" helper="Tipe unit mana yang paling membantu profit LCL." chartData={typeValueChart} tooltipFormatter={formatRp} />
                            <DoughnutCard title="Status pembayaran LCL" helper="Mana yang sudah lunas dan mana yang perlu ditagih." chartData={paymentChart} tooltipFormatter={formatRp} />
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <DoughnutCard title="Status pengiriman" helper="Nominal pengiriman yang sudah diterima dan yang masih perlu dipantau." chartData={deliveryChart} tooltipFormatter={formatRp} />
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Profit per tahun</h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">Tren profit LCL dari data yang tersedia.</p>
                                </div>
                                <div className="p-5">
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={byYear} margin={{ top: 10, right: 16, left: 12, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
                                                <YAxis tickFormatter={(v) => Number(v || 0).toLocaleString("id-ID")} tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                                <Tooltip formatter={(value) => formatRp(value)} />
                                                <Bar dataKey="profit" name="Profit LCL" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={54} isAnimationActive={false} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
