import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Car, ChevronRight, Image as ImageIcon } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const fields = [
    { label: "ID", key: "id_key" },
    { label: "Nopol", key: "nopol" },
    { label: "Region", key: "region" },
    { label: "Area", key: "area" },
    { label: "Area Asal", key: "area_asal" },
    { label: "Inventaris", key: "inventaris" },
    { label: "Tipe", key: "tipe" },
    { label: "Pabrikan", key: "pabrikan" },
    { label: "Model", key: "model" },
    { label: "Jenis", key: "jenis" },
    { label: "GPS", key: "gps" },
    { label: "No. Mesin", key: "no_mesin" },
    { label: "No. Rangka", key: "no_rangka" },
    { label: "Project", key: "project" },
    { label: "Tahun", key: "tahun" },
    { label: "Tahun Pembelian", key: "tahun_pembelian" },
    { label: "Distribusi", key: "distribusi" },
    { label: "Status", key: "status" },
    { label: "Status STNK", key: "status_stnk" },
    { label: "Status Pajak", key: "status_pajak" },
    { label: "Status KIR", key: "status_kir" },
    { label: "My Pertamina", key: "my_pertamina" },
    { label: "Keterangan", key: "keterangan" },
];

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 break-words text-sm font-black text-slate-950">{value || "-"}</p>
        </div>
    );
}

export default function KendaraanOperasionalDetail({ asset }) {
    return (
        <AdminLayout>
            <Head title={`${asset?.nopol || "Kendaraan Operasional"} - Detail`} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/inventori/daftar-asset" className="transition hover:text-cyan-600">Daftar Asset</Link>
                    <ChevronRight size={16} />
                    <Link href="/inventori/daftar-asset/kendaraan-operasional" className="transition hover:text-cyan-600">Kendaraan Operasional</Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">{asset?.nopol || "Detail"}</span>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                <Car size={23} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Detail Kendaraan Operasional</p>
                                <h1 className="mt-2 text-2xl font-black text-slate-950">{asset?.nopol || "Kendaraan Operasional"}</h1>
                                <p className="mt-2 text-sm font-semibold text-slate-500">{asset?.tipe || "-"} · {asset?.area || "-"}</p>
                            </div>
                        </div>

                        <Link
                            href="/inventori/daftar-asset/kendaraan-operasional"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                            Kembali
                        </Link>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Informasi Kendaraan</h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {fields.map((field) => (
                                <InfoItem key={field.key} label={field.label} value={asset?.[field.key]} />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Foto Unit</h2>
                        <div className="mt-5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50">
                            {asset?.foto_unit ? (
                                <div className="p-4 text-center">
                                    <ImageIcon size={36} className="mx-auto text-emerald-600" />
                                    <p className="mt-3 break-all text-xs font-bold text-slate-600">{asset.foto_unit}</p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <ImageIcon size={42} className="mx-auto" />
                                    <p className="mt-3 text-sm font-black">Belum ada foto unit</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
