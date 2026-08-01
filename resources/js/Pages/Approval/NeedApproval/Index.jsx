import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, CheckSquare, Clock, Database, FileText } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

function StatCard({ title, value, helper, icon: Icon, href, tone = "violet" }) {
    const tones = {
        violet: "bg-[#f1efff] text-[#635bff]",
        cyan: "bg-cyan-50 text-cyan-600",
        amber: "bg-amber-50 text-amber-600",
        emerald: "bg-emerald-50 text-emerald-600",
    };

    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">{title}</p>
                    <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">{value}</p>
                </div>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">{helper}</p>
        </>
    );

    if (href) {
        return (
            <Link href={href} className="block min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#c7c3ff] hover:shadow-lg hover:shadow-[#635bff]/10">
                {content}
            </Link>
        );
    }

    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {content}
        </div>
    );
}

function MenuCard({ title, helper, href, icon: Icon, amount }) {
    return (
        <Link href={href} className="group relative block overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#c7c3ff] hover:shadow-lg hover:shadow-[#635bff]/10">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#635bff] to-cyan-400" />
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#f1efff] px-3 py-1.5 text-xs font-bold text-[#635bff]">
                        <Icon size={16} />
                        {title}
                    </div>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{formatRp(amount)}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{helper}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f1efff] text-[#635bff] transition group-hover:bg-[#635bff] group-hover:text-white">
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
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#f1efff] px-3 py-1.5 text-xs font-bold text-[#635bff]">
                                <CheckSquare size={14} />
                                Need Approval
                            </div>
                            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Pekerjaan yang menunggu keputusan</h1>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Fokus pada data yang baru diajukan atau perlu dicek ulang sebelum proses pembayaran dilanjutkan.
                            </p>
                        </div>
                        <Link href="/need-approval/outstanding" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#635bff] px-4 text-sm font-bold text-white shadow-lg shadow-[#635bff]/20 transition hover:bg-[#554de8]">
                            Buka antrian
                            <ArrowRight size={17} />
                        </Link>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-[#635bff] via-cyan-400 to-emerald-400" />
                </section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard title="Outstanding" value={formatNumber(summary.outstandingCount)} helper="Status submit dan re-check" icon={FileText} href="/need-approval/outstanding" tone="violet" />
                    <StatCard title="Submit" value={formatNumber(summary.submitCount)} helper="Menunggu keputusan" icon={Clock} href="/need-approval/outstanding?status=SUBMIT" tone="cyan" />
                    <StatCard title="Re-check" value={formatNumber(summary.recheckCount)} helper="Perlu dicek ulang" icon={CheckSquare} href="/need-approval/outstanding?status=RE-CHECK" tone="amber" />
                    <StatCard title="Nominal antrian" value={formatRp(summary.paymentAmount)} helper="Total pembayaran yang menunggu proses" icon={Database} tone="emerald" />
                </div>

                <div className="grid gap-5">
                    <MenuCard
                        title="Inputan Data Outstanding"
                        helper="Daftar pembayaran invoice yang masih SUBMIT atau RE-CHECK, lengkap dengan vendor, due date, divisi, dan rekening tujuan."
                        href="/need-approval/outstanding"
                        icon={FileText}
                        amount={summary.paymentAmount}
                    />
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                        <h2 className="text-base font-bold text-slate-950">Cakupan data</h2>
                        <p className="mt-1 text-sm text-slate-500">Jumlah data yang ikut membentuk antrian approval saat ini.</p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {Object.entries(sourceStatus).map(([table, count]) => (
                            <div key={table} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="truncate text-xs font-semibold text-slate-400" title={table}>{table}</p>
                                <p className="mt-1 text-lg font-bold tracking-tight text-slate-950">{formatNumber(count)} data</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
