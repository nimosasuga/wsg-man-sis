import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, CheckSquare, Clock, CreditCard, FileText } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-900">{value || "-"}</p>
        </div>
    );
}

function StatusPill({ status }) {
    const tone = status === "SUBMIT"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

    return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide ${tone}`}>{status || "-"}</span>;
}

export default function OutstandingDetail({ record = {}, approvalHistory = [], backUrl = "/need-approval/outstanding" }) {
    return (
        <AdminLayout>
            <Head title={`Outstanding - ${record.no_invoice || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50">
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Need Approval</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">Detail Outstanding</h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr_0.75fr_0.75fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200">
                                <FileText size={15} />
                                Invoice
                            </div>
                            <h2 className="mt-4 break-words text-2xl font-black">{record.no_invoice || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">{record.vendor_supplier || "-"} / payment #{record.no_payment || "-"}.</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <CreditCard size={15} />
                                Payment Amount
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(record.payment_amount)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Clock size={15} />
                                Due Date
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{record.due_date || "-"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <CheckSquare size={15} />
                                Status
                            </div>
                            <div className="mt-3"><StatusPill status={record.status_pengajuan} /></div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoItem label="Tanggal Invoice" value={record.tanggal_invoice} />
                    <InfoItem label="Due Date" value={record.due_date} />
                    <InfoItem label="Days Left" value={record.days_left} />
                    <InfoItem label="Regional" value={record.regional} />
                    <InfoItem label="Divisi" value={record.divisi} />
                    <InfoItem label="No Payment" value={record.no_payment} />
                    <InfoItem label="PAO Week" value={record.pao_week} />
                    <InfoItem label="Jenis Pembayaran" value={record.jenis_pembayaran} />
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Nilai dan Rekening</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Data pembayaran yang perlu dicek sebelum keputusan dibuat.</p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        <InfoItem label="Invoice Amount" value={formatRp(record.invoice_amount)} />
                        <InfoItem label="PPN" value={formatRp(record.ppn)} />
                        <InfoItem label="PPh" value={formatRp(record.pph)} />
                        <InfoItem label="Biaya Lainnya" value={formatRp(record.biaya_lainnya)} />
                        <InfoItem label="Payment Amount" value={formatRp(record.payment_amount)} />
                        <InfoItem label="Rekening Tujuan" value={record.rekening_tujuan} />
                        <InfoItem label="Nama Penerima" value={record.nama_penerima} />
                        <InfoItem label="Sumber Dana" value={record.sumber_dana} />
                        <InfoItem label="Dokumen Diterima" value={record.dokumen_diterima} />
                        <InfoItem label="Bukti TF" value={record.bukti_tf} />
                        <InfoItem label="Email" value={record.email} />
                        <InfoItem label="Keterangan" value={record.keterangan} />
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Riwayat Approval</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Diambil dari ALUR APROVAL untuk invoice dan nomor payment yang sama.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-left">
                            <thead className="bg-slate-50">
                                <tr>
                                    {["Date Time", "Email", "Status", "Diajukan"].map((head) => (
                                        <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {approvalHistory.length ? approvalHistory.map((row) => (
                                    <tr key={row.id_key} className="hover:bg-cyan-50/40">
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.date_time || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.email || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.status_doc || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.diajukan || "-"}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Belum ada riwayat approval.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
