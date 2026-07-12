import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatTanggal = (value) => {
    if (!value) return "-";

    const parts = String(value).split("-");
    if (parts.length === 3) {
        return `${Number(parts[1])}/${Number(parts[0])}/${parts[2]}`;
    }

    return value;
};

export default function RentalTable({ rows = [], filters = {}, summary = {} }) {
    const [search, setSearch] = useState(filters.SEARCH || "");

    const goSearch = (event) => {
        event.preventDefault();

        router.get("/profit-unit/rental/table", {
            nopol: filters.NOPOL || "ALL",
            area: filters.AREA || "ALL",
            tahun: filters.TAHUN || "ALL",
            search,
        }, {
            preserveScroll: true,
        });
    };

    const syncData = () => {
        router.reload({
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Tabel Profit Rental" />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link
                                href="/profit-unit/rental"
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                                title="Kembali"
                            >
                                <ArrowLeft size={19} />
                            </Link>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">
                                    Profit Rental
                                </p>
                                <h1 className="truncate text-xl font-black uppercase text-slate-950">
                                    Tabel Profit Rental
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <form onSubmit={goSearch} className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="grid w-10 place-items-center text-slate-400">
                                    <Search size={17} />
                                </div>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari tanggal, area, nopol..."
                                    className="w-full min-w-0 border-0 px-1 text-sm font-semibold text-slate-800 outline-none focus:ring-0 sm:w-72"
                                />
                            </form>
                            <button
                                type="button"
                                onClick={syncData}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                            >
                                <RefreshCw size={15} />
                                Sync
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Filter Unit</p>
                        <p className="mt-2 text-lg font-black text-slate-950">{filters.NOPOL && filters.NOPOL !== "ALL" ? filters.NOPOL : "Semua Unit"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Total Record</p>
                        <p className="mt-2 text-lg font-black text-slate-950">{Number(summary.count || 0).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Nilai Rental</p>
                        <p className="mt-2 break-words text-lg font-black text-blue-600">{formatRp(summary.revenue)}</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                            Data Rental Unit
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Klik sync kalau ingin membaca ulang data terbaru dari server lokal.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-[860px] w-full border-collapse text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    {["ID_KEY", "TANGGAL", "AREA", "NOPOL", "TIPE", "TARIF_SEWA_UNIT_BLN", "WEEK"].map((head) => (
                                        <th key={head} className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-700 last:border-r-0">
                                            {head}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.length ? rows.map((row) => (
                                    <tr
                                        key={row.id_key}
                                        onClick={() => router.get(`/profit-unit/rental/table/${row.id_key}`)}
                                        className="cursor-pointer hover:bg-cyan-50/50"
                                        title={`Buka detail ${row.nopol || row.id_key}`}
                                    >
                                        <td className="border-r border-slate-100 px-4 py-3 text-sm font-black text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <span>{row.id_key || "-"}</span>
                                                <ChevronRight size={14} className="text-slate-300" />
                                            </div>
                                        </td>
                                        <td className="border-r border-slate-100 px-4 py-3 text-sm font-black text-slate-900">{formatTanggal(row.tanggal)}</td>
                                        <td className="border-r border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{row.area || "-"}</td>
                                        <td className="border-r border-slate-100 px-4 py-3 text-sm font-black text-blue-600">{row.nopol || "-"}</td>
                                        <td className="border-r border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{row.tipe || "-"}</td>
                                        <td className="border-r border-slate-100 px-4 py-3 text-sm font-black text-slate-950">{formatRp(row.tarif_sewa_unit_bln)}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{row.week || "-"}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                            Data rental tidak ditemukan untuk filter ini.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
