import React, { memo, useState, useMemo } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    FileCheck,
    Gauge,
    ShieldAlert,
    Truck,
    ClipboardList,
} from "lucide-react";

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
})}`;

const formatCompactRp = (value) => {
    const nominal = Number(value || 0);
    const absolute = Math.abs(nominal);

    if (absolute >= 1_000_000_000) {
        return `Rp${(nominal / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
    }

    if (absolute >= 1_000_000) {
        return `Rp${(nominal / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 0 })} jt`;
    }

    return formatRp(nominal);
};

const healthMetrics = [
    { label: "Pajak aktif", value: "259", helper: "15 unit perlu tindakan", tone: "blue" },
    { label: "STNK aktif", value: "262", helper: "15 dokumen expired", tone: "emerald" },
    { label: "KIR aktif", value: "229", helper: "31 hampir expired", tone: "amber" },
    { label: "Invoice lengkap", value: "2,507", helper: "836 belum lengkap", tone: "rose" },
];

const workQueue = [
    { task: "Validasi legalitas kendaraan", owner: "Inventori", due: "Hari ini", status: "Prioritas" },
    { task: "Follow up KIR hampir expired", owner: "Operasional", due: "7 hari", status: "Aktif" },
    { task: "Rekonsiliasi FAT Doc Primary", owner: "Finance", due: "Bulan ini", status: "Dipantau" },
    { task: "Audit dokumen invoice kosong", owner: "Admin Area", due: "Minggu ini", status: "Backlog" },
];

const BusinessHealth = memo(function BusinessHealth({ data }) {
    const pajakActive = data.pajak?.find((p) => p.name === "AKTIF")?.value || 0;
    const stnkActive = data.stnk?.find((s) => s.name === "AKTIF")?.value || 0;
    const kirActive = data.kir?.find((k) => k.name === "AKTIF")?.value || 0;
    const total = data.totalPajak || 1;
    const complianceScore = Math.round(((pajakActive + stnkActive + kirActive) / (total * 3)) * 100);

    const gp = data.globalProfit || {};
    const profit = Number(gp.profit || 0);
    const revenue = Number(gp.revenue || 0);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const marginScore = Math.min(Math.round((margin / 50) * 100), 100);

    const healthScore = Math.round((complianceScore * 0.5) + (marginScore * 0.5));
    const scoreColor = healthScore >= 75 ? "text-emerald-400" : healthScore >= 50 ? "text-amber-400" : "text-rose-400";
    const barColor = healthScore >= 75 ? "bg-emerald-400" : healthScore >= 50 ? "bg-amber-400" : "bg-rose-400";
    const statusLabel = healthScore >= 75 ? "Sehat" : healthScore >= 50 ? "Sedang" : "Kritis";

    return (
        <section className="mb-8 overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.2fr] lg:p-6">
                <div className="flex flex-col justify-center">
                    <div className="mb-1 inline-flex w-fit items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white">
                        <Gauge size={15} />
                        Business Health
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-slate-950">Kesehatan Bisnis</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Nilai ini ngukur sehat nggaknya bisnis dari dua sisi: urusan dokumen kendaraan (pajak, STNK, KIR) sama untung rugi usahanya.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-950 p-4 text-white">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Skor Kesehatan</p>
                        <p className={`mt-1 text-4xl font-black ${scoreColor}`}>{healthScore}<span className="text-xl text-slate-400">/100</span></p>
                        <p className="mt-1 text-sm font-semibold text-slate-400">Status: <span className={scoreColor}>{statusLabel}</span></p>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-700">
                            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${healthScore}%` }} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: "Kepatuhan Dokumen", value: `${complianceScore}%`, detail: `${pajakActive + stnkActive + kirActive} dari ${total * 3} dokumen aktif`, color: complianceScore >= 75 ? "text-emerald-600" : complianceScore >= 50 ? "text-amber-600" : "text-rose-600" },
                            { label: "Margin Profit", value: `${margin.toFixed(1)}%`, detail: `${formatCompactRp(profit)} dari ${formatCompactRp(revenue)}`, detailFull: `${formatRp(profit)} dari ${formatRp(revenue)}`, color: margin >= 15 ? "text-emerald-600" : margin >= 5 ? "text-amber-600" : "text-rose-600" },
                        ].map((m) => (
                            <div key={m.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{m.label}</p>
                                    <p className={`text-sm font-black ${m.color}`}>{m.value}</p>
                                </div>
                                <p title={m.detailFull || m.detail} className="mt-1 text-xs font-semibold text-slate-500">{m.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
});

const KpiCard = memo(function KpiCard({ title, value, icon: Icon, trend, trendLabel, colorClass, description }) {
    const isPositive = trend === "up";

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[11px] font-black text-slate-400 tracking-wider uppercase mb-1">{title}</p>
                    <h4 className="text-2xl font-black text-slate-900">{value}</h4>
                </div>
                <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
            </div>
            <p className="mt-3 min-h-[36px] text-sm font-medium leading-5 text-slate-500">{description}</p>
            <div className="mt-4 flex items-center text-xs font-bold">
                <span className={isPositive ? "inline-flex items-center gap-1 text-emerald-600" : "inline-flex items-center gap-1 text-rose-600"}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trendLabel}
                </span>
                <span className="text-slate-400 ml-2">dibanding bulan lalu</span>
            </div>
        </div>
    );
});

const SectionHeader = memo(function SectionHeader({ title, description }) {
    return (
        <div className="mb-4">
            <h2 className="text-base font-extrabold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>
    );
});

const AreaHealthTable = memo(function AreaHealthTable({ areas = [] }) {
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const perPage = 10;

    const sorted = useMemo(() => {
        if (!sortKey) return areas;
        return [...areas].sort((a, b) => {
            const av = a[sortKey] ?? 0;
            const bv = b[sortKey] ?? 0;
            return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
    }, [areas, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
    const paged = sorted.slice((page - 1) * perPage, page * perPage);
    const maxScore = Math.max(...areas.map((a) => a.score || 0), 1);

    const toggleSort = (key) => {
        setSortKey((prev) => prev === key && sortDir === 'asc' ? key : key);
        setSortDir((prev) => sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
        setPage(1);
    };

    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <span className="text-slate-300 ml-1"><ArrowUp size={11} /></span>;
        return <span className="ml-1">{sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}</span>;
    };

    const Th = ({ col, label, className }) => (
        <th
            className={`cursor-pointer select-none px-5 py-3 hover:bg-slate-100 ${className || ''}`}
            onClick={() => toggleSort(col)}
        >
            <span className="inline-flex items-center gap-0.5">
                {label}
                <SortIcon col={col} />
            </span>
        </th>
    );

    return (
        <section className="mb-8">
            <SectionHeader title="Kesehatan Per Area" description="Skor kepatuhan dokumen dan profitabilitas tiap cabang." />
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold leading-relaxed text-slate-500">
                Skor tiap area dihitung dari dua hal: kepatuhan dokumen (pajak, STNK, KIR) dan margin profit. Hijau (&ge;75), Kuning (50&ndash;74), Merah (&lt;50).
            </div>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                            <tr>
                                <Th col="area" label="Area" />
                                <Th col="total" label="Unit" />
                                <Th col="compliance" label="Kepatuhan" />
                                <Th col="margin" label="Margin" />
                                <Th col="profit" label="Profit" />
                                <Th col="score" label="Skor" />
                                <th className="px-5 py-3 w-44">Indikator</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paged.map((item) => {
                                const barWidth = Math.max((item.score / maxScore) * 100, item.score > 0 ? 5 : 0);
                                const barColor = item.score >= 75 ? "bg-emerald-500" : item.score >= 50 ? "bg-amber-500" : "bg-rose-500";
                                const textColor = item.score >= 75 ? "text-emerald-700" : item.score >= 50 ? "text-amber-700" : "text-rose-700";
                                const badgeBg = item.score >= 75 ? "bg-emerald-50" : item.score >= 50 ? "bg-amber-50" : "bg-rose-50";
                                const label = item.score >= 75 ? "Sehat" : item.score >= 50 ? "Sedang" : "Kritis";

                                return (
                                    <tr key={item.area} className="text-xs font-bold text-slate-600">
                                        <td className="px-5 py-3 font-black text-slate-900">{item.area}</td>
                                        <td className="px-5 py-3">{item.total}</td>
                                        <td className="px-5 py-3">{item.compliance}%</td>
                                        <td className="px-5 py-3">{item.margin}%</td>
                                        <td className="px-5 py-3">{formatRp(item.profit)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-md px-2.5 py-1 text-xs font-black ${badgeBg} ${textColor}`}>{item.score}</span>
                                        </td>
                                        <td className="w-44 px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                                                </div>
                                                <span className={`text-[11px] font-black ${textColor}`}>{label}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                        <p className="text-xs font-semibold text-slate-500">
                            Menampilkan {(page - 1) * perPage + 1}&ndash;{Math.min(page * perPage, sorted.length)} dari {sorted.length}
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(1)} disabled={page <= 1} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"><ChevronsLeft size={16} /></button>
                            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"><ChevronLeft size={16} /></button>
                            <span className="px-3 text-xs font-bold text-slate-600">{page} / {totalPages}</span>
                            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"><ChevronRight size={16} /></button>
                            <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"><ChevronsRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
});

const ComplianceCard = memo(function ComplianceCard() {
    const toneClass = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <SectionHeader title="Kondisi Dokumen Hari Ini" description="Bagian yang sudah aman, yang mendekati jatuh tempo, dan yang perlu dibereskan dulu." />
            <div className="space-y-3">
                {healthMetrics.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-3">
                        <div>
                            <p className="text-sm font-black text-slate-800">{item.label}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.helper}</p>
                        </div>
                        <span className={`rounded-lg px-3 py-1.5 text-sm font-black ${toneClass[item.tone]}`}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

const WorkQueueCard = memo(function WorkQueueCard() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
            <SectionHeader title="Pekerjaan Yang Perlu Dikejar" description="Daftar kecil supaya follow up tidak tercecer di tengah operasional." />
            <div className="overflow-hidden rounded-lg border border-slate-100">
                {workQueue.map((item) => (
                    <div key={item.task} className="grid gap-2 border-b border-slate-100 p-3 last:border-b-0 sm:grid-cols-[1fr_110px_86px] sm:items-center">
                        <div>
                            <p className="text-sm font-black text-slate-800">{item.task}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.owner}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-500">{item.due}</p>
                        <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{item.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

const GlobalProfitSection = memo(function GlobalProfitSection({ summary = {}, areas = [] }) {
    const maxProfit = Math.max(...areas.map((item) => Math.max(Number(item.profit || 0), 0)), 1);

    return (
        <section className="mb-8">
            <SectionHeader title="Kinerja Profit Global" description="Gabungan Primary, Secondary, Rental, dan LCL untuk melihat hasil usaha dan kontribusi tiap area." />
            <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                {[
                    ["Total Pendapatan", summary.revenue, "Nilai pekerjaan yang tercatat.", "currency"],
                    ["Total Biaya", summary.cost, "Beban operasional Primary dan Secondary.", "currency"],
                    ["Profit Bersih", summary.profit, "Sisa pendapatan setelah biaya.", "currency"],
                    ["Margin Global", `${Number(summary.margin || 0).toFixed(1)}%`, "Porsi profit dari seluruh pendapatan.", "text"],
                    ["Area Teratas", summary.topArea || "-", `${formatRp(summary.topAreaProfit)} profit.`, "text"],
                ].map(([label, value, helper, type]) => {
                    const isCurrency = type === "currency";
                    const displayValue = isCurrency ? formatCompactRp(value) : value;
                    const fullValue = isCurrency ? formatRp(value) : value;

                    return (
                    <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
                        <p title={fullValue} className="mt-2 break-words text-[clamp(0.875rem,1.35vw,1.25rem)] font-black leading-tight tabular-nums text-slate-950">{displayValue}</p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
                    </div>
                    );
                })}
            </div>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase text-slate-950">Keuntungan Per Area</h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Semua area dengan profit dari seluruh grup usaha.</p>
                    </div>
                    <span className="text-xs font-black text-cyan-700">{Number(summary.areaCount || 0).toLocaleString("id-ID")} area tercatat</span>
                </div>
                <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                            <tr><th className="px-5 py-3">Area</th><th className="px-5 py-3">Pendapatan</th><th className="px-5 py-3">Biaya</th><th className="px-5 py-3">Profit</th><th className="px-5 py-3">Margin</th><th className="px-5 py-3">Kontribusi</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {areas.map((item) => {
                                const margin = Number(item.revenue || 0) > 0 ? Number(item.profit || 0) / Number(item.revenue) * 100 : 0;
                                const width = Math.max(Number(item.profit || 0) / maxProfit * 100, 0);
                                return <tr key={item.area} className="text-xs font-bold text-slate-600">
                                    <td className="px-5 py-3 font-black text-slate-900">{item.area}</td>
                                    <td className="px-5 py-3">{formatRp(item.revenue)}</td>
                                    <td className="px-5 py-3">{formatRp(item.cost)}</td>
                                    <td className={`px-5 py-3 font-black ${Number(item.profit) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatRp(item.profit)}</td>
                                    <td className="px-5 py-3">{margin.toFixed(1)}%</td>
                                    <td className="w-44 px-5 py-3"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${width}%` }} /></div></td>
                                </tr>;
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
});

export default function Health({ title, dbChartData }) {
    return (
        <AdminLayout>
            <Head title={title} />

            <div className="font-[Manrope] space-y-2 mb-6">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700">Business control</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Kondisi bisnis secara menyeluruh</h1>
                <p className="text-sm font-medium text-slate-600">Pantau kesehatan bisnis, profit global, dan pekerjaan operasional dari satu tempat.</p>
            </div>

            {dbChartData?.pajak && <BusinessHealth data={dbChartData} />}

            <section className="mb-8">
                <SectionHeader title="Analitik Cepat" description="Ringkasan metrik utama untuk memantau kondisi armada dan dokumen." />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
                    <KpiCard title="Total Armada Aktif" value="262" icon={Truck} trend="up" trendLabel="4.2%" colorClass="bg-blue-50 text-blue-600" description="Unit aktif yang menjadi dasar pengecekan operasional harian." />
                    <KpiCard title="Dokumen Lengkap" value="2,507" icon={FileCheck} trend="up" trendLabel="12.5%" colorClass="bg-emerald-50 text-emerald-600" description="Invoice yang sudah lengkap dan aman untuk proses berikutnya." />
                    <KpiCard title="Pajak Expired" value="15" icon={AlertCircle} trend="down" trendLabel="2.1%" colorClass="bg-rose-50 text-rose-600" description="Unit yang pajaknya lewat masa berlaku dan perlu segera dicek." />
                    <KpiCard title="KIR Hampir Expired" value="31" icon={ShieldAlert} trend="up" trendLabel="8.4%" colorClass="bg-amber-50 text-amber-600" description="KIR yang sudah dekat jatuh tempo, bagusnya mulai dijadwalkan." />
                </div>
            </section>

            <GlobalProfitSection summary={dbChartData?.globalProfit || {}} areas={dbChartData?.profitByArea || []} />

            {dbChartData?.areaHealth?.length > 0 && <AreaHealthTable areas={dbChartData.areaHealth} />}

            <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr] xl:gap-6">
                <ComplianceCard />
                <WorkQueueCard />
            </div>
        </AdminLayout>
    );
}
