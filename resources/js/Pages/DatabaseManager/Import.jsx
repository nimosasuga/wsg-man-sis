import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2, FileSpreadsheet, FileUp, ShieldCheck, Upload, XCircle } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Import({ table, preview = null }) {
    const [file, setFile] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const canCommit = preview?.token && preview.validRows > 0 && preview.errorCount === 0;

    const submit = (event) => {
        event.preventDefault();
        if (!file) return;
        setUploadError(null);
        router.post(table.previewUrl, { file }, {
            forceFormData: true,
            onError: (errors) => setUploadError(Object.values(errors)[0] || "File belum dapat diperiksa. Pastikan format dan ukurannya sesuai."),
        });
    };

    const commit = () => {
        if (window.confirm(`Simpan ${preview.validRows} baris ke tabel ${table.name}?`)) {
            router.post(table.commitUrl, { token: preview.token });
        }
    };

    return <AdminLayout>
        <Head title={`Upload: ${table.name}`} />
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><Link href={table.detailUrl} className="inline-flex items-center gap-1 transition hover:text-violet-600"><ArrowLeft size={15} /> {table.name}</Link><span className="text-slate-300">/</span><span className="text-slate-900">Upload data</span></div>

            <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-300" />
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-end">
                    <div className="min-w-0"><span className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"><Upload size={15} /> Upload ke tabel</span><h1 className="mt-4 break-all font-mono text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{table.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Gunakan template asli agar nama dan urutan kolom tetap sama. Sistem hanya menambah data baru atau memperbarui baris dengan primary key yang sama.</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">Primary key: {table.primaryKey || "tidak tersedia"}</span><span className="rounded-lg bg-cyan-50 px-3 py-2 text-cyan-700">{table.columns.length} kolom</span></div></div>
                    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-bold text-slate-950">Pilih file</p><p className="mt-1 text-sm leading-5 text-slate-500">`.xlsx`, `.xls`, atau `.csv` hingga 50 MB.</p><label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 transition hover:border-violet-300"><FileUp size={20} className="shrink-0 text-violet-600" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-600">{file?.name || "Pilih file dari komputer"}</span><input className="sr-only" type="file" accept=".xlsx,.xls,.csv,.txt" onChange={(event) => { setFile(event.target.files?.[0] || null); setUploadError(null); }} /></label>{uploadError && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold leading-5 text-rose-700">{uploadError}</p>}<button disabled={!file || !table.primaryKey} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><Upload size={16} />Periksa file</button><a href={table.templateUrl} className="mt-3 inline-flex w-full items-center justify-center gap-2 text-sm font-bold text-violet-700 hover:text-violet-900"><FileSpreadsheet size={16} />Download template asli</a></form>
                </div>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-700" size={19} /><div><p className="font-bold">Sebelum data disimpan</p><p className="mt-1">Upload tidak mengubah nama tabel, kolom, index, atau struktur database. Primary key yang sudah ada dipakai untuk memperbarui data. Jika `id_key` kosong pada baris baru, sistem akan membuatkannya otomatis.</p></div></div></section>

            {preview && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="font-extrabold text-slate-950">Hasil pemeriksaan file</h2><p className="mt-1 text-sm text-slate-500">Data belum berubah sampai tombol simpan digunakan.</p></div>{canCommit ? <button onClick={commit} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"><CheckCircle2 size={16} />Simpan {preview.validRows} baris</button> : <span className="inline-flex items-center gap-2 text-sm font-bold text-rose-600"><XCircle size={17} />Perbaiki file sebelum menyimpan</span>}</div><div className="grid gap-3 p-5 sm:grid-cols-4 sm:p-6">{[["Diperiksa", preview.totalRows, "border-slate-200 bg-slate-50", "text-slate-600"], ["Data baru", preview.newRows, "border-cyan-100 bg-cyan-50", "text-cyan-700"], ["Perbarui", preview.updateRows, "border-violet-100 bg-violet-50", "text-violet-700"], ["Perlu dicek", preview.errorCount, "border-rose-100 bg-rose-50", "text-rose-700"]].map(([label, value, cardClass, labelClass]) => <div key={label} className={`rounded-xl border p-4 ${cardClass}`}><p className={`text-xs font-bold uppercase tracking-wide ${labelClass}`}>{label}</p><p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-950">{new Intl.NumberFormat("id-ID").format(value || 0)}</p></div>)}</div>{preview.errors?.length > 0 && <div className="border-t border-rose-100 bg-rose-50 p-5 text-sm text-rose-800 sm:p-6"><p className="font-bold">Baris yang perlu diperbaiki</p><ul className="mt-2 space-y-1">{preview.errors.map((error, index) => <li key={`${error.row}-${index}`}>{error.row ? `Baris ${error.row}: ` : ""}{error.message}</li>)}</ul>{preview.errorCount > preview.errors.length && <p className="mt-2">Masih ada error lain yang tidak ditampilkan pada daftar ini.</p>}</div>}<div className="custom-scrollbar overflow-auto border-t border-slate-100"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Status</th>{table.columns.map((column) => <th key={column.name} className="px-4 py-3">{column.name}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{preview.sample?.map((row, index) => <tr key={index}><td className="whitespace-nowrap px-4 py-3"><span className={`rounded-md px-2 py-1 text-xs font-bold ${row.__action === "Baru" ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>{row.__action}</span></td>{table.columns.map((column) => <td key={column.name} className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-slate-700" title={row[column.name] || ""}>{row[column.name] || "-"}</td>)}</tr>)}{!preview.sample?.length && <tr><td colSpan={table.columns.length + 1} className="px-4 py-10 text-center text-sm text-slate-500">Belum ada data yang dapat diproses.</td></tr>}</tbody></table></div></section>}
        </div>
    </AdminLayout>;
}
