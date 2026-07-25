import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CalendarClock, Mail, Phone, Search, Users } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const tablePageSize = 50;

const statusTone = {
    EXPIRED: "border-rose-100 bg-rose-50 text-rose-700",
    "NON AKTIF": "border-slate-200 bg-slate-100 text-slate-700",
    "TIDAK AKTIF": "border-slate-200 bg-slate-100 text-slate-700",
    RESIGN: "border-slate-200 bg-slate-100 text-slate-700",
    KELUAR: "border-slate-200 bg-slate-100 text-slate-700",
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

export default function Archive({ employees = [], filters = {} }) {
    const [search, setSearch] = useState("");
    const [divisi, setDivisi] = useState("all");
    const [jabatan, setJabatan] = useState("all");
    const [area, setArea] = useState("all");
    const [status, setStatus] = useState("all");
    const [tablePage, setTablePage] = useState(1);

    const filteredEmployees = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return employees.filter((employee) => {
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
                (area === "all" || employee.area === area) &&
                (status === "all" || employee.status === status)
            );
        });
    }, [employees, search, divisi, jabatan, area, status]);

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
            <Head title="Arsip Karyawan Non Aktif" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-rose-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-rose-200">
                                <Users size={15} />
                                Arsip HR
                            </div>
                            <h1 className="mt-4 text-2xl font-black tracking-tight">
                                Karyawan Expired / Non Aktif
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                                Halaman ini khusus untuk data karyawan yang sudah expired atau tidak aktif. Data tidak ikut tabel kerja harian.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Cari nama, NIP, divisi, area..."
                                    className="h-11 w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-3 text-sm font-semibold text-white placeholder:text-slate-400 outline-none focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                                />
                            </div>
                            <Link
                                href="/daftar-karyawan"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
                            >
                                <ArrowLeft size={16} />
                                Kembali
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <SelectFilter label="Divisi" value={divisi} options={filters.divisi} onChange={setDivisi} />
                        <SelectFilter label="Jabatan" value={jabatan} options={filters.jabatan} onChange={setJabatan} />
                        <SelectFilter label="Area" value={area} options={filters.area} onChange={setArea} />
                        <SelectFilter label="Status" value={status} options={filters.status} onChange={setStatus} />
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
                                Data Arsip Karyawan
                            </h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Menampilkan {formatNumber(filteredEmployees.length)} dari {formatNumber(employees.length)} data arsip.
                            </p>
                        </div>
                    </div>

                    <div className="table-scroll max-h-[66vh] overflow-auto">
                        <table className="w-full min-w-[1120px] text-left text-sm">
                            <thead className="sticky top-0 z-20 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
                                <tr>
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
                                        className="cursor-pointer transition hover:bg-rose-50/50"
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
                                        <td className="px-4 py-3 font-bold text-slate-700">{employee.status_pkwt || "-"}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2 font-bold text-slate-700">
                                                <Phone size={14} className="text-slate-400" />
                                                {employee.no_ponsel || "-"}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                                <Mail size={13} className="text-slate-400" />
                                                <span className="max-w-[190px] truncate">{employee.email || "-"}</span>
                                            </div>
                                        </td>
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
                                {!filteredEmployees.length && (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                                            Tidak ada data arsip yang cocok.
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
            </div>
        </AdminLayout>
    );
}
