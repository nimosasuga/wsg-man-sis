import React, { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Database,
    GitBranch,
    Search,
    Table2,
    UserRound,
} from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

const statusClass = {
    ready: "bg-emerald-50 text-emerald-700 border-emerald-100",
    "needs-data": "bg-amber-50 text-amber-700 border-amber-100",
    missing: "bg-rose-50 text-rose-700 border-rose-100",
    filled: "bg-emerald-50 text-emerald-700 border-emerald-100",
    empty: "bg-slate-100 text-slate-600 border-slate-200",
};

function StatCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:border-[#d8d5ff] hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">
                        {title}
                    </p>
                    <p className="mt-2 max-w-full overflow-x-auto whitespace-nowrap text-2xl font-bold tracking-tight text-slate-950 tabular-nums">{value}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1efff] text-[#635bff]">
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

function MenuCard({ title, helper, href, icon: Icon }) {
    return (
        <Link
            href={href}
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-[#c7c3ff] hover:shadow-lg hover:shadow-[#635bff]/10"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-[#f1efff] px-3 py-2 text-xs font-bold text-[#635bff]">
                        <Icon size={16} />
                        {title}
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">{helper}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-white transition group-hover:bg-[#635bff]">
                    <ArrowRight size={19} />
                </div>
            </div>
        </Link>
    );
}

function StatusPill({ status }) {
    const label = {
        ready: "Siap",
        "needs-data": "Perlu data",
        missing: "Missing",
        filled: "Terisi",
        empty: "Kosong",
    }[status] || status;

    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass[status] || statusClass.empty}`}>
            {label}
        </span>
    );
}

export default function Index({ summary = {}, modules = [], tables = [], relations = [] }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredTables = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return tables.filter((table) => {
            const matchKeyword =
                !keyword ||
                table.name.toLowerCase().includes(keyword) ||
                table.columns.some((column) => column.toLowerCase().includes(keyword)) ||
                table.moduleHints.some((module) => module.toLowerCase().includes(keyword));
            const matchStatus = statusFilter === "all" || table.status === statusFilter;

            return matchKeyword && matchStatus;
        });
    }, [tables, search, statusFilter]);

    const emptyTables = tables.filter((table) => table.rows === 0);

    return (
        <AdminLayout>
            <Head title="Data Health" />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-400">
                    <Link href="/dashboard" className="transition hover:text-[#635bff]">Dashboard</Link>
                    <ArrowRight size={15} className="rotate-0" />
                    <span className="text-slate-700">Data Health</span>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.6fr)] lg:items-center">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#f1efff] px-3 py-1.5 text-xs font-bold text-[#635bff]">
                                <Database size={15} />
                                Mapping Database
                            </div>
                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                                Data Health / Mapping Database
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                Tempat mengecek tabel AppSheet, relasi yang kelihatan, dan modul mana yang sudah cukup siap dipakai di Laravel.
                            </p>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                            <div className="min-w-0 rounded-xl border border-[#e6e4ff] bg-[#fafaff] p-4">
                                <p className="text-xs font-semibold text-slate-500">Database aktif</p>
                                <p className="mt-2 truncate text-sm font-bold text-slate-950" title={summary.database || "-"}>{summary.database || "-"}</p>
                            </div>
                            <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                                <p className="text-xs font-semibold text-cyan-700">Tabel terbaca</p>
                                <p className="mt-2 text-2xl font-bold text-slate-950 tabular-nums">{formatNumber(summary.tableCount)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-[#635bff] via-cyan-400 to-emerald-400" />
                </section>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
                    <StatCard title="Tabel Legacy" value={formatNumber(summary.tableCount)} helper="Tabel AppSheet/legacy yang terbaca" icon={Table2} />
                    <StatCard title="Tabel Terisi" value={formatNumber(summary.filledTables)} helper="Sudah punya data" icon={CheckCircle2} />
                    <StatCard title="Tabel Kosong" value={formatNumber(summary.emptyTables)} helper="Perlu dicek kalau dipakai modul" icon={AlertTriangle} />
                    <StatCard title="Total Row" value={formatNumber(summary.totalRows)} helper="Total baris dari tabel legacy" icon={Database} />
                </div>

                <div className="grid gap-5">
                    <MenuCard
                        title="User Activity Log"
                        helper="Buka riwayat aktivitas user: siapa yang melakukan aksi, kapan terjadi, aplikasi/tabel mana yang disentuh, dan id record terkait."
                        href="/system/activity-log/user"
                        icon={UserRound}
                    />
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:p-5">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-slate-950">
                                Kesiapan Modul
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Berdasarkan tabel utama yang sudah kelihatan dari AppSheet dan schema lokal.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                        {modules.map((module) => (
                            <div key={module.name} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-[#d8d5ff] hover:bg-white">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">{module.name}</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {module.filled} terisi, {module.empty} kosong, {module.missing} missing
                                        </p>
                                    </div>
                                    <StatusPill status={module.status} />
                                </div>
                                <div className="mt-3 space-y-1">
                                    {module.tables.map((table) => (
                                        <div key={table.name} className="flex min-w-0 items-center justify-between gap-3 text-xs">
                                            <span className="truncate font-semibold text-slate-600">{table.name}</span>
                                            <span className="shrink-0 font-black text-slate-900">{formatNumber(table.rows)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
                    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-slate-950">
                                    Daftar Tabel
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Cari nama tabel, kolom, atau modul.
                                </p>
                            </div>
                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                                <div className="relative min-w-0">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Cari tabel/kolom..."
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#635bff] focus:ring-4 focus:ring-[#635bff]/10 sm:w-72"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 focus:border-[#635bff] focus:ring-[#635bff]/10"
                                >
                                    <option value="all">Semua status</option>
                                    <option value="filled">Terisi</option>
                                    <option value="empty">Kosong</option>
                                </select>
                            </div>
                        </div>

                        <div className="custom-scrollbar max-h-[720px] overflow-auto">
                            <table className="w-full border-collapse text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 bg-slate-50">
                                    <tr>
                                        <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase text-slate-500">Tabel</th>
                                        <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase text-slate-500">Row</th>
                                        <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase text-slate-500">PK</th>
                                        <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase text-slate-500">Relasi</th>
                                        <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase text-slate-500">Modul</th>
                                        <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTables.map((table) => (
                                        <tr key={table.name} className="hover:bg-cyan-50/40">
                                            <td className="px-4 py-3 text-xs font-black text-slate-950">{table.name}</td>
                                            <td className="px-4 py-3 text-xs font-black text-slate-700">{formatNumber(table.rows)}</td>
                                            <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                                                {table.primaryColumns.length ? table.primaryColumns.join(", ") : "-"}
                                            </td>
                                            <td className="max-w-sm px-4 py-3 text-xs font-semibold text-slate-600">
                                                <span className="block truncate" title={table.relationColumns.join(", ")}>
                                                    {table.relationColumns.length ? table.relationColumns.join(", ") : "-"}
                                                </span>
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-xs font-semibold text-slate-600">
                                                <span className="block truncate" title={table.moduleHints.join(", ")}>
                                                    {table.moduleHints.length ? table.moduleHints.join(", ") : "-"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <StatusPill status={table.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="min-w-0 space-y-5">
                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
                            <div className="mb-3 flex items-center gap-2">
                                <AlertTriangle size={17} className="text-amber-500" />
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                    Tabel Kosong Prioritas
                                </h2>
                            </div>
                            <div className="space-y-2">
                                {emptyTables.slice(0, 16).map((table) => (
                                    <div key={table.name} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                        <p className="text-xs font-black text-slate-800">{table.name}</p>
                                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                            {table.moduleHints.length ? table.moduleHints.join(", ") : "Belum dipetakan ke modul"}
                                        </p>
                                    </div>
                                ))}
                                {emptyTables.length === 0 && (
                                    <p className="text-sm font-semibold text-slate-500">Tidak ada tabel kosong.</p>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
                            <div className="mb-3 flex items-center gap-2">
                                <GitBranch size={17} className="text-cyan-600" />
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                    Kolom Relasi Umum
                                </h2>
                            </div>
                            <div className="custom-scrollbar max-h-[520px] space-y-2 overflow-auto pr-1">
                                {relations.map((relation) => (
                                    <div key={relation.column} className="rounded-lg border border-slate-200 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-black text-slate-900">{relation.column}</p>
                                            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black text-cyan-700">
                                                {relation.tableCount} tabel
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                                            {relation.tables.map((table) => table.table).join(", ")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
