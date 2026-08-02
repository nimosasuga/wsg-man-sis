import React from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

function fieldLabel(field) {
    return String(field || "").replaceAll("_", " ").toUpperCase();
}

function TextField({ field, value, error, disabled, placeholder, onChange }) {
    const isLong = ["keterangan", "dekripsi_invoice", "alamat_lengkap"].some((key) => field.includes(key));

    return (
        <label className={isLong ? "md:col-span-2" : ""}>
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">
                {fieldLabel(field)}
            </span>
            {isLong ? (
                <textarea
                    value={value || ""}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                />
            ) : (
                <input
                    value={value || ""}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-100"
                />
            )}
            {error && <p className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
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

        if (isEdit) {
            put(`/module-records/${module}/${encodeURIComponent(recordId)}`);
            return;
        }

        post(`/module-records/${module}`);
    };

    const destroy = () => {
        if (!isEdit || !window.confirm(`Hapus data ${config.label} ini?`)) {
            return;
        }

        router.delete(`/module-records/${module}/${encodeURIComponent(recordId)}`);
    };

    return (
        <AdminLayout>
            <Head title={`${isEdit ? "Edit" : "Tambah"} ${config.label}`} />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <Link href={config.back} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-violet-200 transition hover:text-white">
                        <ArrowLeft size={15} />
                        Kembali
                    </Link>
                    <h1 className="mt-4 text-2xl font-black tracking-tight">
                        {isEdit ? "Edit" : "Tambah"} {config.label}
                    </h1>
                </section>

                <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                        {config.fields.map((field) => (
                            <TextField
                                key={field}
                                field={field}
                                value={data[field]}
                                error={errors[field]}
                                disabled={field === keyField}
                                placeholder={field === keyField ? "Dibuat otomatis saat data disimpan" : undefined}
                                onChange={(value) => setData(field, value)}
                            />
                        ))}
                    </div>

                    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        {isEdit ? (
                            <button
                                type="button"
                                onClick={destroy}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-black text-rose-600 transition hover:bg-rose-50"
                            >
                                <Trash2 size={16} />
                                Hapus
                            </button>
                        ) : <span />}
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
                        >
                            <Save size={16} />
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
