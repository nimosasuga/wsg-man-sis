import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Clock, User, MapPin, Route, Truck, Box, DollarSign, Hash, FileText } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;

function InfoItem({ label, value, highlight }) {
    const displayValue = value === null || value === undefined || value === "" ? "-" : value;

    return (
        <div className={`rounded-lg border ${highlight ? 'border-cyan-200 bg-cyan-50' : 'border-slate-100 bg-slate-50'} px-4 py-3`}>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 break-words text-sm font-black ${highlight ? 'text-cyan-800' : 'text-slate-900'}`}>{displayValue}</p>
        </div>
    );
}

function SectionCard({ icon: Icon, title, children }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                {Icon && <Icon size={16} className="text-cyan-700" />}
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {children}
            </div>
        </div>
    );
}

const formatNum = (value) => Number(value || 0).toLocaleString("id-ID");

export default function OperationDetail({ title, type, detail = {}, backUrl }) {
    return (
        <AdminLayout>
            <Head title={`${title} - ${detail.nopol || detail.id_key || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href={backUrl || `/profit-unit/${type}/table`}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Profit Unit</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">{title}</h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr_0.8fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200">
                                <Truck size={15} />
                                PRIMARY
                            </div>
                            <h2 className="mt-4 text-3xl font-black">{detail.nopol || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">
                                {detail.jenis || "-"} di area {detail.area || "-"}.
                            </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <DollarSign size={15} />
                                Profit
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(detail.profit)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Hash size={15} />
                                Week
                            </div>
                            <p className="mt-2 text-lg font-black">{detail.week || "-"}</p>
                        </div>
                    </div>
                </section>

                <SectionCard icon={FileText} title="Informasi Record">
                    <InfoItem label="ID KEY" value={detail.id_key} />
                    <InfoItem label="CREATE" value={detail.create} />
                    <InfoItem label="TANGGAL MUAT" value={detail.tanggal_muat} />
                    <InfoItem label="TANGGAL TERIMA" value={detail.tanggal_terima} />
                    <InfoItem label="WEEK" value={detail.week} />
                </SectionCard>

                <SectionCard icon={MapPin} title="Lokasi & Rute">
                    <InfoItem label="REGIONAL" value={detail.regional} />
                    <InfoItem label="AREA" value={detail.area} />
                    <InfoItem label="RUTE ASAL" value={detail.rute_asal} />
                    <InfoItem label="RUTE TUJUAN" value={detail.rute_tujuan} />
                </SectionCard>

                <SectionCard icon={Box} title="Muatan & Dokumen">
                    <InfoItem label="NOPOL & DRIVER" value={detail.nopol} />
                    <InfoItem label="VENDOR" value={detail.vendor} />
                    <InfoItem label="QTY" value={formatNum(detail.qty)} />
                    <InfoItem label="JENIS" value={detail.jenis} />
                    <InfoItem label="NO. PO" value={detail.no_po} />
                    <InfoItem label="NO. SI" value={detail.no_si} />
                    <InfoItem label="NO. SJ" value={detail.no_sj} />
                </SectionCard>

                <SectionCard icon={DollarSign} title="Keuangan">
                    <InfoItem label="TOTAL" value={formatRp(detail.total)} />
                    <InfoItem label="TARIF" value={formatRp(detail.tarif)} />
                    <InfoItem label="TOTAL TARIF" value={formatRp(detail.total_tarif)} />
                    <InfoItem label="TOTAL BIAYA" value={formatRp(detail.total_biaya)} />
                    <InfoItem label="PROFIT" value={formatRp(detail.profit)} highlight />
                </SectionCard>

                <SectionCard icon={User} title="Aktivitas">
                    <InfoItem label="EDITOR" value={detail.editor} />
                    <InfoItem label="EDIT TIME" value={detail.edit_time} />
                </SectionCard>
            </div>
        </AdminLayout>
    );
}