import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, FileText, MapPin, Box, DollarSign, ClipboardList, User, Truck } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function InfoItem({ label, value, highlight }) {
    const displayValue = value === null || value === undefined || value === "" ? "-" : value;
    return (
        <div className={`rounded-lg border ${highlight ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-slate-50"} px-4 py-3`}>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 break-words text-sm font-black ${highlight ? "text-indigo-800" : "text-slate-900"}`}>{displayValue}</p>
        </div>
    );
}

function SectionCard({ icon: Icon, title, children }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                {Icon && <Icon size={16} className="text-indigo-600" />}
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {children}
            </div>
        </div>
    );
}

export default function FatDocumentsPrimaryDetail({ record, editor }) {
    const d = record || {};

    return (
        <AdminLayout>
            <Head title={`FAT Primary - ${d.no_bap || d.id_key || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href="/business-control/fat-primary"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-indigo-600">FAT Document</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">
                                Primary — {d.no_bap || d.id_key || "-"}
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr_0.8fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-indigo-300">
                                <Truck size={15} />
                                PRIMARY
                            </div>
                            <h2 className="mt-4 text-3xl font-black">{d.no_bap || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">
                                {d.nopol_driver || "-"} — {d.area || "-"}
                            </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <DollarSign size={15} />
                                Profit
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(d.profit)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <ClipboardList size={15} />
                                Status Dokumen
                            </div>
                            <p className="mt-2 text-lg font-black">
                                {d.status_dokument === "DITERIMA" ? "DITERIMA FAT" : d.status_dokument || "BELUM NAIK"}
                            </p>
                        </div>
                    </div>
                </section>

                <SectionCard icon={FileText} title="Informasi Record">
                    <InfoItem label="ID KEY" value={d.id_key} />
                    <InfoItem label="NO BAP" value={d.no_bap} />
                    <InfoItem label="TANGGAL MUAT" value={d.tanggal_muat} />
                    <InfoItem label="TANGGAL TERIMA" value={d.tanggal_terima} />
                    <InfoItem label="WEEK" value={d.week} />
                </SectionCard>

                <SectionCard icon={MapPin} title="Lokasi & Rute">
                    <InfoItem label="REGIONAL" value={d.regional} />
                    <InfoItem label="AREA" value={d.area} />
                    <InfoItem label="RUTE ASAL" value={d.rute_asal} />
                    <InfoItem label="RUTE TUJUAN" value={d.rute_tujuan} />
                </SectionCard>

                <SectionCard icon={Box} title="Muatan & Dokumen">
                    <InfoItem label="NOPOL / DRIVER" value={d.nopol_driver} />
                    <InfoItem label="VENDOR" value={d.vendor} />
                    <InfoItem label="QTY" value={d.qty ?? "-"} />
                    <InfoItem label="JENIS" value={d.jenis} />
                    <InfoItem label="TOTAL" value={d.total ?? "-"} />
                    <InfoItem label="NO. PO" value={d.no_po} />
                    <InfoItem label="NO. SI" value={d.no_si} />
                    <InfoItem label="NO. SJ" value={d.no_sj} />
                </SectionCard>

                <SectionCard icon={DollarSign} title="Finance / Keuangan">
                    <InfoItem label="TARIF" value={formatRp(d.tarif)} />
                    <InfoItem label="TOTAL TARIF" value={formatRp(d.total_tarif)} />
                    <InfoItem label="TARIF VENDOR" value={formatRp(d.tarif_vendor)} />
                    <InfoItem label="TOTAL BIAYA" value={formatRp(d.total_biaya)} />
                    <InfoItem label="PROFIT" value={formatRp(d.profit)} highlight />
                    <InfoItem label="PRODUKTIVITAS" value={d.productivity != null ? `${d.productivity}%` : "-"} />
                </SectionCard>

                <SectionCard icon={DollarSign} title="Rincian Biaya">
                    <InfoItem label="BURUH MUAT" value={formatRp(d.biaya_buruh_muat)} />
                    <InfoItem label="BURUH BONGKAR" value={formatRp(d.biaya_buruh_bongkar)} />
                    <InfoItem label="DOORING" value={formatRp(d.biaya_dooring)} />
                    <InfoItem label="KAPAL" value={formatRp(d.biaya_kapal)} />
                    <InfoItem label="BBM" value={formatRp(d.biaya_bbm)} />
                    <InfoItem label="TRANSPORT" value={formatRp(d.biaya_transport)} />
                    <InfoItem label="LAIN-LAIN" value={formatRp(d.biaya_lain_lain)} />
                </SectionCard>

                <SectionCard icon={ClipboardList} title="Status Dokumen">
                    <InfoItem label="STATUS DOKUMEN" value={d.status_dokument === "DITERIMA" ? "DITERIMA FAT" : d.status_dokument || "BELUM NAIK"} />
                    <InfoItem label="TGL DOKUMEN NAIK" value={d.tanggal_dokument_naik} />
                    <InfoItem label="KETERANGAN" value={d.keterangan} />
                </SectionCard>

                <SectionCard icon={User} title="Editor">
                    <InfoItem label="NAMA ADMIN" value={editor} />
                </SectionCard>
            </div>
        </AdminLayout>
    );
}