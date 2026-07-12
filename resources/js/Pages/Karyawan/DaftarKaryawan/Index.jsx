import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    BriefcaseBusiness,
    Building2,
    CalendarClock,
    Edit3,
    IdCard,
    Mail,
    MapPinned,
    Phone,
    Plus,
    Search,
    ShieldAlert,
    UserCheck,
    Users,
} from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

const statusTone = {
    AKTIF: "border-emerald-100 bg-emerald-50 text-emerald-700",
    EXPIRED: "border-rose-100 bg-rose-50 text-rose-700",
    "HAMPIR EXPIRED": "border-amber-100 bg-amber-50 text-amber-700",
};

const officeDivisions = [
    "DIREKSI",
    "FINANCE ACCOUNTING & TAX",
    "HR-GA",
    "MAINTENANCE",
    "OPERATIONAL",
    "PRIMARY",
    "TRUCKING",
];

const viewModes = [
    { key: "all", label: "Semua", icon: Users },
    { key: "ho", label: "Pegawai HO", icon: Building2 },
    { key: "branch", label: "Kantor Cabang", icon: MapPinned },
    { key: "driver", label: "Driver", icon: IdCard },
    { key: "helper", label: "Helper", icon: BriefcaseBusiness },
];

function employeeMode(employee) {
    if (employee.jabatan === "DRIVER") {
        return "driver";
    }

    if (employee.jabatan === "HELPER") {
        return "helper";
    }

    if (officeDivisions.includes(employee.divisi)) {
        return "ho";
    }

    return "branch";
}

function StatCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{formatNumber(value)}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

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

function DistributionList({ title, items = [] }) {
    const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            <div className="mt-4 space-y-3">
                {items.slice(0, 7).map((item) => {
                    const percent = total > 0 ? Math.round((Number(item.value || 0) / total) * 100) : 0;

                    return (
                        <div key={item.label}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                                <span className="truncate">{item.label}</span>
                                <span>{formatNumber(item.value)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.max(percent, item.value > 0 ? 4 : 0)}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Index({
    employees = [],
    summary = {},
    distributions = {},
    filters = {},
}) {
    const [search, setSearch] = useState("");
    const [divisi, setDivisi] = useState("all");
    const [jabatan, setJabatan] = useState("all");
    const [area, setArea] = useState("all");
    const [status, setStatus] = useState("all");
    const [mode, setMode] = useState("all");

    const modeCounts = useMemo(() => {
        return employees.reduce(
            (counts, employee) => {
                const key = employeeMode(employee);
                counts.all += 1;
                counts[key] += 1;

                return counts;
            },
            { all: 0, ho: 0, branch: 0, driver: 0, helper: 0 },
        );
    }, [employees]);

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
                ]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(keyword));

            return (
                matchKeyword &&
                (mode === "all" || employeeMode(employee) === mode) &&
                (divisi === "all" || employee.divisi === divisi) &&
                (jabatan === "all" || employee.jabatan === jabatan) &&
                (area === "all" || employee.area === area) &&
                (status === "all" || employee.status === status)
            );
        });
    }, [employees, search, mode, divisi, jabatan, area, status]);

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
                                Data pegawai, driver, helper, divisi, area, dan status kontrak dari tabel legacy AppSheet.
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
                            <Link
                                href="/daftar-karyawan/create"
                                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-black text-white shadow-lg shadow-cyan-950/20 transition hover:bg-cyan-400"
                            >
                                <Plus size={17} />
                                Tambah
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <StatCard title="Total" value={summary.total} helper="Seluruh data pegawai" icon={Users} />
                    <StatCard title="Aktif" value={summary.aktif} helper="Status aktif" icon={UserCheck} />
                    <StatCard title="Expired" value={summary.expired} helper="Perlu validasi kontrak" icon={ShieldAlert} />
                    <StatCard title="Driver" value={summary.driver} helper="Jabatan driver" icon={IdCard} />
                    <StatCard title="Helper" value={summary.helper} helper="Jabatan helper" icon={BriefcaseBusiness} />
                    <StatCard title="Kontak" value={summary.kontakTerisi} helper="Nomor ponsel terisi" icon={Phone} />
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        {viewModes.map((item) => {
                            const Icon = item.icon;
                            const isActive = mode === item.key;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setMode(item.key)}
                                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition ${isActive ? "border-cyan-300 bg-cyan-50 text-cyan-700 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-slate-50"}`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isActive ? "bg-white text-cyan-600" : "bg-slate-100 text-slate-500"}`}>
                                            <Icon size={18} />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-black">{item.label}</span>
                                            <span className="text-xs font-semibold opacity-75">Subview karyawan</span>
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-lg font-black">{formatNumber(modeCounts[item.key])}</span>
                                </button>
                            );
                        })}
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
                                    setMode("all");
                                }}
                                className="h-10 w-full rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-cyan-600"
                            >
                                Reset Filter
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 xl:grid-cols-3">
                    <DistributionList title="Divisi Terbanyak" items={distributions.divisi} />
                    <DistributionList title="Jabatan Terbanyak" items={distributions.jabatan} />
                    <DistributionList title="Area Terbanyak" items={distributions.area} />
                </div>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                                Data Karyawan
                            </h2>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                                Menampilkan {formatNumber(filteredEmployees.length)} dari {formatNumber(employees.length)} data.
                            </p>
                        </div>
                        <div className="text-xs font-black uppercase tracking-wide text-slate-400">
                            Source: hr_manager_db_pegawai
                        </div>
                    </div>

                    <div className="table-scroll max-h-[62vh] overflow-auto">
                        <table className="w-full min-w-[1120px] text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500 shadow-[0_1px_0_rgba(226,232,240,1)]">
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
                                    <th className="px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.map((employee) => (
                                    <tr
                                        key={employee.id_key}
                                        className="cursor-pointer transition hover:bg-cyan-50/40 focus-within:bg-cyan-50/40"
                                        tabIndex={0}
                                        onClick={() => router.visit(`/daftar-karyawan/${employee.id_key}`)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                router.visit(`/daftar-karyawan/${employee.id_key}`);
                                            }
                                        }}
                                    >
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
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/daftar-karyawan/${employee.id_key}/edit`}
                                                onClick={(event) => event.stopPropagation()}
                                                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-cyan-300 hover:text-cyan-600"
                                            >
                                                <Edit3 size={14} />
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
