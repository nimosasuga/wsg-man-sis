import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Clock, Database, Fingerprint, Table2, UserRound } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-900">{value || "-"}</p>
        </div>
    );
}

function ActionPill({ action }) {
    const normalized = String(action || "").toLowerCase();
    const tone = normalized.includes("create")
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : normalized.includes("update")
            ? "bg-blue-50 text-blue-700 border-blue-100"
            : normalized.includes("delete")
                ? "bg-rose-50 text-rose-700 border-rose-100"
                : "bg-slate-100 text-slate-600 border-slate-200";

    return (
        <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide ${tone}`}>
            {action || "-"}
        </span>
    );
}

export default function UserDetail({ log = {}, backUrl = "/system/activity-log/user" }) {
    return (
        <AdminLayout>
            <Head title={`Detail User Activity - ${log.id_key || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50">
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">User Activity Log</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">Detail Aktivitas User</h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr_0.75fr_0.75fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200">
                                <UserRound size={15} />
                                Aktivitas User
                            </div>
                            <h2 className="mt-4 break-words text-2xl font-black">{log.actor || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">Record log ini hanya untuk dibaca, bukan diedit.</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Clock size={15} />
                                Waktu
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{log.tgl_cek_admin || "-"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Database size={15} />
                                Aplikasi
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{log.app || "-"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Table2 size={15} />
                                Tabel
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{log.table || "-"}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoItem label="ID Key" value={log.id_key} />
                    <InfoItem label="ID Record" value={log.id_record} />
                    <InfoItem label="Tanggal" value={log.tanggal} />
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Aksi</p>
                        <div className="mt-2"><ActionPill action={log.action} /></div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Detail Parsed</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Pecahan informasi dari kolom NAMA_ADMIN.</p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        <InfoItem label="Nama Admin / Actor" value={log.actor} />
                        <InfoItem label="Action" value={log.action} />
                        <InfoItem label="App" value={log.app} />
                        <InfoItem label="Table" value={log.table} />
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Fingerprint size={17} className="text-cyan-700" />
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Raw Log</h2>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Nilai mentah dari database, berguna kalau hasil parsing perlu dicek ulang.</p>
                    </div>
                    <div className="p-5">
                        <div className="rounded-lg bg-slate-950 p-4 text-sm font-semibold leading-6 text-slate-100">
                            {log.nama_admin || "-"}
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
