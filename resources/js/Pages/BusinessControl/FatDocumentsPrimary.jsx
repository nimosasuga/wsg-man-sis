import React, { useState, Component } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import {
    FileText, Search, X,
    ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error("FatDocumentsPrimary error:", error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <AdminLayout>
                    <div className="flex min-h-[60vh] items-center justify-center">
                        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                            <AlertCircle size={40} className="mx-auto mb-4 text-rose-400" />
                            <h2 className="mb-2 text-lg font-black text-slate-800">Terjadi Kesalahan</h2>
                            <p className="mb-4 text-sm text-slate-500">{this.state.error?.message || "Gagal memuat halaman"}</p>
                            <button onClick={() => window.location.reload()}
                                className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-600">
                                Muat Ulang
                            </button>
                        </div>
                    </div>
                </AdminLayout>
            );
        }
        return this.props.children;
    }
}

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

const COLUMNS = [
    { key: "no_bap", label: "No BAP" },
    { key: "area", label: "Area" },
    { key: "week", label: "Week" },
    { key: "tanggal_muat", label: "Tgl Muat" },
    { key: "tanggal_terima", label: "Tgl Terima" },
    { key: "rute_asal", label: "Rute Asal" },
    { key: "rute_tujuan", label: "Rute Tujuan" },
    { key: "vendor", label: "Vendor" },
    { key: "nopol_driver", label: "Nopol Driver" },
    { key: "qty", label: "Qty" },
    { key: "jenis", label: "Jenis" },
    { key: "total", label: "Total" },
    { key: "no_po", label: "No PO" },
    { key: "no_si", label: "No SI" },
    { key: "no_sj", label: "No SJ" },
    { key: "tarif", label: "Tarif" },
    { key: "total_tarif", label: "Total Tarif" },
    { key: "tarif_vendor", label: "Tarif Vendor" },
    { key: "total_biaya", label: "Total Biaya" },
    { key: "productivity", label: "Produktivitas" },
    { key: "profit", label: "Profit" },
    { key: "status_dokument", label: "Status Dok" },
    { key: "tanggal_dokument_naik", label: "Tgl Dok Naik" },
];

const STATUS_OPTIONS = [
    { value: "", label: "Semua Status" },
    { value: "DITERIMA FAT", label: "DITERIMA FAT" },
    { value: "BELUM NAIK", label: "BELUM NAIK" },
];

export default function FatDocumentsPrimary({ records, kategoriList, regionalList, vendorList, jenisList, weekList, filters }) {
    const [status, setStatus] = useState(filters?.status || "");
    const [search, setSearch] = useState(filters?.search || "");
    const [selectedKategori, setSelectedKategori] = useState(filters?.kategori || "");
    const [regional, setRegional] = useState(filters?.regional || "");
    const [vendor, setVendor] = useState(filters?.vendor || "");
    const [jenis, setJenis] = useState(filters?.jenis || "");
    const [week, setWeek] = useState(filters?.week || "");
    const [tglMulai, setTglMulai] = useState(filters?.tanggal_mulai || "");
    const [tglSelesai, setTglSelesai] = useState(filters?.tanggal_selesai || "");

    const data = Array.isArray(records?.data) ? records.data : [];
    const paginator = records && typeof records === "object" ? records : {};
    const katList = Array.isArray(kategoriList) ? kategoriList : [];
    const regList = Array.isArray(regionalList) ? regionalList : [];
    const venList = Array.isArray(vendorList) ? vendorList : [];
    const jenList = Array.isArray(jenisList) ? jenisList : [];
    const wkList = Array.isArray(weekList) ? weekList : [];

    const buildParams = (overrides = {}) => {
        const p = new URLSearchParams();
        const s = overrides.status !== undefined ? overrides.status : status;
        const q = overrides.search !== undefined ? overrides.search : search;
        const k = overrides.kategori !== undefined ? overrides.kategori : selectedKategori;
        const r = overrides.regional !== undefined ? overrides.regional : regional;
        const v = overrides.vendor !== undefined ? overrides.vendor : vendor;
        const j = overrides.jenis !== undefined ? overrides.jenis : jenis;
        const w = overrides.week !== undefined ? overrides.week : week;
        const tm = overrides.tanggal_mulai !== undefined ? overrides.tanggal_mulai : tglMulai;
        const ts = overrides.tanggal_selesai !== undefined ? overrides.tanggal_selesai : tglSelesai;
        if (s) p.set("status", s);
        if (q) p.set("search", q);
        if (k) p.set("kategori", k);
        if (r) p.set("regional", r);
        if (v) p.set("vendor", v);
        if (j) p.set("jenis", j);
        if (w) p.set("week", w);
        if (tm) p.set("tanggal_mulai", tm);
        if (ts) p.set("tanggal_selesai", ts);
        return p;
    };

    const pageUrl = (page) => {
        const p = buildParams();
        return `/business-control/fat-primary?page=${page}${p.toString() ? "&" + p.toString() : ""}`;
    };

    const applyFilter = (overrides = {}) => {
        const p = buildParams(overrides);
        router.visit(`/business-control/fat-primary?${p.toString()}`, { preserveScroll: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilter({ search });
    };

    const clearSearch = () => {
        setSearch("");
        applyFilter({ search: "" });
    };

    const renderCell = (row, col) => {
        let val = row[col.key];
        if (["total_tarif", "total_biaya", "tarif", "tarif_vendor", "profit"].includes(col.key)) {
            val = formatRp(val);
        } else if (col.key === "productivity") {
            val = val != null ? `${val}%` : "—";
        } else if (col.key === "status_dokument") {
            val = val === "DITERIMA" ? "DITERIMA FAT" : (val || "BELUM NAIK");
        } else {
            val = val ?? "—";
        }
        return val;
    };

    const paginate = (items) => {
        const last = paginator.last_page || 1;
        const curr = paginator.current_page || 1;
        if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
        if (curr <= 4) return [1, 2, 3, 4, 5, 6, 7];
        if (curr >= last - 3) return Array.from({ length: 7 }, (_, i) => last - 6 + i);
        return [curr - 3, curr - 2, curr - 1, curr, curr + 1, curr + 2, curr + 3];
    };

    return (
        <ErrorBoundary>
        <AdminLayout>
            <Head title="FAT Document - Primary" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900">FAT Document Primary</h1>
                    <p className="mt-1 text-sm font-medium text-slate-400">
                        {paginator.total || 0} dokumen terdaftar
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={status} onChange={(e) => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <form onSubmit={handleSearch} className="relative">
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nopol atau area..."
                            className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        {search && (
                            <button type="button" onClick={clearSearch}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </form>
                </div>
            </div>

            <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[140px]">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Regional</p>
                        <select value={regional} onChange={(e) => { setRegional(e.target.value); applyFilter({ regional: e.target.value }); }}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                            <option value="">Semua Regional</option>
                            {regList.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[160px]">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Vendor</p>
                        <select value={vendor} onChange={(e) => { setVendor(e.target.value); applyFilter({ vendor: e.target.value }); }}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                            <option value="">Semua Vendor</option>
                            {venList.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[120px]">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Jenis</p>
                        <select value={jenis} onChange={(e) => { setJenis(e.target.value); applyFilter({ jenis: e.target.value }); }}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                            <option value="">Semua Jenis</option>
                            {jenList.map((j) => <option key={j} value={j}>{j}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[100px]">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Week</p>
                        <select value={week} onChange={(e) => { setWeek(e.target.value); applyFilter({ week: e.target.value }); }}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
                            <option value="">Semua Week</option>
                            {wkList.map((w) => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[140px]">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Tgl Mulai</p>
                        <input type="date" value={tglMulai} onChange={(e) => { setTglMulai(e.target.value); applyFilter({ tanggal_mulai: e.target.value }); }}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <div className="min-w-[140px]">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Tgl Selesai</p>
                        <input type="date" value={tglSelesai} onChange={(e) => { setTglSelesai(e.target.value); applyFilter({ tanggal_selesai: e.target.value }); }}
                            className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
                    </div>
                    <button onClick={() => {
                        setRegional(""); setVendor(""); setJenis(""); setWeek("");
                        setTglMulai(""); setTglSelesai("");
                        applyFilter({ regional: "", vendor: "", jenis: "", week: "", tanggal_mulai: "", tanggal_selesai: "" });
                    }}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700">
                        Reset
                    </button>
                </div>
            </div>

            <div className="flex gap-6">
                {/* KATEGORI Sidebar */}
                <aside className="hidden w-52 shrink-0 lg:block">
                    <div className="rounded-xl bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3">
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Kategori</p>
                        </div>
                        <div className="space-y-0.5 p-2">
                            <button onClick={() => { setSelectedKategori(""); applyFilter({ kategori: "" }); }}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${
                                    !selectedKategori ? "bg-blue-500/15 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${!selectedKategori ? "bg-blue-500" : "bg-slate-300"}`} />
                                Semua
                            </button>
                            {katList.map((k) => (
                                <button key={k} onClick={() => { setSelectedKategori(k); applyFilter({ kategori: k }); }}
                                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold transition ${
                                        selectedKategori === k ? "bg-blue-500/15 text-blue-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                                >
                                    <span className={`h-2 w-2 rounded-full ${selectedKategori === k ? "bg-blue-500" : "bg-slate-300"}`} />
                                    {k}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Table */}
                <div className="min-w-0 flex-1">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="sticky left-0 z-10 bg-slate-50/80 px-3 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">#</th>
                                        {COLUMNS.map((col) => (
                                            <th key={col.key} className="whitespace-nowrap px-3 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, i) => (
                                        <tr key={row.id_key} onClick={() => router.visit(`/business-control/fat-primary/${row.id_key}`)}
                                            className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/60">
                                            <td className="sticky left-0 z-10 bg-white px-3 py-2.5 text-xs font-bold text-slate-400">
                                                {(paginator.from || 0) + i}
                                            </td>
                                            {COLUMNS.map((col) => (
                                                <td key={col.key} className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-slate-700">
                                                    {renderCell(row, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={COLUMNS.length + 1} className="px-3 py-12 text-center text-sm font-semibold text-slate-400">
                                                Tidak ada data ditemukan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {(paginator.last_page || 0) > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                                <p className="text-xs font-semibold text-slate-400">
                                    Menampilkan {paginator.from}–{paginator.to} dari {paginator.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button disabled={(paginator.current_page || 1) <= 1}
                                        onClick={() => router.visit(pageUrl(1), { preserveScroll: true })}
                                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30">
                                        <ChevronLeft size={14} />
                                    </button>
                                    {paginate().map((page) => (
                                        <button key={page}
                                            onClick={() => router.visit(pageUrl(page), { preserveScroll: true })}
                                            className={`grid h-7 min-w-[28px] place-items-center rounded-lg px-1.5 text-xs font-bold transition ${
                                                (paginator.current_page || 1) === page
                                                    ? "bg-blue-500 text-white"
                                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button disabled={(paginator.current_page || 1) >= (paginator.last_page || 1)}
                                        onClick={() => router.visit(pageUrl(paginator.last_page), { preserveScroll: true })}
                                        className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30">
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </AdminLayout>
        </ErrorBoundary>
    );
}