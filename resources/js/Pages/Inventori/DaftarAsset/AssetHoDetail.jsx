import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Box, ChevronRight, Image as ImageIcon } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const fields = [
    { label: "ID", key: "id_key" },
    { label: "Nama Pengguna", key: "nama_pengguna" },
    { label: "Katagori", key: "katagori" },
    { label: "Jenis Barang", key: "jenis_barang" },
    { label: "Model Unit", key: "model_unit" },
    { label: "Divisi", key: "divisi" },
    { label: "Lokasi", key: "lokasi" },
    { label: "Jumlah Unit", key: "jumlah_unit" },
    { label: "Pengguna Sebelumnya", key: "pengguna_sebelumnya" },
    { label: "Spesifikasi", key: "spesifikasi" },
    { label: "Status", key: "status" },
    { label: "Warna", key: "warna" },
    { label: "Serial Number", key: "serial_number" },
    { label: "Keterangan", key: "keterangan" },
];

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                {label}
            </p>
            <p className="mt-2 break-words text-sm font-black text-slate-950">
                {value || "-"}
            </p>
        </div>
    );
}

export default function AssetHoDetail({ asset }) {
    return (
        <AdminLayout>
            <Head title={`${asset?.jenis_barang || "Asset HO"} - Detail`} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/inventori/daftar-asset" className="transition hover:text-cyan-600">
                        Daftar Asset
                    </Link>
                    <ChevronRight size={16} />
                    <Link href="/inventori/daftar-asset/asset-ho" className="transition hover:text-cyan-600">
                        Asset HO
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">{asset?.jenis_barang || "Detail"}</span>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                                <Box size={23} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-cyan-600">
                                    Detail Asset HO
                                </p>
                                <h1 className="mt-2 text-2xl font-black text-slate-950">
                                    {asset?.jenis_barang || "Asset HO"}
                                </h1>
                                <p className="mt-2 text-sm font-semibold text-slate-500">
                                    {asset?.model_unit || "-"} · {asset?.lokasi || "-"}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/inventori/daftar-asset/asset-ho"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                            Kembali
                        </Link>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                            Informasi Asset
                        </h2>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {fields.map((field) => (
                                <InfoItem
                                    key={field.key}
                                    label={field.label}
                                    value={asset?.[field.key]}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                            Gambar Asset
                        </h2>
                        <div className="mt-5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50">
                            {asset?.gambar ? (
                                <div className="p-4 text-center">
                                    <ImageIcon size={36} className="mx-auto text-cyan-600" />
                                    <p className="mt-3 break-all text-xs font-bold text-slate-600">
                                        {asset.gambar}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <ImageIcon size={42} className="mx-auto" />
                                    <p className="mt-3 text-sm font-black">Belum ada gambar</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 rounded-lg bg-slate-50 p-4">
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                                Catatan
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                                {asset?.keterangan || "Tidak ada catatan tambahan."}
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
