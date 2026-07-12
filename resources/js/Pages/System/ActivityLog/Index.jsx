import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Activity, ArrowRight, Clock, Database, UserRound } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

function StatCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
                    <p className="mt-2 break-words text-2xl font-black text-slate-950">{value}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

function MenuCard({ title, helper, meta, href, icon: Icon }) {
    return (
        <Link
            href={href}
            className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-200/80"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                        <Icon size={16} />
                        {title}
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">{helper}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-cyan-600">
                    <ArrowRight size={19} />
                </div>
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Sumber Data</p>
                <p className="mt-1 break-words text-sm font-black text-slate-950">{meta}</p>
            </div>
        </Link>
    );
}

export default function Index({ summary = {} }) {
    return (
        <AdminLayout>
            <Head title="System Activity Log" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                                <Activity size={15} />
                                System Activity
                            </div>
                            <h1 className="mt-4 text-2xl font-black tracking-tight">Catatan Aktivitas Sistem</h1>
                            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
                                Tempat melihat jejak aktivitas. Log user hanya untuk dibaca supaya riwayatnya tetap bersih dan tidak berubah karena edit manual.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="User Log" value={formatNumber(summary.totalUserLogs)} helper="Record dari CATATAN UPDATE" icon={UserRound} />
                    <StatCard title="Log Terbaru" value={summary.latestUserLog || "-"} helper="Aktivitas paling baru ada di atas" icon={Clock} />
                    <StatCard title="Status Sumber" value={summary.sourceStatus === "ready" ? "Siap" : "Missing"} helper={summary.sourceTable || "-"} icon={Database} />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <MenuCard
                        title="User Activity Log"
                        helper="Buka riwayat aktivitas user: siapa yang melakukan aksi, kapan terjadi, aplikasi/tabel mana yang disentuh, dan id record terkait."
                        href="/system/activity-log/user"
                        meta={summary.sourceTable || "operasional_catatan_update"}
                        icon={UserRound}
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
