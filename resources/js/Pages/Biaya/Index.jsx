import React, { memo, useMemo } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { AlertTriangle, ChevronRight, Eye, Lightbulb, TrendingUp } from "lucide-react";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const SummaryChart = memo(function SummaryChart({ data }) {
    const maxAmount = Math.max(
        ...data.map((item) => Number(item.amount || 0)),
        1,
    );

    return (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Statistik Biaya
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    Lihat biaya terbesar dulu, lalu turun ke rinciannya kalau ada angka yang terasa janggal.
                </p>
            </div>
            <div className="space-y-3">
                {data.map((item) => {
                    const amount = Number(item.amount || 0);
                    const width = Math.max((amount / maxAmount) * 100, amount > 0 ? 4 : 0);

                    return (
                        <div key={item.slug} className="grid gap-2 sm:grid-cols-[150px_1fr_170px] sm:items-center">
                            <p className="truncate text-xs font-black text-slate-700">
                                {item.title}
                            </p>
                            <div className="h-8 overflow-hidden rounded-lg bg-slate-100">
                                <div
                                    className="h-full rounded-lg bg-cyan-500 shadow-[inset_0_-8px_18px_rgba(14,116,144,0.22)] transition-[width] duration-500"
                                    style={{ width: `${width}%` }}
                                />
                            </div>
                            <p className="text-xs font-black text-slate-900 sm:text-right">
                                {formatRp(amount)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

function SmartAnalysis({ summaryData, totalBiaya }) {
    const analysis = useMemo(() => {
        const rows = [...summaryData]
            .map((item) => ({
                ...item,
                amount: Number(item.amount || 0),
                percent: totalBiaya > 0 ? (Number(item.amount || 0) / totalBiaya) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        const top = rows[0];
        const second = rows[1];
        const serviceTotal = rows
            .filter((item) => ["service-ban", "service-umum"].includes(item.slug))
            .reduce((sum, item) => sum + item.amount, 0);
        const legalTotal = rows
            .filter((item) => ["pajak-1-tahun", "pajak-5-tahun", "biaya-kir"].includes(item.slug))
            .reduce((sum, item) => sum + item.amount, 0);
        const operasionalTotal = rows
            .filter((item) => ["operasional-prim", "operasional-sec"].includes(item.slug))
            .reduce((sum, item) => sum + item.amount, 0);

        const notes = [];

        if (!rows.length || totalBiaya <= 0) {
            return {
                top: null,
                notes: [
                    "Belum ada biaya yang terbaca. Cek dulu import data operasional, pajak, KIR, dan service.",
                    "Untuk sementara jangan ambil kesimpulan dulu. Data nol biasanya berarti sumbernya belum lengkap.",
                ],
            };
        }

        if (top) {
            notes.push(`${top.title} sedang jadi beban paling besar: ${formatRp(top.amount)}, sekitar ${top.percent.toFixed(1)}% dari total biaya.`);
        }

        if (second && top && top.amount > second.amount * 1.8) {
            notes.push(`Jaraknya cukup jauh dari ${second.title}. Artinya audit pertama sebaiknya masuk ke ${top.title}, bukan dibagi rata ke semua kategori.`);
        } else if (second) {
            notes.push(`${top.title} dan ${second.title} sama-sama perlu dipantau. Dua kategori ini yang paling terasa kalau ada pemborosan kecil tapi berulang.`);
        }

        if (operasionalTotal > totalBiaya * 0.55) {
            notes.push(`Biaya operasional mengambil porsi besar. Cek rute, ritase, BBM, dan biaya lapangan sebelum menaikkan volume pekerjaan.`);
        }

        if (serviceTotal > totalBiaya * 0.25) {
            notes.push(`Service dan ban sudah cukup berat. Ini sinyal bagus untuk cek unit yang sering masuk bengkel, bukan hanya melihat total nominalnya.`);
        }

        if (legalTotal > totalBiaya * 0.2) {
            notes.push(`Pajak, STNK, dan KIR punya porsi besar. Pastikan jatuh tempo rapih supaya biaya legalitas tidak datang menumpuk di bulan yang sama.`);
        }

        notes.push("Langkah paling masuk akal: buka kategori terbesar, urutkan nominal tertinggi, lalu cek apakah biayanya wajar untuk unit, area, dan tanggalnya.");

        return { top, rows, serviceTotal, legalTotal, operasionalTotal, notes: notes.slice(0, 5) };
    }, [summaryData, totalBiaya]);

    return (
        <section className="mb-5 rounded-xl border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                        <Lightbulb size={19} />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-wider text-cyan-700">Catatan biaya</p>
                        <h2 className="mt-1 text-lg font-black text-slate-950">Mulai cek dari sini</h2>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                            Ringkasan ini membantu mencari biaya yang perlu dicek dulu, bukan sekadar melihat totalnya.
                        </p>
                    </div>
                </div>
                {analysis.top && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 lg:min-w-64">
                        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-500">
                            <TrendingUp size={14} />
                            Beban utama
                        </div>
                        <p className="mt-2 text-sm font-black text-slate-950">{analysis.top.title}</p>
                        <p className="mt-1 break-words text-lg font-black text-blue-600">{formatRp(analysis.top.amount)}</p>
                    </div>
                )}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                {analysis.notes.map((note, index) => (
                    <div key={note} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-white text-[11px] font-black text-cyan-700">
                            {index + 1}
                        </span>
                        {note}
                    </div>
                ))}
            </div>

            {totalBiaya > 0 && (
                <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
                    <span className="mr-2 inline-flex align-[-3px] text-amber-600">
                        <AlertTriangle size={17} />
                    </span>
                    Angka besar belum tentu salah. Yang perlu dicari adalah biaya yang tidak sejalan dengan ritase, umur unit, area kerja, atau jadwal jatuh tempo.
                </div>
            )}
        </section>
    );
}

export default function Index({ summaryData = [] }) {
    const totalBiaya = useMemo(
        () => summaryData.reduce((total, item) => total + Number(item.amount || 0), 0),
        [summaryData],
    );

    return (
        <AdminLayout>
            <Head title="Biaya" />

            <div className="mb-4 flex items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>BIAYA</span>
                <ChevronRight size={14} className="mx-1" />
                <span className="text-slate-900">TABEL BIAYA</span>
            </div>

            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-200">Total Biaya</p>
                <h1 className="mt-2 text-2xl font-black">{formatRp(totalBiaya)}</h1>
                <p className="mt-1 text-sm font-medium text-slate-300">Total dari semua kategori biaya yang sudah terbaca.</p>
            </div>

            <SmartAnalysis summaryData={summaryData} totalBiaya={totalBiaya} />

            <SummaryChart data={summaryData} />

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                Sub Menu
                            </th>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                Nominal Biaya
                            </th>
                            <th className="w-16 px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {summaryData.map((item) => {
                            const href = `/biaya/${item.slug}`;

                            return (
                            <tr
                                key={item.slug}
                                onClick={() => router.visit(href)}
                                onKeyDown={(event) => {
                                    if (!["Enter", " "].includes(event.key)) return;
                                    event.preventDefault();
                                    router.visit(href);
                                }}
                                role="button"
                                tabIndex={0}
                                className="group cursor-pointer transition-colors hover:bg-blue-50/50 focus:bg-blue-50/60 focus:outline-none"
                            >
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-800">
                                    {item.title}
                                </td>
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                                    {formatRp(item.amount)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span
                                        className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-600 transition group-hover:text-blue-600"
                                        title={`Lihat ${item.title}`}
                                    >
                                        <Eye size={17} />
                                        <span className="hidden whitespace-nowrap xl:inline">
                                            {item.actionLabel || "LIHAT RINCIAN"}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
