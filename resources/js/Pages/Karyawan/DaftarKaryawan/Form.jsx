import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Save, Users } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

function Input({ label, error, ...props }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</span>
            <input
                {...props}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500"
            />
            {error ? <span className="mt-1 block text-xs font-bold text-rose-600">{error}</span> : null}
        </label>
    );
}

function TextArea({ label, error, ...props }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</span>
            <textarea
                {...props}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />
            {error ? <span className="mt-1 block text-xs font-bold text-rose-600">{error}</span> : null}
        </label>
    );
}

function Select({ label, error, children, ...props }) {
    return (
        <label className="block">
            <span className="mb-1 block text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</span>
            <select
                {...props}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            >
                {children}
            </select>
            {error ? <span className="mt-1 block text-xs font-bold text-rose-600">{error}</span> : null}
        </label>
    );
}

function OptionSelect({ label, value, onChange, options = [], error }) {
    return (
        <Select label={label} value={value} onChange={(event) => onChange(event.target.value)} error={error}>
            <option value="">Pilih / kosongkan</option>
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </Select>
    );
}

export default function Form({ mode, employee, options = {} }) {
    const isEdit = mode === "edit";
    const { data, setData, post, put, processing, errors } = useForm({
        id_key: employee.id_key || "",
        nama_karyawan: employee.nama_karyawan || "",
        nama_panggilan: employee.nama_panggilan || "",
        nip: employee.nip || "",
        divisi: employee.divisi || "",
        jabatan: employee.jabatan || "",
        level: employee.level || "",
        area: employee.area || "",
        agama: employee.agama || "",
        jenis_kelamin: employee.jenis_kelamin || "",
        tempat_lahir: employee.tempat_lahir || "",
        tanggal_lahir: employee.tanggal_lahir || "",
        umur: employee.umur || "",
        no_ponsel: employee.no_ponsel || "",
        no_ktp: employee.no_ktp || "",
        no_kartu_keluarga: employee.no_kartu_keluarga || "",
        alamat_sesuai_ktp: employee.alamat_sesuai_ktp || "",
        alamat_domisili: employee.alamat_domisili || "",
        status_pernikahan: employee.status_pernikahan || "",
        email: employee.email || "",
        tanggal_bergabung: employee.tanggal_bergabung || "",
        awal_pkwt: employee.awal_pkwt || "",
        status_pkwt: employee.status_pkwt || "",
        akhir_pkwt: employee.akhir_pkwt || "",
        masa_aktif: employee.masa_aktif || "",
        hari_aktif: employee.hari_aktif || "",
        jenis_sim: employee.jenis_sim || "",
        no_sim: employee.no_sim || "",
        masa_berlaku: employee.masa_berlaku || "",
        status: employee.status || "",
        nama_bank: employee.nama_bank || "",
        rekening: employee.rekening || "",
        nama_pemilik_rekening: employee.nama_pemilik_rekening || "",
        pendidikan: employee.pendidikan || "",
        nama_sekolah_universitas: employee.nama_sekolah_universitas || "",
        fakultas: employee.fakultas || "",
        jurusan: employee.jurusan || "",
        no_npwp: employee.no_npwp || "",
        bpjk_kes: employee.bpjk_kes || "",
        bpjs_tk: employee.bpjs_tk || "",
        ukuran_baju: employee.ukuran_baju || "",
        ukuran_sepatu: employee.ukuran_sepatu || "",
        keterangan: employee.keterangan || "",
    });

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) {
            put(`/daftar-karyawan/${employee.id_key}`);
            return;
        }

        post("/daftar-karyawan");
    };

    return (
        <AdminLayout>
            <Head title={isEdit ? "Edit Karyawan" : "Tambah Karyawan"} />

            <form onSubmit={submit} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={isEdit ? `/daftar-karyawan/${employee.id_key}` : "/daftar-karyawan"}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-600"
                    >
                        <ArrowLeft size={16} />
                        Kembali
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save size={17} />
                        {processing ? "Menyimpan..." : "Simpan Data"}
                    </button>
                </div>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                        <Users size={15} />
                        {isEdit ? "Edit Karyawan" : "Tambah Karyawan"}
                    </div>
                    <h1 className="mt-4 text-2xl font-black tracking-tight">
                        {isEdit ? data.nama_karyawan || employee.id_key : "Data Karyawan Baru"}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                        Form ini menulis ke kolom fisik hr_manager_db_pegawai. Virtual column AppSheet tetap tidak diubah.
                    </p>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-950">Identitas & Pekerjaan</h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Input label="ID Key" value={data.id_key} disabled={isEdit} onChange={(event) => setData("id_key", event.target.value)} error={errors.id_key} placeholder="Auto jika kosong" />
                        <Input label="Nama Karyawan" value={data.nama_karyawan} onChange={(event) => setData("nama_karyawan", event.target.value)} error={errors.nama_karyawan} />
                        <Input label="Nama Panggilan" value={data.nama_panggilan} onChange={(event) => setData("nama_panggilan", event.target.value)} error={errors.nama_panggilan} />
                        <Input label="NIP" value={data.nip} onChange={(event) => setData("nip", event.target.value)} error={errors.nip} />
                        <OptionSelect label="Divisi" value={data.divisi} onChange={(value) => setData("divisi", value)} options={options.divisi} error={errors.divisi} />
                        <OptionSelect label="Jabatan" value={data.jabatan} onChange={(value) => setData("jabatan", value)} options={options.jabatan} error={errors.jabatan} />
                        <OptionSelect label="Level" value={data.level} onChange={(value) => setData("level", value)} options={options.level} error={errors.level} />
                        <OptionSelect label="Area" value={data.area} onChange={(value) => setData("area", value)} options={options.area} error={errors.area} />
                        <Input label="Area Manual" value={data.area} onChange={(event) => setData("area", event.target.value)} error={errors.area} />
                        <OptionSelect label="Status" value={data.status} onChange={(value) => setData("status", value)} options={options.status} error={errors.status} />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-950">Biodata & Kontak</h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <OptionSelect label="Agama" value={data.agama} onChange={(value) => setData("agama", value)} options={options.agama} error={errors.agama} />
                        <OptionSelect label="Jenis Kelamin" value={data.jenis_kelamin} onChange={(value) => setData("jenis_kelamin", value)} options={options.jenis_kelamin} error={errors.jenis_kelamin} />
                        <Input label="Tempat Lahir" value={data.tempat_lahir} onChange={(event) => setData("tempat_lahir", event.target.value)} error={errors.tempat_lahir} />
                        <Input label="Tanggal Lahir" value={data.tanggal_lahir} onChange={(event) => setData("tanggal_lahir", event.target.value)} error={errors.tanggal_lahir} />
                        <Input label="Umur" value={data.umur} onChange={(event) => setData("umur", event.target.value)} error={errors.umur} />
                        <Input label="No Ponsel" value={data.no_ponsel} onChange={(event) => setData("no_ponsel", event.target.value)} error={errors.no_ponsel} />
                        <Input label="Email" value={data.email} onChange={(event) => setData("email", event.target.value)} error={errors.email} />
                        <OptionSelect label="Status Pernikahan" value={data.status_pernikahan} onChange={(value) => setData("status_pernikahan", value)} options={options.status_pernikahan} error={errors.status_pernikahan} />
                        <TextArea label="Alamat KTP" value={data.alamat_sesuai_ktp} onChange={(event) => setData("alamat_sesuai_ktp", event.target.value)} error={errors.alamat_sesuai_ktp} />
                        <TextArea label="Alamat Domisili" value={data.alamat_domisili} onChange={(event) => setData("alamat_domisili", event.target.value)} error={errors.alamat_domisili} />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-950">Kontrak, SIM, Bank</h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Input label="Tanggal Bergabung" value={data.tanggal_bergabung} onChange={(event) => setData("tanggal_bergabung", event.target.value)} error={errors.tanggal_bergabung} />
                        <Input label="Awal PKWT" value={data.awal_pkwt} onChange={(event) => setData("awal_pkwt", event.target.value)} error={errors.awal_pkwt} />
                        <OptionSelect label="Status PKWT" value={data.status_pkwt} onChange={(value) => setData("status_pkwt", value)} options={options.status_pkwt} error={errors.status_pkwt} />
                        <Input label="Akhir PKWT" value={data.akhir_pkwt} onChange={(event) => setData("akhir_pkwt", event.target.value)} error={errors.akhir_pkwt} />
                        <Input label="Masa Aktif" value={data.masa_aktif} onChange={(event) => setData("masa_aktif", event.target.value)} error={errors.masa_aktif} />
                        <Input label="Hari Aktif" value={data.hari_aktif} onChange={(event) => setData("hari_aktif", event.target.value)} error={errors.hari_aktif} />
                        <OptionSelect label="Jenis SIM" value={data.jenis_sim} onChange={(value) => setData("jenis_sim", value)} options={options.jenis_sim} error={errors.jenis_sim} />
                        <Input label="No SIM" value={data.no_sim} onChange={(event) => setData("no_sim", event.target.value)} error={errors.no_sim} />
                        <Input label="Masa Berlaku SIM" value={data.masa_berlaku} onChange={(event) => setData("masa_berlaku", event.target.value)} error={errors.masa_berlaku} />
                        <OptionSelect label="Bank" value={data.nama_bank} onChange={(value) => setData("nama_bank", value)} options={options.nama_bank} error={errors.nama_bank} />
                        <Input label="Rekening" value={data.rekening} onChange={(event) => setData("rekening", event.target.value)} error={errors.rekening} />
                        <Input label="Nama Pemilik Rekening" value={data.nama_pemilik_rekening} onChange={(event) => setData("nama_pemilik_rekening", event.target.value)} error={errors.nama_pemilik_rekening} />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-950">Dokumen & Pendidikan</h2>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Input label="No KTP" value={data.no_ktp} onChange={(event) => setData("no_ktp", event.target.value)} error={errors.no_ktp} />
                        <Input label="No Kartu Keluarga" value={data.no_kartu_keluarga} onChange={(event) => setData("no_kartu_keluarga", event.target.value)} error={errors.no_kartu_keluarga} />
                        <Input label="NPWP" value={data.no_npwp} onChange={(event) => setData("no_npwp", event.target.value)} error={errors.no_npwp} />
                        <Input label="BPJS Kesehatan" value={data.bpjk_kes} onChange={(event) => setData("bpjk_kes", event.target.value)} error={errors.bpjk_kes} />
                        <Input label="BPJS TK" value={data.bpjs_tk} onChange={(event) => setData("bpjs_tk", event.target.value)} error={errors.bpjs_tk} />
                        <OptionSelect label="Pendidikan" value={data.pendidikan} onChange={(value) => setData("pendidikan", value)} options={options.pendidikan} error={errors.pendidikan} />
                        <Input label="Sekolah / Universitas" value={data.nama_sekolah_universitas} onChange={(event) => setData("nama_sekolah_universitas", event.target.value)} error={errors.nama_sekolah_universitas} />
                        <Input label="Fakultas" value={data.fakultas} onChange={(event) => setData("fakultas", event.target.value)} error={errors.fakultas} />
                        <Input label="Jurusan" value={data.jurusan} onChange={(event) => setData("jurusan", event.target.value)} error={errors.jurusan} />
                        <Input label="Ukuran Baju" value={data.ukuran_baju} onChange={(event) => setData("ukuran_baju", event.target.value)} error={errors.ukuran_baju} />
                        <Input label="Ukuran Sepatu" value={data.ukuran_sepatu} onChange={(event) => setData("ukuran_sepatu", event.target.value)} error={errors.ukuran_sepatu} />
                        <TextArea label="Keterangan" value={data.keterangan} onChange={(event) => setData("keterangan", event.target.value)} error={errors.keterangan} />
                    </div>
                </section>
            </form>
        </AdminLayout>
    );
}
