import React, { useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    Filter,
    Image as ImageIcon,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    Search,
    SearchX,
} from "lucide-react";

const normalize = (value) => (value ? String(value).toUpperCase() : "TIDAK DIKETAHUI");
const searchText = (row, keys) => keys.map((key) => row?.[key] ?? "").join(" ").toLowerCase();

export default function AssetHo({ rawTableData = [] }) {
    const permissions = usePage().props.auth?.permissions || [];
    const canManageInventory = permissions.includes("inventory.manage");
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
    const [isJenisMenuOpen, setIsJenisMenuOpen] = useState(true);
    const [activeJenis, setActiveJenis] = useState("ALL");
    const [activeLokasi, setActiveLokasi] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const jenisList = useMemo(() => {
        const counts = rawTableData.reduce((acc, item) => {
            const label = normalize(item.jenis_barang);
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [rawTableData]);

    const lokasiList = useMemo(() => {
        return [...new Set(rawTableData.map((item) => item.lokasi))]
            .filter(Boolean)
            .sort()
            .map((lokasi) => ({ name: lokasi }));
    }, [rawTableData]);

    const filteredData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return rawTableData.filter((item) => {
            const matchJenis = activeJenis === "ALL" || normalize(item.jenis_barang) === activeJenis;
            const matchLokasi = activeLokasi === "ALL" || item.lokasi === activeLokasi;
            const matchSearch =
                !query ||
                searchText(item, [
                    "jenis_barang",
                    "nama_pengguna",
                    "katagori",
                    "model_unit",
                    "divisi",
                    "lokasi",
                    "status",
                    "warna",
                    "serial_number",
                    "keterangan",
                ]).includes(query);
            return matchJenis && matchLokasi && matchSearch;
        });
    }, [rawTableData, activeJenis, activeLokasi, searchQuery]);

    const sortedAndFilteredData = useMemo(() => {
        const rows = [...filteredData];
        if (!sortConfig.key) return rows;

        return rows.sort((a, b) => {
            const aValue = normalize(a[sortConfig.key]).toLowerCase();
            const bValue = normalize(b[sortConfig.key]).toLowerCase();
            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const countJenis = (jenis) =>
        rawTableData.filter((item) => jenis === "ALL" || normalize(item.jenis_barang) === jenis).length;

    const countLokasi = (lokasi) =>
        rawTableData.filter((item) => item.lokasi === lokasi).length;

    const columns = [
        { label: "JENIS BARANG", key: "jenis_barang" },
        { label: "NAMA PENGGUNA", key: "nama_pengguna" },
        { label: "KATAGORI", key: "katagori" },
        { label: "MODEL UNIT", key: "model_unit" },
        { label: "DIVISI", key: "divisi" },
        { label: "LOKASI", key: "lokasi" },
        { label: "JUMLAH UNIT", key: "jumlah_unit" },
        { label: "STATUS", key: "status" },
        { label: "WARNA", key: "warna" },
        { label: "SERIAL NUMBER", key: "serial_number" },
        { label: "KETERANGAN", key: "keterangan" },
    ];

    return (
        <AdminLayout>
            <Head title="Asset HO" />

            <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-2 flex items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                        <Link href="/inventori/daftar-asset" className="hover:text-violet-600">
                            DAFTAR ASSET
                        </Link>
                        <ChevronRight size={14} className="mx-1" />
                        <span className="text-gray-800">ASSET HO</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-gray-800">
                            Asset HO
                        </h1>
                        <button
                            onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:border-violet-200 hover:text-violet-600"
                        >
                            {isFilterSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                        </button>
                    </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Cari pengguna, jenis, lokasi..."
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        />
                    </div>
                    {canManageInventory && (
                        <Link
                            href="/module-records/asset-ho/create"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-violet-700 sm:w-auto"
                        >
                            <Plus size={16} />
                            Tambah Data
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4 overflow-hidden lg:h-[calc(100vh-180px)] lg:flex-row">
                <div
                    className={`flex shrink-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${isFilterSidebarOpen ? "w-full opacity-100 lg:w-64" : "h-0 w-0 overflow-hidden border-0 opacity-0 lg:h-auto"}`}
                >
                    <div
                        onClick={() => {
                            setActiveJenis("ALL");
                            setActiveLokasi("ALL");
                            setIsJenisMenuOpen(!isJenisMenuOpen);
                        }}
                        className={`flex cursor-pointer items-center justify-between border-b border-gray-100 p-3 transition-colors ${activeJenis === "ALL" && activeLokasi === "ALL" ? "border-blue-100 bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                        <span className={`text-sm font-bold ${activeJenis === "ALL" && activeLokasi === "ALL" ? "text-blue-800" : "text-gray-700"}`}>
                            Semua Data
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{countJenis("ALL")}</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isJenisMenuOpen ? "rotate-0" : "rotate-180"}`} />
                        </span>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${isJenisMenuOpen ? "max-h-64 border-b border-gray-100" : "max-h-0"}`}>
                        {jenisList.map((item) => (
                            <div
                                key={item.name}
                                onClick={() => {
                                    setActiveJenis(item.name);
                                    setActiveLokasi("ALL");
                                }}
                                className={`flex cursor-pointer items-center justify-between p-2 transition-colors ${activeJenis === item.name ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                            >
                                <span className={`truncate pl-2 text-xs font-semibold ${activeJenis === item.name ? "text-blue-700" : "text-gray-600"}`}>
                                    {item.name}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{item.count}</span>
                            </div>
                        ))}
                    </div>

                    <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Filter Lokasi
                        </div>
                        {lokasiList.map((lokasi) => {
                            const isActive = activeLokasi === lokasi.name;
                            return (
                                <div
                                    key={lokasi.name}
                                    onClick={() => setActiveLokasi(isActive ? "ALL" : lokasi.name)}
                                    className={`flex cursor-pointer items-center justify-between rounded-md px-4 py-2 transition-colors ${isActive ? "border border-blue-100 bg-blue-50" : "hover:bg-gray-50"}`}
                                >
                                    <span className={`text-[11px] font-bold ${isActive ? "text-blue-700" : "text-gray-600"}`}>{lokasi.name}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-400"}`}>{countLokasi(lokasi.name)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
                    <div className="custom-scrollbar flex-1 overflow-auto">
                        {sortedAndFilteredData.length > 0 ? (
                            <table className="w-full border-collapse text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
                                    <tr>
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                onClick={() => handleSort(col.key)}
                                                className="group cursor-pointer select-none border-r border-gray-100 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-colors last:border-r-0 hover:bg-gray-200"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{col.label}</span>
                                                    {sortConfig.key === col.key ? (
                                                        sortConfig.direction === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="text-gray-300 transition-colors group-hover:text-gray-500" />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
                                            GAMBAR
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedAndFilteredData.map((row) => (
                                        <tr
                                            key={row.id_key}
                                            onClick={() => router.get(`/inventori/daftar-asset/asset-ho/${row.id_key}`)}
                                            className="group cursor-pointer transition-colors hover:bg-blue-50/50"
                                        >
                                            {columns.map((col) => (
                                                <td key={col.key} className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                    {row[col.key] || "-"}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2.5 text-center">
                                                {row.gambar ? (
                                                    <div className="inline-flex h-6 w-8 items-center justify-center rounded border border-blue-200 bg-blue-100 text-blue-600">
                                                        <ImageIcon size={14} />
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-400">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                <SearchX size={48} className="mb-4 text-gray-300" />
                                <p className="text-sm font-semibold">Tidak ada data ditemukan</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
