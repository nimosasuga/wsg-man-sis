import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    BadgeCheck,
    CalendarClock,
    Edit3,
    Mail,
    Phone,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    UserCheck,
    Users,
} from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const tablePageSize = 50;
const normalizeStatus = (value) => String(value || "").trim().toUpperCase();
const isInactiveEmployee = (employee) => {
    const status = normalizeStatus(employee?.status);

    return status === "EXPIRED" || [
        "EXPIRED",
        "NON AKTIF",
        "NON-AKTIF",
        "TIDAK AKTIF",
        "INACTIVE",
        "RESIGN",
        "KELUAR",
    ].includes(status);
};

const statusTone = {
    AKTIF: "border-emerald-100 bg-emerald-50 text-emerald-700",
    EXPIRED: "border-rose-100 bg-rose-50 text-rose-700",
    "HAMPIR EXPIRED": "border-amber-100 bg-amber-50 text-amber-700",
};

function SelectFilter({ label, value, options = [], onChange }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">
                {label}
            </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
                <option value="all">Semua</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function StatusPill({ value }) {
    const label = value || "BELUM DIISI";

    return (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusTone[label] || "border-slate-200 bg-slate-100 text-slate-600"}`}>
            {label}
        </span>
    );
}

function EmployeeMetricCard({ title, value, helper, icon: Icon, tone }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{formatNumber(value)}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
                </div>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tone}`}>
                    <Icon size={19} />
                </div>
            </div>
        </div>
    );
}

export default function Index({
    employees = [],
    filters = {},
}) {
    const canManage = (usePage().props.auth?.permissions || []).includes("employees.manage");
    const [search, setSearch] = useState("");
    const [divisi, setDivisi] = useState("all");
    const [jabatan, setJabatan] = useState("all");
    const [area, setArea] = useState("all");
    const [status, setStatus] = useState("all");
    const [tablePage, setTablePage] = useState(1);

    const activeEmployees = useMemo(
        () => employees.filter((employee) => !isInactiveEmployee(employee)),
        [employees],
    );

    const inactiveEmployees = useMemo(
        () => employees.filter((employee) => isInactiveEmployee(employee)),
        [employees],
    );

    const activeStatusOptions = useMemo(
        () => (filters.status || []).filter((option) => !isInactiveEmployee({ status: option })),
        [filters.status],
    );

    const employeeMetrics = useMemo(() => {
        return {
            aktif: activeEmployees.filter((employee) => normalizeStatus(employee.status) === "AKTIF").length,
            hampirExpired: activeEmployees.filter((employee) => normalizeStatus(employee.status) === "HAMPIR EXPIRED").length,
            tetap: activeEmployees.filter((employee) => normalizeStatus(employee.status_pkwt) === "TETAP").length,
            kontrakUlang: activeEmployees.filter((employee) => normalizeStatus(employee.status_pkwt) === "PKWT").length,
            nonAktif: inactiveEmployees.length,
        };
    }, [activeEmployees, inactiveEmployees]);

    const filteredEmployees = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return activeEmployees.filter((employee) => {
            const matchKeyword =
                !keyword ||
                [
                    employee.nama_karyawan,
                    employee.nama_panggilan,
                    employee.nip,
                    employee.divisi,
                    employee.jabatan,
                    employee.area,
                    employee.no_ponsel,
                    employee.email,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword));

            return (
                matchKeyword &&
                (divisi === "all" || employee.divisi === divisi) &&
                (jabatan === "all" || employee.jabatan === jabatan) &&
                (area === "all" || employee.area === area) &&
                (status === "all" || employee.status === status)
            );
        });
    }, [activeEmployees, search, divisi, jabatan, area, status]);

    const archivedEmployees = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return inactiveEmployees.filter((employee) => {
            const matchKeyword =
                !keyword ||
                [
                    employee.nama_karyawan,
                    employee.nama_panggilan,
                    employee.nip,
                    employee.divisi,
                    employee.jabatan,
                    employee.area,
                    employee.no_ponsel,
                    employee.email,
                    employee.status,
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword));

            return (
                matchKeyword &&
                (divisi === "all" || employee.divisi === divisi) &&
                (jabatan === "all" || employee.jabatan === jabatan) &&
                (area === "all" || employee.area === area)
            );
        });
    }, [inactiveEmployees, search, divisi, jabatan, area]);

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / tablePageSize));
    const currentPage = Math.min(tablePage, totalPages);
    const paginatedEmployees = useMemo(
        () => filteredEmployees.slice((currentPage - 1) * tablePageSize, currentPage * tablePageSize),
        [filteredEmployees, currentPage],
    );
    const visiblePages = useMemo(
        () => [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
            .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages),
        [currentPage, totalPages],
    );

    useEffect(() => {
        setTablePage(1);
    }, [search, divisi, jabatan, area, status]);

    return (
        <AdminLayout>
            <Head title="Daftar Karyawan" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                                <Users size={15} />
                                HR Manager
                            </div>
                            <h1 className="mt-4 text-2xl font-black tracking-tight">
                                Daftar Karyawan
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                                Data aktif tampil di tabel kerja. Karyawan non aktif disimpan terpisah di arsip supaya tidak mengganggu pantauan harian.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari nama, NIP, divisi, area..."
                                    className="h-11 w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-3 text-sm font-semibold text-white placeholder:text-slate-400 outline-none focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <EmployeeMetricCard
                        title="Karyawan Aktif"
                        value={employeeMetrics.aktif}
                        helper="Diambil dari kolom status: AKTIF."
                        icon={UserCheck}
                        tone="bg-emerald-50 text-emerald-600"
                    />
                    <EmployeeMetricCard
                        title="Hampir Expired"
                        value={employeeMetrics.hampirExpired}
                        helper="Kontrak atau status yang perlu dipantau dekat jatuh tempo."
                        icon={ShieldAlert}
                        tone="bg-amber-50 text-amber-600"
                    />
                    <EmployeeMetricCard
                        title="Tetap"
                        value={employeeMetrics.tetap}
                        helper="Diambil dari kolom status_pkwt: TETAP."
                        icon={BadgeCheck}
                        tone="bg-cyan-50 text-cyan-600"
                    />
                    <EmployeeMetricCard
                        title="Kontrak Ulang"
                        value={employeeMetrics.kontrakUlang}
                        helper="Diambil dari kolom status_pkwt: PKWT."
                        icon={RefreshCw}
                        tone="bg-indigo-50 text-indigo-600"
                    />
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                Arsip Karyawan Non Aktif
                            </p>
                            <h2 className="mt-1 text-2xl font-black text-slate-950">
                                {formatNumber(employeeMetrics.nonAktif)} orang
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Tidak ikut dihitung di statistik dan tabel Data Karyawan.
                            </p>
                        </div>
                        <Link
                            href="/daftar-karyawan/arsip"
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-600"
                        >
                            Buka Arsip
                        </Link>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <SelectFilter label="Divisi" value={divisi} options={filters.divisi} onChange={setDivisi} />
                        <SelectFilter label="Jabatan" value={jabatan} options={filters.jabatan} onChange={setJabatan} />
                        <SelectFilter label="Area" value={area} options={filters.area} onChange={setArea} />
                        <SelectFilter label="Status" value={status} options={activeStatusOptions} onChange={setStatus} />
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setDivisi("all");
                                    setJabatan("all");
                                    setArea("all");
                                    setStatus("all");
                                }}
                                className="h-10 w-full rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-cyan-600"
                            >
                                Reset Filter
                            </button>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                Data Karyawan
                            </h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Menampilkan {formatNumber(filteredEmployees.length)} dari {formatNumber(activeEmployees.length)} karyawan aktif.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                            {canManage && (
                                <Link
                                    href="/daftar-karyawan/create"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-xs font-black text-white shadow-sm transition hover:bg-cyan-600"
                                >
                                    <Plus size={16} />
                                    Tambah Karyawan
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="table-scroll max-h-[62vh] overflow-auto">
                        <table className="w-full min-w-[1120px] text-left text-sm">
                            <thead className="sticky top-0 z-30 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                                <tr>
                                    {canManage && <th className="sticky left-0 z-40 w-[92px] bg-slate-50 px-4 py-3 shadow-[1px_0_0_rgba(226,232,240,1)]">Aksi</th>}
                                    <th className="px-4 py-3">Karyawan</th>
                                    <th className="px-4 py-3">NIP</th>
                                    <th className="px-4 py-3">Divisi</th>
                                    <th className="px-4 py-3">Jabatan</th>
                                    <th className="px-4 py-3">Area</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">PKWT</th>
                                    <th className="px-4 py-3">Kontak</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedEmployees.map((employee) => (
                                    <tr
                                        key={employee.id_key}
                                        className="group cursor-pointer transition hover:bg-cyan-50/40 focus-within:bg-cyan-50/40"
                                        tabIndex={0}
                                        onClick={() => router.visit(`/daftar-karyawan/${employee.id_key}`)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                router.visit(`/daftar-karyawan/${employee.id_key}`);
                                            }
                                        }}
                                    >
                                        {canManage && (
                                            <td className="sticky left-0 z-20 bg-white px-4 py-3 shadow-[1px_0_0_rgba(226,232,240,1)] group-hover:bg-cyan-50">
                                                <Link
                                                    href={`/daftar-karyawan/${employee.id_key}/edit`}
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-600"
                                                    title="Edit karyawan"
                                                >
                                                    <Edit3 size={15} />
                                                </Link>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/daftar-karyawan/${employee.id_key}`}
                                                className="font-black text-slate-950 transition hover:text-cyan-600"
                                            >
                                                {employee.nama_karyawan || "-"}
                                            </Link>
                                            <div className="mt-1 text-xs font-semibold text-slate-500">{employee.nama_panggilan || employee.id_key}</div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block hover:text-cyan-600">
                                                {employee.nip || "-"}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block hover:text-cyan-600">
                                                {employee.divisi || "-"}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block hover:text-cyan-600">
                                                {employee.jabatan || "-"}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block hover:text-cyan-600">
                                                {employee.area || "-"}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block">
                                                <StatusPill value={employee.status} />
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block hover:text-cyan-600">
                                                {employee.status_pkwt || "-"}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block">
                                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {employee.no_ponsel || "-"}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                    <Mail size={13} className="text-slate-400" />
                                                    <span className="max-w-[190px] truncate">{employee.email || "-"}</span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link href={`/daftar-karyawan/${employee.id_key}`} className="block">
                                                <div className="flex items-center gap-2 font-bold text-slate-700">
                                                    <CalendarClock size={14} className="text-slate-400" />
                                                    {employee.tanggal_bergabung || "-"}
                                                </div>
                                                <div className="mt-1 text-xs font-semibold text-slate-500">
                                                    Akhir PKWT: {employee.akhir_pkwt || "-"}
                                                </div>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {!filteredEmployees.length && (
                                    <tr>
                                        <td colSpan={canManage ? 10 : 9} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                            Tidak ada data karyawan yang cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {filteredEmployees.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs font-bold text-slate-500">
                                Menampilkan {formatNumber((currentPage - 1) * tablePageSize + 1)}-{formatNumber(Math.min(currentPage * tablePageSize, filteredEmployees.length))} dari {formatNumber(filteredEmployees.length)} data
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => setTablePage(currentPage - 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Sebelumnya
                                </button>
                                {visiblePages.map((pageNumber, index) => (
                                    <React.Fragment key={pageNumber}>
                                        {index > 0 && pageNumber - visiblePages[index - 1] > 1 && (
                                            <span className="px-1 text-xs font-black text-slate-400">...</span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setTablePage(pageNumber)}
                                            className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-black transition ${pageNumber === currentPage ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            {pageNumber}
                                        </button>
                                    </React.Fragment>
                                ))}
                                <button
                                    type="button"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setTablePage(currentPage + 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                Arsip Karyawan Non Aktif
                            </h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Menampilkan {formatNumber(archivedEmployees.length)} dari {formatNumber(inactiveEmployees.length)} data arsip.
                            </p>
                        </div>
                    </div>

                    <div className="table-scroll max-h-[360px] overflow-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="sticky top-0 z-20 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                                <tr>
                                    <th className="px-4 py-3">Karyawan</th>
                                    <th className="px-4 py-3">NIP</th>
                                    <th className="px-4 py-3">Divisi</th>
                                    <th className="px-4 py-3">Jabatan</th>
                                    <th className="px-4 py-3">Area</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Tanggal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {archivedEmployees.map((employee) => (
                                    <tr
                                        key={employee.id_key}
                                        className="cursor-pointer transition hover:bg-slate-50"
                                        onClick={() => router.visit(`/daftar-karyawan/${employee.id_key}`)}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-black text-slate-950">{employee.nama_karyawan || "-"}</p>
                                            <p className="mt-1 text-xs font-semibold text-slate-500">{employee.nama_panggilan || employee.id_key}</p>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-700">{employee.nip || "-"}</td>
                                        <td className="px-4 py-3 font-bold text-slate-700">{employee.divisi || "-"}</td>
                                        <td className="px-4 py-3 font-bold text-slate-700">{employee.jabatan || "-"}</td>
                                        <td className="px-4 py-3 font-bold text-slate-700">{employee.area || "-"}</td>
                                        <td className="px-4 py-3"><StatusPill value={employee.status} /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                                <CalendarClock size={14} className="text-slate-400" />
                                                {employee.tanggal_bergabung || "-"}
                                            </div>
                                            <div className="mt-1 text-xs font-semibold text-slate-500">
                                                Akhir PKWT: {employee.akhir_pkwt || "-"}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!archivedEmployees.length && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                                            Belum ada karyawan non aktif yang masuk arsip.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
