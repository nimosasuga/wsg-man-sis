import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, Edit3, Plus, Search, Trash2 } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const pageSize = 50;

function fieldLabel(field) {
    return String(field || "").replaceAll("_", " ").toUpperCase();
}

function valueText(value) {
    const text = String(value ?? "").trim();
    return text || "-";
}

export default function Index({ module, config, records = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || "");
    const [page, setPage] = useState(1);
    const visibleFields = config.fields.slice(0, 8);
    const filteredRecords = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return records;
        }

        return records.filter((record) =>
            config.fields.some((field) => valueText(record[field]).toLowerCase().includes(keyword)),
        );
    }, [config.fields, records, search]);
    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const destroy = (id) => {
        if (!window.confirm(`Hapus data ${config.label} ini?`)) {
            return;
        }

        router.delete(`/module-records/${module}/${encodeURIComponent(id)}`);
    };

    return (
        <AdminLayout>
            <Head title={`CRUD ${config.label}`} />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <Link href={config.back} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-violet-200 transition hover:text-white">
                        <ArrowLeft size={15} />
                        Kembali
                    </Link>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-violet-200">CRUD Modul</p>
                            <h1 className="mt-2 text-2xl font-black tracking-tight">{config.label}</h1>
                        </div>
                        <Link
                            href={`/module-records/${module}/create`}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-black text-white transition hover:bg-violet-700"
                        >
                            <Plus size={16} />
                            Tambah
                        </Link>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Data Record</h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Menampilkan {filteredRecords.length.toLocaleString("id-ID")} dari {records.length.toLocaleString("id-ID")} record.
                            </p>
                        </div>
                        <div className="relative w-full md:max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Cari record..."
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                        </div>
                    </div>

                    <div className="custom-scrollbar max-h-[62vh] overflow-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="sticky top-0 z-20 bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                                <tr>
                                    <th className="sticky left-0 z-30 w-[104px] bg-slate-50 px-4 py-3 shadow-[1px_0_0_rgba(226,232,240,1)]">Aksi</th>
                                    {visibleFields.map((field) => (
                                        <th key={field} className="px-4 py-3">{fieldLabel(field)}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRecords.map((record) => {
                                    const id = record[config.key];

                                    return (
                                    <tr key={id} className="group hover:bg-violet-50/50">
                                            <td className="sticky left-0 z-10 bg-white px-4 py-3 shadow-[1px_0_0_rgba(226,232,240,1)] group-hover:bg-violet-50">
                                                <div className="flex gap-1.5">
                                                    <Link
                                                        href={`/module-records/${module}/${encodeURIComponent(id)}/edit`}
                                                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={14} />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => destroy(id)}
                                                        className="grid h-8 w-8 place-items-center rounded-lg border border-rose-100 bg-white text-rose-500 transition hover:bg-rose-50"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            {visibleFields.map((field) => (
                                                <td key={field} className="max-w-[240px] truncate px-4 py-3 text-xs font-semibold text-slate-700">
                                                    {valueText(record[field])}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                                {!paginatedRecords.length && (
                                    <tr>
                                        <td colSpan={visibleFields.length + 1} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                            Belum ada data yang cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filteredRecords.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-bold text-slate-500">
                                Halaman {currentPage} dari {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>
                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
