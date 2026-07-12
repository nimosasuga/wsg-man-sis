import React, { useMemo } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Lightbulb, TrendingUp } from "lucide-react";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const toneByProfit = (profit) =>
    Number(profit || 0) >= 0
        ? "bg-emerald-50 text-emerald-700"
        : "bg-rose-50 text-rose-700";

const marginOf = (item) =>
    Number(item?.revenue || 0) > 0
        ? (Number(item.profit || 0) / Number(item.revenue || 0)) * 100
        : 0;

const canOpenCategory = (item) => ["primary", "secondary", "rental", "lcl"].includes(item.slug);

function categoryHref(item) {
    if (item.slug === "primary") return "/profit-unit/primary";
    if (item.slug === "secondary") return "/profit-unit/secondary";
    if (item.slug === "rental") return "/profit-unit/rental";
    if (item.slug === "lcl") return "/profit-unit/lcl";
    return "#";
}

function ProfitCard({ item }) {
    const isPositive = Number(item.profit || 0) >= 0;
    const margin =
        Number(item.revenue || 0) > 0
            ? (Number(item.profit || 0) / Number(item.revenue || 0)) * 100
            : 0;

    const content = (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {item.title}
                    </p>
                    <h3 className="mt-2 break-words text-[clamp(1.35rem,2vw,1.9rem)] font-black leading-tight text-slate-900">
                        {formatRp(item.profit)}
                    </h3>
                </div>
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${toneByProfit(item.profit)}`}>
                    <TrendingUp size={22} />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 2xl:grid-cols-2">
                <div className="min-w-0 rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pendapatan</p>
                    <p className="mt-1 break-words text-[13px] font-black leading-tight text-slate-800">{formatRp(item.revenue)}</p>
                </div>
                <div className="min-w-0 rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Biaya</p>
                    <p className="mt-1 break-words text-[13px] font-black leading-tight text-slate-800">{formatRp(item.cost)}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className={isPositive ? "inline-flex items-center gap-1 text-emerald-600" : "inline-flex items-center gap-1 text-rose-600"}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    Margin {margin.toFixed(1)}%
                </span>
                <span className="text-slate-400">{item.count} record</span>
            </div>
        </div>
    );

    const href = categoryHref(item);
    return href !== "#" ? (
        <Link href={href} className="block">
            {content}
        </Link>
    ) : (
        content
    );
}

export default function Index({ summaryData = [] }) {
    const totals = useMemo(
        () =>
            summaryData.reduce(
                (acc, item) => ({
                    revenue: acc.revenue + Number(item.revenue || 0),
                    cost: acc.cost + Number(item.cost || 0),
                    profit: acc.profit + Number(item.profit || 0),
                    count: acc.count + Number(item.count || 0),
                }),
                { revenue: 0, cost: 0, profit: 0, count: 0 },
            ),
        [summaryData],
    );

    const decisionNotes = useMemo(() => {
        const rows = summaryData.map((item) => ({
            ...item,
            margin: marginOf(item),
        }));

        const sortedByProfit = [...rows].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0));
        const sortedByMargin = [...rows].sort((a, b) => b.margin - a.margin);
        const costRatio = Number(totals.revenue || 0) > 0 ? (Number(totals.cost || 0) / Number(totals.revenue || 0)) * 100 : 0;
        const topProfit = sortedByProfit[0];
        const lowProfit = sortedByProfit[sortedByProfit.length - 1];
        const topMargin = sortedByMargin[0];

        if (!rows.length) {
            return [
                    "Belum ada profit yang terbaca. Pastikan data primary, secondary, rental, dan LCL sudah masuk.",
                    "Untuk sementara jangan putuskan apa-apa dulu sebelum pendapatan dan biaya sama-sama terbaca.",
            ];
        }

        const notes = [];

        if (topProfit) {
            notes.push(`${topProfit.title} sedang jadi penyumbang profit terbesar: ${formatRp(topProfit.profit)}.`);
        }

        if (topMargin && topMargin.revenue > 0) {
            notes.push(`Margin paling sehat ada di ${topMargin.title}, sekitar ${topMargin.margin.toFixed(1)}% dari pendapatan.`);
        }

        if (lowProfit && Number(lowProfit.profit || 0) <= 0) {
            notes.push(`${lowProfit.title} perlu dicek dulu sebelum diperbesar, karena profitnya masih ${formatRp(lowProfit.profit)}.`);
        } else if (lowProfit) {
            notes.push(`${lowProfit.title} paling kecil kontribusinya, jadi bagus untuk dicek apakah datanya belum lengkap atau memang volumenya rendah.`);
        }

        if (costRatio > 70) {
            notes.push(`Biaya sudah memakan sekitar ${costRatio.toFixed(1)}% dari pendapatan. Prioritasnya cek komponen biaya terbesar sebelum mengejar order baru.`);
        } else if (totals.revenue > 0) {
            notes.push(`Rasio biaya masih sekitar ${costRatio.toFixed(1)}%. Fokus berikutnya bisa ke peningkatan volume di kategori dengan margin terbaik.`);
        }

        return notes.slice(0, 4);
    }, [summaryData, totals]);

    return (
        <AdminLayout>
            <Head title="Profit Unit" />

            <div className="mb-4 flex items-center text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>PROFIT UNIT</span>
                <ChevronRight size={14} className="mx-1" />
                <span className="text-slate-900">RINGKASAN PROFIT</span>
            </div>

            <section className="mb-6 rounded-xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-200">
                <p className="text-xs font-black uppercase tracking-wider text-cyan-200">
                    Ringkasan Profit Unit
                </p>
                <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_0.8fr_0.8fr_0.5fr]">
                    <div>
                        <h1 className="text-3xl font-black">{formatRp(totals.profit)}</h1>
                        <p className="mt-1 text-sm font-medium text-slate-300">Gabungan profit dari primary, secondary, rental, dan LCL.</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pendapatan</p>
                        <p className="mt-1 text-lg font-black">{formatRp(totals.revenue)}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Biaya</p>
                        <p className="mt-1 text-lg font-black">{formatRp(totals.cost)}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Record</p>
                        <p className="mt-1 text-lg font-black">{totals.count}</p>
                    </div>
                </div>
            </section>

            <section className="mb-6 rounded-xl border border-cyan-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                            <Lightbulb size={19} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-cyan-700">
                                Catatan kerja
                            </p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">
                                Yang sebaiknya dicek dulu
                            </h2>
                        </div>
                    </div>
                    <div className="grid flex-1 gap-3 lg:max-w-4xl lg:grid-cols-2">
                        {decisionNotes.map((note) => (
                            <div key={note} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                                {note}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryData.map((item) => (
                    <ProfitCard key={item.slug} item={item} />
                ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-[920px] w-full border-collapse text-left">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">Kategori</th>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">Pendapatan</th>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">Biaya</th>
                            <th className="border-r border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">Profit</th>
                            <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700">Record</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {summaryData.map((item) => {
                            const href = categoryHref(item);
                            const isClickable = canOpenCategory(item);

                            return (
                            <tr
                                key={item.slug}
                                onClick={() => isClickable && router.visit(href)}
                                onKeyDown={(event) => {
                                    if (!isClickable || !["Enter", " "].includes(event.key)) return;
                                    event.preventDefault();
                                    router.visit(href);
                                }}
                                role={isClickable ? "button" : undefined}
                                tabIndex={isClickable ? 0 : undefined}
                                className={isClickable ? "cursor-pointer transition hover:bg-blue-50/50 focus:bg-blue-50/60 focus:outline-none" : "hover:bg-blue-50/50"}
                            >
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-black text-slate-800">
                                    <span className={isClickable ? "hover:text-blue-600" : ""}>{item.title}</span>
                                </td>
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{formatRp(item.revenue)}</td>
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">{formatRp(item.cost)}</td>
                                <td className="border-r border-slate-100 px-4 py-3 text-sm font-black text-slate-900">{formatRp(item.profit)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{item.count}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
