import React, { memo, useEffect, useMemo, useState } from "react";
import AdminLayout from "../Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { Activity, AlertTriangle, ArrowRight, BarChart3, Briefcase, CheckSquare, Database, DollarSign, Gauge, History, Map, RefreshCw, ShieldAlert, Truck, Users, Wrench } from "lucide-react";

const formatNum = (value) => Number(value || 0).toLocaleString("id-ID");
const formatRp = (value) => {
    const nominal = Number(value || 0);
    const abs = Math.abs(nominal);
    if (abs >= 1_000_000_000) return `Rp${(nominal / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
    if (abs >= 1_000_000) return `Rp${(nominal / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
    return `Rp${nominal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
};
const pct = (value, total) => total > 0 ? Math.round(value / total * 100) : 0;
const statusTone = (severity) => ({ kritis: "bg-rose-50 text-rose-700", prioritas: "bg-orange-50 text-orange-700", dipantau: "bg-amber-50 text-amber-700", sehat: "bg-emerald-50 text-emerald-700", info: "bg-blue-50 text-blue-700" }[severity] || "bg-slate-100 text-slate-700");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const typeLabel = { primary: "Primary", secondary: "Secondary" };

const ShellCard = ({ children, className = "" }) => <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 ${className}`}>{children}</section>;

const MiniMetricBar = memo(function MiniMetricBar({ label, value, total, color = "#2563eb", helper }) {
    const percent = total > 0 ? Math.min(100, Math.max(0, value / total * 100)) : 0;
    return <div className="rounded-xl border border-slate-100 bg-white p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-950">{helper || formatNum(value)}</p></div><span className="shrink-0 text-xs font-black text-slate-500">{percent.toFixed(0)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} /></div></div>;
});

const StackedBar = memo(function StackedBar({ items = [], total, ariaLabel }) {
    const safeTotal = total || items.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return <div className="space-y-2"><div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={ariaLabel}>{items.map((item) => { const width = safeTotal > 0 ? Number(item.value || 0) / safeTotal * 100 : 0; return width > 0 ? <span key={item.label} className="h-full" style={{ width: `${width}%`, backgroundColor: item.color }} /> : null; })}</div><div className="flex flex-wrap gap-x-3 gap-y-1">{items.map((item) => <span key={item.label} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color }} />{item.label} {formatNum(item.value)}</span>)}</div></div>;
});

const MiniRadial = memo(function MiniRadial({ value, label, color = "#10b981", href }) {
    const score = Math.min(100, Math.max(0, Number(value || 0)));
    const content = <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/40"><div className="relative h-14 w-14 shrink-0"><svg viewBox="0 0 44 44" className="h-full w-full -rotate-90"><circle cx="22" cy="22" r="17" fill="none" stroke="#e5e7eb" strokeWidth="6" /><circle cx="22" cy="22" r="17" fill="none" stroke={color} strokeLinecap="round" strokeWidth="6" style={{ strokeDasharray: 106.8, strokeDashoffset: 106.8 * (1 - score / 100) }} /></svg><span className="absolute inset-0 grid place-items-center text-[11px] font-black text-slate-900">{score}%</span></div><div className="min-w-0"><p className="text-sm font-black text-slate-900">{label}</p><p className="mt-0.5 text-xs font-semibold text-slate-500">Komposisi data tersedia</p></div></div>;
    return href ? <Link href={href} className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">{content}</Link> : content;
});

const KpiCard = memo(function KpiCard({ icon: Icon, label, value, helper, tone = "info", href }) {
    const content = <ShellCard className="h-full min-w-0 p-4 transition hover:border-blue-200 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 truncate text-xl font-black tabular-nums text-slate-950 sm:text-2xl">{value}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{helper}</p></div><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${statusTone(tone)}`}><Icon size={17} /></span></div></ShellCard>;
    return href ? <Link href={href} className="block h-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500">{content}</Link> : content;
});

const ModuleCard = memo(function ModuleCard({ icon: Icon, title, metric, helper, href, tone = "info" }) {
    return <Link href={href} className="group block rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"><ShellCard className="h-full min-w-0 p-4 transition group-hover:-translate-y-0.5 group-hover:border-blue-200 group-hover:shadow-md"><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${statusTone(tone)}`}><Icon size={17} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="font-black text-slate-900">{title}</h3><ArrowRight className="mt-0.5 shrink-0 text-slate-300 transition group-hover:text-blue-600" size={14} /></div><p className="mt-2 text-sm font-black tabular-nums text-slate-950">{metric}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{helper}</p></div></div></ShellCard></Link>;
});

const PriorityItem = memo(function PriorityItem({ label, value, detail, severity, href, max = 1 }) {
    const numeric = Number(String(value).replace(/\D/g, "")) || 0;
    const width = Math.min(100, max > 0 ? numeric / max * 100 : numeric > 0 ? 100 : 0);
    return <Link href={href} className="block rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-black text-slate-800">{label}</p><p className="mt-0.5 text-xs font-semibold text-slate-500">{detail}</p></div><span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${statusTone(severity)}`}>{value}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${severity === "kritis" ? "bg-rose-500" : severity === "prioritas" ? "bg-orange-500" : severity === "dipantau" ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${width}%` }} /></div></Link>;
});

const ActivityChart = memo(function ActivityChart({ activeType, dataByYear = [], years = [], selectedYear, setSelectedYear, baseRoute }) {
    useEffect(() => {
        if (!years.length) return;
        if (!years.includes(selectedYear)) setSelectedYear(years[0]);
    }, [activeType, years, selectedYear, setSelectedYear]);

    const activeYear = years.includes(selectedYear) ? selectedYear : years[0];
    const yearData = dataByYear.find((item) => item.tahun === activeYear);
    const chartData = yearData?.months?.map((m) => ({ name: MONTHS[m.bulan - 1] || m.bulan, value: Number(m.value || 0) })) || [];
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    const maxVal = Math.max(...chartData.map((item) => item.value), 1);
    const hasData = total > 0;

    return <div><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{typeLabel[activeType]} · <span className="font-black text-slate-900">{formatNum(total)}</span> pengiriman</p><p className="mt-0.5 text-[11px] font-semibold text-slate-400">Data tahun {activeYear || "-"}</p></div><select value={activeYear || ""} onChange={(event) => setSelectedYear(Number(event.target.value))} className="h-8 rounded-lg border-slate-200 bg-white px-3 text-xs font-black text-slate-600 focus:border-blue-500 focus:ring-blue-500">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></div>{!hasData ? <div className="grid h-44 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center"><div><p className="text-sm font-black text-slate-700">Belum ada shipment {typeLabel[activeType]}</p><p className="mt-1 text-xs font-semibold text-slate-500">Pilih tahun lain atau cek modul Profit Unit.</p></div></div> : <div className="flex h-44 min-w-0 items-end gap-1 border-b border-slate-200 pb-1 sm:h-48">{chartData.map((item, index) => { const height = item.value > 0 ? Math.max(item.value / maxVal * 100, 5) : 2; return <button key={item.name} type="button" onClick={() => router.visit(`${baseRoute}?bulan=${index + 1}&tahun=${activeYear}`)} title={`${item.name}: ${formatNum(item.value)} pengiriman`} className="group flex min-w-0 flex-1 flex-col justify-end gap-1 rounded-t px-0.5 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"><span className="relative flex min-h-0 flex-1 items-end"><span className="w-full rounded-t-sm bg-blue-600 transition group-hover:bg-blue-700" style={{ height: `${height}%` }} /><span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:block group-focus:block">{formatNum(item.value)}</span></span><span className="text-[9px] font-bold text-slate-500 min-[390px]:text-[10px]">{item.name}</span></button>; })}</div>}</div>;
});

export default function Dashboard({ dbChartData }) {
    const { pajak = [], stnk = [], kir = [], invoiceProgress = [], primaryActivityByYear = [], primaryActivityYears = [], secondaryActivityByYear = [], secondaryActivityYears = [], totalActivityPrimary = 0, totalActivitySecondary = 0, totalInvoice = 0, globalProfit = {}, fatPrimaryStatus = {}, fatSecondaryStatus = {}, needApprovalCount = null } = dbChartData || {};
    const [shipmentTab, setShipmentTab] = useState("primary");
    const primaryDefaultYear = primaryActivityYears[0] || new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(primaryDefaultYear);
    const shipmentData = shipmentTab === "primary" ? primaryActivityByYear : secondaryActivityByYear;
    const shipmentYears = shipmentTab === "primary" ? primaryActivityYears : secondaryActivityYears;
    const shipmentTotal = shipmentData.find((item) => item.tahun === (shipmentYears.includes(selectedYear) ? selectedYear : shipmentYears[0]))?.months?.reduce((sum, item) => sum + Number(item.value || 0), 0) || 0;
    const totalUnit = Number(dbChartData?.totalPajak || 0);
    const activeDocs = [pajak, stnk, kir].reduce((sum, items) => sum + Number(items.find((item) => item.name === "AKTIF")?.value || 0), 0);
    const expiredDocs = [pajak, stnk, kir].reduce((sum, items) => sum + Number(items.find((item) => item.name === "EXPIRED")?.value || 0), 0);
    const almostExpiredDocs = [pajak, stnk, kir].reduce((sum, items) => sum + Number(items.find((item) => item.name === "HAMPIR EXPIRED")?.value || 0), 0);
    const totalDocChecks = totalUnit * 3;
    const healthScore = pct(activeDocs, totalDocChecks);
    const unpaid = Number(invoiceProgress.find((item) => item.key === "UNPAID")?.value || 0);
    const partialPaid = Number(invoiceProgress.find((item) => item.key === "PARTIAL PAID")?.value || 0);
    const paid = Number(invoiceProgress.find((item) => item.key === "PAID")?.value || 0);
    const fatPrimaryRisk = Number(fatPrimaryStatus?.data?.find((item) => item.name === "BELUM NAIK")?.value || 0);
    const fatSecondaryRisk = Number(fatSecondaryStatus?.data?.find((item) => item.name === "BELUM NAIK")?.value || 0);
    const revenue = Number(globalProfit.revenue || 0);
    const cost = Number(globalProfit.cost || 0);
    const profit = Number(globalProfit.profit || 0);
    const margin = Number(globalProfit.margin || 0);
    const financialTotal = Math.max(revenue, cost, Math.abs(profit), 1);
    const priorityMax = Math.max(expiredDocs, unpaid + partialPaid, Number(needApprovalCount || 0), fatPrimaryRisk + fatSecondaryRisk, 1);
    const documentStatus = [
        { label: "Aktif", value: activeDocs, color: "#10b981" },
        { label: "Hampir", value: almostExpiredDocs, color: "#f59e0b" },
        { label: "Expired", value: expiredDocs, color: "#ef4444" },
    ];
    const invoiceStatus = [
        { label: "Paid", value: paid, color: "#10b981" },
        { label: "Unpaid", value: unpaid, color: "#ef4444" },
        { label: "Partial", value: partialPaid, color: "#f59e0b" },
    ];
    const priorities = [
        { label: "Dokumen expired", value: formatNum(expiredDocs), detail: "Perlu tindakan legalitas", severity: "kritis", href: "/business-control/health#due-soon", max: priorityMax },
        { label: "Invoice unpaid/parsial", value: formatNum(unpaid + partialPaid), detail: "Perlu follow-up pembayaran", severity: "prioritas", href: "/finance/dokumen-invoice?status=UNPAID", max: priorityMax },
        { label: "Need Approval", value: needApprovalCount === null ? "-" : formatNum(needApprovalCount), detail: "Menunggu keputusan", severity: "dipantau", href: "/need-approval", max: priorityMax },
        { label: "FAT belum naik", value: formatNum(fatPrimaryRisk + fatSecondaryRisk), detail: "Dokumen operasional perlu dicek", severity: "dipantau", href: "/business-control/health#anomalies", max: priorityMax },
    ].filter((item) => item.value !== "0");
    const modules = [
        { title: "Business Performance", metric: formatRp(profit), helper: `Margin ${margin.toFixed(1)}%`, href: "/business-control/performance", icon: BarChart3, tone: "sehat" },
        { title: "Data Health", metric: `${healthScore}/100`, helper: `${formatNum(expiredDocs)} expired`, href: "/business-control/health", icon: Gauge, tone: healthScore >= 85 ? "sehat" : "dipantau" },
        { title: "Biaya", metric: "Lihat modul", helper: "Ringkasan biaya belum tersedia", href: "/biaya", icon: DollarSign, tone: "info" },
        { title: "Profit Unit", metric: `${formatNum(totalActivityPrimary + totalActivitySecondary)} trip`, helper: "Primary + Secondary", href: "/profit-unit", icon: Briefcase, tone: "sehat" },
        { title: "Daftar Unit", metric: formatNum(totalUnit), helper: "Unit terdaftar", href: "/inventori/daftar-unit", icon: Truck, tone: "info" },
        { title: "Daftar Asset", metric: "Lihat modul", helper: "Summary asset belum tersedia", href: "/inventori/daftar-asset", icon: Database, tone: "info" },
        { title: "On The Road", metric: formatNum(totalActivityPrimary + totalActivitySecondary), helper: "Pergerakan tercatat", href: "/on-the-road", icon: Map, tone: "info" },
        { title: "Need Approval", metric: needApprovalCount === null ? "-" : formatNum(needApprovalCount), helper: "Outstanding approval", href: "/need-approval", icon: CheckSquare, tone: "prioritas" },
        { title: "Daftar Karyawan", metric: "Lihat modul", helper: "Summary karyawan belum tersedia", href: "/daftar-karyawan", icon: Users, tone: "info" },
        { title: "Service Unit", metric: "Lihat modul", helper: "Overdue belum tersedia", href: "/riwayat-service-unit", icon: Wrench, tone: "dipantau" },
        { title: "Activity Log", metric: "Lihat log", helper: "Aktivitas sistem", href: "/system/activity-log", icon: History, tone: "info" },
    ];

    return <AdminLayout><Head title="Dashboard" /><div className="space-y-5 font-[Manrope]">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700"><Activity size={13} /> Washeng GO Command Center</span><h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Dashboard</h1><p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Ringkasan operasional, profit, data health, dan aktivitas Washeng GO.</p></div><button type="button" onClick={() => router.reload()} className="inline-flex h-9 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-black text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"><RefreshCw size={14} /> Refresh</button></header>
        <section className="grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"><KpiCard icon={Truck} label="Total Unit" value={formatNum(totalUnit)} helper="Armada terdaftar" href="/inventori/daftar-unit" /><KpiCard icon={CheckSquare} label="Need Approval" value={needApprovalCount === null ? "-" : formatNum(needApprovalCount)} helper="Pending decision" href="/need-approval" tone="prioritas" /><KpiCard icon={DollarSign} label="Revenue" value={formatRp(revenue)} helper="Global performance" href="/business-control/performance" tone="sehat" /><KpiCard icon={BarChart3} label="Profit" value={formatRp(profit)} helper={`Margin ${margin.toFixed(1)}%`} href="/business-control/performance" tone="sehat" /><KpiCard icon={Gauge} label="Data Health" value={`${healthScore}/100`} helper={`${formatNum(activeDocs)} dokumen aktif`} href="/business-control/health" tone={healthScore >= 85 ? "sehat" : "dipantau"} /><KpiCard icon={AlertTriangle} label="Expired" value={formatNum(expiredDocs)} helper="Perlu tindakan" href="/business-control/health#due-soon" tone="kritis" /></section>
        <section className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"><ShellCard className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-slate-950">Prioritas Hari Ini</h2><p className="mt-1 text-xs font-semibold text-slate-500">Yang perlu dikejar lebih dulu.</p></div><ShieldAlert className="shrink-0 text-orange-500" size={20} /></div><div className="mt-4 space-y-2">{priorities.length ? priorities.map((item) => <PriorityItem key={item.label} {...item} />) : <p className="rounded-xl border border-slate-100 py-8 text-center text-sm font-semibold text-slate-400">Tidak ada prioritas dari data tersedia.</p>}</div></ShellCard><ShellCard className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-slate-950">Financial Pulse</h2><p className="mt-1 text-xs font-semibold text-slate-500">Snapshot, bukan analisis detail.</p></div><Link href="/business-control/performance" className="inline-flex items-center gap-1 text-xs font-black text-blue-700">Detail <ArrowRight size={13} /></Link></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><MiniMetricBar label="Revenue" value={revenue} total={financialTotal} color="#2563eb" helper={formatRp(revenue)} /><MiniMetricBar label="Cost" value={cost} total={financialTotal} color="#f59e0b" helper={formatRp(cost)} /><MiniMetricBar label="Profit" value={Math.max(profit, 0)} total={financialTotal} color="#10b981" helper={formatRp(profit)} /><MiniMetricBar label="Margin" value={Math.max(margin, 0)} total={100} color="#0f766e" helper={`${margin.toFixed(1)}%`} /></div></ShellCard></section>
        <ShellCard className="p-5"><div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-black text-slate-950">Module Overview</h2><p className="mt-1 text-xs font-semibold text-slate-500">Shortcut semua modul utama.</p></div><span className="text-xs font-black text-slate-400">{modules.length} modul</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">{modules.map((module) => <ModuleCard key={module.title} {...module} />)}</div></ShellCard>
        <section className="grid gap-5 xl:grid-cols-2"><ShellCard className="p-5"><h2 className="font-black text-slate-950">Operational Pulse</h2><p className="mt-1 text-xs font-semibold text-slate-500">Ringkasan aktivitas berjalan.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><MiniMetricBar label="Primary Shipment" value={totalActivityPrimary} total={Math.max(totalActivityPrimary + totalActivitySecondary, 1)} color="#2563eb" helper={formatNum(totalActivityPrimary)} /><MiniMetricBar label="Secondary Shipment" value={totalActivitySecondary} total={Math.max(totalActivityPrimary + totalActivitySecondary, 1)} color="#7c3aed" helper={formatNum(totalActivitySecondary)} /><MiniMetricBar label="On The Road" value={shipmentTotal} total={Math.max(totalActivityPrimary + totalActivitySecondary, 1)} color="#0f766e" helper={`${formatNum(shipmentTotal)} active filter`} /><MiniMetricBar label="Service Unit" value={0} total={1} color="#f59e0b" helper="Belum tersedia" /></div></ShellCard><ShellCard className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-slate-950">Data Health Snapshot</h2><p className="mt-1 text-xs font-semibold text-slate-500">Ringkas. Detail penuh di Data Health.</p></div><Link href="/business-control/health" className="inline-flex items-center gap-1 text-xs font-black text-blue-700">Detail <ArrowRight size={13} /></Link></div><div className="mt-4 grid gap-3 md:grid-cols-[0.8fr_1.2fr]"><MiniRadial value={healthScore} label="Health Score" color={healthScore >= 85 ? "#10b981" : healthScore >= 70 ? "#f59e0b" : "#ef4444"} href="/business-control/health" /><div className="space-y-3"><StackedBar items={documentStatus} total={totalDocChecks} ariaLabel="Komposisi status dokumen" /><StackedBar items={invoiceStatus} total={totalInvoice} ariaLabel="Komposisi status invoice" /></div></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><Link href="/finance/dokumen-invoice?status=PAID" className="rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Paid {formatNum(paid)}</Link><Link href="/finance/dokumen-invoice?status=UNPAID" className="rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Unpaid {formatNum(unpaid)}</Link><Link href="/finance/dokumen-invoice?status=PARTIAL%20PAID" className="rounded-lg border border-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Partial {formatNum(partialPaid)}</Link></div></ShellCard></section>
        <ShellCard className="p-5"><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-black text-slate-950">Shipment Movement</h2><p className="mt-1 text-xs font-semibold text-slate-500">Tab, tahun, total, dan chart tersinkron.</p></div><div className="flex flex-wrap items-center gap-3"><div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">Aktif: {typeLabel[shipmentTab]} · {formatNum(shipmentTotal)}</div><div className="flex rounded-lg bg-slate-100 p-1"><button type="button" onClick={() => setShipmentTab("primary")} className={`rounded-md px-3 py-1.5 text-[11px] font-black ${shipmentTab === "primary" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Primary</button><button type="button" onClick={() => setShipmentTab("secondary")} className={`rounded-md px-3 py-1.5 text-[11px] font-black ${shipmentTab === "secondary" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>Secondary</button></div></div></div><div className="grid gap-5 pt-4 xl:grid-cols-[minmax(0,1fr)_260px]"><ActivityChart activeType={shipmentTab} dataByYear={shipmentData} years={shipmentYears} selectedYear={selectedYear} setSelectedYear={setSelectedYear} baseRoute={shipmentTab === "primary" ? "/profit-unit/primary/table" : "/profit-unit/secondary/table"} /><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1"><MiniMetricBar label="Primary Total" value={totalActivityPrimary} total={Math.max(totalActivityPrimary + totalActivitySecondary, 1)} color="#2563eb" helper={formatNum(totalActivityPrimary)} /><MiniMetricBar label="Secondary Total" value={totalActivitySecondary} total={Math.max(totalActivityPrimary + totalActivitySecondary, 1)} color="#7c3aed" helper={formatNum(totalActivitySecondary)} /><MiniMetricBar label="Selected Year" value={shipmentTotal} total={Math.max(totalActivityPrimary + totalActivitySecondary, 1)} color="#0f766e" helper={formatNum(shipmentTotal)} /></div></div></ShellCard>
    </div></AdminLayout>;
}
