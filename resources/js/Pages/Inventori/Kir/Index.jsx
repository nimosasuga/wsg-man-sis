// resources/js/Pages/Inventori/Kir/Index.jsx
import React, { useState, useMemo } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ChevronRight,
    ChevronDown,
    Filter,
    Image as ImageIcon,
    PanelLeftClose,
    PanelLeftOpen,
    SearchX,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";

export default function Index({ rawTableData = [] }) {
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(true);
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [activeArea, setActiveArea] = useState("ALL");

    // STATE UNTUK SORTING
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    const areaList = useMemo(() => {
        const uniqueAreas = [...new Set(rawTableData.map((item) => item.area))];
        return uniqueAreas
            .filter(Boolean)
            .sort()
            .map((area) => ({ name: area }));
    }, [rawTableData]);

    // FILTER DATA (Fokus pada status_kir)
    const filteredData = useMemo(() => {
        return rawTableData.filter((item) => {
            const matchStatus =
                activeStatus === "ALL" || item.status_kir === activeStatus;
            const matchArea = activeArea === "ALL" || item.area === activeArea;
            return matchStatus && matchArea;
        });
    }, [activeStatus, activeArea, rawTableData]);

    // SORTING LOGIC
    const sortedAndFilteredData = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key]
                    ? a[sortConfig.key].toString().toLowerCase()
                    : "";
                const bValue = b[sortConfig.key]
                    ? b[sortConfig.key].toString().toLowerCase()
                    : "";
                if (aValue < bValue)
                    return sortConfig.direction === "asc" ? -1 : 1;
                if (aValue > bValue)
                    return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredData, sortConfig]);

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const countStatus = (status) =>
        rawTableData.filter((item) =>
            status === "ALL" ? true : item.status_kir === status,
        ).length;
    const countArea = (areaName) =>
        rawTableData.filter((item) => item.area === areaName).length;

    // DEFINISI KOLOM UNTUK DILOOP
    const columns = [
        { label: "STATUS KIR", key: "status_kir" },
        { label: "JATUH TEMPO KIR", key: "jatuh_tempo_kir" },
        { label: "JATUH TEMPO PAJAK", key: "jatuh_tempo_pajak" },
        { label: "AREA", key: "area" },
        { label: "NOPOL", key: "nopol" },
        { label: "TIPE", key: "tipe" },
        { label: "PABRIKAN", key: "pabrikan" },
        { label: "MODEL", key: "model" },
    ];

    return (
        <AdminLayout>
            <Head title="Status KIR - Detail" />

            <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600">
                            DASHBOARD
                        </Link>
                        <ChevronRight size={14} className="mx-1" />
                        <span className="text-gray-800">STATUS KIR</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            Data KIR Unit
                        </h1>
                        <button
                            onClick={() =>
                                setIsFilterSidebarOpen(!isFilterSidebarOpen)
                            }
                            className="text-gray-400 hover:text-blue-600 bg-white border border-gray-200 p-1.5 rounded-md shadow-sm transition-colors"
                        >
                            {isFilterSidebarOpen ? (
                                <PanelLeftClose size={18} />
                            ) : (
                                <PanelLeftOpen size={18} />
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all">
                        + Tambah Data
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-180px)] overflow-hidden">
                {/* SIDEBAR FILTER */}
                <div
                    className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0 transition-all duration-300 ease-in-out origin-left ${isFilterSidebarOpen ? "w-full md:w-64 opacity-100" : "w-0 opacity-0 border-0 overflow-hidden"}`}
                >
                    <div
                        onClick={() => {
                            setActiveStatus("ALL");
                            setActiveArea("ALL");
                            setIsStatusMenuOpen(!isStatusMenuOpen);
                        }}
                        className={`p-3 border-b border-gray-100 flex justify-between items-center cursor-pointer transition-colors ${activeStatus === "ALL" && activeArea === "ALL" ? "bg-blue-50 border-blue-100" : "hover:bg-gray-50"}`}
                    >
                        <span
                            className={`font-bold text-sm ${activeStatus === "ALL" && activeArea === "ALL" ? "text-blue-800" : "text-gray-700"}`}
                        >
                            Semua Data
                        </span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isStatusMenuOpen ? "rotate-0" : "rotate-180"} ${activeStatus === "ALL" ? "text-blue-600" : "text-gray-400"}`}
                        />
                    </div>

                    <div
                        className={`overflow-hidden transition-all duration-300 ${isStatusMenuOpen ? "max-h-40 border-b border-gray-100" : "max-h-0"}`}
                    >
                        {["AKTIF", "EXPIRED", "HAMPIR EXPIRED"].map((status) => (
                            <div
                                key={status}
                                onClick={() => {
                                    setActiveStatus(status);
                                    setActiveArea("ALL");
                                }}
                                className={`p-2 flex justify-between items-center cursor-pointer transition-colors ${activeStatus === status ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                            >
                                <div className="flex items-center pl-2">
                                    <span
                                        className={`w-2 h-2 rounded-full mr-2 ${status === "AKTIF" ? "bg-green-500" : status === "EXPIRED" ? "bg-red-500" : "bg-amber-500"}`}
                                    ></span>
                                    <span
                                        className={`font-semibold text-xs ${activeStatus === status ? "text-blue-700" : "text-gray-600"}`}
                                    >
                                        {status}
                                    </span>
                                </div>
                                <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                    {countStatus(status)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Filter Area
                        </div>
                        {areaList.map((area, idx) => {
                            const isActive = activeArea === area.name;
                            return (
                                <div
                                    key={idx}
                                    onClick={() =>
                                        setActiveArea(
                                            isActive ? "ALL" : area.name,
                                        )
                                    }
                                    className={`flex justify-between items-center px-4 py-2 rounded-md cursor-pointer transition-colors ${isActive ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50"}`}
                                >
                                    <span
                                        className={`text-[11px] font-bold ${isActive ? "text-blue-700" : "text-gray-600"}`}
                                    >
                                        {area.name}
                                    </span>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-400"}`}
                                    >
                                        {countArea(area.name)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MAIN TABLE */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                        {sortedAndFilteredData.length > 0 ? (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                    <tr>
                                        {columns.map((col, idx) => (
                                            <th
                                                key={idx}
                                                onClick={() =>
                                                    handleSort(col.key)
                                                }
                                                className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-gray-200 transition-colors group select-none"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{col.label}</span>
                                                    {sortConfig.key ===
                                                    col.key ? (
                                                        sortConfig.direction ===
                                                        "asc" ? (
                                                            <ArrowUp
                                                                size={12}
                                                                className="text-blue-600"
                                                            />
                                                        ) : (
                                                            <ArrowDown
                                                                size={12}
                                                                className="text-blue-600"
                                                            />
                                                        )
                                                    ) : (
                                                        <ArrowUpDown
                                                            size={12}
                                                            className="text-gray-300 group-hover:text-gray-500 transition-colors"
                                                        />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider border-r border-gray-100">
                                            FOTO BUKU KIR
                                        </th>
                                        <th className="px-3 py-3 w-10 sticky right-0 bg-gray-50 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedAndFilteredData.map((row) => (
                                        <tr
                                            key={row.id_key}
                                            onClick={() =>
                                                router.get(
                                                    `/inventori/kir/${row.nopol}`,
                                                )
                                            }
                                            className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-4 py-2.5 border-r border-gray-50">
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-1 rounded-md ${row.status_kir === "AKTIF" ? "bg-green-100 text-green-700" : row.status_kir === "EXPIRED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                                                >
                                                    {row.status_kir || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-700 font-medium border-r border-gray-50">
                                                {row.jatuh_tempo_kir}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-700 font-medium border-r border-gray-50">
                                                {row.jatuh_tempo_pajak}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-700 font-medium border-r border-gray-50">
                                                {row.area}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-900 font-bold border-r border-gray-50">
                                                <span className="group-hover:text-blue-600 transition-colors">
                                                    {row.nopol}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-600 border-r border-gray-50">
                                                {row.tipe}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-600 border-r border-gray-50">
                                                {row.pabrikan}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-600 border-r border-gray-50">
                                                {row.model}
                                            </td>
                                            <td className="px-4 py-2.5 border-r border-gray-50 text-center">
                                                {row.foto_buku_kir ? (
                                                    <div className="inline-flex w-8 h-6 bg-blue-100 rounded border border-blue-200 items-center justify-center text-blue-600">
                                                        <ImageIcon size={14} />
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-bold">
                                                        N/A
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 sticky right-0 bg-white group-hover:bg-blue-50/50 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.02)] text-center">
                                                <div className="inline-flex text-gray-300 group-hover:text-blue-600 group-hover:bg-white p-1 rounded transition-all shadow-sm border border-transparent group-hover:border-gray-200 pointer-events-none">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <SearchX
                                    size={48}
                                    className="mb-4 text-gray-300"
                                />
                                <p className="font-semibold text-sm">
                                    Tidak ada data ditemukan
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

