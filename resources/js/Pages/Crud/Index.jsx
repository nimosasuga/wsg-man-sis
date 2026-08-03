import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowDownUp, ArrowLeft, ChevronDown, ChevronUp, Edit3, FileSpreadsheet, Plus, Search, Trash2 } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const pageSize = 50;

function fieldLabel(field) {
    return String(field || "").replaceAll("_", " ");
}

function valueText(value) {
    const text = String(value ?? "").trim();
    return text || "-";
}

export default function Index({ module, config, records = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || "");
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState(config.key);
    const [direction, setDirection] = useState("asc");
    const visibleFields = config.fields.slice(0, 8);

    const filteredRecords = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return records;

        return records.filter((record) => (
            config.fields.some((field) => valueText(record[field]).toLowerCase().includes(keyword))
        ));
    }, [config.fields, records, search]);

    const sortedRecords = useMemo(() => [...filteredRecords].sort((left, right) => {
        const leftValue = valueText(left[sort]);
        const rightValue = valueText(right[sort]);
        const comparison = leftValue.localeCompare(rightValue, "id", { numeric: true, sensitivity: "base" });

        return direction === "asc" ? comparison : -comparison;
    }), [direction, filteredRecords, sort]);

    const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const changeSort = (field) => {
        setPage(1);
        if (sort === field) {
            setDirection((value) => value === "asc" ? "desc" : "asc");
            return;
        }

        setSort(field);
        setDirection("asc");
    };

    const destroy = (id) => {
        if (window.confirm(`Hapus data ${config.label} ini?`)) {
            router.delete(`/module-records/${module}/${encodeURIComponent(id)}`);
        }
    };

    const SortIcon = ({ field }) => {
        if (sort !== field) return <ArrowDownUp size={14} className="text-slate-400" />;
        return direction === "asc" ? <ChevronUp size={15} className="text-indigo-600" /> : <ChevronDown size={15} className="text-indigo-600" />;
    };

    return (
        <AdminLayout>
            <Head title={`CRUD ${config.label}`} />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-indigo-600">Dashboard</Link>
                    <span>/</span>
                    <Link href="/module-records" className="transition hover:text-indigo-600">CRUD Data</Link>
                    <span>/</span>
                    <span className="text-slate-800">{config.label}</span>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                                <ArrowDownUp size={14} />
                                Master data
                            </div>
                            <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{config.label}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Kelola data secara terpusat. Gunakan pencarian atau urutkan kolom untuk menemukan record dengan cepat.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {config.importEnabled && <>
                                <a href={`/import-export/${encodeURIComponent(module)}/export?search=${encodeURIComponent(search)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100">
                                    <FileSpreadsheet size={16} />
                                    {search.trim() ? "Ekspor hasil cari" : "Ekspor data"}
                                </a>
                                <Link href={`/import-export?module=${encodeURIComponent(module)}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100">
                                    <FileSpreadsheet size={16} />
                                    Impor Excel
                                </Link>
                            </>}
                            <Link href={config.back} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                                <ArrowLeft size={16} />
                                Kembali
                            </Link>
                            <Link href={`/module-records/${module}/create`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700">
                                <Plus size={16} />
                                Tambah data
                            </Link>
                        </div>
                    </div>
                    <div className="grid border-t border-slate-100 sm:grid-cols-2">
                        <div className="p-4 sm:border-r sm:border-slate-100">
                            <p className="text-xs font-semibold text-slate-500">Total record</p>
                            <p className="mt-1 text-xl font-extrabold text-slate-950">{records.length.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-semibold text-slate-500">Hasil pencarian</p>
                            <p className="mt-1 text-xl font-extrabold text-slate-950">{filteredRecords.length.toLocaleString("id-ID")}</p>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-950">Data record</h2>
                            <p className="mt-1 text-sm text-slate-500">Klik judul kolom untuk mengurutkan data A-Z atau Z-A.</p>
                        </div>
                        <div className="relative w-full lg:max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                id={`search-${module}`}
                                name="search"
                                value={search}
                                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                                placeholder="Cari record..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>
                    </div>

                    <div className="custom-scrollbar max-h-[62vh] overflow-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="sticky top-0 z-20 bg-slate-50/95 text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)] backdrop-blur">
                                <tr>
                                    <th className="sticky left-0 z-30 w-[104px] bg-slate-50 px-4 py-3 shadow-[1px_0_0_rgba(226,232,240,1)]">Aksi</th>
                                    {visibleFields.map((field) => (
                                        <th key={field} className="px-4 py-3">
                                            <button type="button" onClick={() => changeSort(field)} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold transition hover:text-indigo-700">
                                                {fieldLabel(field)}
                                                <SortIcon field={field} />
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRecords.map((record) => {
                                    const id = record[config.key];
                                    return (
                                        <tr key={id} className="group transition hover:bg-indigo-50/40">
                                            <td className="sticky left-0 z-10 bg-white px-4 py-3 shadow-[1px_0_0_rgba(226,232,240,1)] group-hover:bg-indigo-50">
                                                <div className="flex gap-1.5">
                                                    <Link href={`/module-records/${module}/${encodeURIComponent(id)}/edit`} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600" title="Edit" aria-label="Edit record">
                                                        <Edit3 size={14} />
                                                    </Link>
                                                    <button type="button" onClick={() => destroy(id)} className="grid h-8 w-8 place-items-center rounded-lg border border-rose-100 bg-white text-rose-500 transition hover:bg-rose-50" title="Hapus" aria-label="Hapus record">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            {visibleFields.map((field) => (
                                                <td key={field} className="max-w-[240px] truncate px-4 py-3 text-sm text-slate-700" title={valueText(record[field])}>{valueText(record[field])}</td>
                                            ))}
                                        </tr>
                                    );
                                })}
                                {!paginatedRecords.length && (
                                    <tr><td colSpan={visibleFields.length + 1} className="px-4 py-12 text-center text-sm font-medium text-slate-500">Belum ada data yang cocok.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredRecords.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <p className="text-sm text-slate-500">Halaman <span className="font-bold text-slate-900">{currentPage}</span> dari <span className="font-bold text-slate-900">{totalPages}</span></p>
                            <div className="flex gap-2">
                                <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>
                                <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Berikutnya</button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
