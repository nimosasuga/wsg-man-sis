// resources/js/Pages/Inventori/Pajak/Index.jsx
import React from "react";
import AdminLayout from "../../../Layouts/AdminLayout"; // Path disesuaikan
import { Head, Link } from "@inertiajs/react";
import {
    ChevronRight,
    ChevronDown,
    Filter,
    ChevronLeft,
    Image as ImageIcon,
} from "lucide-react";

export default function Index() {
    // Dummy Data Area Filter (Mirip Sidebar AppSheet)
    const areas = [
        { name: "AIR MOLEK", count: 4 },
        { name: "AMBON", count: 4 },
        { name: "BALIKPAPAN", count: 4 },
        { name: "BANDUNG", count: 20 },
        { name: "BANYUWANGI", count: 2 },
        { name: "BATAM", count: 2 },
        { name: "KUPANG", count: 53, active: true },
        { name: "MAKASSAR", count: 6 },
    ];

    // Dummy Data Table (Berdasarkan gambar)
    const tableData = [
        {
            id: 1,
            stnk: "14 Okt 2030",
            pajak: "14 Okt 2026",
            area: "KUPANG",
            nopol: "DH-9709-AJ",
            tipe: "HEAD",
            pabrikan: "HINO",
            model: "HEAD",
            mesin: "J08EUGJ41831",
            rangka: "MJEFC8JJKEJT16680",
            imgStnk: true,
            imgPajak: true,
        },
        {
            id: 2,
            stnk: "17 Okt 2030",
            pajak: "17 Okt 2026",
            area: "KUPANG",
            nopol: "DH-9708-AJ",
            tipe: "HEAD",
            pabrikan: "HINO",
            model: "HEAD",
            mesin: "J08EUGJ41829",
            rangka: "MJEFC8JJKEJT16678",
            imgStnk: true,
            imgPajak: true,
        },
        {
            id: 3,
            stnk: "31 Des 2030",
            pajak: "31 Des 2030",
            area: "KUPANG",
            nopol: "EC.01.10.10974",
            tipe: "CHASSIS HEAD",
            pabrikan: "NN",
            model: "CHASSIS HEAD",
            mesin: "011010974",
            rangka: "011010974",
            imgStnk: false,
            imgPajak: false,
        },
        {
            id: 4,
            stnk: "31 Des 2030",
            pajak: "31 Des 2030",
            area: "KUPANG",
            nopol: "EC.01.10.10975",
            tipe: "CHASSIS HEAD",
            pabrikan: "NN",
            model: "CHASSIS HEAD",
            mesin: "011010975",
            rangka: "011010975",
            imgStnk: false,
            imgPajak: false,
        },
        {
            id: 5,
            stnk: "31 Des 2030",
            pajak: "31 Des 2030",
            area: "KUPANG",
            nopol: "EKOR-10",
            tipe: "CHASSIS HEAD",
            pabrikan: "NN",
            model: "CHASSIS HEAD",
            mesin: "",
            rangka: "",
            imgStnk: false,
            imgPajak: false,
        },
    ];

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
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                        Data Pajak & STNK
                    </h1>
                </div>
                {/* Tombol Aksi CRUD */}
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-all flex items-center">
                        <Filter size={16} className="mr-2" /> Filter Lanjutan
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] transition-all">
                        + Tambah Data
                    </button>
                </div>
            </div>

            {/* Layout Mirip AppSheet (Sidebar Filter Kiri + Table Kanan) */}
            <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-180px)]">
                {/* Sidebar Filter Area */}
                <div className="w-full md:w-64 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center cursor-pointer">
                        <span className="font-bold text-blue-800 text-sm">
                            All
                        </span>
                        <ChevronDown size={16} className="text-blue-600" />
                    </div>
                    <div className="p-2 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                            <ChevronDown
                                size={14}
                                className="text-gray-400 mr-1"
                            />
                            <span className="font-semibold text-gray-700 text-xs">
                                AKTIF
                            </span>
                        </div>
                        <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            259
                        </span>
                    </div>

                    {/* List Area Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {areas.map((area, idx) => (
                            <div
                                key={idx}
                                className={`flex justify-between items-center px-6 py-1.5 rounded-md cursor-pointer transition-colors ${area.active ? "bg-blue-50 border border-blue-100" : "hover:bg-gray-50"}`}
                            >
                                <span
                                    className={`text-[11px] font-bold ${area.active ? "text-blue-700" : "text-gray-600"}`}
                                >
                                    {area.name}
                                </span>
                                <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${area.active ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-500"}`}
                                >
                                    {area.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Data Table */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
                    <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                <tr>
                                    {[
                                        "JATUH TEMPO STNK",
                                        "JATUH TEMPO PAJAK",
                                        "AREA",
                                        "NOPOL",
                                        "TIPE",
                                        "PABRIKAN",
                                        "MODEL",
                                        "NO. MESIN",
                                        "NO.RANGKA",
                                        "FOTO STNK",
                                        "FOTO PAJAK",
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
                                {tableData.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-4 py-2.5 text-xs text-gray-700 font-medium border-r border-gray-50">
                                            {row.stnk}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-700 font-medium border-r border-gray-50">
                                            {row.pajak}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-700 font-medium border-r border-gray-50">
                                            {row.area}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-900 font-bold border-r border-gray-50">
                                            {row.nopol}
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
                                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono border-r border-gray-50">
                                            {row.mesin}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono border-r border-gray-50">
                                            {row.rangka}
                                        </td>
                                        <td className="px-4 py-2.5 border-r border-gray-50">
                                            {row.imgStnk ? (
                                                <div className="w-10 h-6 bg-blue-100 rounded border border-blue-200 flex items-center justify-center text-blue-600">
                                                    <ImageIcon size={14} />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-bold">
                                                    N/A
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 border-r border-gray-50">
                                            {row.imgPajak ? (
                                                <div className="w-10 h-6 bg-green-100 rounded border border-green-200 flex items-center justify-center text-green-600">
                                                    <ImageIcon size={14} />
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-bold">
                                                    N/A
                                                </span>
                                            )}
                                        </td>
                                        {/* Action Icon (Mirip > di AppSheet) */}
                                        <td className="px-3 py-2.5 sticky right-0 bg-white group-hover:bg-blue-50/50 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.02)] text-center">
                                            <button className="text-gray-400 hover:text-blue-600 hover:bg-white p-1 rounded transition-all shadow-sm border border-transparent hover:border-gray-200">
                                                <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Fake Scrollbar / Footer indikator */}
                    <div className="h-4 bg-gray-100 border-t border-gray-200 w-full flex items-center justify-center">
                        <div className="w-1/2 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
