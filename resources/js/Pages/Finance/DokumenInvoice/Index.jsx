import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Database,
    RotateCcw,
    SearchX,
} from "lucide-react";

const statusTone = (status) => {
    const normalized = (status || "").toUpperCase();

    if (normalized === "PAID" || normalized.includes("DITERIMA") || normalized.includes("LENGKAP")) {
        return "bg-emerald-100 text-emerald-700";
    }

    if (normalized === "UNPAID" || normalized.includes("BELUM") || normalized.includes("KOSONG")) {
        return "bg-rose-100 text-rose-700";
    }

    return "bg-amber-100 text-amber-700";
};

const formatRp = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const normalizeInvoiceStatus = (status) => {
    const normalized = String(status || "").trim().toUpperCase();

    if (["PAID", "UNPAID", "PARTIAL PAID", "REFUND"].includes(normalized)) {
        return normalized;
    }

    return "UNPAID";
};

const documentStatusLabel = (status) =>
    String(status || "").trim() || "Blank";

const dateSortValue = (value) => {
    const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? Number(`${match[3]}${match[2]}${match[1]}`) : 0;
};

const FilterSelect = ({ label, value, options, onChange }) => (
    <label className="min-w-0">
        <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span>
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        >
            <option value="ALL">Semua</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);

const StatCard = ({ title, value, helper, icon: Icon, tone = "cyan" }) => {
    const tones = {
        cyan: "bg-cyan-50 text-cyan-600",
        violet: "bg-violet-50 text-violet-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-500">{title}</p>
                    <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900">{value}</p>
                </div>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-gray-400">{helper}</p>
        </div>
    );
};

export default function Index({ invoiceData = {}, summary = {}, filters = {}, areas = [], divisions = [], vendors = [] }) {
    const rawTableData = invoiceData.data || [];
    const requestedStatus = filters.status || "ALL";
    const requestedArea = filters.area || "ALL";
    const requestedDivision = filters.divisi || "ALL";
    const requestedVendor = filters.vendor || "ALL";
    const [activeStatus, setActiveStatus] = useState(requestedStatus);
    const [activeArea, setActiveArea] = useState(requestedArea);
    const [activeDivision, setActiveDivision] = useState(requestedDivision);
    const [activeVendor, setActiveVendor] = useState(requestedVendor);
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    useEffect(() => {
        setActiveStatus(requestedStatus);
    }, [requestedStatus]);

    useEffect(() => {
        setActiveArea(requestedArea);
    }, [requestedArea]);

    useEffect(() => {
        setActiveDivision(requestedDivision);
    }, [requestedDivision]);

    useEffect(() => {
        setActiveVendor(requestedVendor);
    }, [requestedVendor]);

    const statusList = ["PAID", "UNPAID", "PARTIAL PAID", "REFUND"];

    const visitFilters = (nextStatus, nextVendor, nextArea, nextDivision, page = null) => {
        router.get(
            "/finance/dokumen-invoice",
            {
                status: nextStatus,
                vendor: nextVendor,
                area: nextArea,
                divisi: nextDivision,
                ...(page ? { page } : {}),
            },
            { preserveScroll: true, preserveState: false },
        );
    };

    const changeStatus = (value) => {
        setActiveStatus(value);
        visitFilters(value, activeVendor, activeArea, activeDivision);
    };

    const changeVendor = (value) => {
        setActiveVendor(value);
        visitFilters(activeStatus, value, activeArea, activeDivision);
    };

    const changeArea = (value) => {
        setActiveArea(value);
        visitFilters(activeStatus, activeVendor, value, activeDivision);
    };

    const changeDivision = (value) => {
        setActiveDivision(value);
        visitFilters(activeStatus, activeVendor, activeArea, value);
    };

    const resetFilters = () => {
        setActiveStatus("ALL");
        setActiveVendor("ALL");
        setActiveArea("ALL");
        setActiveDivision("ALL");
        visitFilters("ALL", "ALL", "ALL", "ALL");
    };

    const sortedAndFilteredData = useMemo(() => {
        const sortableItems = [...rawTableData];

        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const isDate = ["invoice_date", "due_date"].includes(sortConfig.key);
                const aValue = isDate ? dateSortValue(a[sortConfig.key]) : a[sortConfig.key]
                    ? a[sortConfig.key].toString().toLowerCase()
                    : "";
                const bValue = isDate ? dateSortValue(b[sortConfig.key]) : b[sortConfig.key]
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
    }, [rawTableData, sortConfig]);

    const handleSort = (key) => {
        let direction = "asc";

        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }

        setSortConfig({ key, direction });
    };

    const columns = [
        { label: "STATUS INVOICE", key: "status_invoice" },
        { label: "STATUS DOKUMEN", key: "status_dokumen_asli" },
        { label: "EDITOR", key: "editor" },
        { label: "NO INVOICE", key: "no_invoice" },
        { label: "TANGGAL INVOICE", key: "invoice_date" },
        { label: "DUE DATE", key: "due_date" },
        { label: "AREA", key: "area" },
        { label: "DIVISI", key: "divisi" },
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
                    <h1 className="text-2xl font-black tracking-tight text-gray-800">Data Dokumen Invoice</h1>
                </div>
            </div>

            <div className="mb-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
                <StatCard
                    title="Total Payment"
                    value={formatRp(summary.totalPayment)}
                    helper="Total nilai payment sesuai filter aktif"
                    icon={Database}
                    tone="cyan"
                />
            </div>

            <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto] xl:items-end">
                <FilterSelect label="Status" value={activeStatus} options={statusList} onChange={changeStatus} />
                <FilterSelect label="Vendor" value={activeVendor} options={vendors} onChange={changeVendor} />
                <FilterSelect label="Area" value={activeArea} options={areas} onChange={changeArea} />
                <FilterSelect label="Divisi" value={activeDivision} options={divisions} onChange={changeDivision} />
                <button type="button" onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 text-xs font-bold text-gray-600 transition hover:bg-gray-50">
                    <RotateCcw size={15} />
                    Reset
                </button>
            </div>

            <div className="flex h-[calc(100vh-290px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                    <p className="text-xs font-medium text-gray-500">Menampilkan {rawTableData.length} invoice pada halaman ini</p>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => invoiceData.prev_page_url && visitFilters(activeStatus, activeVendor, activeArea, activeDivision, invoiceData.current_page - 1)} disabled={!invoiceData.prev_page_url} className="rounded-md border border-gray-200 p-1.5 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman sebelumnya">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-semibold text-gray-600">Halaman {invoiceData.current_page || 1}</span>
                        <button type="button" onClick={() => invoiceData.next_page_url && visitFilters(activeStatus, activeVendor, activeArea, activeDivision, (invoiceData.current_page || 1) + 1)} disabled={!invoiceData.next_page_url} className="rounded-md border border-gray-200 p-1.5 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Halaman berikutnya">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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
                                                    className={`rounded-md px-2 py-1 text-[10px] font-bold ${statusTone(row.status_invoice)}`}
                                                >
                                                    {normalizeInvoiceStatus(row.status_invoice)}
                                                </span>
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5">
                                                <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${statusTone(row.status_dokumen_asli)}`}>
                                                    {documentStatusLabel(row.status_dokumen_asli)}
                                                </span>
                                            </td>
                                            <td className="border-r border-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700">
                                                {row.editor || "-"}
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
                                                {row.divisi || "-"}
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
