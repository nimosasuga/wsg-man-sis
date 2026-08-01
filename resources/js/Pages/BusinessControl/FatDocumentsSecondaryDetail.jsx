import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, FileText, Clock, Truck, Users, DollarSign, Fuel, ClipboardList, User } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function InfoItem({ label, value, highlight }) {
    const displayValue = value === null || value === undefined || value === "" ? "-" : value;
    return (
        <div className={`rounded-lg border ${highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"} px-4 py-3`}>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-1 break-words text-sm font-black ${highlight ? "text-emerald-800" : "text-slate-900"}`}>{displayValue}</p>
        </div>
    );
}

function SectionCard({ icon: Icon, title, children }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                {Icon && <Icon size={16} className="text-emerald-600" />}
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {children}
            </div>
        </div>
    );
}

export default function FatDocumentsSecondaryDetail({ record, editor }) {
    const d = record || {};

    return (
        <AdminLayout>
            <Head title={`FAT Secondary - ${d.nopol || d.id_key || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href="/business-control/fat-secondary"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={19} />
                        </Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-600">FAT Document</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">
                                Secondary — {d.nopol || d.id_key || "-"}
                            </h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr_0.8fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-300">
                                <Truck size={15} />
                                SECONDARY
                            </div>
                            <h2 className="mt-4 text-3xl font-black">{d.nopol || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">
                                {d.tipe_unit || "-"} — {d.area || "-"}
                            </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <DollarSign size={15} />
                                Total Tarif
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(d.total_tarif)}</p>
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
                    <InfoItem label="TANGGAL" value={d.tanggal} />
                    <InfoItem label="NO PO" value={d.no_po} />
                    <InfoItem label="NO SI" value={d.no_si} />
                    <InfoItem label="PROJECT" value={d.project} />
                    <InfoItem label="REGION" value={d.region} />
                </SectionCard>

                <SectionCard icon={Clock} title="Waktu & Unit">
                    <InfoItem label="JAM MULAI" value={d.jam_mulai} />
                    <InfoItem label="JAM SELESAI" value={d.jam_selesai} />
                    <InfoItem label="NOPOL" value={d.nopol} />
                    <InfoItem label="TIPE UNIT" value={d.tipe_unit} />
                    <InfoItem label="AREA" value={d.area} />
                </SectionCard>

                <SectionCard icon={Users} title="Personil">
                    <InfoItem label="DRIVER" value={d.driver} />
                    <InfoItem label="HELPER" value={d.helper} />
                    <InfoItem label="QTY" value={d.qty ?? "-"} />
                </SectionCard>

                <SectionCard icon={DollarSign} title="Pendapatan & Biaya Pokok">
                    <InfoItem label="TARIF UNIT" value={formatRp(d.tarif_unit)} />
                    <InfoItem label="TOTAL TARIF" value={formatRp(d.total_tarif)} highlight />
                    <InfoItem label="ADD COST LONG ROUTE" value={formatRp(d.add_cost_long_route)} />
                    <InfoItem label="TARIF SEWA UNIT VENDOR" value={formatRp(d.tarif_sewa_unit_vendor)} />
                    <InfoItem label="TOTAL BIAYA OPERASIONAL" value={formatRp(d.total_biaya_operasional)} />
                </SectionCard>

                <SectionCard icon={DollarSign} title="Biaya Tambahan">
                    <InfoItem label="TKBM" value={formatRp(d.tkbm)} />
                    <InfoItem label="SPSI" value={formatRp(d.spsi)} />
                    <InfoItem label="PARKIR LIAR / KEAMANAN" value={formatRp(d.parkir_liar_keamanan)} />
                    <InfoItem label="ALLOWANCE" value={formatRp(d.allowance)} />
                    <InfoItem label="PENYEBRANGAN / PAS MASUK" value={formatRp(d.penyebrangan_pas_masuk)} />
                    <InfoItem label="RAPID ANTIGEN" value={formatRp(d.rapid_antigen)} />
                    <InfoItem label="PARKIR RESMI" value={formatRp(d.parkir_resmi)} />
                    <InfoItem label="TOL" value={formatRp(d.tol)} />
                    <InfoItem label="KIRIM DOKUMEN" value={formatRp(d.kirim_dokumen)} />
                    <InfoItem label="ATK" value={formatRp(d.atk)} />
                    <InfoItem label="TARIF GS" value={formatRp(d.tarif_gs)} />
                    <InfoItem label="BIAYA LAINNYA" value={formatRp(d.biaya_lainnya)} />
                </SectionCard>

                <SectionCard icon={DollarSign} title="Hotel">
                    <InfoItem label="BIAYA TAGIHAN HOTEL" value={formatRp(d.biaya_tagihan_hotel)} />
                    <InfoItem label="TARIF HOTEL" value={formatRp(d.tarif_hotel)} />
                    <InfoItem label="SUBSIDI HOTEL" value={formatRp(d.subsidi_hotel)} />
                    <InfoItem label="SELISIH TAGIHAN HOTEL" value={formatRp(d.selisih_tagihan_hotel)} />
                </SectionCard>

                <SectionCard icon={Fuel} title="BBM">
                    <InfoItem label="SUBSIDI BBM" value={formatRp(d.subsidi_bbm)} />
                    <InfoItem label="NOMINAL PENGISIAN BBM" value={formatRp(d.nominal_pengisian_bbm)} />
                    <InfoItem label="SELISIH BBM" value={formatRp(d.selisih_bbm)} />
                    <InfoItem label="NON CLAIM BBM" value={formatRp(d.non_claim_bbm)} />
                    <InfoItem label="NOMINAL PENGISIAN BBM 2" value={formatRp(d.nominal_pengisian_bbm_2)} />
                    <InfoItem label="SELISIH BBM 2" value={formatRp(d.selisih_bbm_2)} />
                    <InfoItem label="NON CLAIM BBM 2" value={formatRp(d.non_claim_bbm_2)} />
                    <InfoItem label="TOTAL NOMINAL PENGISIAN BBM" value={formatRp(d.total_nominal_pengisian_bbm)} />
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