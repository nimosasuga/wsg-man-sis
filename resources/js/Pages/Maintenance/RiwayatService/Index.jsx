import React, { useMemo, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import {
    ArrowLeft,
    ArrowRight,
    CircleDollarSign,
    Filter,
    Lightbulb,
    Plus,
    PenTool,
    RotateCcw,
    Search,
    Truck,
    Wrench,
} from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        maximumFractionDigits: 0,
    })}`;

const defaultFilters = {
    "TIPE UNIT": "ALL",
    AREA: "ALL",
    NOPOL: "ALL",
    DRIVER: "ALL",
    JENIS: "ALL",
    STATUS: "ALL",
    HARI: "",
    WEEK: "ALL",
    BULAN: "ALL",
    TAHUN: "ALL",
};

function SummaryCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
                    <p className="mt-2 break-words text-2xl font-black text-slate-950">{value}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <Icon size={19} />
                </div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

function FilterSelect({ label, value, options, onChange }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
            {options ? (
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                    {options.map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            ) : (
                <input
                    type="date"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
            )}
        </label>
    );
}

function MenuCard({ title, helper, href, icon: Icon, count, amount, tone }) {
    return (
        <Link
            href={href}
            className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-200/80"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider ${tone}`}>
                        <Icon size={16} />
                        {title}
                    </div>
                    <h2 className="mt-4 text-2xl font-black text-slate-950">{formatRp(amount)}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{helper}</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-cyan-600">
                    <ArrowRight size={19} />
                </div>
            </div>
            <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Record</p>
                <p className="mt-1 text-lg font-black text-slate-950">{count}</p>
            </div>
        </Link>
    );
}

function SmartAnalysis({ activeTab, rows, breakdown }) {
    const notes = useMemo(() => {
        const source = activeTab === "service" ? "service umum" : "service ban";
        const amountKey = activeTab === "service" ? "total_biaya_service" : "total_harga";
        const total = rows.reduce((sum, row) => sum + Number(row[amountKey] || 0), 0);
        const topNopol = breakdown.byNopol?.[0];
        const topArea = breakdown.byArea?.[0];
        const topType = breakdown.byType?.[0];
        const average = rows.length ? total / rows.length : 0;
        const costlyRows = rows.filter((row) => Number(row[amountKey] || 0) >= average && average > 0).length;

        if (!rows.length) {
            return [
                `Belum ada data ${source} untuk filter ini. Coba longgarkan area, tanggal, minggu, bulan, atau tahun.`,
                "Kalau semua filter sudah ALL tapi tetap kosong, berarti data maintenance belum masuk ke database lokal.",
            ];
        }

        const result = [];
        if (topNopol) result.push(`Unit ${topNopol.name} paling banyak menyerap biaya ${source}: ${formatRp(topNopol.amount)} dari ${topNopol.count} record.`);
        if (topArea) result.push(`Area ${topArea.name} sedang paling dominan. Bagus untuk dicek apakah memang volume unitnya besar atau ada pola kerusakan berulang.`);
        if (topType) result.push(`${topType.name} adalah jenis pekerjaan yang paling terasa biayanya. Ini titik awal yang paling praktis untuk audit.`);
        result.push(`Rata-rata biaya per record sekitar ${formatRp(average)}. Ada ${costlyRows} record yang posisinya di atas rata-rata, jadi jangan semua dikejar sekaligus.`);
        result.push(`Total biaya ${source} pada filter ini ${formatRp(total)}. Mulai cek dari row nominal tertinggi, lalu lihat apakah nopol yang sama muncul berulang.`);

        return result.slice(0, 4);
    }, [activeTab, rows, breakdown]);

    return (
        <section className="rounded-xl border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                    <Lightbulb size={19} />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-700">Catatan service</p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">Yang perlu dicek dulu</h2>
                </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
                {notes.map((note, index) => (
                    <div key={note} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-white text-[11px] font-black text-cyan-700">{index + 1}</span>
                        {note}
                    </div>
                ))}
            </div>
        </section>
    );
}

function BreakdownList({ title, items = [] }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            <div className="mt-4 divide-y divide-slate-100">
                {items.length ? items.slice(0, 6).map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                            <p className="text-xs font-semibold text-slate-500">{item.count} record</p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-blue-600">{formatRp(item.amount)}</p>
                    </div>
                )) : (
                    <p className="py-4 text-sm font-semibold text-slate-500">Belum ada data.</p>
                )}
            </div>
        </section>
    );
}

export default function Index({
    mode = "menu",
    services = [],
    ban = [],
    summary = {},
    filters = defaultFilters,
    filterOptions = {},
    serviceBreakdown = { byArea: [], byType: [], byNopol: [] },
    banBreakdown = { byArea: [], byType: [], byNopol: [] },
    sourceStatus = {},
}) {
    const isMenu = mode === "menu";
    const [activeTab, setActiveTab] = useState(mode === "ban" ? "ban" : "service");
    const [search, setSearch] = useState("");

    const activeRows = activeTab === "service" ? services : ban;
    const activeBreakdown = activeTab === "service" ? serviceBreakdown : banBreakdown;
    const filteredRows = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return activeRows;

        return activeRows.filter((row) =>
            [
                row.nopol,
                row.tipe_unit,
                row.area,
                row.driver,
                row.mode_service,
                row.tipe_service,
                row.jenis_pengerjaan,
                row.keluhan,
                row.keterangan,
                row.jenis_spare_parts,
                row.posisi,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword)),
        );
    }, [activeRows, search]);

    const applyFilter = (key, value) => {
        router.get(activeTab === "service" ? "/riwayat-service-unit/service-umum" : "/riwayat-service-unit/service-ban", { ...filters, [key]: value }, { preserveScroll: true, preserveState: true });
    };

    const resetFilters = () => {
        router.get(activeTab === "service" ? "/riwayat-service-unit/service-umum" : "/riwayat-service-unit/service-ban", defaultFilters, { preserveScroll: true, preserveState: true });
    };

    const isEmpty = services.length === 0 && ban.length === 0;
    const activeAmountKey = activeTab === "service" ? "total_biaya_service" : "total_harga";

    return (
        <AdminLayout>
            <Head title="Riwayat Service Unit" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
                                <PenTool size={15} />
                                Maintenance
                            </div>
                            <h1 className="mt-4 text-2xl font-black tracking-tight">Riwayat Service Unit</h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
                                {isMenu
                                    ? "Pilih jenis riwayat yang mau dibuka. Filter dan tabel detail ada di halaman masing-masing."
                                    : "Di sini kita cari unit yang mulai sering masuk service atau biayanya mulai berat."}
                            </p>
                        </div>
                        {!isMenu && (
                        <div className="relative w-full max-w-md">
                            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari nopol, area, driver, keluhan..."
                                className="h-11 w-full rounded-lg border border-white/10 bg-white/10 pl-10 pr-3 text-sm font-semibold text-white placeholder:text-slate-400 outline-none focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10"
                            />
                        </div>
                        )}
                    </div>
                </section>

                {isMenu ? (
                    <>
                        <div className="grid gap-5 lg:grid-cols-2">
                            <MenuCard
                                title="Service Umum Berkala"
                                helper="Buka history perbaikan unit, keluhan, spare part, bengkel, odometer, dan total biaya service."
                                href="/riwayat-service-unit/service-umum"
                                icon={Wrench}
                                count={summary.totalService || 0}
                                amount={summary.totalBiayaService || 0}
                                tone="bg-cyan-50 text-cyan-700"
                            />
                            <MenuCard
                                title="Service Ban Berkala"
                                helper="Buka history service ban, posisi ban, kilometer pemakaian, jenis pengerjaan, dan total harga."
                                href="/riwayat-service-unit/service-ban"
                                icon={Truck}
                                count={summary.totalBan || 0}
                                amount={summary.totalBiayaBan || 0}
                                tone="bg-orange-50 text-orange-700"
                            />
                        </div>

                        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Kondisi Data</h2>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                                Kalau angkanya masih 0, bukan menunya rusak. Artinya tabel maintenance lokal belum terisi data.
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {Object.entries(sourceStatus).map(([table, count]) => (
                                    <div key={table} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{table}</p>
                                        <p className="mt-1 text-lg font-black text-slate-950">{count} data</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between gap-3">
                            <Link href="/riwayat-service-unit" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 hover:text-slate-950">
                                <ArrowLeft size={15} />
                                Kembali ke Menu
                            </Link>
                            <Link
                                href={activeTab === "service" ? "/riwayat-service-unit/service-umum/create" : "/riwayat-service-unit/service-ban/create"}
                                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700"
                            >
                                <Plus size={15} />
                                Tambah Data
                            </Link>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <SummaryCard title="Service Umum" value={summary.totalService || 0} helper="Total record service unit" icon={Wrench} />
                            <SummaryCard title="Biaya Service" value={formatRp(summary.totalBiayaService)} helper="Akumulasi total biaya service" icon={CircleDollarSign} />
                            <SummaryCard title="Service Ban" value={summary.totalBan || 0} helper="Total riwayat ban yang tercatat" icon={Truck} />
                            <SummaryCard title="Biaya Ban" value={formatRp(summary.totalBiayaBan)} helper="Akumulasi total biaya ban" icon={CircleDollarSign} />
                            <SummaryCard title="Total Maintenance" value={formatRp(summary.totalKeseluruhan)} helper="Gabungan service dan ban" icon={PenTool} />
                        </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">
                                <Filter size={17} />
                            </div>
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Saring Data</h2>
                        </div>
                        <button onClick={resetFilters} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <FilterSelect label="TIPE UNIT" value={filters["TIPE UNIT"]} options={filterOptions["TIPE UNIT"] || ["ALL"]} onChange={(value) => applyFilter("TIPE UNIT", value)} />
                        <FilterSelect label="AREA" value={filters.AREA} options={filterOptions.AREA || ["ALL"]} onChange={(value) => applyFilter("AREA", value)} />
                        <FilterSelect label="NOPOL" value={filters.NOPOL} options={filterOptions.NOPOL || ["ALL"]} onChange={(value) => applyFilter("NOPOL", value)} />
                        <FilterSelect label="DRIVER" value={filters.DRIVER} options={filterOptions.DRIVER || ["ALL"]} onChange={(value) => applyFilter("DRIVER", value)} />
                        <FilterSelect label="JENIS" value={filters.JENIS} options={filterOptions.JENIS || ["ALL"]} onChange={(value) => applyFilter("JENIS", value)} />
                        <FilterSelect label="STATUS" value={filters.STATUS} options={filterOptions.STATUS || ["ALL"]} onChange={(value) => applyFilter("STATUS", value)} />
                        <FilterSelect label="HARI" value={filters.HARI} onChange={(value) => applyFilter("HARI", value)} />
                        <FilterSelect label="WEEK" value={filters.WEEK} options={filterOptions.WEEK || ["ALL"]} onChange={(value) => applyFilter("WEEK", value)} />
                        <FilterSelect label="BULAN" value={filters.BULAN} options={filterOptions.BULAN || ["ALL"]} onChange={(value) => applyFilter("BULAN", value)} />
                        <FilterSelect label="TAHUN" value={filters.TAHUN} options={filterOptions.TAHUN || ["ALL"]} onChange={(value) => applyFilter("TAHUN", value)} />
                    </div>
                </section>

                {isEmpty ? (
                    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                        <h2 className="text-base font-black text-slate-950">Belum ada data untuk halaman ini</h2>
                        <p className="mt-2 text-sm font-semibold text-slate-500">Data akan muncul setelah tabel maintenance lokal terisi.</p>
                    </section>
                ) : (
                    <>
                        <SmartAnalysis activeTab={activeTab} rows={filteredRows} breakdown={activeBreakdown} />

                        <div className="grid gap-4 xl:grid-cols-3">
                            <BreakdownList title="Biaya by Nopol" items={activeBreakdown.byNopol} />
                            <BreakdownList title="Biaya by Area" items={activeBreakdown.byArea} />
                            <BreakdownList title="Biaya by Tipe / Pekerjaan" items={activeBreakdown.byType} />
                        </div>

                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex rounded-lg bg-slate-100 p-1">
                                    {[
                                        ["service", "Service Umum", services.length],
                                        ["ban", "Service Ban", ban.length],
                                    ].map(([key, label, count]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setActiveTab(key)}
                                            className={`rounded-md px-3 py-2 text-xs font-black transition ${activeTab === key ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                                        >
                                            {label} ({count})
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-slate-500">Menampilkan {filteredRows.length} data</p>
                            </div>

                            <div className="custom-scrollbar overflow-auto">
                                <table className="w-full border-collapse text-left whitespace-nowrap">
                                    <thead className="sticky top-0 z-10 bg-slate-50">
                                        <tr>
                                            {(activeTab === "service"
                                                ? ["TIPE UNIT", "AREA", "MODE SERVICE", "TANGGAL", "ODO", "KELUHAN", "TIPE SERVICE", "SPARE PARTS", "HARGA PARTS", "TOTAL"]
                                                : ["AREA", "NOPOL", "TANGGAL", "JENIS PENGERJAAN", "POSISI", "KM GANTI", "KM SEBELUMNYA", "TOTAL KM", "TOTAL HARGA"]
                                            ).map((head) => (
                                                <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500">{head}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRows.map((row, index) => {
                                            const detailUrl = activeTab === "service"
                                                ? `/riwayat-service-unit/service-umum/${row.id_key}`
                                                : `/riwayat-service-unit/service-ban/${row.id_key}`;

                                            return (
                                            <tr
                                                key={`${activeTab}-${row.id_key || index}`}
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
                                                {activeTab === "service" ? (
                                                    <>
                                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.tipe_unit || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.area || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.mode_service || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_services || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.odo_services || "-"}</td>
                                                        <td className="max-w-sm px-4 py-3 text-xs font-semibold text-slate-600"><span className="block truncate" title={row.keluhan || "-"}>{row.keluhan || "-"}</span></td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tipe_service || "-"}</td>
                                                        <td className="max-w-sm px-4 py-3 text-xs font-semibold text-slate-600"><span className="block truncate" title={row.jenis_spare_parts || row.spare_parts || "-"}>{row.jenis_spare_parts || row.spare_parts || "-"}</span></td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.harga_parts)}</td>
                                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{formatRp(row[activeAmountKey])}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.area || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.nopol || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_ganti_ban || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.jenis_pengerjaan || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.posisi || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.kilometer_ganti_ban || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.kilometer_ganti_ban_sebelumnya || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.total_kilometer_pemakaian_ban || "-"}</td>
                                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{formatRp(row[activeAmountKey])}</td>
                                                    </>
                                                )}
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
