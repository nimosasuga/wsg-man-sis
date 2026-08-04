import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Code2, Database, LockKeyhole, Settings2 } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Structure({ table, preview = null }) {
    const firstColumn = table.editableColumns[0]?.name || "";
    const [column, setColumn] = useState(firstColumn);
    const selected = useMemo(() => table.editableColumns.find((item) => item.name === column), [table.editableColumns, column]);
    const [type, setType] = useState(selected?.options?.includes(selected?.type) ? selected.type : selected?.options?.[0] || "");

    const changeColumn = (value) => {
        setColumn(value);
        const next = table.editableColumns.find((item) => item.name === value);
        setType(next?.options?.includes(next?.type) ? next.type : next?.options?.[0] || "");
    };

    const previewChange = (event) => {
        event.preventDefault();
        router.post(table.previewUrl, { column, type });
    };

    const commit = () => {
        if (window.confirm(`Ubah tipe ${preview.column} dari ${preview.currentType} menjadi ${preview.type}?`)) {
            router.put(table.commitUrl, { token: preview.token });
        }
    };

    return <AdminLayout>
        <Head title={`Struktur: ${table.name}`} />
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><Link href={table.detailUrl} className="inline-flex items-center gap-1 transition hover:text-violet-600"><ArrowLeft size={15} /> {table.name}</Link><span className="text-slate-300">/</span><span className="text-slate-900">Ubah tipe kolom</span></div>

            <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7"><div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 via-violet-500 to-cyan-400" /><span className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><Settings2 size={15} /> Pengaturan Super Admin</span><h1 className="mt-4 break-all font-mono text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Ubah tipe kolom</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Pilih jenis data yang sesuai. Nama tabel, nama kolom, primary key, index, dan auto increment dikunci dari halaman ini.</p></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6"><form onSubmit={previewChange} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"><label><span className="mb-2 block text-sm font-bold text-slate-800">Kolom</span><select value={column} onChange={(event) => changeColumn(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">{table.editableColumns.map((item) => <option key={item.name} value={item.name}>{item.name} ({item.type})</option>)}</select></label><label><span className="mb-2 block text-sm font-bold text-slate-800">Tipe baru</span><select value={type} onChange={(event) => setType(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">{(selected?.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select></label><button disabled={!column || !type} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><Code2 size={16} />Periksa perubahan</button></form>{!table.editableColumns.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Tidak ada kolom yang aman untuk diubah pada tabel ini.</p>}</section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-amber-700" size={19} /><div><p className="font-bold">Batas perubahan</p><p className="mt-1">Tipe hanya dapat dipilih dalam kelompok data yang sama. Untuk kolom teks, sistem akan menolak kapasitas yang lebih pendek dari isi data saat ini. Struktur sebelum perubahan disimpan sebagai catatan pemulihan.</p></div></div></section>

            {preview && <section className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${preview.error ? "border-rose-200" : "border-slate-200"}`}><div className="p-5 sm:p-6">{preview.error ? <div className="flex gap-3 text-rose-800"><AlertTriangle className="mt-0.5 shrink-0" size={20} /><div><h2 className="font-extrabold">Perubahan belum dapat dilanjutkan</h2><p className="mt-1 text-sm leading-6">{preview.error}</p></div></div> : <><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={15} /> Siap ditinjau</span><h2 className="mt-3 font-extrabold text-slate-950">Preview perubahan</h2><p className="mt-1 text-sm text-slate-600"><span className="font-mono font-bold">{preview.column}</span>: <span className="font-mono">{preview.currentType}</span> menjadi <span className="font-mono font-bold">{preview.type}</span>.</p></div><button type="button" onClick={commit} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"><CheckCircle2 size={16} />Simpan perubahan</button></div><div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-4"><code className="whitespace-pre font-mono text-sm text-emerald-300">{preview.sql}</code></div></>}</div></section>}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"><div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4"><Database size={18} className="text-violet-600" /><div><h2 className="font-extrabold text-slate-950">Kolom terkunci</h2><p className="mt-0.5 text-sm text-slate-500">Primary key, index, dan auto increment tidak tersedia untuk diubah.</p></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Kolom</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Alasan</th></tr></thead><tbody className="divide-y divide-slate-100">{table.columns.filter((item) => item.key || item.extra?.toLowerCase().includes("auto_increment")).map((item) => <tr key={item.name}><td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{item.name}</td><td className="px-4 py-3 font-mono text-xs text-slate-700">{item.type}</td><td className="px-4 py-3 text-sm text-slate-600">{item.key ? "Key / index" : "Auto increment"}</td></tr>)}{!table.columns.some((item) => item.key || item.extra?.toLowerCase().includes("auto_increment")) && <tr><td colSpan="3" className="px-4 py-8 text-center text-sm text-slate-500">Tidak ada kolom terkunci.</td></tr>}</tbody></table></div></section>
        </div>
    </AdminLayout>;
}
