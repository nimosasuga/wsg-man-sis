import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowLeft, CircleDollarSign, Gauge, Pencil, PenTool, Trash2, Truck } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        maximumFractionDigits: 0,
    })}`;

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-black text-slate-900">{value || "-"}</p>
        </div>
    );
}

function TimelineTable({ title, rows = [], type }) {
    const heads = type === "service"
        ? ["Tanggal", "Mode", "Tipe Service", "Keluhan", "Biaya"]
        : ["Tanggal", "Jenis Pengerjaan", "Posisi", "KM Pakai", "Biaya"];

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">Riwayat lain dari nopol yang sama.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            {heads.map((head) => (
                                <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">{head}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.length ? rows.map((row) => {
                            const detailUrl = type === "service"
                                ? `/riwayat-service-unit/service-umum/${row.id_key}`
                                : `/riwayat-service-unit/service-ban/${row.id_key}`;

                            return (
                            <tr
                                key={row.id_key}
                                onClick={() => row.id_key && router.visit(detailUrl)}
                                onKeyDown={(event) => {
                                    if (!row.id_key || !["Enter", " "].includes(event.key)) return;
                                    event.preventDefault();
                                    router.visit(detailUrl);
                                }}
                                role="button"
                                tabIndex={0}
                                className="cursor-pointer hover:bg-cyan-50/40 focus:bg-cyan-50/60 focus:outline-none"
                            >
                                {type === "service" ? (
                                    <>
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_services || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.mode_service || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-900">{row.tipe_service || "-"}</td>
                                        <td className="max-w-md px-4 py-3 text-xs font-semibold text-slate-600"><span className="block truncate">{row.keluhan || "-"}</span></td>
                                        <td className="px-4 py-3 text-xs font-black text-blue-600">{formatRp(row.total_biaya_service)}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_ganti_ban || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-900">{row.jenis_pengerjaan || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.posisi || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.total_kilometer_pemakaian_ban || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-blue-600">{formatRp(row.total_harga)}</td>
                                    </>
                                )}
                            </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Belum ada riwayat terkait.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function BanDetail({ record = {}, unit = {}, related = {}, backUrl = "/riwayat-service-unit/service-ban" }) {
    const totalMaintenance = Number(related.totalService || 0) + Number(related.totalBan || 0);
    const deleteRecord = () => {
        if (!window.confirm("Hapus record service ban ini? Data yang sudah dihapus tidak bisa dikembalikan dari halaman ini.")) return;
        router.delete(`/riwayat-service-unit/service-ban/${record.id_key}`);
    };

    return (
        <AdminLayout>
            <Head title={`Detail Service Ban - ${record.nopol || ""}`} />

            <div className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50">
                                <ArrowLeft size={19} />
                            </Link>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Riwayat Service Unit</p>
                                <h1 className="truncate text-xl font-black uppercase text-slate-950">Detail Service Ban</h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/riwayat-service-unit/service-ban/${record.id_key}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700">
                                <Pencil size={15} />
                                Edit
                            </Link>
                            <button type="button" onClick={deleteRecord} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-xs font-black uppercase tracking-wide text-rose-600 transition hover:bg-rose-50">
                                <Trash2 size={15} />
                                Hapus
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                    <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr_0.75fr_0.75fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-200">
                                <Truck size={15} />
                                Unit Ban
                            </div>
                            <h2 className="mt-4 text-3xl font-black">{record.nopol || "-"}</h2>
                            <p className="mt-2 text-sm font-semibold text-slate-300">{unit?.tipe || record.tipe_ban || "-"} di area {record.area || "-"}.</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <CircleDollarSign size={15} />
                                Biaya Ban
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(record.total_harga)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <Gauge size={15} />
                                KM Pemakaian
                            </div>
                            <p className="mt-2 text-lg font-black">{record.total_kilometer_pemakaian_ban || "-"}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
                                <PenTool size={15} />
                                Total Unit Ini
                            </div>
                            <p className="mt-2 break-words text-lg font-black">{formatRp(totalMaintenance)}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoItem label="Area" value={record.area} />
                    <InfoItem label="Driver" value={record.driver} />
                    <InfoItem label="Tanggal Ganti Ban" value={record.tanggal_ganti_ban} />
                    <InfoItem label="Jenis Pengerjaan" value={record.jenis_pengerjaan} />
                    <InfoItem label="Posisi" value={record.posisi} />
                    <InfoItem label="Tipe Unit" value={unit?.tipe} />
                    <InfoItem label="Jumlah Riwayat Service" value={related.serviceCount} />
                    <InfoItem label="Jumlah Riwayat Ban" value={related.banCount} />
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Detail Pekerjaan Ban</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Catatan inti dari record ban yang dipilih.</p>
                    </div>
                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        <InfoItem label="KM Ganti Ban" value={record.kilometer_ganti_ban} />
                        <InfoItem label="KM Ganti Sebelumnya" value={record.kilometer_ganti_ban_sebelumnya} />
                        <InfoItem label="Total KM Pemakaian" value={record.total_kilometer_pemakaian_ban} />
                        <InfoItem label="Qty Ban" value={record.qty_ban} />
                        <InfoItem label="Jenis Ban" value={record.jenis_ban} />
                        <InfoItem label="Tipe Ban" value={record.tipe_ban} />
                        <InfoItem label="Harga Ban" value={formatRp(record.harga_ban)} />
                        <InfoItem label="Total Harga" value={formatRp(record.total_harga)} />
                        <InfoItem label="Tools" value={record.tools} />
                        <InfoItem label="Ban Dalam" value={record.ban_dalam} />
                        <InfoItem label="Marset" value={record.marset} />
                        <InfoItem label="Nama Toko" value={record.nama_toko} />
                        <InfoItem label="Keterangan" value={record.keterangan} />
                    </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-2">
                    <TimelineTable title="Riwayat Ban Unit Ini" rows={related.ban || []} type="ban" />
                    <TimelineTable title="Riwayat Service Unit Ini" rows={related.services || []} type="service" />
                </div>
            </div>
        </AdminLayout>
    );
}
