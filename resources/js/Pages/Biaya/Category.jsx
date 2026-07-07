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

    const yearGroups = useMemo(() => {
        const groups = rawTableData.reduce((acc, row) => {
            const match = String(row.tanggal || "").match(/\d{4}/);
            const year = match ? match[0] : "0";
            acc[year] = (acc[year] || 0) + Number(row.nominal || 0);
            return acc;
        }, {});

        return Object.entries(groups)
            .map(([year, amount]) => ({ year, amount }))
            .sort((a, b) => Number(b.year) - Number(a.year));
    }, [rawTableData]);

    const filteredData = useMemo(() => {
        if (activeYear === "ALL") return rawTableData;

        return rawTableData.filter((row) => String(row.tanggal || "").includes(activeYear));
    }, [activeYear, rawTableData]);

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

            <div className="flex h-[calc(100vh-132px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-2 md:block">
                    <button
                        onClick={() => setActiveYear("ALL")}
                        className={`mb-2 flex w-full items-center rounded-xl px-4 py-2 text-left text-sm font-bold ${activeYear === "ALL" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-white"}`}
                    >
                        All
                    </button>
                    <div className="space-y-1">
                        {yearGroups.map((item) => (
                            <button
                                key={item.year}
                                onClick={() => setActiveYear(item.year)}
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
                            {filteredData.map((row) => (
                                <tr
                                    key={row.id_key}
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
