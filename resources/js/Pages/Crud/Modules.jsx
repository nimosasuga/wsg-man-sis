import React, { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, Database, Search, X } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Modules({ modules = [] }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return modules;
        return modules.filter(
            (m) =>
                m.label.toLowerCase().includes(q) ||
                m.permission.toLowerCase().includes(q) ||
                (m.key || "").toLowerCase().includes(q),
        );
    }, [modules, search]);

    return (
        <AdminLayout>
            <Head title="CRUD Data" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                        <Database size={15} />
                        CRUD Data
                    </div>
                    <h1 className="mt-4 text-2xl font-black tracking-tight">
                        Kelola Data Modul
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                        Modul yang tampil di sini mengikuti hak akses kelola yang diberikan Super Admin.
                    </p>
                </section>

                {modules.length > 0 && (
                    <div className="relative">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari modul..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200/50"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((module) => (
                        <Link
                            key={module.key}
                            href={module.href}
                            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                        {module.permission}
                                    </p>
                                    <h2 className="mt-2 truncate text-lg font-black text-slate-950">
                                        {module.label}
                                    </h2>
                                </div>
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600 transition group-hover:bg-cyan-500 group-hover:text-white">
                                    <ArrowRight size={18} />
                                </span>
                            </div>
                        </Link>
                    ))}
                    {!filtered.length && (
                        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500 shadow-sm md:col-span-2 xl:col-span-3">
                            {modules.length
                                ? `Tidak ada modul yang cocok dengan "${search}".`
                                : "Belum ada hak kelola modul untuk user ini."}
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
