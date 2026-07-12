import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, CircleDollarSign, Gauge, MapPin, Truck } from "lucide-react";
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

export default function Detail({ record = {}, isStandby = false, backUrl = "/on-the-road" }) {
    return (
        <AdminLayout>
            <Head title={`On The Road - ${record.nopol || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50"><ArrowLeft size={19} /></Link>
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">On The Road</p>
                            <h1 className="truncate text-xl font-black uppercase text-slate-950">{isStandby ? "Detail Unit Standby" : "Detail Unit Jalan"}</h1>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr_0.75fr_0.75fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200"><Truck size={15} /> Unit</div>
                            <h2 className="mt-4 text-3xl font-black">{record.nopol || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">{isStandby ? record.tipe : record.tipe_unit || "-"} di area {record.area || "-"}.</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300"><CircleDollarSign size={15} /> Tarif</div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(record.tagihan)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300"><Gauge size={15} /> Biaya</div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(record.total_biaya_operasional)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300"><MapPin size={15} /> Profit</div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(record.profit_trip)}</p>
                        </div>
                    </div>
                </section>

                {isStandby ? (
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <InfoItem label="Region" value={record.region} />
                        <InfoItem label="Area" value={record.area} />
                        <InfoItem label="Driver" value={record.driver} />
                        <InfoItem label="Project" value={record.project} />
                        <InfoItem label="Pabrikan" value={record.pabrikan} />
                        <InfoItem label="Model" value={record.model} />
                        <InfoItem label="Status STNK" value={record.status_stnk} />
                        <InfoItem label="Status Pajak" value={record.status_pajak} />
                        <InfoItem label="Status KIR" value={record.status_kir} />
                        <InfoItem label="GPS" value={record.gps} />
                        <InfoItem label="Tahun" value={record.tahun} />
                        <InfoItem label="Status" value={record.status} />
                    </section>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <InfoItem label="Tanggal" value={record.tanggal_normalized || record.tanggal} />
                            <InfoItem label="Project" value={record.project} />
                            <InfoItem label="Area" value={record.area} />
                            <InfoItem label="Driver" value={record.driver} />
                            <InfoItem label="Helper" value={record.helper} />
                            <InfoItem label="Rute" value={record.rute} />
                            <InfoItem label="Status" value={record.status} />
                            <InfoItem label="Total KM" value={record.total_km} />
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Biaya Operasional</h2>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Ringkasan biaya lapangan dari record yang dipilih.</p>
                            </div>
                            <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                                <InfoItem label="Total Tarif" value={formatRp(record.total_tarif)} />
                                <InfoItem label="Tagihan" value={formatRp(record.tagihan)} />
                                <InfoItem label="Total Biaya Operasional" value={formatRp(record.total_biaya_operasional)} />
                                <InfoItem label="Profit Trip" value={formatRp(record.profit_trip)} />
                                <InfoItem label="BBM" value={formatRp(record.total_nominal_pengisian_bbm)} />
                                <InfoItem label="Tol" value={formatRp(record.tol)} />
                                <InfoItem label="Parkir Resmi" value={formatRp(record.parkir_resmi)} />
                                <InfoItem label="Biaya Lainnya" value={formatRp(record.biaya_lainnya)} />
                            </div>
                        </section>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
