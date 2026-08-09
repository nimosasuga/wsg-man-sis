import React, { useMemo } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { AlertTriangle, ArrowLeft, Database, Plus, Save, Trash2 } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const blankColumn = (name = "") => ({
    name,
    type: "varchar(100)",
    customType: "",
    collation: "",
    attribute: "",
    nullable: false,
    defaultMode: "none",
    defaultValue: "",
    comment: "",
    extra: "",
    primary: false,
    autoIncrement: false,
});

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
const labelClass = "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-slate-500";

export default function Create({ database, typeGroups = [], collations = [], storeUrl, indexUrl }) {
    const { data, setData, post, processing, errors, transform } = useForm({
        name: "",
        columns: [
            { ...blankColumn("id_key"), type: "varchar(50)", primary: true, nullable: false },
        ],
    });

    const collationOptions = useMemo(() => collations.map((collation) => ({
        value: collation.name,
        label: `${collation.name} (${collation.charset})`,
    })), [collations]);

    const updateColumn = (index, key, value) => {
        const nextColumns = data.columns.map((column, columnIndex) => {
            if (columnIndex !== index) return column;
            const nextColumn = { ...column, [key]: value };

            if (key === "autoIncrement" && value) {
                nextColumn.primary = true;
                nextColumn.nullable = false;
                nextColumn.defaultMode = "none";
                nextColumn.defaultValue = "";
            }

            if (key === "primary" && !value) {
                nextColumn.autoIncrement = false;
            }

            if (key === "type" && !["__enum__", "__set__"].includes(value)) {
                nextColumn.customType = "";
            }

            return nextColumn;
        });

        setData("columns", nextColumns);
    };

    const addColumn = () => setData("columns", [...data.columns, blankColumn()]);
    const removeColumn = (index) => setData("columns", data.columns.filter((_, columnIndex) => columnIndex !== index));

    const submit = (event) => {
        event.preventDefault();
        transform((current) => ({
            name: current.name,
            columns: current.columns.map((column) => ({
                name: column.name,
                type: column.customType.trim() || column.type,
                collation: column.collation,
                attribute: column.attribute,
                nullable: Boolean(column.nullable),
                defaultMode: column.defaultMode,
                defaultValue: column.defaultValue,
                comment: column.comment,
                extra: column.extra,
                primary: Boolean(column.primary),
                autoIncrement: Boolean(column.autoIncrement),
            })),
        })).post(storeUrl);
    };

    return (
        <AdminLayout>
            <Head title="Tambah Tabel Database" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                    <Link href={indexUrl} className="inline-flex items-center gap-1 transition hover:text-violet-600">
                        <ArrowLeft size={15} />
                        Manajemen Database
                    </Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900">Tambah tabel</span>
                </div>

                <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-300" />
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                                <Database size={15} />
                                Khusus Super Admin
                            </span>
                            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Tambah tabel database</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Buat tabel baru tanpa menyentuh tabel lama. Nama dan urutan kolom disimpan sesuai isian di halaman ini.
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Database</p>
                            <p className="mt-1 max-w-[260px] truncate font-mono text-sm font-extrabold text-slate-950" title={database}>{database}</p>
                        </div>
                    </div>
                </section>

                <form onSubmit={submit} className="space-y-5">
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
                        <label className={labelClass} htmlFor="table-name">Nama tabel</label>
                        <input
                            id="table-name"
                            name="name"
                            value={data.name}
                            onChange={(event) => setData("name", event.target.value)}
                            placeholder="contoh: operasional_update_posisi_unit"
                            className={inputClass}
                        />
                        {errors.name && <p className="mt-2 text-xs font-bold text-rose-600">{errors.name}</p>}
                        <p className="mt-2 text-xs font-medium text-slate-500">Gunakan huruf, angka, dan underscore. Awali dengan huruf atau underscore.</p>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                            <div>
                                <h2 className="text-base font-extrabold text-slate-950">Kolom tabel</h2>
                                <p className="mt-1 text-sm text-slate-500">Kolom paling atas akan menjadi urutan pertama di database dan template.</p>
                            </div>
                            <button type="button" onClick={addColumn} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700 transition hover:bg-violet-600 hover:text-white">
                                <Plus size={15} />
                                Tambah kolom
                            </button>
                        </div>

                        <div className="space-y-4 p-4 sm:p-5">
                            {data.columns.map((column, index) => {
                                const typeNeedsCustom = ["__enum__", "__set__"].includes(column.type);
                                const fieldError = (field) => errors[`columns.${index}.${field}`];

                                return (
                                    <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                            <p className="text-sm font-extrabold text-slate-950">Kolom {index + 1}</p>
                                            <button
                                                type="button"
                                                onClick={() => removeColumn(index)}
                                                disabled={data.columns.length === 1}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-100 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                <Trash2 size={14} />
                                                Hapus
                                            </button>
                                        </div>

                                        <div className="grid gap-3 lg:grid-cols-12">
                                            <div className="lg:col-span-3">
                                                <label className={labelClass}>Nama</label>
                                                <input value={column.name} onChange={(event) => updateColumn(index, "name", event.target.value)} className={inputClass} placeholder="id_key" />
                                                {fieldError("name") && <p className="mt-1.5 text-xs font-bold text-rose-600">{fieldError("name")}</p>}
                                            </div>
                                            <div className="lg:col-span-3">
                                                <label className={labelClass}>Jenis</label>
                                                <select value={column.type} onChange={(event) => updateColumn(index, "type", event.target.value)} className={inputClass}>
                                                    {typeGroups.map((group) => (
                                                        <optgroup key={group.label} label={group.label}>
                                                            {group.types.map((type) => (
                                                                <option key={`${group.label}-${type.value}`} value={type.value} disabled={type.disabled}>{type.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                                {typeNeedsCustom && (
                                                    <input value={column.customType} onChange={(event) => updateColumn(index, "customType", event.target.value)} className={`${inputClass} mt-2`} placeholder={column.type === "__enum__" ? "enum('A','B')" : "set('A','B')"} />
                                                )}
                                                {fieldError("type") && <p className="mt-1.5 text-xs font-bold text-rose-600">{fieldError("type")}</p>}
                                            </div>
                                            <div className="lg:col-span-3">
                                                <label className={labelClass}>Penyortiran</label>
                                                <select value={column.collation} onChange={(event) => updateColumn(index, "collation", event.target.value)} className={inputClass}>
                                                    <option value="">Default tabel</option>
                                                    {collationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="lg:col-span-3">
                                                <label className={labelClass}>Atribut</label>
                                                <select value={column.attribute} onChange={(event) => updateColumn(index, "attribute", event.target.value)} className={inputClass}>
                                                    <option value="">Tidak ada</option>
                                                    <option value="unsigned">UNSIGNED</option>
                                                    <option value="zerofill">ZEROFILL</option>
                                                    <option value="unsigned zerofill">UNSIGNED ZEROFILL</option>
                                                </select>
                                            </div>

                                            <div className="lg:col-span-2">
                                                <label className={labelClass}>Tak ternilai</label>
                                                <select value={column.nullable ? "yes" : "no"} onChange={(event) => updateColumn(index, "nullable", event.target.value === "yes")} className={inputClass} disabled={column.autoIncrement}>
                                                    <option value="no">Tidak</option>
                                                    <option value="yes">Ya</option>
                                                </select>
                                            </div>
                                            <div className="lg:col-span-2">
                                                <label className={labelClass}>Bawaan</label>
                                                <select value={column.defaultMode} onChange={(event) => updateColumn(index, "defaultMode", event.target.value)} className={inputClass} disabled={column.autoIncrement}>
                                                    <option value="none">Tidak ada</option>
                                                    <option value="null">NULL</option>
                                                    <option value="value">Isi nilai</option>
                                                    <option value="current_timestamp">CURRENT_TIMESTAMP</option>
                                                </select>
                                            </div>
                                            <div className="lg:col-span-3">
                                                <label className={labelClass}>Nilai bawaan</label>
                                                <input value={column.defaultValue} onChange={(event) => updateColumn(index, "defaultValue", event.target.value)} className={inputClass} disabled={column.defaultMode !== "value" || column.autoIncrement} placeholder="kosongkan bila tidak dipakai" />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <label className={labelClass}>Ekstra</label>
                                                <select value={column.extra} onChange={(event) => updateColumn(index, "extra", event.target.value)} className={inputClass} disabled={column.autoIncrement}>
                                                    <option value="">Tidak ada</option>
                                                    <option value="on update current_timestamp">ON UPDATE CURRENT_TIMESTAMP</option>
                                                    <option value="on update current_timestamp(6)">ON UPDATE CURRENT_TIMESTAMP(6)</option>
                                                </select>
                                            </div>
                                            <div className="lg:col-span-3">
                                                <label className={labelClass}>Komentar</label>
                                                <input value={column.comment} onChange={(event) => updateColumn(index, "comment", event.target.value)} className={inputClass} placeholder="catatan kolom" />
                                            </div>

                                            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 lg:col-span-2">
                                                <input type="checkbox" checked={column.primary} onChange={(event) => updateColumn(index, "primary", event.target.checked)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                                                Primary key
                                            </label>
                                            <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 lg:col-span-2">
                                                <input type="checkbox" checked={column.autoIncrement} onChange={(event) => updateColumn(index, "autoIncrement", event.target.checked)} className="rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                                                Auto increment
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                            {errors.columns && <p className="text-sm font-bold text-rose-600">{errors.columns}</p>}
                        </div>
                    </section>

                    <section className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="inline-flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                            Pastikan nama dan tipe kolom sudah benar. Fitur ini hanya membuat tabel baru, bukan mengubah tabel lama.
                        </div>
                        <button type="submit" disabled={processing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                            <Save size={16} />
                            {processing ? "Menyimpan..." : "Buat tabel"}
                        </button>
                    </section>
                </form>
            </div>
        </AdminLayout>
    );
}
