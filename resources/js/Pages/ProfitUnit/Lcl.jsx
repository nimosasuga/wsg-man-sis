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
import { ChevronRight, Eye, Filter, Maximize2, RotateCcw, TrendingUp } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

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
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
            )}
        </label>
    );
}

export default function Lcl({
    filters: initialFilters,
    record = {},
    byArea = [],
    byKapal = [],
    byBulan = [],
    paymentStatus = { lunas: 0, belum_lunas: 0 },
    deliveryStatus = { dlv: { count: 0, nominal: 0 }, sent: { count: 0, nominal: 0 } },
}) {
    const defaultFilters = {
        SALES: "ALL",
        HARI: "",
        WEEK: "ALL",
        BULAN: "E Mei",
        TAHUN: "2026",
    };

    const filters = initialFilters ?? defaultFilters;

    const applyFilter = (key, value) => {
        router.get("/profit-unit/lcl", {
            ...filters,
            [key]: value,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        router.get("/profit-unit/lcl", defaultFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const totalPayment = paymentStatus.lunas + paymentStatus.belum_lunas;
    const pctLunas = totalPayment > 0 ? ((paymentStatus.lunas / totalPayment) * 100).toFixed(0) : 0;
    const pctBelum = totalPayment > 0 ? ((paymentStatus.belum_lunas / totalPayment) * 100).toFixed(0) : 0;

    const totalDelivery = deliveryStatus.dlv.nominal + deliveryStatus.sent.nominal;
    const pctDlv = totalDelivery > 0 ? ((deliveryStatus.dlv.nominal / totalDelivery) * 100).toFixed(0) : 0;
    const pctSent = totalDelivery > 0 ? ((deliveryStatus.sent.nominal / totalDelivery) * 100).toFixed(0) : 0;

    const paymentData = [
        { name: "LUNAS", value: paymentStatus.lunas, color: "#22c55e" },
        { name: "BELUM LUNAS", value: paymentStatus.belum_lunas, color: "#ef4444" },
    ];

    const deliveryData = [
        { name: "DLV", value: deliveryStatus.dlv.nominal, color: "#ef4444" },
        { name: "SENT", value: deliveryStatus.sent.nominal, color: "#22c55e" },
    ];

    const filterOptions = {
        SALES: ["ALL"],
        WEEK: ["ALL", "W31", "W32", "W33", "W34", "W35"],
        BULAN: ["ALL", "E Mei", "F Juni", "G Juli", "H Agustus", "I September"],
        TAHUN: ["ALL", "2024", "2025", "2026"],
    };

    return (
        <AdminLayout>
            <Head title="Profit LCL" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/profit-unit" className="transition hover:text-cyan-600">
                        Profit Unit
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">Profit LCL</span>
                </div>

                <div className="flex flex-col gap-6 xl:flex-row">
                    <div className="w-full shrink-0 xl:w-96">
                        <div className="space-y-6">
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="border-b border-slate-100 px-5 py-4">
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                        PROFIT LCL
                                    </h2>
                                </div>
                                <div className="divide-y divide-slate-100 px-5">
                                    {byArea.slice(0, 5).map((area) => (
                                        <div key={area.name} className="flex items-center justify-between py-3">
                                            <span className="text-xs font-bold text-slate-700">
                                                RECORD PROFIT {area.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-blue-600">
                                                    {formatRp(area.profit)}
                                                </span>
                                                <Eye size={15} className="text-slate-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                                <div className="mb-5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                                            <Filter size={17} />
                                        </div>
                                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                            Filter Data
                                        </h2>
                                    </div>
                                    <button
                                        onClick={resetFilters}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <RotateCcw size={14} />
                                        Reset
                                    </button>
                                </div>

                                <div className="grid gap-4">
                                    <FilterSelect
                                        label="SALES"
                                        value={filters.SALES}
                                        options={filterOptions.SALES}
                                        onChange={(value) => applyFilter("SALES", value)}
                                    />
                                    <FilterSelect
                                        label="HARI"
                                        value={filters.HARI}
                                        onChange={(value) => applyFilter("HARI", value)}
                                    />
                                    <FilterSelect
                                        label="WEEK"
                                        value={filters.WEEK}
                                        options={filterOptions.WEEK}
                                        onChange={(value) => applyFilter("WEEK", value)}
                                    />
                                    <FilterSelect
                                        label="BULAN"
                                        value={filters.BULAN}
                                        options={filterOptions.BULAN}
                                        onChange={(value) => applyFilter("BULAN", value)}
                                    />
                                    <FilterSelect
                                        label="TAHUN"
                                        value={filters.TAHUN}
                                        options={filterOptions.TAHUN}
                                        onChange={(value) => applyFilter("TAHUN", value)}
                                    />
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                            VIEW PROFIT BY KAPAL
                                        </h2>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            {byKapal.length} data ditampilkan
                                        </p>
                                    </div>
                                    <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                        <Maximize2 size={14} />
                                        Expand
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="h-[360px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={byKapal}
                                                layout="vertical"
                                                margin={{ top: 6, right: 30, left: 90, bottom: 6 }}
                                                barCategoryGap="20%"
                                            >
                                                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                                                <XAxis
                                                    type="number"
                                                    tickFormatter={(v) =>
                                                        Number(v || 0).toLocaleString("id-ID")
                                                    }
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={90}
                                                />
                                                <Tooltip formatter={(value) => formatRp(value)} />
                                                <Bar
                                                    dataKey="ongkir"
                                                    name="SUM Total Ongkir"
                                                    fill="#f97316"
                                                    maxBarSize={22}
                                                    isAnimationActive={false}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                        VIEW PROFIT TGL KAPAL BERANGKAT
                                    </h2>
                                    <p className="mt-1 text-xs font-semibold text-slate-500">
                                        {byBulan.length} data ditampilkan
                                    </p>
                                </div>
                                <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                    <Maximize2 size={14} />
                                    Expand
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                                    <span className="h-3 w-5 rounded bg-red-500" />
                                    SUM Total COD
                                </div>
                                <div className="h-[360px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={byBulan}
                                            margin={{ top: 10, right: 16, left: 12, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                                                axisLine={{ stroke: "#cbd5e1" }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={(v) =>
                                                    Number(v || 0).toLocaleString("id-ID")
                                                }
                                                tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip formatter={(value) => formatRp(value)} />
                                            <Bar
                                                dataKey="total"
                                                name="SUM Total COD"
                                                fill="#ef4444"
                                                radius={[6, 6, 0, 0]}
                                                maxBarSize={50}
                                                isAnimationActive={false}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </section>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                            VIEW DATA PELUNASAN LCL
                                        </h2>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            Status Pembayaran STT
                                        </p>
                                    </div>
                                    <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                        <Maximize2 size={14} />
                                        Expand
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="flex flex-col items-center">
                                        <div className="h-[240px] w-[240px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={paymentData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={65}
                                                        outerRadius={105}
                                                        dataKey="value"
                                                        startAngle={90}
                                                        endAngle={-270}
                                                    >
                                                        {paymentData.map((entry, index) => (
                                                            <Cell key={index} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatRp(value)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-xs font-semibold">
                                                <span className="h-3 w-3 rounded-full bg-green-500" />
                                                <span className="text-slate-600">LUNAS</span>
                                                <span className="font-black text-slate-900">{pctLunas}%</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold">
                                                <span className="h-3 w-3 rounded-full bg-red-500" />
                                                <span className="text-slate-600">BELUM LUNAS</span>
                                                <span className="font-black text-slate-900">{pctBelum}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                            VIEW STATUS PENGIRIMAN
                                        </h2>
                                        <p className="mt-1 text-xs font-semibold text-slate-500">
                                            {byBulan.length} data ditampilkan
                                        </p>
                                    </div>
                                    <button className="inline-flex items-center gap-1 text-sm font-black text-cyan-600 transition hover:text-cyan-700">
                                        <Maximize2 size={14} />
                                        Expand
                                    </button>
                                </div>
                                <div className="p-5">
                                    <div className="mb-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-wide text-red-600">DLV</p>
                                            <p className="mt-1 text-xs font-bold text-slate-700">
                                                {deliveryStatus.dlv.count} koli
                                            </p>
                                            <p className="text-xs font-black text-red-600">
                                                {formatRp(deliveryStatus.dlv.nominal)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-wide text-green-600">SENT</p>
                                            <p className="mt-1 text-xs font-bold text-slate-700">
                                                {deliveryStatus.sent.count} koli
                                            </p>
                                            <p className="text-xs font-black text-green-600">
                                                {formatRp(deliveryStatus.sent.nominal)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="h-[220px] w-[220px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={deliveryData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={65}
                                                        outerRadius={100}
                                                        dataKey="value"
                                                        startAngle={90}
                                                        endAngle={-270}
                                                    >
                                                        {deliveryData.map((entry, index) => (
                                                            <Cell key={index} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => formatRp(value)} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-3 flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-xs font-semibold">
                                                <span className="h-3 w-3 rounded-full bg-red-500" />
                                                <span className="text-slate-600">DLV</span>
                                                <span className="font-black text-slate-900">{pctDlv}%</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold">
                                                <span className="h-3 w-3 rounded-full bg-green-500" />
                                                <span className="text-slate-600">SENT</span>
                                                <span className="font-black text-slate-900">{pctSent}%</span>
                                            </div>
                                        </div>
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
