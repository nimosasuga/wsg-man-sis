import React, { useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    SearchX,
    X,
} from "lucide-react";

const textColumns = [
    { label: "TANGGAL", key: "tanggal", width: 140, minWidth: 110 },
    { label: "NOPOL", key: "nopol", width: 130, minWidth: 110 },
    { label: "STATUS CHECKLIST", key: "status_checklist", width: 180, minWidth: 140 },
    { label: "KELUHAN", key: "keluhan", width: 260, minWidth: 160 },
];

const checklistColumns = [
    { label: "Surat Kendaraan", key: "surat_kendaraan" },
    { label: "Kebersihan Kabin", key: "kebersihan_unit_kabin" },
    { label: "Mesin/Oli", key: "kondisi_mesin_oli" },
    { label: "Service Berkala", key: "service_berkala" },
    { label: "Air Radiator", key: "air_radiator" },
    { label: "Air Aki", key: "air_aki" },
    { label: "Rem", key: "kondisi_rem" },
    { label: "Dashboard", key: "indikator_dashboard" },
    { label: "Box", key: "kondisi_kebersihan_box" },
    { label: "Klakson", key: "klakson" },
    { label: "Lampu", key: "lampu_lampu" },
    { label: "APAR", key: "apar" },
    { label: "Safety Belt", key: "safety_belt" },
    { label: "P3K", key: "p3k" },
    { label: "Dongkrak", key: "dongkrak" },
    { label: "Kunci Roda", key: "kunci_roda" },
    { label: "Engsel", key: "engsel_pengunci_pintu" },
    { label: "Gembok", key: "gembok" },
    { label: "Ban", key: "kondisi_ban" },
    { label: "Tekanan Ban", key: "tekanan_angin_ban" },
];

const normalize = (value) => (value ? String(value).trim().toUpperCase() : "TIDAK DIKETAHUI");

function isChecked(value) {
    const text = normalize(value);
    const raw = value ? String(value) : "";

    if (
        raw.includes("\u274c") ||
        raw.includes("\u2716") ||
        raw.includes("\u00d7") ||
        raw.includes("\u009d") ||
        text === "X" ||
        text === "SILANG" ||
        text === "CROSS"
    ) {
        return false;
    }

    if (
        raw.includes("\u2705") ||
        raw.includes("\u2714") ||
        raw.includes("\u2713") ||
        raw.includes("\u0153") ||
        ["OK", "BAIK", "ADA", "YA", "YES", "TRUE", "1", "CHECK", "CHECKED"].includes(text)
    ) {
        return true;
    }

    if ([
        "",
        "0",
        "NO",
        "N",
        "FALSE",
        "TIDAK",
        "TIDAK ADA",
        "TIDAK BAIK",
        "RUSAK",
        "N/A",
        "TIDAK DIKETAHUI",
    ].includes(text)) {
        return false;
    }

    return true;
}

function CheckCell({ value }) {
    const checked = isChecked(value);

    return (
        <span
            className={`inline-grid h-7 w-7 place-items-center rounded-lg border ${
                checked
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-rose-200 bg-rose-50 text-rose-600"
            }`}
            title={value || "-"}
        >
            {checked ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}
        </span>
    );
}

export default function Toolkit({ rawTableData = [] }) {
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(true);
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [activeArea, setActiveArea] = useState("ALL");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(100);
    const [columnWidths, setColumnWidths] = useState(() =>
        textColumns.reduce((acc, column) => ({ ...acc, [column.key]: column.width }), {}),
    );

    const statusList = useMemo(() => {
        const counts = rawTableData.reduce((acc, item) => {
            const label = normalize(item.status_checklist);
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
            const matchStatus = activeStatus === "ALL" || normalize(item.status_checklist) === activeStatus;
            const matchArea = activeArea === "ALL" || item.area === activeArea;
            return matchStatus && matchArea;
        });
    }, [rawTableData, activeStatus, activeArea]);

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

    const totalPages = Math.max(1, Math.ceil(sortedAndFilteredData.length / perPage));
    const visibleData = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return sortedAndFilteredData.slice(start, start + perPage);
    }, [sortedAndFilteredData, currentPage, perPage]);

    const firstVisibleRow = sortedAndFilteredData.length === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const lastVisibleRow = Math.min(currentPage * perPage, sortedAndFilteredData.length);

    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
        setCurrentPage(1);
    };

    const startColumnResize = (event, column) => {
        event.preventDefault();
        event.stopPropagation();

        const startX = event.clientX;
        const startWidth = columnWidths[column.key] || column.width;

        const handleMouseMove = (moveEvent) => {
            const nextWidth = Math.max(column.minWidth, startWidth + moveEvent.clientX - startX);
            setColumnWidths((current) => ({ ...current, [column.key]: nextWidth }));
        };

        const handleMouseUp = () => {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const countStatus = (status) =>
        rawTableData.filter((item) => status === "ALL" || normalize(item.status_checklist) === status).length;

    const countArea = (area) => rawTableData.filter((item) => item.area === area).length;

    const applyStatusFilter = (status) => {
        setActiveStatus(status);
        setActiveArea("ALL");
        setCurrentPage(1);
    };

    const applyAreaFilter = (area) => {
        setActiveArea(area);
        setCurrentPage(1);
    };

    return (
        <AdminLayout>
            <Head title="Toolkit" />

            <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-2 flex items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                        <Link href="/inventori/daftar-asset" className="hover:text-blue-600">
                            DAFTAR ASSET
                        </Link>
                        <ChevronRight size={14} className="mx-1" />
                        <span className="text-gray-800">TOOLKIT</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-gray-800">Toolkit</h1>
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
                            setActiveStatus("ALL");
                            setActiveArea("ALL");
                            setCurrentPage(1);
                            setIsStatusMenuOpen(!isStatusMenuOpen);
                        }}
                        className={`flex cursor-pointer items-center justify-between border-b border-gray-100 p-3 transition-colors ${activeStatus === "ALL" && activeArea === "ALL" ? "border-blue-100 bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                        <span className={`text-sm font-bold ${activeStatus === "ALL" && activeArea === "ALL" ? "text-blue-800" : "text-gray-700"}`}>
                            Semua Data
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{countStatus("ALL")}</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isStatusMenuOpen ? "rotate-0" : "rotate-180"}`} />
                        </span>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${isStatusMenuOpen ? "max-h-64 border-b border-gray-100" : "max-h-0"}`}>
                        {statusList.map((item) => (
                            <div
                                key={item.name}
                                onClick={() => applyStatusFilter(item.name)}
                                className={`flex cursor-pointer items-center justify-between p-2 transition-colors ${activeStatus === item.name ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                            >
                                <span className={`truncate pl-2 text-xs font-semibold ${activeStatus === item.name ? "text-blue-700" : "text-gray-600"}`}>{item.name}</span>
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
                                    onClick={() => applyAreaFilter(isActive ? "ALL" : area.name)}
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
                    <div className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 md:flex-row md:items-center">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-gray-400">Data Toolkit</p>
                            <p className="text-sm font-semibold text-gray-700">
                                Menampilkan {firstVisibleRow}-{lastVisibleRow} dari {sortedAndFilteredData.length} data
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={perPage}
                                onChange={(event) => {
                                    setPerPage(Number(event.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 focus:border-blue-500 focus:ring-blue-500"
                            >
                                {[50, 100, 200, 500].map((value) => (
                                    <option key={value} value={value}>
                                        {value} baris
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="min-w-20 text-center text-xs font-bold text-gray-600">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="custom-scrollbar flex-1 overflow-auto">
                        {visibleData.length > 0 ? (
                            <table className="w-full table-fixed border-collapse text-left whitespace-nowrap">
                                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
                                    <tr>
                                        {textColumns.map((col) => (
                                            <th
                                                key={col.key}
                                                onClick={() => handleSort(col.key)}
                                                style={{ width: columnWidths[col.key], minWidth: col.minWidth }}
                                                className="group relative cursor-pointer select-none border-r border-gray-100 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-colors hover:bg-gray-200"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>{col.label}</span>
                                                    {sortConfig.key === col.key ? (
                                                        sortConfig.direction === "asc" ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="text-gray-300 transition-colors group-hover:text-gray-500" />
                                                    )}
                                                </div>
                                                <span
                                                    onMouseDown={(event) => startColumnResize(event, col)}
                                                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-blue-300"
                                                    title="Geser untuk ubah lebar kolom"
                                                />
                                            </th>
                                        ))}
                                        {checklistColumns.map((col) => (
                                            <th key={col.key} className="w-28 border-r border-gray-100 px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-500">
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visibleData.map((row) => (
                                        <tr
                                            key={row.id_key}
                                            onClick={() => router.visit(`/inventori/daftar-asset/toolkit/${encodeURIComponent(row.id_key)}`)}
                                            className="cursor-pointer transition-colors hover:bg-blue-50/50"
                                        >
                                            {textColumns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    style={{ width: columnWidths[col.key], minWidth: col.minWidth }}
                                                    className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700"
                                                >
                                                    {col.key === "keluhan" ? (
                                                        <span className="block truncate" title={row[col.key] || "-"}>
                                                            {row[col.key] || "-"}
                                                        </span>
                                                    ) : (
                                                        row[col.key] || "-"
                                                    )}
                                                </td>
                                            ))}
                                            {checklistColumns.map((col) => (
                                                <td key={col.key} className="border-r border-gray-50 px-4 py-2.5 text-center">
                                                    <CheckCell value={row[col.key]} />
                                                </td>
                                            ))}
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
