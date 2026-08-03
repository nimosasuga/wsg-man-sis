import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, FileUp, History, Upload, XCircle } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Index({ modules = [], selectedModule, preview = null, logs = [] }) {
    const [file, setFile] = useState(null);
    const [mode, setMode] = useState("create");
    const activeModule = useMemo(() => modules.find((item) => item.key === selectedModule) || modules[0], [modules, selectedModule]);
    const canCommit = preview && preview.rowCount > 0 && preview.errors?.length === 0;

    const upload = (event) => {
        event.preventDefault();
        if (!file || !activeModule) return;

        router.post(`/import-export/${activeModule.key}/preview`, { file, mode }, { forceFormData: true });
    };

    const commit = () => {
        if (window.confirm(`Simpan ${preview.rowCount} data ke ${activeModule.label}?`)) {
            router.post(`/import-export/${activeModule.key}/commit`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Pusat Impor & Ekspor" />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-indigo-600">Dashboard</Link>
                    <span>/</span>
                    <Link href="/module-records" className="transition hover:text-indigo-600">CRUD Data</Link>
                    <span>/</span>
                    <span className="text-slate-800">Pusat Impor & Ekspor</span>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                                <FileSpreadsheet size={14} />
                                Excel lokal Indonesia
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Pusat Impor & Ekspor</h1>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Unduh template, periksa isi file sebelum disimpan, lalu ekspor data sesuai hak akses Anda. ID record dibuat otomatis saat impor data baru.</p>
                        </div>
                        <Link href="/module-records" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                            <ArrowLeft size={16} />
                            Kembali ke CRUD
                        </Link>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-6">
                    <label className="block max-w-xl">
                        <span className="mb-2 block text-sm font-bold text-slate-800">Pilih modul data</span>
                        <select
                            value={activeModule?.key || ""}
                            onChange={(event) => {
                                setFile(null);
                                setMode("create");
                                router.get(`/import-export?module=${encodeURIComponent(event.target.value)}`);
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        >
                            {modules.map((module) => <option key={module.key} value={module.key}>{module.label}</option>)}
                        </select>
                    </label>

                    {activeModule && (
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                                <h2 className="font-bold text-slate-950">Template dan ekspor</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">Kolom yang digunakan: {(activeModule.fieldLabels || activeModule.fields).join(", ")}.</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <a href={activeModule.templateUrl} className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700"><Download size={16} />Unduh template</a>
                                    <a href={activeModule.exportUrl} className="inline-flex h-10 items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"><FileSpreadsheet size={16} />Ekspor data</a>
                                </div>
                            </div>
                            <form onSubmit={upload} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                                <h2 className="font-bold text-slate-950">Impor file</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">Format yang didukung: `.xlsx`, `.xls`, atau `.csv`. Maksimal 5.000 baris dan 10 MB.</p>
                                <label className="mt-4 block">
                                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Mode impor</span>
                                    <select value={mode} onChange={(event) => setMode(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
                                        <option value="create">Tambah data baru (ID KEY otomatis)</option>
                                        <option value="update">Perbarui data berdasarkan ID KEY</option>
                                    </select>
                                </label>
                                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 transition hover:border-indigo-300">
                                    <FileUp size={20} className="shrink-0 text-indigo-600" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-600">{file?.name || "Pilih file Excel"}</span>
                                    <input type="file" accept=".xlsx,.xls,.csv,.txt" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                                </label>
                                <button type="submit" disabled={!file} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"><Upload size={16} />Periksa file</button>
                            </form>
                        </div>
                    )}
                </section>

                {preview && activeModule && (
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                            <div>
                                <h2 className="text-base font-bold text-slate-950">Simulasi impor</h2>
                                <p className="mt-1 text-sm text-slate-500">{preview.totalRows || 0} baris diperiksa dalam mode {preview.mode === "update" ? "perbarui data" : "tambah data baru"}. Data belum disimpan.</p>
                            </div>
                            {canCommit ? (
                                <button type="button" onClick={commit} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"><CheckCircle2 size={16} />Simpan {preview.rowCount} data</button>
                            ) : <span className="inline-flex items-center gap-2 text-sm font-bold text-rose-600"><XCircle size={17} />Perbaiki error sebelum menyimpan</span>}
                        </div>

                        {preview.errors?.length > 0 && (
                            <div className="border-b border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-800 sm:px-6">
                                <p className="font-bold">Ditemukan {preview.errors.length} error</p>
                                <ul className="mt-2 space-y-1">
                                    {preview.errors.slice(0, 10).map((error) => <li key={`${error.row}-${error.message}`}>Baris {error.row}: {error.message}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="custom-scrollbar overflow-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-semibold text-slate-500"><tr>{(activeModule.fieldLabels || activeModule.fields).map((field) => <th key={field} className="px-4 py-3">{field}</th>)}</tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(preview.sample || []).map((row, index) => <tr key={index}>{activeModule.fields.map((field) => <td key={field} className="px-4 py-3 text-slate-700">{row[field] || "-"}</td>)}</tr>)}
                                    {!preview.sample?.length && <tr><td colSpan={activeModule.fields.length} className="px-4 py-8 text-center text-slate-500">Tidak ada baris valid untuk ditampilkan.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 sm:px-6">
                        <History size={18} className="text-indigo-600" />
                        <div>
                            <h2 className="text-base font-bold text-slate-950">Riwayat impor terbaru</h2>
                            <p className="mt-0.5 text-sm text-slate-500">Catatan hasil validasi dan data yang sudah disimpan.</p>
                        </div>
                    </div>
                    <div className="custom-scrollbar overflow-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold text-slate-500"><tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Modul</th><th className="px-4 py-3">File</th><th className="px-4 py-3">Hasil</th><th className="px-4 py-3">Pengimpor</th><th className="px-4 py-3">Catatan</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map((log) => {
                                    const completed = log.status === "completed";
                                    return <tr key={log.id}><td className="whitespace-nowrap px-4 py-3 text-slate-600">{log.created_at || "-"}</td><td className="px-4 py-3 font-semibold text-slate-800">{log.module_label}</td><td className="max-w-[220px] truncate px-4 py-3 text-slate-600">{log.file_name || "-"}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${completed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{completed ? `${log.successful_rows} berhasil` : `${log.failed_rows} perlu diperbaiki`}</span></td><td className="px-4 py-3 text-slate-600">{log.user_nik || "Sistem"}</td><td className="max-w-[280px] truncate px-4 py-3 text-slate-500" title={log.error_summary || ""}>{log.error_summary || "-"}</td></tr>;
                                })}
                                {!logs.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Belum ada riwayat impor.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
