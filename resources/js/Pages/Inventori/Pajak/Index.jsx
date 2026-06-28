import { Head, Link, router } from "@inertiajs/react";
import React, { useState, useMemo } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import {
    ChevronRight,
    ChevronDown,
    Filter,
    Image as ImageIcon,
    PanelLeftClose,
    PanelLeftOpen,
    SearchX,
} from "lucide-react";

export default function Index({ rawTableData }) {
    // 1. STATE MANAGEMENT (Menyimpan status interaksi UI)
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(true);
    const [activeStatus, setActiveStatus] = useState("ALL"); // 'ALL', 'AKTIF', 'EXPIRED'
    const [activeArea, setActiveArea] = useState("ALL");

    // Dummy Area List
    const areaList = [
        { name: "AIR MOLEK" },
        { name: "AMBON" },
        { name: "BALIKPAPAN" },
        { name: "BANDUNG" },
        { name: "BANYUWANGI" },
        { name: "BATAM" },
        { name: "KUPANG" },
        { name: "MAKASSAR" },
    ];

    // 3. LOGIKA FILTER REAL-TIME
    const filteredData = useMemo(() => {
        return rawTableData.filter((item) => {
            const matchStatus =
                activeStatus === "ALL" || item.status === activeStatus;
            const matchArea = activeArea === "ALL" || item.area === activeArea;
            return matchStatus && matchArea;
        });
    }, [activeStatus, activeArea, rawTableData]);

    // Kalkulasi jumlah data untuk indikator angka di sidebar
    const countStatus = (status) =>
        rawTableData.filter((item) =>
            status === "ALL" ? true : item.status === status,
        ).length;
    const countArea = (areaName) =>
        rawTableData.filter((item) => item.area === areaName).length;

    return (
        <AdminLayout>
            <Head title="Pajak STNK - Detail" />

            {/* Breadcrumb & Header Action */}
            <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">
                        <Link href="/dashboard" className="hover:text-blue-600">
                            DASHBOARD
                        </Link>
                        <ChevronRight size={14} className="mx-1" />
                        <span className="text-gray-800">PAJAK STNK</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            Data Pajak & STNK
                        </h1>
                        {/* Tombol Toggle Sidebar Filter */}
                        <button
                            onClick={() =>
                                setIsFilterSidebarOpen(!isFilterSidebarOpen)
                            }
                            className="text-gray-400 hover:text-blue-600 bg-white border border-gray-200 p-1.5 rounded-md shadow-sm transition-colors"
                            title={
                                isFilterSidebarOpen
                                    ? "Sembunyikan Filter"
                                    : "Tampilkan Filter"
                            }
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
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center">
                        <Filter size={16} className="mr-2" /> Filter Lanjutan
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all">
                        + Tambah Data
                    </button>
                </div>
            </div>

            {/* Layout Utama */}
            <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-180px)] overflow-hidden">
                {/* SIDEBAR FILTER (Interaktif: Hide/Show) */}
                <div
                    className={`bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0 transition-all duration-300 ease-in-out origin-left ${isFilterSidebarOpen ? "w-full md:w-64 opacity-100" : "w-0 opacity-0 border-0 overflow-hidden"}`}
                >
                    {/* Header Filter (ALL Status) */}
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

                    {/* Collapse Menu Status */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ${isStatusMenuOpen ? "max-h-40 border-b border-gray-100" : "max-h-0"}`}
                    >
                        {["AKTIF", "EXPIRED"].map((status) => (
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
                                        className={`w-2 h-2 rounded-full mr-2 ${status === "AKTIF" ? "bg-green-500" : "bg-red-500"}`}
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

                    {/* List Area Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                            Filter Area
                        </div>
                        {areaList.map((area, idx) => {
                            const count = countArea(area.name);
                            const isActive = activeArea === area.name;
                            return (
                                <div
                                    key={idx}
                                    onClick={() =>
                                        setActiveArea(
                                            isActive ? "ALL" : area.name,
                                        )
                                    } // Klik ulang untuk membatalkan filter area
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
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* MAIN DATA TABLE */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden transition-all duration-300">
                    <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                        {filteredData.length > 0 ? (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                    <tr>
                                        {[
                                            "STATUS",
                                            "JATUH TEMPO STNK",
                                            "JATUH TEMPO PAJAK",
                                            "AREA",
                                            "NOPOL",
                                            "TIPE",
                                            "PABRIKAN",
                                            "MODEL",
                                            "FOTO STNK",
                                        ].map((col, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0"
                                            >
                                                {col}
                                            </th>
                                        ))}
                                        <th className="px-3 py-3 w-10 sticky right-0 bg-gray-50 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredData.map((row) => (
                                        <tr
                                            key={row.id_key} // Gunakan id_key asli dari MySQL
                                            onClick={() =>
                                                router.get(
                                                    `/inventori/pajak/${row.nopol}`,
                                                )
                                            }
                                            className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-4 py-2.5 border-r border-gray-50">
                                                {/* Contoh penggunaan kolom asli 'status_stnk' atau 'status_pajak' */}
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-1 rounded-md ${row.status_stnk === "AKTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                                                >
                                                    {row.status_stnk || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-xs text-gray-700 font-medium border-r border-gray-50">
                                                {row.jatuh_tempo_stnk}
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
                                                {row.foto_stnk ? (
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
                            // Tampilan jika filter tidak menemukan data
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <SearchX
                                    size={48}
                                    className="mb-4 text-gray-300"
                                />
                                <p className="font-semibold text-sm">
                                    Tidak ada data ditemukan
                                </p>
                                <p className="text-xs mt-1">
                                    Coba sesuaikan filter status atau area Anda.
                                </p>
                            </div>
                        )}
                    </div>
                    {/* Status Bar / Footer Table */}
                    <div className="h-10 bg-gray-50 border-t border-gray-200 w-full flex items-center justify-between px-4">
                        <span className="text-xs font-bold text-gray-500">
                            Menampilkan {filteredData.length} baris data
                        </span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
