import React from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, KeyRound, Save, Trash2 } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

function fieldLabel(field) {
    return String(field || "").replaceAll("_", " ");
}

function TextField({ field, value, error, disabled, placeholder, onChange }) {
    const isLong = ["keterangan", "dekripsi_invoice", "alamat_lengkap"].some((key) => field.includes(key));
    const className = "w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

    return (
        <label className={isLong ? "min-w-0 md:col-span-2" : "min-w-0"}>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">{fieldLabel(field)}</span>
            {isLong ? (
                <textarea value={value || ""} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={4} className={`${className} py-3`} />
            ) : (
                <input value={value || ""} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${className} h-11`} />
            )}
            {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
        </label>
    );
}

export default function Form({ mode, module, config, record = {} }) {
    const isEdit = mode === "edit";
    const keyField = config.key;
    const recordId = record?.[keyField];
    const { data, setData, post, put, processing, errors } = useForm(record);

    const submit = (event) => {
        event.preventDefault();
        if (isEdit) put(`/module-records/${module}/${encodeURIComponent(recordId)}`);
        else post(`/module-records/${module}`);
    };

    const destroy = () => {
        if (isEdit && window.confirm(`Hapus data ${config.label} ini?`)) {
            router.delete(`/module-records/${module}/${encodeURIComponent(recordId)}`);
        }
    };

    return (
        <AdminLayout>
            <Head title={`${isEdit ? "Edit" : "Tambah"} ${config.label}`} />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-indigo-600">Dashboard</Link>
                    <span>/</span>
                    <Link href="/module-records" className="transition hover:text-indigo-600">CRUD Data</Link>
                    <span>/</span>
                    <Link href={config.index} className="transition hover:text-indigo-600">{config.label}</Link>
                    <span>/</span>
                    <span className="text-slate-800">{isEdit ? "Edit" : "Tambah data"}</span>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                                <KeyRound size={14} />
                                CRUD data
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{isEdit ? "Edit data" : "Tambah data"} {config.label}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{isEdit ? "Perbarui informasi yang diperlukan, lalu simpan perubahan." : "Lengkapi data berikut. ID record akan dibuat otomatis saat data disimpan."}</p>
                        </div>
                        <Link href={config.index} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                            <ArrowLeft size={16} />
                            Kembali
                        </Link>
                    </div>
                </section>

                <form onSubmit={submit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h2 className="text-base font-bold text-slate-950">Informasi record</h2>
                        <p className="mt-1 text-sm text-slate-500">Kolom ID hanya sebagai identitas record dan tidak dapat diubah.</p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
                        {config.fields.map((field) => (
                            <TextField
                                key={field}
                                field={field}
                                value={data[field]}
                                error={errors[field]}
                                disabled={field === keyField}
                                placeholder={field === keyField ? (isEdit ? "ID record" : "Dibuat otomatis saat data disimpan") : undefined}
                                onChange={(value) => setData(field, value)}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        {isEdit ? (
                            <button type="button" onClick={destroy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                                <Trash2 size={16} />
                                Hapus data
                            </button>
                        ) : <span />}
                        <button type="submit" disabled={processing} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
                            <Save size={16} />
                            {processing ? "Menyimpan..." : "Simpan data"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
