import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Search } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;

const formatNum = (value) => Number(value || 0).toLocaleString("id-ID");

const PRIMARY_CONFIG = {
    columns: ["ID_KEY", "TANGGAL", "TAHUN", "BULAN", "AREA", "NOPOL", "TIPE", "STATUS DOC FAT", "KATEGORI", "JARAK WAKTU", "END TIME", "EDITOR", "TARIF", "BIAYA", "PROFIT", "WEEK"],
    sortable: {
        "ID_KEY": "id_key",
        "TANGGAL": "tanggal_muat",
        "AREA": "area",
        "NOPOL": "nopol_driver",
        "TIPE": "jenis",
        "STATUS DOC FAT": "status_dokument",
        "JARAK WAKTU": "create_data",
        "TARIF": "total_tarif",
        "BIAYA": "total_biaya",
        "WEEK": "week",
    },
    renderCell: (row) => [
        <td key="id_key" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-slate-900">
            <div className="flex items-center gap-1">
                <span className="truncate max-w-[120px]">{row.id_key || "-"}</span>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
            </div>
        </td>,
        <td key="tanggal" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.tanggal || "-"}</td>,
        <td key="tahun" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.tahun || "-"}</td>,
        <td key="bulan" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.bulan || "-"}</td>,
        <td key="area" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.area || "-"}</td>,
        <td key="nopol" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-blue-600">{row.nopol || "-"}</td>,
        <td key="tipe" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.tipe || "-"}</td>,
        <td key="status_doc_fat" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold whitespace-nowrap">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${row.status_doc_fat === 'DITERIMA FAT' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {row.status_doc_fat || "-"}
            </span>
        </td>,
        <td key="kategori" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.kategori || "-"}</td>,
        <td key="jarak_waktu" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.jarak_waktu || "-"}</td>,
        <td key="end_time" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.end_time || "-"}</td>,
        <td key="editor" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.editor || "-"}</td>,
        <td key="tarif" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-slate-950 whitespace-nowrap">{formatRp(row.tarif)}</td>,
        <td key="biaya" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{formatRp(row.biaya)}</td>,
        <td key="profit" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-emerald-600 whitespace-nowrap">{formatRp(row.profit)}</td>,
        <td key="week" className="px-3 py-3 text-sm font-semibold text-slate-700">{row.week || "-"}</td>,
    ],
};

const SECONDARY_CONFIG = {
    columns: ["ID_KEY", "TANGGAL", "AREA", "NOPOL", "TIPE", "EDITOR", "LAMA CEK DATA", "ADMIN CROSS CEK", "JAM MULAI", "JAM SELESAI", "TARIF UNIT", "TOTAL TARIF", "TOTAL BIAYA OP", "PROFIT", "WEEK"],
    sortable: {
        "ID_KEY": "id_key",
        "TANGGAL": "tanggal",
        "AREA": "area",
        "NOPOL": "nopol",
        "TIPE": "tipe_unit",
        "EDITOR": "nama_admin",
        "TARIF UNIT": "tarif_unit",
        "TOTAL TARIF": "total_tarif",
        "TOTAL BIAYA OP": "total_biaya_operasional",
        "WEEK": "week",
    },
    renderCell: (row) => [
        <td key="id_key" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-slate-900">
            <div className="flex items-center gap-1">
                <span className="truncate max-w-[120px]">{row.id_key || "-"}</span>
                <ChevronRight size={14} className="shrink-0 text-slate-300" />
            </div>
        </td>,
        <td key="tanggal" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.tanggal || "-"}</td>,
        <td key="area" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.area || "-"}</td>,
        <td key="nopol" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-blue-600">{row.nopol || "-"}</td>,
        <td key="tipe" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.tipe || "-"}</td>,
        <td key="editor" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.editor || "-"}</td>,
        <td key="lama_cek_data" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.lama_cek_data || "-"}</td>,
        <td key="admin_cross_cek" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.admin_cross_cek || "-"}</td>,
        <td key="jam_mulai" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.jam_mulai || "-"}</td>,
        <td key="jam_selesai" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{row.jam_selesai || "-"}</td>,
        <td key="tarif_unit" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-slate-950 whitespace-nowrap">{formatRp(row.tarif_unit)}</td>,
        <td key="total_tarif" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-slate-950 whitespace-nowrap">{formatRp(row.total_tarif)}</td>,
        <td key="total_biaya_operasional" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{formatRp(row.total_biaya_operasional)}</td>,
        <td key="profit" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-emerald-600 whitespace-nowrap">{formatRp(row.profit)}</td>,
        <td key="week" className="px-3 py-3 text-sm font-semibold text-slate-700">{row.week || "-"}</td>,
    ],
};

const LCL_CONFIG = {
    columns: ["ID_KEY", "TANGGAL", "AREA", "NO STT", "KATEGORI", "TARIF", "BIAYA", "PROFIT", "WEEK"],
    sortable: {
        "ID_KEY": "id_key",
        "TANGGAL": "tanggal",
        "AREA": "kota_tujuan",
        "NO STT": "no_stt",
        "KATEGORI": "katagori_barang",
        "TARIF": "total_ongkir",
        "BIAYA": "biaya_kirim",
        "WEEK": "week",
    },
    renderCell: (row) => [
        <td key="id_key" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-slate-900"><span className="inline-flex items-center gap-1">{row.id_key || "-"}<ChevronRight size={14} className="text-slate-300" /></span></td>,
        <td key="tanggal" className="whitespace-nowrap border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.tanggal || "-"}</td>,
        <td key="area" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.area || "-"}</td>,
        <td key="nopol" className="border-r border-slate-100 px-3 py-3 text-sm font-black text-blue-600">{row.nopol || "-"}</td>,
        <td key="tipe" className="border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{row.tipe || "-"}</td>,
        <td key="tarif" className="whitespace-nowrap border-r border-slate-100 px-3 py-3 text-sm font-black text-slate-950">{formatRp(row.tarif)}</td>,
        <td key="biaya" className="whitespace-nowrap border-r border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">{formatRp(row.biaya)}</td>,
        <td key="profit" className="whitespace-nowrap border-r border-slate-100 px-3 py-3 text-sm font-black text-emerald-600">{formatRp(row.profit)}</td>,
        <td key="week" className="px-3 py-3 text-sm font-semibold text-slate-700">{row.week || "-"}</td>,
    ],
};

export default function OperationTable({ title, type, rows: paginator = {}, filters = {}, summary = {} }) {
    const [search, setSearch] = useState(filters.SEARCH || "");
    const lastRequestedSearch = useRef(filters.SEARCH || "");
    const basePath = `/profit-unit/${type}/table`;

    const { data: rows = [], current_page, last_page, from, to, total } = paginator;

    const config = useMemo(() => type === 'secondary' ? SECONDARY_CONFIG : type === 'lcl' ? LCL_CONFIG : PRIMARY_CONFIG, [type]);
    const defaultSort = type === 'primary' ? 'tanggal_muat' : 'tanggal';
    const sort = filters.SORT || defaultSort;
    const direction = filters.DIRECTION || 'desc';

    useEffect(() => {
        const normalizedSearch = search.trim();
        if (normalizedSearch === lastRequestedSearch.current) return undefined;

        const timeout = window.setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            params.set('nopol', filters.NOPOL || 'ALL');
            params.set('area', filters.AREA || 'ALL');
            normalizedSearch ? params.set('search', normalizedSearch) : params.delete('search');
            params.delete('page');
            lastRequestedSearch.current = normalizedSearch;

            router.get(`${basePath}?${params.toString()}`, {}, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 400);

        return () => window.clearTimeout(timeout);
    }, [basePath, filters.AREA, filters.NOPOL, search]);

    const toggleSort = (column) => {
        const dbColumn = config.sortable[column];
        if (!dbColumn) return;

        const params = new URLSearchParams(window.location.search);
        params.set('sort', dbColumn);
        params.set('direction', sort === dbColumn && direction === 'asc' ? 'desc' : 'asc');
        params.delete('page');

        router.get(`${basePath}?${params.toString()}`, {}, {
            preserveScroll: true,
        });
    };

    const goToPage = (page) => {
        if (!page || page < 1 || page > last_page) return;

        const params = new URLSearchParams(window.location.search);
        params.set('page', page);

        router.get(`${basePath}?${params.toString()}`, {}, {
            preserveScroll: true,
        });
    };

    const pageNumbers = [];
    if (last_page <= 7) {
        for (let i = 1; i <= last_page; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        if (current_page > 3) pageNumbers.push('...');
        const start = Math.max(2, current_page - 1);
        const end = Math.min(last_page - 1, current_page + 1);
        for (let i = start; i <= end; i++) pageNumbers.push(i);
        if (current_page < last_page - 2) pageNumbers.push('...');
        pageNumbers.push(last_page);
    }

    return (
        <AdminLayout>
            <Head title={title} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link
                                href={`/profit-unit/${type}`}
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                            >
                                <ArrowLeft size={19} />
                            </Link>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">
                                    Profit Unit
                                </p>
                                <h1 className="truncate text-xl font-black uppercase text-slate-950">{title}</h1>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="grid w-10 place-items-center text-slate-400">
                                    <Search size={17} />
                                </div>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari tanggal, area, nopol..."
                                    className="w-full min-w-0 border-0 px-1 text-sm font-semibold text-slate-800 outline-none focus:ring-0 sm:w-72"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => router.reload({ preserveScroll: true })}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-black uppercase tracking-wide text-slate-700 transition hover:bg-slate-50"
                            >
                                <RefreshCw size={15} />
                                Sync
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Total Record</p>
                        <p className="mt-2 text-lg font-black text-slate-950">{Number(total || 0).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Total Tarif</p>
                        <p className="mt-2 break-words text-lg font-black text-blue-600">{formatRp(summary.revenue)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Total Biaya</p>
                        <p className="mt-2 break-words text-lg font-black text-slate-950">{formatRp(summary.cost)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Total Profit</p>
                        <p className="mt-2 break-words text-lg font-black text-emerald-600">{formatRp(summary.profit)}</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Data Operasional</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Klik salah satu row untuk membuka detail record.</p>
                    </div>
                    <div className="overflow-x-auto">
                            <table className="min-w-[1600px] w-full border-collapse text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {config.columns.map((head) => {
                                            const dbCol = config.sortable[head];
                                            const active = sort === dbCol;
                                            return (
                                                <th
                                                    key={head}
                                                    onClick={() => toggleSort(head)}
                                                    className={`border-r border-slate-200 px-3 py-3 text-[11px] font-black uppercase tracking-wide whitespace-nowrap last:border-r-0 ${
                                                        dbCol ? 'cursor-pointer select-none hover:bg-slate-100' : ''
                                                    } ${active ? 'text-cyan-700' : 'text-slate-700'}`}
                                                >
                                                    <span className="inline-flex items-center gap-1">
                                                        {head}
                                                        {dbCol && (
                                                            active ? (
                                                                direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                                                            ) : (
                                                                <span className="text-slate-300"><ArrowUp size={13} /></span>
                                                            )
                                                        )}
                                                    </span>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.length ? rows.map((row, index) => (
                                        <tr
                                            key={`${row.id_key || "row"}-${index}`}
                                            onClick={() => router.get(`${basePath}/${row.id_key}`)}
                                            className="cursor-pointer hover:bg-cyan-50/50"
                                        >
                                            {config.renderCell(row)}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={config.columns.length} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                                Data tidak ditemukan untuk filter ini.
                                            </td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </div>

                    {last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                            <p className="text-xs font-semibold text-slate-500">
                                Menampilkan {from}–{to} dari {total}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(1)}
                                    disabled={current_page <= 1}
                                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronsLeft size={16} />
                                </button>
                                <button
                                    onClick={() => goToPage(current_page - 1)}
                                    disabled={current_page <= 1}
                                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                {pageNumbers.map((page, i) =>
                                    page === '...' ? (
                                        <span key={`ellipsis-${i}`} className="px-1 text-xs font-bold text-slate-400">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`grid h-8 min-w-[32px] place-items-center rounded-lg px-2 text-xs font-black transition ${
                                                page === current_page
                                                    ? 'bg-cyan-700 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    onClick={() => goToPage(current_page + 1)}
                                    disabled={current_page >= last_page}
                                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    onClick={() => goToPage(last_page)}
                                    disabled={current_page >= last_page}
                                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
                                >
                                    <ChevronsRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
