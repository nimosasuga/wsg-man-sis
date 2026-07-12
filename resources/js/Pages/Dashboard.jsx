import { Link } from "@inertiajs/react";
import { ExternalLink } from "lucide-react";
import React, { memo } from "react";
import AdminLayout from "../Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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

// Komponen KPI Card Atas (Analitik Cepat)
const chartData = {
    kir: [
        { name: "AKTIF", value: 229 },
        { name: "EXPIRED", value: 17 },
        { name: "HAMPIR EXPIRED", value: 31 },
    ],
    docInv: [
        { name: "LENGKAP", value: 2507 },
        { name: "BELUM LENGKAP", value: 836 },
        { name: "[blank]", value: 52 },
    ],
    aktifitasPrimary: [
        { name: "Februari", value: 25 },
        { name: "Maret", value: 106 },
        { name: "April", value: 107 },
        { name: "Mei", value: 36 },
        { name: "Juni", value: 16 },
    ],
    aktifitasSecondary: [{ name: "Juni", value: 45 }],
    fatDocPrimary: [
        { name: "BELUM NAIK", value: 514 },
        { name: "DITERIMA", value: 2390 },
    ],
    fatDocSecondary: [
        { name: "BELUM NAIK", value: 869 },
        { name: "DITERIMA", value: 3852 },
    ],
};

const cBlue = ["#3B82F6", "#93C5FD", "#F59E0B"];
const cDoc = ["#10B981", "#EF4444", "#F59E0B"];
const cActivity = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4"];
const cOrange = ["#F97316"];
const cFinance = ["#EF4444", "#10B981"];
const fallbackInvoiceTotal = chartData.docInv.reduce(
    (total, item) => total + item.value,
    0,
);

const totalOf = (items = []) => items.reduce((total, item) => total + Number(item.value || 0), 0);

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

// Komponen Reusable Donut Chart yang diperhalus
const DonutCard = memo(function DonutCard({
    title,
    subtitle,
    data,
    centerText,
    colors,
    detailLink,
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col h-full hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/80 transition-all relative group">
            {/* Tombol Detail (Muncul & Aktif jika detailLink ada) */}
            {detailLink && (
                <Link
                    href={detailLink}
                    className="absolute top-4 right-4 text-slate-300 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-blue-50 cursor-pointer z-20"
                    title="Lihat Detail Data"
                >
                    <ExternalLink size={18} />
                </Link>
            )}

            <div className="mb-2 min-h-[44px] pr-8">
                <h3 className="text-[13px] font-black text-gray-800 tracking-wide leading-tight">
                    {title}
                </h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">
                    {subtitle}
                </p>
            </div>

            <div className="flex-1 relative w-full flex items-center justify-center min-h-[210px]">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    {centerText && (
                        <>
                            <span className="text-3xl font-black text-gray-800 leading-none">
                                {centerText.value}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">
                                {centerText.label}
                            </span>
                        </>
                    )}
                </div>

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    className="relative z-10"
                >
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="85%"
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            isAnimationActive={false}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            wrapperStyle={{ zIndex: 100 }}
                            contentStyle={{
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                boxShadow:
                                    "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                padding: "8px 12px",
                            }}
                            itemStyle={{ fontWeight: "900", color: "#1f2937" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center content-start gap-x-3 gap-y-2 mt-4 min-h-[48px]">
                {data.map((entry, index) => (
                    <div
                        key={`legend-${index}`}
                        className="flex items-center text-[11px] font-bold text-gray-600"
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full mr-1.5 shadow-sm"
                            style={{
                                backgroundColor: colors[index % colors.length],
                            }}
                        ></span>
                        {entry.name}
                        <span className="ml-1.5 text-gray-400">
                            ({entry.value})
                        </span>
                    </div>
                ))}
            </div>
        </div>
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

            <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr] xl:gap-6">
                <ComplianceCard />
                <WorkQueueCard />
            </div>

            <SectionHeader
                title="Bacaan Per Modul"
                description="Lihat pola data per bagian, lalu masuk ke detail kalau ada angka yang terasa tidak wajar."
            />

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-6 pb-10">
                <DonutCard
                    title="STATUS PAJAK"
                    subtitle="Legalitas Kendaraan"
                    data={dbChartData?.pajak || []} // Ambil dari DB
                    colors={cBlue}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.totalPajak || 0,
                    }}
                    detailLink="/inventori/pajak"
                />

                {/* 2. MENGGUNAKAN DATA DATABASE */}
                <DonutCard
                    title="STATUS STNK"
                    subtitle="Legalitas Kendaraan"
                    data={dbChartData?.stnk || []} // Ambil dari DB
                    colors={cBlue}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.totalStnk || 0,
                    }}
                    detailLink="/inventori/stnk"
                />
                <DonutCard
                    title="STATUS KIR"
                    subtitle="Kelaikan Kendaraan"
                    data={dbChartData?.kir || chartData.kir}
                    colors={cBlue}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.totalKir || 0,
                    }}
                    detailLink="/inventori/kir"
                />
                <DonutCard
                    title="DOKUMEN INVOICE"
                    subtitle="Progress Pemberkasan"
                    data={
                        dbChartData?.invoice?.length
                            ? dbChartData.invoice
                            : chartData.docInv
                    }
                    colors={cDoc}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.invoice?.length
                            ? dbChartData.totalInvoice
                            : fallbackInvoiceTotal,
                    }}
                    detailLink="/finance/dokumen-invoice"
                />

                <DonutCard
                    title="AKTIFITAS PRIMARY"
                    subtitle="Distribusi Bulanan"
                    data={dbChartData?.activityPrimary?.length ? dbChartData.activityPrimary : chartData.aktifitasPrimary}
                    colors={cActivity}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.activityPrimary?.length
                            ? dbChartData.totalActivityPrimary
                            : totalOf(chartData.aktifitasPrimary),
                    }}
                    detailLink="/profit-unit/primary"
                />
                <DonutCard
                    title="AKTIFITAS SECONDARY"
                    subtitle="Distribusi Bulanan"
                    data={dbChartData?.activitySecondary?.length ? dbChartData.activitySecondary : chartData.aktifitasSecondary}
                    colors={cOrange}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.activitySecondary?.length
                            ? dbChartData.totalActivitySecondary
                            : totalOf(chartData.aktifitasSecondary),
                    }}
                    detailLink="/profit-unit/secondary"
                />
                <DonutCard
                    title="FAT DOC PRIMARY"
                    subtitle="Finance & Tax"
                    data={dbChartData?.fatDocPrimary?.length ? dbChartData.fatDocPrimary : chartData.fatDocPrimary}
                    colors={cFinance}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.fatDocPrimary?.length
                            ? dbChartData.totalFatDocPrimary
                            : totalOf(chartData.fatDocPrimary),
                    }}
                    detailLink="/finance/dokumen-invoice"
                />
                <DonutCard
                    title="FAT DOC SECONDARY"
                    subtitle="Finance & Tax"
                    data={dbChartData?.fatDocSecondary?.length ? dbChartData.fatDocSecondary : chartData.fatDocSecondary}
                    colors={cFinance}
                    centerText={{
                        label: "Total",
                        value: dbChartData?.fatDocSecondary?.length
                            ? dbChartData.totalFatDocSecondary
                            : totalOf(chartData.fatDocSecondary),
                    }}
                    detailLink="/finance/dokumen-invoice"
                />
            </div>
        </AdminLayout>
    );
}
