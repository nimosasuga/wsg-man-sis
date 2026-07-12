import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Clock, Database, RotateCcw, Search, UserRound } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

function StatCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
                    <p className="mt-2 break-words text-2xl font-black text-slate-950">{value}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

function ActionPill({ action }) {
    const normalized = String(action || "").toLowerCase();
    const tone = normalized.includes("create")
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : normalized.includes("update")
            ? "bg-blue-50 text-blue-700 border-blue-100"
            : normalized.includes("delete")
                ? "bg-rose-50 text-rose-700 border-rose-100"
                : "bg-slate-100 text-slate-600 border-slate-200";

    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tone}`}>
            {action || "-"}
        </span>
    );
}

export default function User({ logs = [], summary = {}, filters = {} }) {
    const [search, setSearch] = useState(filters.search || "");
    const [tanggal, setTanggal] = useState(filters.tanggal || "");

    const topActors = useMemo(() => {
        const counts = logs.reduce((result, row) => {
            const key = row.actor || "Tidak diketahui";
            result[key] = (result[key] || 0) + 1;
            return result;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);
    }, [logs]);

    const applyFilters = (event) => {
        event.preventDefault();
        router.get("/system/activity-log/user", { search, tanggal }, { preserveState: true, preserveScroll: true });
    };

    const resetFilters = () => {
        setSearch("");
        setTanggal("");
        router.get("/system/activity-log/user", {}, { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="User Activity Log" />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link href="/system/data-health" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50">
                                <ArrowLeft size={19} />
                            </Link>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">System Activity Log</p>
                                <h1 className="truncate text-xl font-black uppercase text-slate-950">User Activity Log</h1>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                            <UserRound size={15} />
                            Read Only Log
                        </div>
                        <h2 className="mt-4 text-2xl font-black tracking-tight">Aktivitas user terbaru</h2>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                            Ini bukan halaman untuk mengubah data. Fungsinya untuk membaca jejak aktivitas: user, waktu, aksi, tabel sumber, dan id record yang tersentuh.
                        </p>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Ditampilkan" value={formatNumber(summary.totalShown)} helper="Maksimal 1.500 log terbaru sesuai filter" icon={Clock} />
                    <StatCard title="Total Row" value={formatNumber(summary.totalRows)} helper="Total di tabel sumber lokal" icon={Database} />
                    <StatCard title="Sumber" value={summary.sourceStatus === "ready" ? "Siap" : "Missing"} helper={summary.sourceTable || "-"} icon={Database} />
                </div>

                <section className="rounded-xl border border-cyan-100 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Ringkasan cepat</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {topActors.length ? topActors.map(([actor, count]) => (
                            <div key={actor} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="truncate text-sm font-black text-slate-900">{actor}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{count} aktivitas pada hasil filter ini.</p>
                            </div>
                        )) : (
                            <p className="text-sm font-semibold text-slate-500">Belum ada aktivitas untuk filter ini.</p>
                        )}
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <form onSubmit={applyFilters} className="grid gap-3 lg:grid-cols-[1fr_220px_auto_auto] lg:items-end">
                        <label>
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">Cari log</span>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari admin, id key, id record..."
                                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                                />
                            </div>
                        </label>
                        <label>
                            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">Tanggal</span>
                            <input
                                type="date"
                                value={tanggal}
                                onChange={(event) => setTanggal(event.target.value)}
                                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                            />
                        </label>
                        <button type="submit" className="h-11 rounded-lg bg-cyan-600 px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700">
                            Terapkan
                        </button>
                        <button type="button" onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50">
                            <RotateCcw size={15} />
                            Reset
                        </button>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Tabel Log User</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Urutan mengikuti TGL_CEK_ADMIN terbaru ke terlama.</p>
                    </div>
                    <div className="custom-scrollbar max-h-[720px] overflow-auto">
                        <table className="w-full border-collapse text-left whitespace-nowrap">
                            <thead className="sticky top-0 z-10 bg-slate-50">
                                <tr>
                                    {["TGL_CEK_ADMIN", "NAMA_ADMIN", "AKSI", "APP", "TABLE", "ID_RECORD", "TANGGAL"].map((head) => (
                                        <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.length ? logs.map((row) => (
                                    <tr
                                        key={row.id_key}
                                        onClick={() => row.id_key && router.visit(`/system/activity-log/user/${row.id_key}`)}
                                        onKeyDown={(event) => {
                                            if (!row.id_key || !["Enter", " "].includes(event.key)) return;
                                            event.preventDefault();
                                            router.visit(`/system/activity-log/user/${row.id_key}`);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        className="cursor-pointer hover:bg-cyan-50/40 focus:bg-cyan-50/60 focus:outline-none"
                                    >
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.tgl_cek_admin || "-"}</td>
                                        <td className="max-w-md px-4 py-3 text-xs font-semibold text-slate-600">
                                            <span className="block truncate" title={row.nama_admin || "-"}>{row.actor || row.nama_admin || "-"}</span>
                                        </td>
                                        <td className="px-4 py-3"><ActionPill action={row.action} /></td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.app || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.table || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.id_record || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tanggal || "-"}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">Belum ada log untuk filter ini.</td>
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
