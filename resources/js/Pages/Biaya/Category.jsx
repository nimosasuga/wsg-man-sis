import React, { useMemo, useState } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { ChevronRight, Filter } from "lucide-react";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

export default function Category({ category, rawTableData = [] }) {
    const [activeYear, setActiveYear] = useState("ALL");
    const [activeMonth, setActiveMonth] = useState("ALL");
    const [activeArea, setActiveArea] = useState("ALL");

    const yearGroups = useMemo(() => {
        const groups = rawTableData.reduce((acc, row) => {
            const year = row.groupYear || "0";
            acc[year] = (acc[year] || 0) + Number(row.nominal || 0);
            return acc;
        }, {});

        return Object.entries(groups)
            .map(([year, amount]) => ({ year, amount }))
            .sort((a, b) => Number(b.year) - Number(a.year));
    }, [rawTableData]);

    const monthGroups = useMemo(() => {
        const groups = rawTableData.reduce((acc, row) => {
            if (activeYear !== "ALL" && row.groupYear !== activeYear) return acc;

            const month = row.groupMonth || "0";
            acc[month] = (acc[month] || 0) + Number(row.nominal || 0);
            return acc;
        }, {});

        return Object.entries(groups)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => String(a.month).localeCompare(String(b.month)));
    }, [rawTableData, activeYear]);

    const areaGroups = useMemo(() => {
        const groups = rawTableData.reduce((acc, row) => {
            if (activeYear !== "ALL" && row.groupYear !== activeYear) return acc;
            if (activeMonth !== "ALL" && row.groupMonth !== activeMonth) return acc;

            const area = row.groupArea || "TIDAK DIKETAHUI";
            acc[area] = (acc[area] || 0) + Number(row.nominal || 0);
            return acc;
        }, {});

        return Object.entries(groups)
            .map(([area, amount]) => ({ area, amount }))
            .sort((a, b) => String(a.area).localeCompare(String(b.area)));
    }, [rawTableData, activeYear, activeMonth]);

    const filteredData = useMemo(() => {
        return rawTableData.filter((row) => {
            return (
                (activeYear === "ALL" || row.groupYear === activeYear) &&
                (activeMonth === "ALL" || row.groupMonth === activeMonth) &&
                (activeArea === "ALL" || row.groupArea === activeArea)
            );
        });
    }, [activeYear, activeMonth, activeArea, rawTableData]);

    const filteredTotal = useMemo(
        () => filteredData.reduce((total, row) => total + Number(row.nominal || 0), 0),
        [filteredData],
    );

    return (
        <AdminLayout>
            <Head title={`Rincian Biaya - ${category.title}`} />

            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                    <Link href="/biaya" className="hover:text-blue-600">BIAYA</Link>
                    <ChevronRight size={14} className="mx-1" />
                    <Link href="/biaya" className="hover:text-blue-600">TABEL BIAYA</Link>
                    <ChevronRight size={14} className="mx-1" />
                    <span className="text-slate-900">RINCIAN BIAYA {category.title}</span>
                </div>
                <Filter size={17} className="text-slate-400" />
            </div>

            <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3">
                <label>
                    <span className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Tahun
                    </span>
                    <select
                        value={activeYear}
                        onChange={(event) => {
                            setActiveYear(event.target.value);
                            setActiveMonth("ALL");
                            setActiveArea("ALL");
                        }}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                        <option value="ALL">Semua Tahun</option>
                        {yearGroups.map((item) => (
                            <option key={item.year} value={item.year}>
                                {item.year} - {formatRp(item.amount)}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Bulan
                    </span>
                    <select
                        value={activeMonth}
                        onChange={(event) => {
                            setActiveMonth(event.target.value);
                            setActiveArea("ALL");
                        }}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                        <option value="ALL">Semua Bulan</option>
                        {monthGroups.map((item) => (
                            <option key={item.month} value={item.month}>
                                {item.month} - {formatRp(item.amount)}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    <span className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Area
                    </span>
                    <select
                        value={activeArea}
                        onChange={(event) => setActiveArea(event.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    >
                        <option value="ALL">Semua Area</option>
                        {areaGroups.map((item) => (
                            <option key={item.area} value={item.area}>
                                {item.area} - {formatRp(item.amount)}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Total Filter
                </p>
                <p className="mt-1 text-lg font-black">{formatRp(filteredTotal)}</p>
            </div>

            <div className="flex h-[calc(100vh-180px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-2 md:block">
                    <button
                        onClick={() => {
                            setActiveYear("ALL");
                            setActiveMonth("ALL");
                            setActiveArea("ALL");
                        }}
                        className={`mb-2 flex w-full items-center rounded-xl px-4 py-2 text-left text-sm font-bold ${activeYear === "ALL" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-white"}`}
                    >
                        All
                    </button>
                    <div className="space-y-1">
                        {yearGroups.map((item) => (
                            <button
                                key={item.year}
                                onClick={() => {
                                    setActiveYear(item.year);
                                    setActiveMonth("ALL");
                                    setActiveArea("ALL");
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-4 py-2 text-left text-sm font-semibold ${activeYear === item.year ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:bg-white"}`}
                            >
                                <span>{item.year}</span>
                                <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                                    {formatRp(item.amount)}
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                <div className="custom-scrollbar flex-1 overflow-auto">
                    <table className="w-full border-collapse whitespace-nowrap text-left">
                        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                            <tr>
                                <th className="border-r border-slate-100 px-4 py-3 text-[11px] font-black uppercase text-slate-800">Nopol</th>
                                <th className="border-r border-slate-100 px-4 py-3 text-[11px] font-black uppercase text-slate-800">Area</th>
                                <th className="border-r border-slate-100 px-4 py-3 text-[11px] font-black uppercase text-slate-800">Tanggal</th>
                                <th className="border-r border-slate-100 px-4 py-3 text-[11px] font-black uppercase text-slate-800">Nominal</th>
                                <th className="border-r border-slate-100 px-4 py-3 text-[11px] font-black uppercase text-slate-800">Keterangan</th>
                                <th className="w-12 px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredData.map((row, index) => (
                                <tr
                                    key={`${category.slug}-${row.id_key || "row"}-${index}`}
                                    onClick={() => router.get(`/biaya/${category.slug}/${row.id_key}`)}
                                    className="cursor-pointer transition-colors hover:bg-blue-50/50"
                                >
                                    <td className="border-r border-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900">{row.nopol || "-"}</td>
                                    <td className="border-r border-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700">{row.area || "-"}</td>
                                    <td className="border-r border-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700">{row.tanggal || "-"}</td>
                                    <td className="border-r border-slate-50 px-4 py-2.5 text-xs font-black text-slate-900">{formatRp(row.nominal)}</td>
                                    <td className="border-r border-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700">{row.keterangan || row.model || row.tipe || "-"}</td>
                                    <td className="px-4 py-2.5 text-right text-lg font-black text-slate-900">›</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
