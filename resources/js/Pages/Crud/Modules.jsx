import React, { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    ArrowRight,
    Boxes,
    BriefcaseBusiness,
    Database,
    Landmark,
    PackageSearch,
    ReceiptText,
    Search,
    Settings2,
    Truck,
    Upload,
    X,
} from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const groupMeta = {
    inventori: { icon: PackageSearch, tone: "text-blue-600 bg-blue-50", description: "Unit, kendaraan, asset kantor, dan toolkit." },
    biaya: { icon: ReceiptText, tone: "text-amber-600 bg-amber-50", description: "Legalitas unit serta catatan biaya kendaraan." },
    operasional: { icon: Truck, tone: "text-cyan-600 bg-cyan-50", description: "Pemantauan perjalanan dan dokumen operasional." },
    profit: { icon: BriefcaseBusiness, tone: "text-violet-600 bg-violet-50", description: "Data sumber perhitungan profit tiap layanan." },
    finance: { icon: Landmark, tone: "text-emerald-600 bg-emerald-50", description: "Dokumen dan data pendukung finance." },
    "master-data": { icon: Settings2, tone: "text-slate-600 bg-slate-100", description: "Daftar pilihan yang dipakai pada formulir sistem." },
    administrasi: { icon: Boxes, tone: "text-slate-600 bg-slate-100", description: "Konfigurasi data administratif." },
};

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

    const groupedModules = useMemo(() => {
        return filtered.reduce((groups, module) => {
            const key = module.group_key || "administrasi";
            if (!groups[key]) {
                groups[key] = { label: module.group || "Administrasi", modules: [] };
            }
            groups[key].modules.push(module);
            return groups;
        }, {});
    }, [filtered]);

    return (
        <AdminLayout>
            <Head title="CRUD Data" />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-violet-600">Dashboard</Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900">CRUD Data</span>
                </div>

                <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-300" />
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                        <Database size={15} />
                        CRUD Data
                            </div>
                            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Kelola data per modul</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Pilih kelompok data yang ingin dikelola. Modul yang muncul mengikuti akses kelola dari Super Admin.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modul tersedia</p>
                                <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-950">{modules.length}</p>
                            </div>
                            <Link href="/import-export" className="inline-flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700">
                                <Upload size={16} />
                                Impor & Ekspor
                            </Link>
                        </div>
                    </div>
                </section>

                {modules.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/60 sm:p-4">
                    <div className="relative">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari modul..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200/50"
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
                    </section>
                )}

                {Object.entries(groupedModules).map(([groupKey, group]) => {
                    const meta = groupMeta[groupKey] || groupMeta.administrasi;
                    const Icon = meta.icon;

                    return (
                    <section key={groupKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.tone}`}><Icon size={19} /></span>
                                <div className="min-w-0">
                                    <h2 className="text-base font-extrabold text-slate-950">{group.label}</h2>
                                    <p className="mt-0.5 text-sm text-slate-500">{meta.description}</p>
                                </div>
                            </div>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-600">{group.modules.length} modul</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.modules.map((module) => (
                        <Link
                            key={module.key}
                            href={module.href}
                            className="group min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-violet-200 hover:bg-white hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-bold text-slate-400">
                                        {module.permission}
                                    </p>
                                    <h3 className="mt-2 truncate text-base font-extrabold text-slate-950">
                                        {module.label}
                                    </h3>
                                </div>
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white">
                                    <ArrowRight size={18} />
                                </span>
                            </div>
                        </Link>
                    ))}
                        </div>
                    </section>
                    );
                })}

                {!filtered.length && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500">
                        {modules.length
                            ? `Tidak ada modul yang cocok dengan "${search}".`
                            : "Belum ada hak kelola modul untuk user ini."}
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
