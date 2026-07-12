import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, MapPin, Route, Truck } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-900">{value || "-"}</p>
        </div>
    );
}

export default function OperationDetail({ title, type, detail = {}, backUrl }) {
    const typeLabel = type === "primary" ? "Primary" : type === "lcl" ? "LCL" : "Secondary";

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
                                {typeLabel}
                            </div>
                            <h2 className="mt-4 text-3xl font-black">{detail.nopol || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">
                                {detail.tipe || "-"} di area {detail.area || "-"}.
                            </p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <MapPin size={15} />
                                Profit
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(detail.profit)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Route size={15} />
                                Week
                            </div>
                            <p className="mt-2 text-lg font-black">{detail.week || "-"}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Data Detail</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Ini data asli dari record yang dipilih.</p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                        <InfoItem label="ID_KEY" value={detail.id_key} />
                        <InfoItem label="TANGGAL" value={detail.tanggal} />
                        <InfoItem label="AREA" value={detail.area} />
                        <InfoItem label="NOPOL" value={detail.nopol} />
                        <InfoItem label="TIPE" value={detail.tipe} />
                        <InfoItem label="TARIF" value={formatRp(detail.tarif)} />
                        <InfoItem label="BIAYA" value={formatRp(detail.biaya)} />
                        <InfoItem label="PROFIT" value={formatRp(detail.profit)} />
                        <InfoItem label="WEEK" value={detail.week} />
                        <InfoItem label="NO_PO" value={detail.no_po} />
                        <InfoItem label="NO_SI" value={detail.no_si} />
                        <InfoItem label="RUTE / ORDER" value={detail.rute || detail.order_type} />
                        <InfoItem label="VENDOR / DRIVER" value={detail.vendor || detail.driver} />
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
