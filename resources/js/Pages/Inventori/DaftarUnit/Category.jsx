import React, { useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    PanelLeftClose,
    PanelLeftOpen,
    Pencil,
    Plus,
    SearchX,
    Trash2,
} from "lucide-react";

const normalize = (value) => (value ? String(value).toUpperCase() : "TIDAK DIKETAHUI");

export default function Category({ rawTableData = [], category }) {
    const permissions = usePage().props.auth?.permissions || [];
    const canManageInventory = permissions.includes("inventory.manage");
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(true);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(true);
    const [activeValue, setActiveValue] = useState("ALL");
    const [activeArea, setActiveArea] = useState("ALL");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const groupList = useMemo(() => {
        const counts = rawTableData.reduce((acc, item) => {
            const label = normalize(item[category.field]);
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [rawTableData, category.field]);

    const areaList = useMemo(() => {
        return [...new Set(rawTableData.map((item) => item.area))]
            .filter(Boolean)
            .sort()
            .map((area) => ({ name: area }));
    }, [rawTableData]);

    const filteredData = useMemo(() => {
        return rawTableData.filter((item) => {
            const matchGroup = activeValue === "ALL" || normalize(item[category.field]) === activeValue;
            const matchArea = activeArea === "ALL" || item.area === activeArea;
            return matchGroup && matchArea;
        });
    }, [rawTableData, activeValue, activeArea, category.field]);

    const sortedData = useMemo(() => {
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

    const countGroup = (value) =>
        rawTableData.filter((item) => value === "ALL" || normalize(item[category.field]) === value).length;

    const countArea = (areaName) =>
        rawTableData.filter((item) => item.area === areaName).length;

    const columns = [
        { label: category.title.toUpperCase(), key: category.field },
        { label: "NOPOL", key: "nopol" },
        { label: "AREA", key: "area" },
        { label: "TIPE", key: "tipe" },
        { label: "PAJAK", key: "status_pajak" },
        { label: "STNK", key: "status_stnk" },
        { label: "KIR", key: "status_kir" },
        { label: "GPS", key: "gps" },
        { label: "MY PERTAMINA", key: "my_pertamina" },
        { label: "TAHUN", key: "tahun" },
    ];

    return (
        <AdminLayout>
            <Head title={`${category.title} - Daftar Unit`} />

            <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-2 flex items-center text-xs font-bold uppercase tracking-widest text-gray-500">
                        <Link href="/inventori/daftar-unit" className="hover:text-violet-600">
                            DAFTAR UNIT
                        </Link>
                        <ChevronRight size={14} className="mx-1" />
                        <span className="text-gray-800">{category.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black tracking-tight text-gray-800">
                            {category.title}
                        </h1>
                        <button
                            onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition-colors hover:border-violet-200 hover:text-violet-600"
                        >
                            {isFilterSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                        </button>
                    </div>
                </div>
                {canManageInventory && (
                    <Link
                        href="/module-records/unit-inventori/create"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#635bff] px-4 text-sm font-bold text-white shadow-sm shadow-[#635bff]/25 transition hover:bg-[#5148ea]"
                    >
                        <Plus size={16} />
                        Tambah unit
                    </Link>
                )}
            </div>

            <div className="flex min-w-0 flex-col gap-4 overflow-hidden lg:h-[calc(100vh-180px)] lg:flex-row">
                <div
                    className={`flex shrink-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out ${isFilterSidebarOpen ? "w-full opacity-100 lg:w-64" : "h-0 w-0 overflow-hidden border-0 opacity-0 lg:h-auto"}`}
                >
                    <div
                        onClick={() => {
                            setActiveValue("ALL");
                            setActiveArea("ALL");
                            setIsFilterMenuOpen(!isFilterMenuOpen);
                        }}
                        className={`flex cursor-pointer items-center justify-between border-b border-slate-100 p-3 transition-colors ${activeValue === "ALL" && activeArea === "ALL" ? "border-violet-100 bg-violet-50" : "hover:bg-slate-50"}`}
                    >
                        <span className={`text-sm font-bold ${activeValue === "ALL" && activeArea === "ALL" ? "text-violet-800" : "text-slate-700"}`}>
                            Semua Data
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{countGroup("ALL")}</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isFilterMenuOpen ? "rotate-0" : "rotate-180"}`} />
                        </span>
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${isFilterMenuOpen ? "max-h-64 border-b border-gray-100" : "max-h-0"}`}>
                        {groupList.map((item) => (
                            <div
                                key={item.name}
                                onClick={() => {
                                    setActiveValue(item.name);
                                    setActiveArea("ALL");
                                }}
                                className={`flex cursor-pointer items-center justify-between p-2 transition-colors ${activeValue === item.name ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                            >
                                <span className={`truncate pl-2 text-xs font-semibold ${activeValue === item.name ? "text-blue-700" : "text-gray-600"}`}>
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

                <div className="relative flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300">
                    <div className="custom-scrollbar flex-1 overflow-auto">
                        {sortedData.length > 0 ? (
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
                                        <th className="sticky right-0 z-20 w-[112px] bg-gray-50 px-3 py-3 text-center text-[10px] font-black uppercase tracking-wider text-gray-500 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                                            {canManageInventory ? "Aksi" : ""}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedData.map((row) => (
                                        <tr
                                            key={row.id_key}
                                            onClick={() => router.get(`/inventori/pajak/${row.nopol}`)}
                                            className="group cursor-pointer transition-colors hover:bg-blue-50/50"
                                        >
                                            {columns.map((col) => (
                                                <td key={col.key} className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                    {row[col.key] || "-"}
                                                </td>
                                            ))}
                                            <td className="sticky right-0 z-10 bg-white px-3 py-2.5 text-center shadow-[-4px_0_10px_rgba(0,0,0,0.02)] transition-colors group-hover:bg-blue-50/50">
                                                {canManageInventory ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={`/module-records/unit-inventori/${encodeURIComponent(row.id_key)}/edit`}
                                                            onClick={(event) => event.stopPropagation()}
                                                            className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-violet-100 hover:text-violet-700"
                                                            title={`Edit ${row.nopol || "unit"}`}
                                                            aria-label={`Edit ${row.nopol || "unit"}`}
                                                        >
                                                            <Pencil size={15} />
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                if (window.confirm(`Hapus unit ${row.nopol || row.id_key}?`)) {
                                                                    router.delete(`/module-records/unit-inventori/${encodeURIComponent(row.id_key)}`);
                                                                }
                                                            }}
                                                            className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                                                            title={`Hapus ${row.nopol || "unit"}`}
                                                            aria-label={`Hapus ${row.nopol || "unit"}`}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <ChevronRight size={16} className="mx-auto text-gray-300 group-hover:text-blue-600" />
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
