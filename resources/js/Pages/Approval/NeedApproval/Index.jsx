import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, CheckSquare, Clock, Database, FileText } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

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

function MenuCard({ title, helper, href, icon: Icon, amount }) {
    return (
        <Link href={href} className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-200/80">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs font-black uppercase tracking-wider text-cyan-700">
                        <Icon size={16} />
                        {title}
                    </div>
                    <h2 className="mt-4 text-2xl font-black text-slate-950">{formatRp(amount)}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{helper}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-cyan-600">
                    <ArrowRight size={19} />
                </div>
            </div>
        </Link>
    );
}

export default function Index({ summary = {}, sourceStatus = {} }) {
    return (
        <AdminLayout>
            <Head title="Need Approval" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                            <CheckSquare size={15} />
                            Need Approval
                        </div>
                        <h1 className="mt-4 text-2xl font-black tracking-tight">Pekerjaan yang menunggu keputusan</h1>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                            Fokusnya data yang masih menggantung: yang baru submit, perlu dicek ulang, atau harus segera di-follow up.
                        </p>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard title="Outstanding" value={formatNumber(summary.outstandingCount)} helper="Status SUBMIT dan RE-CHECK" icon={FileText} />
                    <StatCard title="Submit" value={formatNumber(summary.submitCount)} helper="Menunggu keputusan" icon={Clock} />
                    <StatCard title="Re-Check" value={formatNumber(summary.recheckCount)} helper="Perlu dicek ulang" icon={CheckSquare} />
                    <StatCard title="Nominal" value={formatRp(summary.paymentAmount)} helper="Total payment amount dalam antrian" icon={Database} />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <MenuCard
                        title="Inputan Data Outstanding"
                        helper="Daftar pembayaran invoice yang masih SUBMIT atau RE-CHECK, lengkap dengan vendor, due date, divisi, dan rekening tujuan."
                        href="/need-approval/outstanding"
                        icon={FileText}
                        amount={summary.paymentAmount}
                    />
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Sumber data</h2>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {Object.entries(sourceStatus).map(([table, count]) => (
                            <div key={table} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{table}</p>
                                <p className="mt-1 text-lg font-black text-slate-950">{formatNumber(count)} data</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
