import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Code2, Database, LockKeyhole, Settings2 } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const attributes = ["", "unsigned", "zerofill", "unsigned zerofill"];
const extras = ["", "on update current_timestamp", "on update current_timestamp(6)"];

export default function Structure({ table, preview = null }) {
    const firstColumn = table.editableColumns[0]?.name || "";
    const [column, setColumn] = useState(firstColumn);
    const selected = useMemo(() => table.editableColumns.find((item) => item.name === column), [table.editableColumns, column]);
    const selectableTypes = useMemo(() => (table.typeGroups || []).flatMap((group) => group.types.map((option) => option.value)), [table.typeGroups]);
    const [form, setForm] = useState(() => makeForm(table.editableColumns[0]));
    const effectiveType = form.customType.trim() || form.type;

    const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
    const changeColumn = (value) => {
        setColumn(value);
        setForm(makeForm(table.editableColumns.find((item) => item.name === value)));
    };
    const previewChange = (event) => {
        event.preventDefault();
        router.post(table.previewUrl, { ...form, column, type: effectiveType, nullable: form.nullable === "yes" });
    };
    const commit = () => router.put(table.commitUrl, { token: preview.token });
    const collationDisabled = !supportsCollation(effectiveType);

    return <AdminLayout>
        <Head title={`Struktur: ${table.name}`} />
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><Link href={table.detailUrl} className="inline-flex items-center gap-1 transition hover:text-violet-600"><ArrowLeft size={15} /> {table.name}</Link><span className="text-slate-300">/</span><span className="text-slate-900">Edit struktur kolom</span></div>

            <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7"><div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 via-violet-500 to-cyan-400" /><span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><Settings2 size={15} /> Pengaturan Super Admin</span><h1 className="mt-4 break-all font-mono text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Edit struktur kolom</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ubah properti kolom sesuai struktur MySQL. Periksa preview SQL sebelum menyimpan karena perubahan ini langsung berlaku pada tabel yang dipakai aplikasi.</p></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
                <form onSubmit={previewChange} className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        <Field label="Kolom yang diedit"><select value={column} onChange={(event) => changeColumn(event.target.value)} className={inputClass}>{table.editableColumns.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.type})</option>)}</select></Field>
                        <Field label="Nama"><input value={form.name} onChange={(event) => update("name", event.target.value)} className={`${inputClass} font-mono`} /></Field>
                        <Field label="Jenis"><select value={form.type} onChange={(event) => { update("type", event.target.value); update("customType", ""); }} className={inputClass}>{selected?.type && !selectableTypes.includes(selected.type) && <option value={selected.type}>{selected.type}</option>}{(table.typeGroups || []).map((group) => <optgroup key={group.label} label={group.label}>{group.types.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}</optgroup>)}</select></Field>
                        <Field label="Jenis sendiri (opsional)"><input value={form.customType} onChange={(event) => update("customType", event.target.value)} placeholder="contoh: enum('PAID','UNPAID')" className={`${inputClass} font-mono`} /></Field>
                        <Field label="Penyortiran"><select value={form.collation} disabled={collationDisabled} onChange={(event) => update("collation", event.target.value)} className={inputClass}><option value="">Default server</option>{(table.collations || []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></Field>
                        <Field label="Atribut"><select value={form.attribute} onChange={(event) => update("attribute", event.target.value)} className={inputClass}>{attributes.map((item) => <option key={item} value={item}>{item || "Tidak ada"}</option>)}</select></Field>
                        <Field label="Tak ternilai"><select value={form.nullable} onChange={(event) => update("nullable", event.target.value)} className={inputClass}><option value="yes">YA - boleh kosong</option><option value="no">TIDAK - wajib diisi</option></select></Field>
                        <Field label="Bawaan"><select value={form.defaultMode} onChange={(event) => update("defaultMode", event.target.value)} className={inputClass}><option value="none">Tidak ada</option><option value="null">NULL</option><option value="value">Nilai sendiri</option><option value="current_timestamp">CURRENT_TIMESTAMP</option></select></Field>
                        {form.defaultMode === "value" && <Field label="Nilai bawaan"><input value={form.defaultValue} onChange={(event) => update("defaultValue", event.target.value)} className={inputClass} /></Field>}
                        <Field label="Ekstra"><select value={form.extra} onChange={(event) => update("extra", event.target.value)} className={inputClass}>{extras.map((item) => <option key={item} value={item}>{item || "Tidak ada"}</option>)}</select></Field>
                    </div>
                    <Field label="Komentar"><textarea value={form.comment} onChange={(event) => update("comment", event.target.value)} rows="3" className={`${inputClass} h-auto py-3`} /></Field>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><p className="max-w-3xl text-xs leading-5 text-slate-500">`Tak ternilai: YA` berarti kolom boleh kosong atau bernilai NULL. `TIDAK` berarti data wajib terisi. Pilihan penyortiran hanya aktif untuk tipe teks.</p><button disabled={!column || !effectiveType || !form.name} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><Code2 size={16} />Periksa perubahan</button></div>
                </form>
                {!table.editableColumns.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Tidak ada kolom yang aman untuk diubah pada tabel ini.</p>}
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-amber-700" size={19} /><div><p className="font-bold">Batas perubahan</p><p className="mt-1">Primary key, index, auto increment, dan generated column terkunci. Sistem menolak perubahan yang dapat memotong teks atau menjadikan kolom wajib saat masih ada data kosong.</p></div></div></section>

            {preview && <section className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${preview.error ? "border-rose-200" : "border-slate-200"}`}><div className="p-5 sm:p-6">{preview.error ? <div className="flex gap-3 text-rose-800"><AlertTriangle className="mt-0.5 shrink-0" size={20} /><div><h2 className="font-extrabold">Perubahan belum dapat dilanjutkan</h2><p className="mt-1 text-sm leading-6">{preview.error}</p></div></div> : <><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={15} /> Siap ditinjau</span><h2 className="mt-3 font-extrabold text-slate-950">Preview perubahan</h2><p className="mt-1 text-sm text-slate-600"><span className="font-mono font-bold">{preview.column}</span>{preview.name !== preview.column && <> menjadi <span className="font-mono font-bold">{preview.name}</span></>}; tipe baru <span className="font-mono font-bold">{preview.type}</span>.</p></div><button type="button" onClick={commit} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"><CheckCircle2 size={16} />Simpan perubahan</button></div><div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4"><code className="whitespace-pre font-mono text-sm text-emerald-300">{preview.sql}</code></div></>}</div></section>}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Database size={18} className="text-violet-600" /><div><h2 className="font-extrabold text-slate-950">Kolom terkunci</h2><p className="mt-0.5 text-sm text-slate-500">Primary key, index, auto increment, dan generated column tidak tersedia untuk diedit.</p></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Kolom</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Alasan</th></tr></thead><tbody className="divide-y divide-slate-100">{table.columns.filter(isLocked).map((item) => <tr key={item.name}><td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{item.name}</td><td className="px-4 py-3 font-mono text-xs text-slate-700">{item.type}</td><td className="px-4 py-3 text-sm text-slate-600">{lockedReason(item)}</td></tr>)}{!table.columns.some(isLocked) && <tr><td colSpan="3" className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada kolom terkunci.</td></tr>}</tbody></table></div></section>
        </div>
    </AdminLayout>;
}

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100";
const Field = ({ label, children }) => <label className="min-w-0"><span className="mb-2 block text-sm font-bold text-slate-800">{label}</span>{children}</label>;
const supportsCollation = (type) => /^(?:char|varchar|tinytext|text|mediumtext|longtext|enum|set)/i.test(type.trim());
const isLocked = (item) => item.key || item.extra?.toLowerCase().includes("auto_increment") || item.extra?.toLowerCase().includes("generated");
const lockedReason = (item) => item.key ? "Key / index" : item.extra?.toLowerCase().includes("auto_increment") ? "Auto increment" : "Generated column";
const makeForm = (column) => ({ name: column?.name || "", type: column?.options?.includes(column?.type) ? column.type : column?.options?.[0] || "", customType: "", collation: column?.collation || "", attribute: column?.attribute || "", nullable: column?.nullable ? "yes" : "no", defaultMode: column?.defaultMode || "none", defaultValue: column?.defaultValue || "", comment: column?.comment || "", extra: column?.extra || "" });
