import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarClock,
    CreditCard,
    Edit3,
    IdCard,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Trash2,
    User,
} from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const statusTone = {
    AKTIF: "border-emerald-100 bg-emerald-50 text-emerald-700",
    EXPIRED: "border-rose-100 bg-rose-50 text-rose-700",
    "HAMPIR EXPIRED": "border-amber-100 bg-amber-50 text-amber-700",
};

const value = (item) => item || "-";

function StatusPill({ value: status }) {
    const label = status || "BELUM DIISI";

    return (
        <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide ${statusTone[label] || "border-slate-200 bg-slate-100 text-slate-600"}`}>
            {label}
        </span>
    );
}

function InfoCard({ title, icon: Icon, children }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Icon size={18} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function Field({ label, children, wide = false }) {
    return (
        <div className={wide ? "sm:col-span-2" : ""}>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-800">{value(children)}</p>
        </div>
    );
}

export default function Detail({ employee }) {
    const destroy = () => {
        if (window.confirm("Hapus data karyawan ini? Aksi ini tidak bisa dibatalkan.")) {
            router.delete(`/daftar-karyawan/${employee.id_key}`);
        }
    };

    return (
        <AdminLayout>
            <Head title={`Detail Karyawan - ${employee.nama_karyawan || employee.id_key}`} />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/daftar-karyawan"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-600"
                    >
                        <ArrowLeft size={16} />
                        Kembali ke Daftar Karyawan
                    </Link>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`/daftar-karyawan/${employee.id_key}/edit`}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-cyan-600"
                        >
                            <Edit3 size={16} />
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={destroy}
                            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-rose-700"
                        >
                            <Trash2 size={16} />
                            Hapus
                        </button>
                    </div>
                </div>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                                <User size={15} />
                                Detail Karyawan
                            </div>
                            <h1 className="mt-4 break-words text-2xl font-black tracking-tight">
                                {value(employee.nama_karyawan)}
                            </h1>
                            <p className="mt-2 text-sm font-semibold text-slate-300">
                                {value(employee.jabatan)} | {value(employee.divisi)} | {value(employee.area)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <StatusPill value={employee.status} />
                            <StatusPill value={employee.status_pkwt} />
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 xl:grid-cols-2">
                    <InfoCard title="Identitas" icon={IdCard}>
                        <Field label="ID Key">{employee.id_key}</Field>
                        <Field label="NIP">{employee.nip}</Field>
                        <Field label="Nama Panggilan">{employee.nama_panggilan}</Field>
                        <Field label="Jenis Kelamin">{employee.jenis_kelamin}</Field>
                        <Field label="Agama">{employee.agama}</Field>
                        <Field label="Status Pernikahan">{employee.status_pernikahan}</Field>
                        <Field label="Tempat Lahir">{employee.tempat_lahir}</Field>
                        <Field label="Tanggal Lahir / Umur">{`${value(employee.tanggal_lahir)} / ${value(employee.umur)}`}</Field>
                        <Field label="No KTP">{employee.no_ktp}</Field>
                        <Field label="No Kartu Keluarga">{employee.no_kartu_keluarga}</Field>
                    </InfoCard>

                    <InfoCard title="Pekerjaan" icon={BriefcaseBusiness}>
                        <Field label="Divisi">{employee.divisi}</Field>
                        <Field label="Jabatan">{employee.jabatan}</Field>
                        <Field label="Level">{employee.level}</Field>
                        <Field label="Area">{employee.area}</Field>
                        <Field label="Tanggal Bergabung">{employee.tanggal_bergabung}</Field>
                        <Field label="Awal PKWT">{employee.awal_pkwt}</Field>
                        <Field label="Akhir PKWT">{employee.akhir_pkwt}</Field>
                        <Field label="Masa Aktif">{employee.masa_aktif}</Field>
                        <Field label="Hari Aktif">{employee.hari_aktif}</Field>
                        <Field label="Status PKWT">{employee.status_pkwt}</Field>
                    </InfoCard>

                    <InfoCard title="Kontak & Alamat" icon={Phone}>
                        <Field label="No Ponsel">
                            <span className="inline-flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" />
                                {value(employee.no_ponsel)}
                            </span>
                        </Field>
                        <Field label="Email">
                            <span className="inline-flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                {value(employee.email)}
                            </span>
                        </Field>
                        <Field label="Alamat KTP" wide>
                            <span className="inline-flex items-start gap-2">
                                <MapPin size={14} className="mt-1 shrink-0 text-slate-400" />
                                {value(employee.alamat_sesuai_ktp)}
                            </span>
                        </Field>
                        <Field label="Alamat Domisili" wide>{employee.alamat_domisili}</Field>
                    </InfoCard>

                    <InfoCard title="SIM, Bank, Pendidikan" icon={ShieldCheck}>
                        <Field label="Jenis SIM">{employee.jenis_sim}</Field>
                        <Field label="No SIM">{employee.no_sim}</Field>
                        <Field label="Masa Berlaku SIM">
                            <span className="inline-flex items-center gap-2">
                                <CalendarClock size={14} className="text-slate-400" />
                                {value(employee.masa_berlaku)}
                            </span>
                        </Field>
                        <Field label="Bank">
                            <span className="inline-flex items-center gap-2">
                                <CreditCard size={14} className="text-slate-400" />
                                {value(employee.nama_bank)}
                            </span>
                        </Field>
                        <Field label="No Rekening">{employee.rekening}</Field>
                        <Field label="Atas Nama Rekening">{employee.nama_pemilik_rekening}</Field>
                        <Field label="Pendidikan">{employee.pendidikan}</Field>
                        <Field label="Sekolah / Universitas">{employee.nama_sekolah_universitas}</Field>
                        <Field label="Fakultas">{employee.fakultas}</Field>
                        <Field label="Jurusan">{employee.jurusan}</Field>
                        <Field label="NPWP">{employee.no_npwp}</Field>
                        <Field label="BPJS Kesehatan">{employee.bpjk_kes}</Field>
                        <Field label="BPJS TK">{employee.bpjs_tk}</Field>
                        <Field label="Ukuran Baju / Sepatu">{`${value(employee.ukuran_baju)} / ${value(employee.ukuran_sepatu)}`}</Field>
                    </InfoCard>
                </div>

                <InfoCard title="Keterangan" icon={User}>
                    <Field label="Catatan" wide>{employee.keterangan}</Field>
                </InfoCard>
            </div>
        </AdminLayout>
    );
}
