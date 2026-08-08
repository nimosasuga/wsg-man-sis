import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Database, Download, FileSpreadsheet, KeyRound, LoaderCircle, Settings2, TableProperties, Trash2, Upload } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";
import Modal from "../../Components/Modal";

const number = new Intl.NumberFormat("id-ID");
const displayDefault = (value) => value === null ? "NULL" : value === "" ? "''" : String(value);

export default function Detail({ database, table }) {
    const [showEmptyModal, setShowEmptyModal] = useState(false);
    const [emptyToken, setEmptyToken] = useState(null);
    const [preparedRows, setPreparedRows] = useState(null);
    const [confirmation, setConfirmation] = useState("");
    const [preparing, setPreparing] = useState(false);
    const [emptying, setEmptying] = useState(false);
    const [emptyError, setEmptyError] = useState("");

    const closeEmptyModal = () => {
        if (emptying) return;
        setShowEmptyModal(false);
        setEmptyToken(null);
        setPreparedRows(null);
        setConfirmation("");
        setPreparing(false);
        setEmptyError("");
    };

    const downloadBeforeEmpty = async () => {
        setPreparing(true);
        setEmptyError("");
        try {
            const response = await window.axios.post(table.prepareEmptyUrl);
            setEmptyToken(response.data.token);
            setPreparedRows(response.data.rowCount);
            window.location.assign(table.fullExportUrl);
        } catch (error) {
            setEmptyError(error.response?.data?.message || "Unduhan belum dapat disiapkan. Coba lagi.");
        } finally {
            setPreparing(false);
        }
    };

    const emptyTable = () => {
        if (!emptyToken || confirmation !== table.name) return;
        setEmptying(true);
        window.axios.delete(table.emptyUrl, { data: { token: emptyToken, confirmation_table: confirmation } })
            .then(() => window.location.assign(`/database-manager/${encodeURIComponent(table.name)}`))
            .catch((error) => {
                setEmptying(false);
                setEmptyError(error.response?.data?.message || "Data belum dapat dikosongkan. Periksa relasi tabel lalu coba lagi.");
            });
    };

    return (
        <AdminLayout>
            <Head title={`Database: ${table.name}`} />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><Link href="/database-manager" className="inline-flex items-center gap-1 transition hover:text-violet-600"><ArrowLeft size={15} /> Manajemen Database</Link><span className="text-slate-300">/</span><span className="font-mono text-xs text-slate-900">{table.name}</span></div>

                <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-300" />
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                        <div className="min-w-0"><span className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"><Database size={15} /> Struktur tabel</span><h1 className="mt-4 break-all font-mono text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{table.name}</h1><p className="mt-2 text-sm leading-6 text-slate-600">Nama dan urutan kolom mengikuti struktur tabel saat ini.</p></div>
                        <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kolom</p><p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-950">{number.format(table.columns.length)}</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Data</p><p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-950">{number.format(table.rows)}</p></div></div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">{table.canAlterStructure && <Link href={table.structureUrl} className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100"><Settings2 size={16} /> Edit struktur kolom</Link>}<Link href={table.importUrl} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"><Upload size={16} /> Upload data</Link><a href={table.templateUrl} className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"><FileSpreadsheet size={16} /> Download template asli</a><a href={table.exportUrl} className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"><Download size={16} /> Ekspor XLSX (maks. 10.000)</a><a href={table.fullExportUrl} className="inline-flex h-10 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-bold text-cyan-700 transition hover:bg-cyan-100"><Download size={16} /> Ekspor CSV lengkap</a>{table.canEmptyData && <button type="button" onClick={() => setShowEmptyModal(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 transition hover:bg-rose-100"><Trash2 size={16} /> Kosongkan data</button>}</div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">Upload memakai template asli dan selalu diperiksa sebelum disimpan. XLSX cocok untuk sampai 10.000 baris; untuk data lebih banyak gunakan CSV lengkap.</p>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"><div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4 sm:px-5"><TableProperties size={18} className="text-violet-600" /><div><h2 className="font-extrabold text-slate-950">Urutan kolom</h2><p className="mt-0.5 text-sm text-slate-500">Database: `{database}`.</p></div></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 text-right">#</th><th className="px-4 py-3">Nama kolom</th><th className="px-4 py-3">Tipe asli</th><th className="px-4 py-3">Null</th><th className="px-4 py-3">Default</th><th className="px-4 py-3">Key</th><th className="px-4 py-3">Extra</th><th className="px-4 py-3">Komentar</th></tr></thead><tbody className="divide-y divide-slate-100">{table.columns.map((column) => <tr key={column.position} className="hover:bg-violet-50/40"><td className="px-4 py-3 font-semibold tabular-nums text-slate-500">{column.position}</td><td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{column.name}</td><td className="px-4 py-3 font-mono text-xs text-slate-700">{column.type}</td><td className="px-4 py-3 text-xs font-bold text-slate-600">{column.nullable ? "YES" : "NO"}</td><td className="max-w-[220px] truncate px-4 py-3 font-mono text-xs text-slate-600" title={displayDefault(column.default)}>{displayDefault(column.default)}</td><td className="px-4 py-3">{column.key && <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700"><KeyRound size={12} /> {column.key}</span>}</td><td className="px-4 py-3 text-xs text-slate-500">{column.extra || "-"}</td><td className="max-w-[220px] truncate px-4 py-3 text-xs text-slate-500" title={column.comment}>{column.comment || "-"}</td></tr>)}</tbody></table></div></section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"><div className="border-b border-slate-100 px-4 py-4 sm:px-5"><h2 className="font-extrabold text-slate-950">Index database</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Index</th><th className="px-4 py-3">Kolom</th><th className="px-4 py-3">Urutan</th><th className="px-4 py-3">Tipe</th></tr></thead><tbody className="divide-y divide-slate-100">{table.indexes.map((index) => <tr key={`${index.name}-${index.sequence}-${index.column}`}><td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{index.name}</td><td className="px-4 py-3 font-mono text-xs text-slate-700">{index.column}</td><td className="px-4 py-3 tabular-nums text-slate-600">{index.sequence}</td><td className="px-4 py-3 text-xs font-bold text-slate-600">{index.unique ? "UNIQUE" : "INDEX"}</td></tr>)}{!table.indexes.length && <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-500">Belum ada index yang tercatat.</td></tr>}</tbody></table></div></section>
            </div>

            <Modal show={showEmptyModal} onClose={closeEmptyModal} maxWidth="lg">
                <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-3"><div className="rounded-xl bg-rose-100 p-2.5 text-rose-700"><Trash2 size={20} /></div><div><h2 className="text-lg font-extrabold text-slate-950">Kosongkan isi tabel?</h2><p className="mt-1 text-sm leading-6 text-slate-600">Struktur tabel <span className="font-mono font-bold text-slate-800">{table.name}</span> tidak berubah. Seluruh baris di dalamnya akan dihapus.</p></div></div>
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><p className="font-bold">Simpan salinan di perangkat Anda terlebih dahulu.</p><p className="mt-1">Unduh CSV lengkap sebelum melanjutkan. File tidak disimpan sebagai backup di server.</p></div>
                    <button type="button" onClick={downloadBeforeEmpty} disabled={preparing || emptying} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">{preparing ? <LoaderCircle size={17} className="animate-spin" /> : <Download size={17} />}{emptyToken ? "Unduh ulang data lengkap" : "Download data lengkap terlebih dahulu"}</button>
                    {emptyToken && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">Unduhan sudah disiapkan untuk {number.format(preparedRows ?? table.rows)} baris. Ketik nama tabel untuk mengaktifkan aksi berikutnya.</div>}
                    <label className="mt-4 block text-sm font-bold text-slate-700">Ketik <span className="font-mono text-xs">{table.name}</span> untuk konfirmasi<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={!emptyToken || emptying} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-100" placeholder={table.name} /></label>
                    {emptyError && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{emptyError}</p>}
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={closeEmptyModal} disabled={emptying} className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Batal</button><button type="button" onClick={emptyTable} disabled={!emptyToken || confirmation !== table.name || emptying} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-45">{emptying && <LoaderCircle size={16} className="animate-spin" />} Kosongkan data sekarang</button></div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
