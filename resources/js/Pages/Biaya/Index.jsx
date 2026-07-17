import React, { memo, useMemo, useState } from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, router } from "@inertiajs/react";
import { AlertTriangle, ChevronRight, Filter, Lightbulb, RotateCcw, TrendingUp } from "lucide-react";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const MONTHS = [
    "A Januari",
    "B Februari",
    "C Maret",
    "D April",
    "E Mei",
    "F Juni",
    "G Juli",
    "H Agustus",
    "I September",
    "J Oktober",
    "K November",
    "L Desember",
];

const shortMonth = (month) => String(month || "").replace(/^[A-L]\s+/, "").slice(0, 3);

const FlowChart = memo(function FlowChart({ data = [], filters = {} }) {
    const chartData = data.map((item) => ({
        ...item,
        key: item.key || item.year || item.label,
        label: item.label || item.year || item.key,
    }));
    const chartWidth = Math.max((chartData.length || 1) * 92, 680);
    const chartHeight = 260;
    const padding = { top: 26, right: 28, bottom: 42, left: 72 };
    const maxAmount = Math.max(...chartData.flatMap((item) => [Number(item.primary || 0), Number(item.secondary || 0), Number(item.total || 0)]), 1);
    const xFor = (index) => chartData.length <= 1
        ? chartWidth / 2
        : padding.left + (index * (chartWidth - padding.left - padding.right)) / (chartData.length - 1);
    const yFor = (value) => padding.top + ((maxAmount - Number(value || 0)) / maxAmount) * (chartHeight - padding.top - padding.bottom);
    const pointsFor = (key) => chartData.map((item, index) => `${xFor(index)},${yFor(item[key])}`).join(" ");
    const modeText = filters.TAHUN !== "ALL"
        ? filters.BULAN !== "ALL"
            ? `Menampilkan ${filters.BULAN.replace(/^[A-L]\s+/, "")} ${filters.TAHUN}.`
            : `Menampilkan alur bulanan tahun ${filters.TAHUN}, dari Januari sampai Desember.`
        : "Rekomendasi tampilan semua tahun: lihat tren per tahun dulu, baru pilih tahun tertentu untuk membaca gerak bulanan.";
    const series = [
        ["primary", "Primary", "#2563eb"],
        ["secondary", "Secondary", "#06b6d4"],
        ["total", "Total", "#0f172a"],
    ];

    return (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    Statistik Biaya
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    {modeText}
                </p>
            </div>
            {chartData.length ? (
                <div>
                    <div className="mb-4 flex flex-wrap gap-3">
                        {series.map(([key, label, color]) => (
                            <div key={key} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                                {label}
                            </div>
                        ))}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width={chartWidth} height={chartHeight} className="min-w-full">
                            {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                                const value = maxAmount * (1 - step);
                                const y = padding.top + step * (chartHeight - padding.top - padding.bottom);

                                return (
                                    <g key={step}>
                                        <line x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                                        <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-bold">
                                            {Number(value || 0).toLocaleString("id-ID", { notation: "compact" })}
                                        </text>
                                    </g>
                                );
                            })}
                            {series.map(([key, label, color]) => (
                                <g key={key}>
                                    <polyline fill="none" stroke={color} strokeWidth={key === "total" ? 4 : 3} strokeLinecap="round" strokeLinejoin="round" points={pointsFor(key)} />
                                    {chartData.map((item, index) => (
                                        <circle key={`${key}-${item.key}`} cx={xFor(index)} cy={yFor(item[key])} r={key === "total" ? 4.5 : 3.5} fill={color}>
                                            <title>{`${label} ${item.label}: ${formatRp(item[key])}`}</title>
                                        </circle>
                                    ))}
                                </g>
                            ))}
                            {chartData.map((item, index) => (
                                <text key={item.key} x={xFor(index)} y={chartHeight - 14} textAnchor="middle" className="fill-slate-500 text-[11px] font-black">
                                    {item.label}
                                </text>
                            ))}
                        </svg>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {chartData.map((item) => (
                            <div key={item.key} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-sm font-black text-slate-950">{item.label}</p>
                                <div className="mt-2 space-y-1 text-xs font-semibold text-slate-600">
                                    <div className="flex justify-between gap-3"><span>Primary</span><span>{formatRp(item.primary)}</span></div>
                                    <div className="flex justify-between gap-3"><span>Secondary</span><span>{formatRp(item.secondary)}</span></div>
                                    <div className="flex justify-between gap-3 font-black text-slate-950"><span>Total</span><span>{formatRp(item.total)}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                    Belum ada biaya operasional Primary atau Secondary untuk filter ini.
                </p>
            )}
        </div>
    );
});

function SearchableSelect({ label, value, options = [], onChange }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const selectedLabel = value === "ALL" ? "Semua" : value;
    const filteredOptions = options.filter((option) => {
        const text = option === "ALL" ? "Semua" : option;

        return text.toLowerCase().includes(search.trim().toLowerCase());
    });

    return (
        <div className="relative">
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
            <button
                type="button"
                onClick={() => {
                    setOpen((current) => !current);
                    setSearch("");
                }}
                className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-700 outline-none transition hover:border-cyan-300"
            >
                <span className="truncate">{selectedLabel || "Semua"}</span>
                <ChevronRight size={15} className={`shrink-0 transition ${open ? "rotate-90 text-cyan-600" : "text-slate-400"}`} />
            </button>
            {open && (
                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
                    <div className="border-b border-slate-100 p-2">
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            autoFocus
                            placeholder={`Cari ${label.toLowerCase()}...`}
                            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                        />
                    </div>
                    <div className="custom-scrollbar max-h-64 overflow-auto p-1">
                        {filteredOptions.length ? filteredOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${option === value ? "bg-cyan-50 text-cyan-700" : "text-slate-700 hover:bg-slate-50"}`}
                            >
                                {option === "ALL" ? "Semua" : option}
                            </button>
                        )) : (
                            <p className="px-3 py-4 text-center text-sm font-semibold text-slate-400">Tidak ditemukan.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterPanel({ filters = {}, options = {}, onChange, onReset }) {
    const applyFilter = (key, value) => {
        onChange({ ...filters, [key]: value });
    };

    const resetFilters = () => {
        onReset();
    };

    const fields = [
        ["TAHUN", "Tahun"],
        ["BULAN", "Bulan"],
        ["AREA", "Area"],
        ["TIPE", "Tipe Unit"],
        ["NOPOL", "Nopol"],
    ];

    return (
        <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                        <Filter size={17} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Saring Data Biaya</h2>
                        <p className="text-xs font-semibold text-slate-500">Default menampilkan semua data.</p>
                    </div>
                </div>
                <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50">
                    <RotateCcw size={14} />
                    Reset
                </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {fields.map(([key, label]) => (
                    <SearchableSelect
                        key={key}
                        label={label}
                        value={filters[key] || "ALL"}
                        options={options[key] && options[key].length ? options[key] : ["ALL"]}
                        onChange={(value) => applyFilter(key, value)}
                    />
                ))}
            </div>
        </section>
    );
}

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

const isAll = (value) => !value || value === "ALL";

const matchesActiveFilter = (row, filters) =>
    (isAll(filters.AREA) || String(row.area || "") === filters.AREA)
    && (isAll(filters.TIPE) || String(row.tipe || "") === filters.TIPE)
    && (isAll(filters.NOPOL) || String(row.nopol || "") === filters.NOPOL);

const buildOperationFlow = (rows = [], filters = {}) => {
    const filteredRows = rows.filter((row) =>
        (isAll(filters.TAHUN) || String(row.year || "") === filters.TAHUN)
        && (isAll(filters.BULAN) || String(row.month || "") === filters.BULAN)
        && matchesActiveFilter(row, filters)
    );
    const groupByMonth = !isAll(filters.TAHUN);
    const timeline = groupByMonth
        ? (isAll(filters.BULAN) ? MONTHS : MONTHS.filter((month) => month === filters.BULAN))
        : [...new Set(filteredRows.map((row) => String(row.year || "")).filter((year) => year && year !== "0"))].sort();

    const grouped = filteredRows.reduce((carry, row) => {
        const key = groupByMonth ? String(row.month || "") : String(row.year || "");
        if (!key || key === "0") return carry;

        if (!carry[key]) {
            carry[key] = {
                key,
                label: groupByMonth ? shortMonth(key) : key,
                primary: 0,
                secondary: 0,
                total: 0,
            };
        }

        const amount = Number(row.nominal || 0);
        if (row.source === "primary") carry[key].primary += amount;
        if (row.source === "secondary") carry[key].secondary += amount;
        carry[key].total += amount;

        return carry;
    }, {});

    return timeline.map((key) => grouped[key] || {
        key,
        label: groupByMonth ? shortMonth(key) : key,
        primary: 0,
        secondary: 0,
        total: 0,
    });
};

export default function Index({ summaryData = [], vehicleCosts = [], vehicleCostRows = [], operationFlow = [], operationRows = [], filters = {}, filterOptions = {} }) {
    const [activeFilters, setActiveFilters] = useState({
        TAHUN: filters.TAHUN || "ALL",
        BULAN: filters.BULAN || "ALL",
        AREA: filters.AREA || "ALL",
        TIPE: filters.TIPE || "ALL",
        NOPOL: filters.NOPOL || "ALL",
    });
    const totalBiaya = useMemo(
        () => summaryData.reduce((total, item) => total + Number(item.amount || 0), 0),
        [summaryData],
    );
    const normalizedFilterOptions = useMemo(() => {
        const fromRows = (key) => [
            "ALL",
            ...[...new Set(vehicleCosts.map((row) => row[key]).filter(Boolean).map(String))].sort(),
        ];

        return {
            TAHUN: filterOptions.TAHUN?.length ? filterOptions.TAHUN : ["ALL", ...[...new Set(operationFlow.map((row) => row.year).filter(Boolean).map(String))].sort().reverse()],
            BULAN: filterOptions.BULAN?.length ? filterOptions.BULAN : ["ALL"],
            AREA: filterOptions.AREA?.length ? filterOptions.AREA : fromRows("area"),
            TIPE: filterOptions.TIPE?.length ? filterOptions.TIPE : fromRows("tipe"),
            NOPOL: filterOptions.NOPOL?.length ? filterOptions.NOPOL : fromRows("nopol"),
        };
    }, [filterOptions, operationFlow, vehicleCosts]);
    const instantVehicleCosts = useMemo(() => {
        const sourceRows = vehicleCostRows.length ? vehicleCostRows : vehicleCosts;

        return sourceRows
            .filter((row) => matchesActiveFilter(row, activeFilters))
            .slice(0, 300);
    }, [activeFilters, vehicleCostRows, vehicleCosts]);
    const normalizedFlow = useMemo(() => {
        if (operationRows.length) return buildOperationFlow(operationRows, activeFilters);

        if (operationFlow.length) return operationFlow;

        const primary = summaryData.find((item) => item.slug === "operasional-prim")?.amount || 0;
        const secondary = summaryData.find((item) => item.slug === "operasional-sec")?.amount || 0;
        const total = Number(primary || 0) + Number(secondary || 0);

        return total > 0 ? [{ year: "Semua", primary, secondary, total }] : [];
    }, [activeFilters, operationFlow, operationRows, summaryData]);

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

            <FilterPanel
                filters={activeFilters}
                options={normalizedFilterOptions}
                onChange={setActiveFilters}
                onReset={() => setActiveFilters({ TAHUN: "ALL", BULAN: "ALL", AREA: "ALL", TIPE: "ALL", NOPOL: "ALL" })}
            />

            <FlowChart data={normalizedFlow} filters={activeFilters} />

            <section className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-4">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">
                        Beban Biaya per Kendaraan
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                        Legalitas, service, ban, dan operasional digabung ke nopol yang sama.
                    </p>
                </div>
                <div className="custom-scrollbar max-h-[520px] overflow-auto">
                    <table className="w-full min-w-[1080px] border-collapse text-left">
                        <thead className="sticky top-0 z-10 bg-slate-50">
                            <tr>
                                {["Nopol", "Area", "Tipe", "Unit", "Legalitas", "Maintenance", "Operasional", "Total", "Riwayat"].map((head) => (
                                    <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {instantVehicleCosts.map((row) => (
                                <tr
                                    key={row.nopol}
                                    onClick={() => router.visit(`/inventori/pajak/${encodeURIComponent(row.nopol)}`)}
                                    onKeyDown={(event) => {
                                        if (!["Enter", " "].includes(event.key)) return;
                                        event.preventDefault();
                                        router.visit(`/inventori/pajak/${encodeURIComponent(row.nopol)}`);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    className="cursor-pointer hover:bg-cyan-50/40 focus:bg-cyan-50/60 focus:outline-none"
                                >
                                    <td className="px-4 py-3 text-xs font-black text-slate-950">{row.nopol || "-"}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.area || "-"}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tipe || "-"}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.unit || "-"}</td>
                                    <td className="px-4 py-3 text-xs font-black text-cyan-700">{formatRp(row.legalitasTotal)}</td>
                                    <td className="px-4 py-3 text-xs font-black text-amber-700">{formatRp(row.maintenanceTotal)}</td>
                                    <td className="px-4 py-3 text-xs font-black text-emerald-700">{formatRp(row.operasionalTotal)}</td>
                                    <td className="px-4 py-3 text-xs font-black text-blue-700">{formatRp(row.total)}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                                        Svc {row.serviceCount || 0}x, Ban {row.banCount || 0}x, Op {(row.primaryCount || 0) + (row.secondaryCount || 0)}x
                                    </td>
                                </tr>
                            ))}
                            {!instantVehicleCosts.length && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                                        Belum ada biaya kendaraan yang bisa dibaca.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

        </AdminLayout>
    );
}
