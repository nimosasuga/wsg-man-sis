import React, { memo, useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ChevronRight, Filter, Lightbulb, RotateCcw, TrendingUp } from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

const MONTHS = [
    ["01", "Januari"], ["02", "Februari"], ["03", "Maret"], ["04", "April"],
    ["05", "Mei"], ["06", "Juni"], ["07", "Juli"], ["08", "Agustus"],
    ["09", "September"], ["10", "Oktober"], ["11", "November"], ["12", "Desember"],
];

const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
})}`;
const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const isAll = (value) => !value || value === "ALL";
const dateParts = (value) => {
    const text = String(value || "").trim();
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return { year: match[1], month: match[2] };
    match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    return match ? { year: match[3], month: match[1].padStart(2, "0") } : { year: "", month: "" };
};
const formatDate = (value) => {
    const text = String(value || "").trim();
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    return match ? `${match[2].padStart(2, "0")}/${match[1].padStart(2, "0")}/${match[3]}` : text || "-";
};

function SearchableSelect({ label, value, options, onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const visibleOptions = options.filter((option) => (option === "ALL" ? "Semua" : option)
        .toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <div className="relative">
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
            <button type="button" onClick={() => { setOpen((current) => !current); setSearch(""); }} className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-700 transition hover:border-cyan-300">
                <span className="truncate">{value === "ALL" ? "Semua" : value}</span>
                <ChevronRight size={15} className={`shrink-0 transition ${open ? "rotate-90 text-cyan-600" : "text-slate-400"}`} />
            </button>
            {open && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 p-2">
                        <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Cari ${label.toLowerCase()}...`} className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-cyan-400" />
                    </div>
                    <div className="custom-scrollbar max-h-64 overflow-auto p-1">
                        {visibleOptions.length ? visibleOptions.map((option) => (
                            <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${option === value ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"}`}>
                                {option === "ALL" ? "Semua" : option}
                            </button>
                        )) : <p className="px-3 py-4 text-center text-sm font-semibold text-slate-400">Tidak ditemukan.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterPanel({ filters, options, onChange, onReset, shortName = "Primary", fields }) {
    const filterFields = fields || [['TAHUN','Tahun'],['BULAN','Bulan'],['AREA','Area'],['TIPE','Tipe Unit'],['NOPOL','Nopol']];

    return (
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Filter size={17} /></div>
                    <div><h2 className="text-sm font-black uppercase text-slate-950">Saring Data Profit {shortName}</h2><p className="text-xs font-semibold text-slate-500">Pilihan langsung diterapkan tanpa memuat ulang halaman.</p></div>
                </div>
                <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-600 hover:bg-slate-50"><RotateCcw size={14} /> Reset</button>
            </div>
            <div className={`grid gap-3 md:grid-cols-2 ${filterFields.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
                {filterFields.map(([key, label]) => (
                    <SearchableSelect key={key} label={label} value={filters[key]} options={options[key]} onChange={(value) => onChange({ ...filters, [key]: value })} />
                ))}
            </div>
        </section>
    );
}

const FlowChart = memo(function FlowChart({ data, year, month, shortName = "Primary", title, description }) {
    const width = Math.max(data.length * 90, 680);
    const height = 270;
    const pad = { top: 24, right: 28, bottom: 44, left: 76 };
    const max = Math.max(...data.flatMap((row) => [row.revenue, row.cost, row.profit]), 1);
    const x = (index) => data.length <= 1 ? width / 2 : pad.left + index * (width - pad.left - pad.right) / (data.length - 1);
    const y = (value) => pad.top + (max - Number(value || 0)) / max * (height - pad.top - pad.bottom);
    const series = [["revenue", "Pendapatan", "#2563eb"], ["cost", "Biaya", "#f97316"], ["profit", "Profit", "#059669"]];
    const helper = !isAll(year) ? (!isAll(month) ? `Data ${MONTHS.find(([key]) => key === month)?.[1] || month} ${year}.` : `Pergerakan bulanan selama ${year}.`) : `Tampilan semua tahun untuk membaca arah pertumbuhan profit ${shortName}.`;

    return (
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase text-slate-950">{title || `Statistik Profit ${shortName}`}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{description || helper}</p>
            {data.length ? <>
                <div className="my-4 flex flex-wrap gap-3">{series.map(([key,label,color]) => <span key={key} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600"><i className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:color}} />{label}</span>)}</div>
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="min-w-full">
                        {[0,.25,.5,.75,1].map((step) => { const lineY = pad.top + step * (height-pad.top-pad.bottom); return <g key={step}><line x1={pad.left} x2={width-pad.right} y1={lineY} y2={lineY} stroke="#e2e8f0"/><text x={pad.left-10} y={lineY+4} textAnchor="end" className="fill-slate-400 text-[10px] font-bold">{Number(max*(1-step)).toLocaleString("id-ID",{notation:"compact"})}</text></g>; })}
                        {series.map(([key,label,color]) => <g key={key}><polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={data.map((row,index)=>`${x(index)},${y(row[key])}`).join(" ")} />{data.map((row,index)=><circle key={`${key}-${row.key}`} cx={x(index)} cy={y(row[key])} r="4" fill={color}><title>{`${label} ${row.label}: ${formatRp(row[key])}`}</title></circle>)}</g>)}
                        {data.map((row,index)=><text key={row.key} x={x(index)} y={height-14} textAnchor="middle" className="fill-slate-500 text-[11px] font-black">{row.label}</text>)}
                    </svg>
                </div>
            </> : <p className="mt-4 rounded-lg bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">Belum ada data {shortName} untuk filter ini.</p>}
        </section>
    );
});

export function ProfitFlowPage({ rows = [], config = {} }) {
    const page = {
        name: config.name || "Profit Primary",
        shortName: config.shortName || "Primary",
        detailBase: config.detailBase || "/profit-unit/primary/table",
        numberLabel: config.numberLabel || "Nopol",
        routeLabel: config.routeLabel || "Rute",
        filterFields: config.filterFields,
        revenueLabel: config.revenueLabel || "Pendapatan",
        costLabel: config.costLabel || "Biaya",
        profitLabel: config.profitLabel || `Total Profit ${config.shortName || "Primary"}`,
        showWeeklyFlow: Boolean(config.showWeeklyFlow),
    };
    const defaults = { TAHUN: "ALL", BULAN: "ALL", AREA: "ALL", TIPE: "ALL", NOPOL: "ALL" };
    const [filters, setFilters] = useState(defaults);
    const [tablePage, setTablePage] = useState(1);
    const pageSize = 25;
    const options = useMemo(() => {
        const unique = (key) => ["ALL", ...new Set(rows.map((row) => String(row[key] || "")).filter(Boolean).sort())];
        const years = [...new Set(rows.map((row) => dateParts(row.tanggal).year).filter(Boolean))].sort().reverse();
        const months = MONTHS.filter(([key]) => rows.some((row) => dateParts(row.tanggal).month === key)).map(([key,name]) => [key,name]);
        return { TAHUN:["ALL",...years], BULAN:["ALL",...months.map(([key,name])=>`${key} ${name}`)], AREA:unique("area"), TIPE:unique("tipe"), NOPOL:unique("nopol") };
    }, [rows]);
    const activeMonth = filters.BULAN === "ALL" ? "ALL" : filters.BULAN.slice(0,2);
    const filteredRows = useMemo(() => rows.filter((row) => {
        const date = dateParts(row.tanggal);
        return (isAll(filters.TAHUN) || date.year === filters.TAHUN)
            && (isAll(filters.BULAN) || date.month === activeMonth)
            && (isAll(filters.AREA) || row.area === filters.AREA)
            && (isAll(filters.TIPE) || row.tipe === filters.TIPE)
            && (isAll(filters.NOPOL) || row.nopol === filters.NOPOL);
    }), [rows, filters, activeMonth]);
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(tablePage, totalPages);
    const paginatedRows = useMemo(
        () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [filteredRows, currentPage],
    );
    const visiblePages = useMemo(
        () => [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
            .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
            .sort((a, b) => a - b),
        [currentPage, totalPages],
    );
    const changeFilters = (nextFilters) => {
        setFilters(nextFilters);
        setTablePage(1);
    };
    const resetFilters = () => {
        setFilters(defaults);
        setTablePage(1);
    };
    const summary = useMemo(() => filteredRows.reduce((total,row) => ({ revenue:total.revenue+Number(row.revenue||0), cost:total.cost+Number(row.cost||0), profit:total.profit+Number(row.profit||0) }), {revenue:0,cost:0,profit:0}), [filteredRows]);
    const chartData = useMemo(() => {
        const monthly = !isAll(filters.TAHUN);
        const keys = monthly ? (isAll(activeMonth) ? MONTHS.map(([key])=>key) : [activeMonth]) : [...new Set(filteredRows.map((row)=>dateParts(row.tanggal).year).filter(Boolean))].sort();
        return keys.map((key) => {
            const matching = filteredRows.filter((row) => (monthly ? dateParts(row.tanggal).month : dateParts(row.tanggal).year) === key);
            return matching.reduce((item,row)=>({ ...item, revenue:item.revenue+Number(row.revenue||0), cost:item.cost+Number(row.cost||0), profit:item.profit+Number(row.profit||0) }), { key, label:monthly ? MONTHS.find(([month])=>month===key)?.[1].slice(0,3) : key, revenue:0,cost:0,profit:0 });
        });
    }, [filteredRows, filters.TAHUN, activeMonth]);
    const weeklyChartData = useMemo(() => {
        if (isAll(activeMonth)) return [];

        const grouped = filteredRows.reduce((weeks, row) => {
            const weekNumber = Number(String(row.week || "").replace(/[^0-9]/g, ""));
            if (!weekNumber) return weeks;
            const key = String(weekNumber);
            if (!weeks[key]) {
                weeks[key] = { key, label: `W${weekNumber}`, revenue: 0, cost: 0, profit: 0 };
            }
            weeks[key].revenue += Number(row.revenue || 0);
            weeks[key].cost += Number(row.cost || 0);
            weeks[key].profit += Number(row.profit || 0);
            return weeks;
        }, {});

        return Object.values(grouped).sort((a, b) => Number(a.key) - Number(b.key));
    }, [filteredRows, activeMonth]);
    const margin = summary.revenue > 0 ? summary.profit / summary.revenue * 100 : 0;

    return <AdminLayout><Head title={page.name} />
        <div className="mb-4 flex items-center text-xs font-bold uppercase tracking-widest text-slate-500"><Link href="/profit-unit">Profit Unit</Link><ChevronRight size={14} className="mx-1"/><span className="text-slate-900">{page.name}</span></div>
        <section className="mb-5 rounded-xl bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase text-cyan-200">{page.profitLabel}</p><h1 className="mt-2 text-2xl font-black">{formatRp(summary.profit)}</h1>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[page.revenueLabel,formatRp(summary.revenue)],[page.costLabel,formatRp(summary.cost)],["Margin",`${margin.toFixed(1)}%`],["Record",formatNumber(filteredRows.length)]].map(([label,value])=><div key={label} className="rounded-lg border border-white/10 bg-white/10 p-3"><p className="text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>)}</div>
        </section>
        <section className="mb-5 rounded-xl border border-cyan-100 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Lightbulb size={19}/></div><div><p className="text-xs font-black uppercase text-cyan-700">Catatan kerja</p><h2 className="mt-1 text-lg font-black text-slate-950">Baca profit sebelum mengejar volume</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{filteredRows.length ? `Dari ${formatNumber(filteredRows.length)} transaksi yang tampil, margin ${page.shortName} berada di ${margin.toFixed(1)}%. Cek row dengan biaya besar dan profit tipis sebelum menambah pekerjaan pada jalur yang sama.` : `Belum ada transaksi yang cocok. Longgarkan filter untuk melihat data ${page.shortName} yang tersedia.`}</p></div></div></section>
        <FilterPanel filters={filters} options={options} onChange={changeFilters} onReset={resetFilters} shortName={page.shortName} fields={page.filterFields} />
        <FlowChart data={chartData} year={filters.TAHUN} month={activeMonth} shortName={page.shortName} />
        {page.showWeeklyFlow && !isAll(activeMonth) && (
            <FlowChart
                data={weeklyChartData}
                year={filters.TAHUN}
                month={activeMonth}
                shortName={page.shortName}
                title="Statistik Flow Per Minggu"
                description={`Pergerakan pendapatan, biaya, dan profit ${page.shortName} pada bulan yang dipilih, disusun berdasarkan week transaksi.`}
            />
        )}
        <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-4 py-4"><h2 className="text-sm font-black uppercase text-slate-950">Data Profit {page.shortName}</h2><p className="mt-1 text-xs font-semibold text-slate-500">Klik row untuk membuka rincian transaksi {page.shortName}.</p></div><div className="custom-scrollbar max-h-[560px] overflow-auto"><table className="w-full min-w-[1050px] border-collapse text-left"><thead className="sticky top-0 z-10 bg-slate-50"><tr>{["Tanggal","Area",page.numberLabel,"Tipe",page.routeLabel,page.revenueLabel,page.costLabel,"Profit"].map((head)=><th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase text-slate-500">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{paginatedRows.map((row,index)=><tr key={`${row.id_key}-${index}`} role="link" tabIndex={0} onClick={()=>router.visit(`${page.detailBase}/${encodeURIComponent(row.id_key)}`)} onKeyDown={(event)=>{if(!["Enter"," "].includes(event.key))return;event.preventDefault();router.visit(`${page.detailBase}/${encodeURIComponent(row.id_key)}`);}} className="cursor-pointer hover:bg-cyan-50/50 focus:bg-cyan-50 focus:outline-none"><td className="px-4 py-3 text-xs font-bold text-slate-700">{formatDate(row.tanggal)}</td><td className="px-4 py-3 text-xs font-bold text-slate-700">{row.area}</td><td className="px-4 py-3 text-xs font-black text-slate-950">{row.nopol}</td><td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tipe}</td><td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.rute}</td><td className="px-4 py-3 text-xs font-black text-blue-700">{formatRp(row.revenue)}</td><td className="px-4 py-3 text-xs font-black text-amber-700">{formatRp(row.cost)}</td><td className="px-4 py-3 text-xs font-black text-emerald-700">{formatRp(row.profit)}</td></tr>)}{!filteredRows.length&&<tr><td colSpan="8" className="px-4 py-8 text-center text-sm font-semibold text-slate-500">Belum ada data {page.shortName} untuk pilihan ini.</td></tr>}</tbody></table></div>{filteredRows.length > 0 && <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-bold text-slate-500">Menampilkan {formatNumber((currentPage - 1) * pageSize + 1)}-{formatNumber(Math.min(currentPage * pageSize, filteredRows.length))} dari {formatNumber(filteredRows.length)} data</p><div className="flex flex-wrap items-center gap-1"><button type="button" disabled={currentPage === 1} onClick={()=>setTablePage(currentPage - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Sebelumnya</button>{visiblePages.map((pageNumber,index)=><React.Fragment key={pageNumber}>{index > 0 && pageNumber - visiblePages[index - 1] > 1 && <span className="px-1 text-slate-400">...</span>}<button type="button" onClick={()=>setTablePage(pageNumber)} className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-black ${pageNumber === currentPage ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{pageNumber}</button></React.Fragment>)}<button type="button" disabled={currentPage === totalPages} onClick={()=>setTablePage(currentPage + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Berikutnya</button></div></div>}</section>
    </AdminLayout>;
}

export default function Primary(props) {
    return <ProfitFlowPage {...props} config={{ ...(props.config || {}), showWeeklyFlow: true }} />;
}
