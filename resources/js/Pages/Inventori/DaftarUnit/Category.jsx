import React, { useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronRight,
    Pencil,
    Plus,
    RotateCcw,
    SearchX,
    Trash2,
    Truck,
} from "lucide-react";

const normalize = (value) => (value ? String(value).toUpperCase() : "TIDAK DIKETAHUI");

const FilterSelect = ({ label, value, options, onChange }) => (
    <label className="min-w-0">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        >
            <option value="ALL">Semua</option>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
    </label>
);

const StatCard = ({ title, value, helper }) => (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">{title}</p>
                <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900">{value}</p>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
                <Truck size={19} />
            </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-gray-400">{helper}</p>
    </div>
);

export default function Category({ rawTableData = [], category }) {
    const permissions = usePage().props.auth?.permissions || [];
    const canManageInventory = permissions.includes("inventory.manage");
    const [activeValue, setActiveValue] = useState("ALL");
    const [activeArea, setActiveArea] = useState("ALL");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const groupLabel = category.field === "inventaris" ? "Inventaris" : "Tipe Unit";

    const groupOptions = useMemo(() => {
        const counts = rawTableData.reduce((acc, item) => {
            const label = normalize(item[category.field]);
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({
                value: name,
                label: `${name} (${count})`,
            }));
    }, [rawTableData, category.field]);

    const areaOptions = useMemo(() => {
        const counts = rawTableData.reduce((acc, item) => {
            const area = item.area ? String(item.area) : "-";
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([name, count]) => ({
                value: name,
                label: `${name} (${count})`,
            }));
    }, [rawTableData]);

    const filteredData = useMemo(() => rawTableData.filter((item) => {
        const matchGroup = activeValue === "ALL" || normalize(item[category.field]) === activeValue;
        const areaValue = item.area ? String(item.area) : "-";
        const matchArea = activeArea === "ALL" || areaValue === activeArea;
        return matchGroup && matchArea;
    }), [rawTableData, activeValue, activeArea, category.field]);

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

    const resetFilters = () => {
        setActiveValue("ALL");
        setActiveArea("ALL");
    };

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
                    <h1 className="text-2xl font-black tracking-tight text-gray-800">
                        {category.title}
                    </h1>
                </div>
                {canManageInventory && (
                    <Link
                        href="/module-records/unit-inventori/create"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#635bff] px-4 text-sm font-bold text-white shadow-sm shadow-[#635bff]/25 transition hover:bg-[#5148ea]"
                    >
                        <Plus size={16} />
                        Tambah Unit
                    </Link>
                )}
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,260px)]">
                <StatCard
                    title="Total Unit"
                    value={filteredData.length.toLocaleString("id-ID")}
                    helper={activeValue === "ALL" && activeArea === "ALL" ? "Seluruh unit pada kategori ini" : "Mengikuti filter aktif"}
                />
            </div>

            <section className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
                    <FilterSelect label={groupLabel} value={activeValue} options={groupOptions} onChange={setActiveValue} />
                    <FilterSelect label="Area" value={activeArea} options={areaOptions} onChange={setActiveArea} />
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-bold text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                        <RotateCcw size={15} />
                        Reset
                    </button>
                </div>
            </section>

            <section className="relative flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-280px)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold text-slate-500">
                        Menampilkan <span className="font-black text-slate-800">{sortedData.length.toLocaleString("id-ID")}</span> dari <span className="font-black text-slate-800">{rawTableData.length.toLocaleString("id-ID")}</span> unit
                    </p>
                </div>

                <div className="custom-scrollbar flex-1 overflow-auto">
                    {sortedData.length > 0 ? (
                        <table className="w-full min-w-[1080px] border-collapse text-left whitespace-nowrap">
                            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 shadow-sm">
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            className="group cursor-pointer select-none border-r border-gray-100 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500 transition-colors last:border-r-0 hover:bg-gray-100"
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
                                        {canManageInventory ? "Aksi" : "Detail"}
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
                        <div className="flex h-full flex-col items-center justify-center px-6 text-center text-gray-400">
                            <SearchX size={48} className="mb-4 text-gray-300" />
                            <p className="text-sm font-semibold">Tidak ada data ditemukan</p>
                        </div>
                    )}
                </div>
            </section>
        </AdminLayout>
    );
}
