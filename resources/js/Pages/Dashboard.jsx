import React, { memo } from "react";
import AdminLayout from "../Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import {
    AlertCircle,
    ArrowDownRight,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    FileCheck,
    Gauge,
    ShieldAlert,
    Truck,
    WalletCards,
} from "lucide-react";

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
})}`;

const complianceItems = [
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

// Komponen KPI Card Atas (Analitik Cepat)
const KpiCard = memo(function KpiCard({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    colorClass,
    description,
}) {
    const isPositive = trend === "up";

    return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[11px] font-black text-slate-400 tracking-wider uppercase mb-1">
                    {title}
                </p>
                <h4 className="text-2xl font-black text-slate-900">{value}</h4>
            </div>
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
        </div>
        <p className="mt-3 min-h-[36px] text-sm font-medium leading-5 text-slate-500">
            {description}
        </p>
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

const SummaryCard = memo(function SummaryCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-white">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-100/80">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-slate-950">
                    <Icon size={22} />
                </div>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-300">{helper}</p>
        </div>
    );
});

const SectionHeader = memo(function SectionHeader({ title, description }) {
    return (
        <div className="mb-4">
            <h2 className="text-base font-black text-slate-900">{title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>
    );
});

const ComplianceCard = memo(function ComplianceCard() {
    const toneClass = {
        blue: "bg-blue-50 text-blue-700",
        emerald: "bg-emerald-50 text-emerald-700",
        amber: "bg-amber-50 text-amber-700",
        rose: "bg-rose-50 text-rose-700",
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
                title="Kondisi Dokumen Hari Ini"
                description="Bagian yang sudah aman, yang mendekati jatuh tempo, dan yang perlu dibereskan dulu."
            />
            <div className="space-y-3">
                {complianceItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 p-3">
                        <div>
                            <p className="text-sm font-black text-slate-800">{item.label}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.helper}</p>
                        </div>
                        <span className={`rounded-lg px-3 py-1.5 text-sm font-black ${toneClass[item.tone]}`}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
});

const WorkQueueCard = memo(function WorkQueueCard() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
                title="Pekerjaan Yang Perlu Dikejar"
                description="Daftar kecil supaya follow up tidak tercecer di tengah operasional."
            />
            <div className="overflow-hidden rounded-lg border border-slate-100">
                {workQueue.map((item) => (
                    <div key={item.task} className="grid gap-2 border-b border-slate-100 p-3 last:border-b-0 sm:grid-cols-[1fr_110px_86px] sm:items-center">
                        <div>
                            <p className="text-sm font-black text-slate-800">{item.task}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.owner}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-500">{item.due}</p>
                        <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                            {item.status}
                        </span>
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
            <SectionHeader
                title="Kinerja Profit Global"
                description="Gabungan Primary, Secondary, Rental, dan LCL untuk melihat hasil usaha dan kontribusi tiap area."
            />
            <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    ["Total Pendapatan", formatRp(summary.revenue), "Nilai pekerjaan yang tercatat."],
                    ["Total Biaya", formatRp(summary.cost), "Beban operasional Primary dan Secondary."],
                    ["Profit Bersih", formatRp(summary.profit), "Sisa pendapatan setelah biaya."],
                    ["Margin Global", `${Number(summary.margin || 0).toFixed(1)}%`, "Porsi profit dari seluruh pendapatan."],
                    ["Area Teratas", summary.topArea || "-", `${formatRp(summary.topAreaProfit)} profit.`],
                ].map(([label, value, helper]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
                        <p className="mt-2 break-words text-xl font-black text-slate-950">{value}</p>
                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{helper}</p>
                    </div>
                ))}
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-black uppercase text-slate-950">Keuntungan Per Area</h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Sepuluh area dengan profit terbesar dari seluruh grup usaha.</p>
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

export default function Dashboard({ dbChartData }) {
    return (
        <AdminLayout>
            <Head title="Dashboard Analitik" />

            <section className="mb-6 overflow-hidden rounded-xl bg-slate-950 shadow-xl shadow-slate-200">
                <div className="grid gap-5 p-5 text-white lg:grid-cols-[1.4fr_1fr] lg:p-6">
                    <div>
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-cyan-400/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-200">
                                Pusat Kendali
                            </span>
                            <span className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
                                Periode berjalan
                            </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                            Dashboard Operasional
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-300">
                            Gambaran cepat kondisi armada, dokumen, finance, dan pekerjaan yang perlu dikejar hari ini.
                        </p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Area kerja</p>
                                <p className="mt-1 text-sm font-black text-white">Fleet, Finance, Tax</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Prioritas</p>
                                <p className="mt-1 text-sm font-black text-white">Yang expired dan yang belum lengkap</p>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Status kerja</p>
                                <p className="mt-1 text-sm font-black text-emerald-300">Data siap dipantau</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        <SummaryCard
                            title="Unit Terpantau"
                            value="262"
                            helper="Unit aktif yang masuk pantauan harian."
                            icon={Gauge}
                        />
                        <SummaryCard
                            title="Dokumen Finance"
                            value="7,625"
                            helper="FAT primary dan secondary yang sudah tercatat."
                            icon={WalletCards}
                        />
                    </div>
                </div>
            </section>

            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6 mb-8">
                <KpiCard
                    title="Total Armada Aktif"
                    value="262"
                    icon={Truck}
                    trend="up"
                    trendLabel="4.2%"
                    colorClass="bg-blue-50 text-blue-600"
                    description="Unit aktif yang menjadi dasar pengecekan operasional harian."
                />
                <KpiCard
                    title="Dokumen Lengkap"
                    value="2,507"
                    icon={FileCheck}
                    trend="up"
                    trendLabel="12.5%"
                    colorClass="bg-emerald-50 text-emerald-600"
                    description="Invoice yang sudah lengkap dan aman untuk proses berikutnya."
                />
                <KpiCard
                    title="Pajak Expired"
                    value="15"
                    icon={AlertCircle}
                    trend="down"
                    trendLabel="2.1%"
                    colorClass="bg-rose-50 text-rose-600"
                    description="Unit yang pajaknya lewat masa berlaku dan perlu segera dicek."
                />
                <KpiCard
                    title="KIR Hampir Expired"
                    value="31"
                    icon={ShieldAlert}
                    trend="up"
                    trendLabel="8.4%"
                    colorClass="bg-amber-50 text-amber-600"
                    description="KIR yang sudah dekat jatuh tempo, bagusnya mulai dijadwalkan."
                />
            </div>

            <GlobalProfitSection
                summary={dbChartData?.globalProfit || {}}
                areas={dbChartData?.profitByArea || []}
            />

            <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr] xl:gap-6">
                <ComplianceCard />
                <WorkQueueCard />
            </div>

        </AdminLayout>
    );
}
