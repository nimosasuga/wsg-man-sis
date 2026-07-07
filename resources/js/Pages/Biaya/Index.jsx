import React, { memo, useMemo } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { ChevronRight, Eye } from "lucide-react";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const SummaryChart = memo(function SummaryChart({ data }) {
    const maxAmount = Math.max(
        ...data.map((item) => Number(item.amount || 0)),
        1,
    );

    return (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Statistik Biaya
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    Ringkasan nominal biaya berdasarkan sub menu operasional.
                </p>
            </div>
            <div className="space-y-3">
                {data.map((item) => {
                    const amount = Number(item.amount || 0);
                    const width = Math.max((amount / maxAmount) * 100, amount > 0 ? 4 : 0);

                    return (
                        <div key={item.slug} className="grid gap-2 sm:grid-cols-[150px_1fr_170px] sm:items-center">
                            <p className="truncate text-xs font-black text-slate-700">
                                {item.title}
                            </p>
                            <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
                                <div
                                    className="h-full rounded-lg bg-cyan-500 shadow-[inset_0_-8px_18px_rgba(14,116,144,0.22)] transition-[width] duration-500"
                                    style={{ width: `${width}%` }}
                                />
                            </div>
                            <p className="text-xs font-black text-slate-900 sm:text-right">
                                {formatRp(amount)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default function Index({ summaryData = [] }) {
    const totalBiaya = useMemo(
        () => summaryData.reduce((total, item) => total + Number(item.amount || 0), 0),
        [summaryData],
    );

    return (
        <AdminLayout>
            <Head title="Biaya" />

            <div className="mb-4 flex items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>BIAYA</span>
                <ChevronRight size={14} className="mx-1" />
                <span className="text-slate-900">TABEL BIAYA</span>
            </div>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-200">Total Biaya</p>
                <h1 className="mt-2 text-2xl font-black">{formatRp(totalBiaya)}</h1>
                <p className="mt-1 text-sm font-medium text-slate-300">Akumulasi seluruh kategori biaya yang tersedia.</p>
            </div>

            <SummaryChart data={summaryData} />

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                Sub Menu
                            </th>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                Nominal Biaya
                            </th>
                            <th className="w-16 px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {summaryData.map((item) => (
                            <tr key={item.slug} className="transition-colors hover:bg-blue-50/50">
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
                                    {item.title}
                                </td>
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                                    {formatRp(item.amount)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <Link
                                        href={`/biaya/${item.slug}`}
                                        className="inline-flex rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-blue-600"
                                        title={`Lihat ${item.title}`}
                                    >
                                        <Eye size={17} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
