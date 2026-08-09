import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowRight, Database, Plus, Search, X } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const number = new Intl.NumberFormat("id-ID");

export default function Index({ database, tables = [], filters = {}, canCreateTables = false, createUrl = "/database-manager/create" }) {
    const [search, setSearch] = useState(filters.search || "");
    const [query, setQuery] = useState(filters.search || "");

    const filteredTables = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return tables;
        return tables.filter((table) => table.name.toLowerCase().includes(term));
    }, [query, tables]);

    const submitSearch = (event) => {
        event.preventDefault();
        router.get("/database-manager", search.trim() ? { search: search.trim() } : {}, { preserveScroll: true, preserveState: true });
        setQuery(search);
    };

    return (
        <AdminLayout>
            <Head title="Manajemen Database" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-violet-600">Dashboard</Link>
                    <span className="text-slate-300">/</span>
                    <Link href="/module-records" className="transition hover:text-violet-600">CRUD Data</Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900">Manajemen Database</span>
                </div>

                <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-300" />
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"><Database size={15} /> Database aktif</span>
                            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Manajemen database</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Daftar tabel yang tersedia di database ini. Buka detail tabel untuk melihat kolom dan menyiapkan file kerja.</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:min-w-[220px]">
                            {canCreateTables && (
                                <Link href={createUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700">
                                    <Plus size={16} />
                                    Tambah tabel
                                </Link>
                            )}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tabel tersedia</p>
                            <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-950">{number.format(tables.length)}</p>
                            <p className="mt-1 max-w-[220px] truncate text-xs font-medium text-slate-500" title={database}>{database}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60 sm:p-4">
                    <form onSubmit={submitSearch} className="relative">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input id="database-table-search" name="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama tabel asli..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200/50" />
                        {search && <button type="button" onClick={() => { setSearch(""); setQuery(""); router.get("/database-manager", {}, { preserveScroll: true, preserveState: true }); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Hapus pencarian"><X size={16} /></button>}
                    </form>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                        <div><h2 className="text-base font-extrabold text-slate-950">Daftar tabel</h2><p className="mt-1 text-sm text-slate-500">Buka tabel untuk cek kolom, key, index, atau unduh file.</p></div>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-600">{number.format(filteredTables.length)} tabel</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 sm:px-5">Nama tabel</th><th className="px-4 py-3 text-right">Kolom</th><th className="px-4 py-3 text-right">Estimasi data</th><th className="px-4 py-3">Collation</th><th className="px-4 py-3 text-right sm:px-5">Aksi</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTables.map((table) => <tr key={table.name} className="group hover:bg-violet-50/40"><td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800 sm:px-5">{table.name}</td><td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-700">{number.format(table.columns)}</td><td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-700">{number.format(table.rows)}</td><td className="px-4 py-3.5 text-xs text-slate-500">{table.collation || "-"}</td><td className="px-4 py-3.5 text-right sm:px-5"><Link href={`/database-manager/${encodeURIComponent(table.name)}`} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-600 hover:text-white">Detail <ArrowRight size={14} /></Link></td></tr>)}
                                {!filteredTables.length && <tr><td colSpan="5" className="px-4 py-12 text-center text-sm font-medium text-slate-500">Tidak ada tabel yang cocok.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
