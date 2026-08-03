import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Building2, CalendarDays, CheckCircle, Clock3, CreditCard, FileText, Landmark, MapPin, WalletCards, XCircle } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

function InfoItem({ label, value, icon: Icon }) {
    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                {Icon && <Icon size={15} className="shrink-0 text-indigo-500" />}
                <span>{label}</span>
            </div>
            <p className="mt-2 break-words text-sm font-bold leading-6 text-slate-950">{value || "-"}</p>
        </div>
    );
}

function StatusPill({ status }) {
    const tone = status === "SUBMIT"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : "bg-amber-50 text-amber-700 border-amber-100";

    return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${tone}`}>{status || "-"}</span>;
}

export default function OutstandingDetail({ record = {}, approvalHistory = [], backUrl = "/need-approval/outstanding" }) {
    const { auth = {} } = usePage().props;
    const canManage = (auth.permissions || []).includes("approval.manage");

    const handleApprove = () => {
        if (!confirm("Setujui invoice " + record.no_invoice + "?")) return;
        router.post(`/need-approval/outstanding/${record.id_key}/approve`);
    };

    const handleReject = () => {
        if (!confirm("Tolak invoice " + record.no_invoice + "?")) return;
        router.post(`/need-approval/outstanding/${record.id_key}/reject`);
    };

    return (
        <AdminLayout>
            <Head title={`Outstanding - ${record.no_invoice || ""}`} />

            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-indigo-600">Dashboard</Link>
                    <span>/</span>
                    <Link href={backUrl} className="transition hover:text-indigo-600">Need Approval</Link>
                    <span>/</span>
                    <span className="text-slate-800">Detail outstanding</span>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                        <div className="min-w-0">
                            <div className="mb-4 flex items-center gap-3">
                                <Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700" aria-label="Kembali ke daftar outstanding">
                                    <ArrowLeft size={19} />
                                </Link>
                                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                                    <FileText size={14} />
                                    Detail invoice
                                </div>
                            </div>
                            <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{record.no_invoice || "Invoice belum bernomor"}</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{record.vendor_supplier || "Vendor belum tercatat"} <span className="text-slate-300">|</span> Payment #{record.no_payment || "-"}</p>
                        </div>
                        <div className="flex flex-col items-start gap-3 lg:items-end">
                            <StatusPill status={record.status_pengajuan} />
                            {canManage && (
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={handleApprove} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">
                                        <CheckCircle size={16} />
                                        Setujui
                                    </button>
                                    <button onClick={handleReject} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100">
                                        <XCircle size={16} />
                                        Tolak
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid border-t border-slate-100 sm:grid-cols-3">
                        <div className="min-w-0 border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
                            <p className="text-xs font-semibold text-slate-500">Nilai pembayaran</p>
                            <p className="mt-1 break-words text-lg font-extrabold text-slate-950">{formatRp(record.payment_amount)}</p>
                        </div>
                        <div className="min-w-0 border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
                            <p className="text-xs font-semibold text-slate-500">Jatuh tempo</p>
                            <p className="mt-1 break-words text-lg font-extrabold text-slate-950">{record.due_date || "-"}</p>
                        </div>
                        <div className="min-w-0 p-4">
                            <p className="text-xs font-semibold text-slate-500">Sisa waktu</p>
                            <p className="mt-1 break-words text-lg font-extrabold text-slate-950">{record.days_left ?? "-"} hari</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h2 className="text-base font-bold text-slate-950">Informasi pengajuan</h2>
                        <p className="mt-1 text-sm text-slate-500">Ringkasan dokumen, unit kerja, dan jadwal pembayaran.</p>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
                        <InfoItem label="Tanggal invoice" value={record.tanggal_invoice} icon={CalendarDays} />
                        <InfoItem label="Jatuh tempo" value={record.due_date} icon={Clock3} />
                        <InfoItem label="Regional" value={record.regional} icon={MapPin} />
                        <InfoItem label="Divisi" value={record.divisi} icon={Building2} />
                        <InfoItem label="Nomor payment" value={record.no_payment} icon={CreditCard} />
                        <InfoItem label="Minggu PAO" value={record.pao_week} icon={CalendarDays} />
                        <InfoItem label="Jenis pembayaran" value={record.jenis_pembayaran} icon={WalletCards} />
                        <InfoItem label="Sumber dana" value={record.sumber_dana} icon={Landmark} />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h2 className="text-base font-bold text-slate-950">Nilai dan rekening</h2>
                        <p className="mt-1 text-sm text-slate-500">Periksa nilai tagihan dan tujuan pembayaran sebelum mengambil keputusan.</p>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
                        <InfoItem label="Nilai invoice" value={formatRp(record.invoice_amount)} icon={FileText} />
                        <InfoItem label="PPN" value={formatRp(record.ppn)} />
                        <InfoItem label="PPh" value={formatRp(record.pph)} />
                        <InfoItem label="Biaya lainnya" value={formatRp(record.biaya_lainnya)} />
                        <InfoItem label="Nilai pembayaran" value={formatRp(record.payment_amount)} icon={WalletCards} />
                        <InfoItem label="Rekening tujuan" value={record.rekening_tujuan} icon={Landmark} />
                        <InfoItem label="Nama penerima" value={record.nama_penerima} />
                        <InfoItem label="Dokumen diterima" value={record.dokumen_diterima} />
                        <InfoItem label="Bukti transfer" value={record.bukti_tf} />
                        <InfoItem label="Email" value={record.email} />
                        <InfoItem label="Keterangan" value={record.keterangan} />
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <h2 className="text-base font-bold text-slate-950">Riwayat approval</h2>
                        <p className="mt-1 text-sm text-slate-500">Catatan persetujuan untuk invoice dan nomor payment yang sama.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-left">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    {["Date Time", "Email", "Status", "Diajukan"].map((head) => (
                                        <th key={head} className="border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {approvalHistory.length ? approvalHistory.map((row) => (
                                    <tr key={row.id_key} className="transition hover:bg-indigo-50/40">
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{row.date_time || "-"}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{row.email || "-"}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-slate-950">{row.status_doc || "-"}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{row.diajukan || "-"}</td>
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
