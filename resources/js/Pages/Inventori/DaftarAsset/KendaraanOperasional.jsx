import React, { useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    Image as ImageIcon,
    PanelLeftClose,
    PanelLeftOpen,
    SearchX,
} from "lucide-react";

const normalize = (value) => (value ? String(value).toUpperCase() : "TIDAK DIKETAHUI");

export default function KendaraanOperasional({ rawTableData = [] }) {
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
    const [isJenisMenuOpen, setIsJenisMenuOpen] = useState(true);
    const [activeJenis, setActiveJenis] = useState("ALL");
    const [activeArea, setActiveArea] = useState("ALL");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const jenisList = useMemo(() => {
        const counts = rawTableData.reduce((acc, item) => {
            const label = normalize(item.jenis || item.tipe);
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [rawTableData]);

    const areaList = useMemo(() => {
        return [...new Set(rawTableData.map((item) => item.area))]
            .filter(Boolean)
            .sort()
            .map((area) => ({ name: area }));
    }, [rawTableData]);

    const filteredData = useMemo(() => {
        return rawTableData.filter((item) => {
            const matchJenis = activeJenis === "ALL" || normalize(item.jenis || item.tipe) === activeJenis;
            const matchArea = activeArea === "ALL" || item.area === activeArea;
            return matchJenis && matchArea;
        });
    }, [rawTableData, activeJenis, activeArea]);

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
        rawTableData.filter((item) => jenis === "ALL" || normalize(item.jenis || item.tipe) === jenis).length;

    const countArea = (area) => rawTableData.filter((item) => item.area === area).length;

    const columns = [
        { label: "JENIS", key: "jenis" },
        { label: "NOPOL", key: "nopol" },
        { label: "AREA", key: "area" },
        { label: "TIPE", key: "tipe" },
        { label: "PABRIKAN", key: "pabrikan" },
        { label: "MODEL", key: "model" },
        { label: "TAHUN", key: "tahun" },
        { label: "GPS", key: "gps" },
        { label: "STNK", key: "status_stnk" },
        { label: "PAJAK", key: "status_pajak" },
        { label: "KIR", key: "status_kir" },
    ];

    return (
        <AdminLayout>
            <Head title="Kendaraan Operasional" />

            <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-2 flex items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                        <Link href="/inventori/daftar-asset" className="hover:text-blue-600">
                            DAFTAR ASSET
                        </Link>
                        <ChevronRight size={14} className="mx-1" />
                        <span className="text-gray-800">KENDARAAN OPERASIONAL</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-gray-800">
                            Kendaraan Operasional
                        </h1>
                        <button
                            onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                            className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-400 shadow-sm transition-colors hover:text-blue-600"
                        >
                            {isFilterSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-180px)] flex-col gap-4 overflow-hidden md:flex-row">
                <div
                    className={`flex shrink-0 origin-left flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${isFilterSidebarOpen ? "w-full opacity-100 md:w-64" : "w-0 overflow-hidden border-0 opacity-0"}`}
                >
                    <div
                        onClick={() => {
                            setActiveJenis("ALL");
                            setActiveArea("ALL");
                            setIsJenisMenuOpen(!isJenisMenuOpen);
                        }}
                        className={`flex cursor-pointer items-center justify-between border-b border-gray-100 p-3 transition-colors ${activeJenis === "ALL" && activeArea === "ALL" ? "border-blue-100 bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                        <span className={`text-sm font-bold ${activeJenis === "ALL" && activeArea === "ALL" ? "text-blue-800" : "text-gray-700"}`}>
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
                                    setActiveArea("ALL");
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
                            Filter Area
                        </div>
                        {areaList.map((area) => {
                            const isActive = activeArea === area.name;
                            return (
                                <div
                                    key={area.name}
                                    onClick={() => setActiveArea(isActive ? "ALL" : area.name)}
                                    className={`flex cursor-pointer items-center justify-between rounded-md px-4 py-2 transition-colors ${isActive ? "border border-blue-100 bg-blue-50" : "hover:bg-gray-50"}`}
                                >
                                    <span className={`text-[11px] font-bold ${isActive ? "text-blue-700" : "text-gray-600"}`}>{area.name}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-400"}`}>{countArea(area.name)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300">
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
                                            FOTO UNIT
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedAndFilteredData.map((row) => (
                                        <tr
                                            key={row.id_key}
                                            onClick={() => router.get(`/inventori/daftar-asset/kendaraan-operasional/${row.id_key}`)}
                                            className="group cursor-pointer transition-colors hover:bg-blue-50/50"
                                        >
                                            {columns.map((col) => (
                                                <td key={col.key} className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                    {row[col.key] || "-"}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2.5 text-center">
                                                {row.foto_unit ? (
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
