import React, { useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    FileText,
    Filter,
    PanelLeftClose,
    PanelLeftOpen,
    SearchX,
} from "lucide-react";

const statusTone = (status) => {
    const normalized = (status || "").toUpperCase();

    if (normalized.includes("DITERIMA") || normalized.includes("LENGKAP")) {
        return "bg-emerald-100 text-emerald-700";
    }

    if (normalized.includes("BELUM") || normalized.includes("KOSONG")) {
        return "bg-rose-100 text-rose-700";
    }

    return "bg-amber-100 text-amber-700";
};

const formatRp = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

export default function Index({ rawTableData = [] }) {
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(true);
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [activeArea, setActiveArea] = useState("ALL");
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    const statusList = useMemo(() => {
        const uniqueStatuses = [
            ...new Set(
                rawTableData.map(
                    (item) => item.status_dokumen_asli || "TIDAK DIKETAHUI",
                ),
            ),
        ];

        return uniqueStatuses.filter(Boolean).sort();
    }, [rawTableData]);

    const areaList = useMemo(() => {
        const uniqueAreas = [...new Set(rawTableData.map((item) => item.area))];
        return uniqueAreas.filter(Boolean).sort();
    }, [rawTableData]);

    const filteredData = useMemo(() => {
        return rawTableData.filter((item) => {
            const itemStatus = item.status_dokumen_asli || "TIDAK DIKETAHUI";
            const matchStatus =
                activeStatus === "ALL" || itemStatus === activeStatus;
            const matchArea = activeArea === "ALL" || item.area === activeArea;

            return matchStatus && matchArea;
        });
    }, [activeStatus, activeArea, rawTableData]);

    const sortedAndFilteredData = useMemo(() => {
        const sortableItems = [...filteredData];

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
        rawTableData.filter((item) => {
            const itemStatus = item.status_dokumen_asli || "TIDAK DIKETAHUI";
            return status === "ALL" ? true : itemStatus === status;
        }).length;
    const countArea = (areaName) =>
        rawTableData.filter((item) => item.area === areaName).length;

    const columns = [
        { label: "STATUS DOKUMEN", key: "status_dokumen_asli" },
        { label: "NO INVOICE", key: "no_invoice" },
        { label: "TANGGAL INVOICE", key: "invoice_date" },
        { label: "DUE DATE", key: "due_date" },
        { label: "AREA", key: "area" },
        { label: "VENDOR", key: "vendor_supplier" },
        { label: "PENGAJUAN", key: "pengajuan" },
        { label: "TOTAL PAYMENT", key: "total_payment" },
    ];

    return (
        <AdminLayout>
            <Head title="Dokumen Invoice" />

            <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-2 flex items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                        <Link href="/dashboard" className="hover:text-blue-600">
                            DASHBOARD
                        </Link>
                        <ChevronRight size={14} className="mx-1" />
                        <span className="text-gray-800">DOKUMEN INVOICE</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-gray-800">
                            Data Dokumen Invoice
                        </h1>
                        <button
                            onClick={() =>
                                setIsFilterSidebarOpen(!isFilterSidebarOpen)
                            }
                            className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-400 shadow-sm transition-colors hover:text-blue-600"
                            title="Toggle Filter"
                        >
                            {isFilterSidebarOpen ? (
                                <PanelLeftClose size={18} />
                            ) : (
                                <PanelLeftOpen size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-180px)] flex-col gap-4 overflow-hidden md:flex-row">
                <div
                    className={`flex shrink-0 origin-left flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${isFilterSidebarOpen ? "w-full opacity-100 md:w-72" : "w-0 overflow-hidden border-0 opacity-0"}`}
                >
                    <div
                        onClick={() => {
                            setActiveStatus("ALL");
                            setActiveArea("ALL");
                            setIsStatusMenuOpen(!isStatusMenuOpen);
                        }}
                        className={`flex cursor-pointer items-center justify-between border-b border-gray-100 p-3 transition-colors ${activeStatus === "ALL" && activeArea === "ALL" ? "border-blue-100 bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                        <span
                            className={`text-sm font-bold ${activeStatus === "ALL" && activeArea === "ALL" ? "text-blue-800" : "text-gray-700"}`}
                        >
                            Semua Invoice
                        </span>
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isStatusMenuOpen ? "rotate-0" : "rotate-180"} ${activeStatus === "ALL" ? "text-blue-600" : "text-gray-400"}`}
                        />
                    </div>

                    <div
                        className={`overflow-hidden transition-all duration-300 ${isStatusMenuOpen ? "max-h-64 border-b border-gray-100" : "max-h-0"}`}
                    >
                        {statusList.map((status) => (
                            <div
                                key={status}
                                onClick={() => {
                                    setActiveStatus(status);
                                    setActiveArea("ALL");
                                }}
                                className={`flex cursor-pointer items-center justify-between p-2 transition-colors ${activeStatus === status ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                            >
                                <div className="flex items-center pl-2">
                                    <span
                                        className={`mr-2 h-2 w-2 rounded-full ${statusTone(status).replace("100 text", "500 text")}`}
                                    />
                                    <span
                                        className={`text-xs font-semibold ${activeStatus === status ? "text-blue-700" : "text-gray-600"}`}
                                    >
                                        {status}
                                    </span>
                                </div>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                                    {countStatus(status)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                            Filter Area
                        </div>
                        {areaList.map((area) => {
                            const isActive = activeArea === area;

                            return (
                                <div
                                    key={area}
                                    onClick={() =>
                                        setActiveArea(isActive ? "ALL" : area)
                                    }
                                    className={`flex cursor-pointer items-center justify-between rounded-md px-4 py-2 transition-colors ${isActive ? "border border-blue-100 bg-blue-50" : "hover:bg-gray-50"}`}
                                >
                                    <span
                                        className={`text-[11px] font-bold ${isActive ? "text-blue-700" : "text-gray-600"}`}
                                    >
                                        {area}
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-400"}`}
                                    >
                                        {countArea(area)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300">
                    <div className="custom-scrollbar flex-1 overflow-auto">
                        {sortedAndFilteredData.length > 0 ? (
                            <table className="w-full border-collapse whitespace-nowrap text-left">
                                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
                                    <tr>
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                onClick={() =>
                                                    handleSort(col.key)
                                                }
                                                className="cursor-pointer select-none border-r border-gray-100 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-colors last:border-r-0 hover:bg-gray-200"
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
                                                            className="text-gray-300"
                                                        />
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="sticky right-0 w-10 bg-gray-50 px-3 py-3 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedAndFilteredData.map((row) => (
                                        <tr
                                            key={row.id_key}
                                            onClick={() =>
                                                router.get(
                                                    `/finance/dokumen-invoice/${row.id_key}`,
                                                )
                                            }
                                            className="group cursor-pointer transition-colors hover:bg-blue-50/50"
                                        >
                                            <td className="border-r border-gray-50 px-4 py-2.5">
                                                <span
                                                    className={`rounded-md px-2 py-1 text-[10px] font-bold ${statusTone(row.status_dokumen_asli)}`}
                                                >
                                                    {row.status_dokumen_asli ||
                                                        "TIDAK DIKETAHUI"}
                                                </span>
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-bold text-gray-900">
                                                {row.no_invoice || "-"}
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                {row.invoice_date || "-"}
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                {row.due_date || "-"}
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                {row.area || "-"}
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                {row.vendor_supplier || "-"}
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                {row.pengajuan || "-"}
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-black text-gray-900">
                                                {formatRp(row.total_payment)}
                                            </td>
                                            <td className="sticky right-0 bg-white px-3 py-2.5 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-blue-50/50">
                                                <div className="inline-flex rounded border border-transparent p-1 text-gray-300 shadow-sm transition-all group-hover:border-gray-200 group-hover:bg-white group-hover:text-blue-600">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                <SearchX
                                    size={48}
                                    className="mb-4 text-gray-300"
                                />
                                <p className="text-sm font-semibold">
                                    Tidak ada data invoice ditemukan
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
