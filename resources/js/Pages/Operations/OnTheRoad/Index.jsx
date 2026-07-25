import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import { ArrowRight, CircleDollarSign, Map, MapPin, Route, Search, Truck } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const formatRp = (value) => `Rp${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function CalendarWidget({ date, dateOptions = [], onChange, dark }) {
    const parsed = date ? new Date(date + "T00:00:00") : new Date();
    const [viewYear, setViewYear] = useState(parsed.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed.getMonth() + 1);
    const available = useMemo(() => new Set(dateOptions), [dateOptions]);

    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth - 1, 1).getDay();
    const startOffset = firstDow === 0 ? 6 : firstDow - 1;

    const pad = (n) => String(n).padStart(2, "0");
    const dayClass = (day) => {
        const ds = `${viewYear}-${pad(viewMonth)}-${pad(day)}`;
        const isSel = date === ds;
        const isTdy = (() => { const t = new Date(); return t.getFullYear() === viewYear && t.getMonth() + 1 === viewMonth && t.getDate() === day; })();
        const has = available.has(ds);
        if (isSel) return dark ? "bg-cyan-500 text-white font-black" : "bg-cyan-600 text-white font-black";
        if (isTdy) return dark ? "bg-white/10 text-white font-bold" : "bg-cyan-50 text-cyan-700 font-bold";
        if (has) return dark ? "text-white font-semibold hover:bg-white/10" : "text-slate-900 font-semibold hover:bg-slate-100";
        return dark ? "text-slate-600 hover:bg-white/5" : "text-slate-400 hover:bg-slate-50";
    };

    const nav = (delta) => {
        let m = viewMonth + delta;
        let y = viewYear;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        setViewMonth(m);
        setViewYear(y);
    };

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(<div key={`e${i}`} />);
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${viewYear}-${pad(viewMonth)}-${pad(d)}`;
        cells.push(
            <button key={d} type="button" onClick={() => onChange(ds)}
                className={`h-8 w-8 rounded-full text-[11px] leading-none transition ${dayClass(d)}`}>
                {d}
            </button>
        );
    }

    const base = dark ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900";
    const navBtn = dark ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-700";
    const labelCls = dark ? "text-slate-400" : "text-slate-500";

    return (
        <div className={`w-full max-w-[260px] rounded-xl border p-3 ${base}`}>
            <div className="mb-2 flex items-center justify-between gap-1">
                <button type="button" onClick={() => nav(-1)} className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black transition ${navBtn}`}>&lt;</button>
                <span className="text-sm font-black">{MONTHS[viewMonth - 1]} {viewYear}</span>
                <button type="button" onClick={() => nav(1)} className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-black transition ${navBtn}`}>&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-0">
                {DAYS.map((d) => <div key={d} className={`h-7 w-8 text-center text-[10px] font-black leading-7 uppercase ${labelCls}`}>{d}</div>)}
                {cells.map((c, i) => <div key={i} className="flex h-8 w-8 items-center justify-center">{c}</div>)}
            </div>
        </div>
    );
}

function StatCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</p>
                    <p className="mt-2 break-words text-2xl font-black text-slate-950">{value}</p>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600"><Icon size={19} /></div>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
    );
}

function UnitCard({ item }) {
    return (
        <Link href={item.href} className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-200/80">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wider text-cyan-700">{item.label}</p>
                    <h2 className="mt-2 text-3xl font-black text-slate-950">{formatNumber(item.count)}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">unit berjalan pada tanggal ini</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-cyan-600"><ArrowRight size={19} /></div>
            </div>
            <div className="mt-5 grid gap-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between gap-3"><span>Tarif</span><span className="font-black text-slate-950">{formatRp(item.tarif)}</span></div>
                <div className="flex justify-between gap-3"><span>Biaya</span><span className="font-black text-slate-950">{formatRp(item.biaya)}</span></div>
                <div className="flex justify-between gap-3"><span>Profit</span><span className="font-black text-blue-600">{formatRp(item.profit)}</span></div>
            </div>
        </Link>
    );
}

function Breakdown({ title, items = [] }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">{title}</h2>
            <div className="mt-4 divide-y divide-slate-100">
                {items.length ? items.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center justify-between gap-3 py-3 transition hover:bg-cyan-50/60"
                    >
                        <p className="truncate text-sm font-black text-slate-900">{item.name}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-blue-600">{formatNumber(item.value)}</p>
                            <ArrowRight size={15} className="text-slate-300" />
                        </div>
                    </Link>
                )) : <p className="py-4 text-sm font-semibold text-slate-500">Belum ada data.</p>}
            </div>
        </section>
    );
}

const LatestPositionMap = memo(function LatestPositionMap({ positions = [] }) {
    const mapElement = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");
    const filteredPositions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) return positions;

        return positions.filter((item) =>
            [
                item.nopol,
                item.nama_driver,
                item.tanggal_jam,
                item.location,
                item.keterangan,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query)),
        );
    }, [positions, searchQuery]);
    const validPositions = filteredPositions.filter((item) => item.latitude !== null && item.longitude !== null);

    useEffect(() => {
        if (!mapElement.current || !validPositions.length) return undefined;

        const map = L.map(mapElement.current, { zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);

        const bounds = [];
        validPositions.forEach((item) => {
            const point = [item.latitude, item.longitude];
            const detailUrl = `/on-the-road/position/${encodeURIComponent(item.id)}`;
            const tooltipButton = document.createElement("button");
            tooltipButton.type = "button";
            tooltipButton.className = "cursor-pointer border-0 bg-transparent p-0 font-bold text-slate-950";
            tooltipButton.textContent = String(item.nopol || "Unit");
            tooltipButton.addEventListener("click", (event) => {
                event.stopPropagation();
                router.visit(detailUrl);
            });

            bounds.push(point);
            const marker = L.circleMarker(point, {
                radius: 8,
                color: "#ffffff",
                weight: 3,
                fillColor: "#0891b2",
                fillOpacity: 1,
            }).addTo(map);

            marker.bindTooltip(tooltipButton, {
                direction: "top",
                interactive: true,
                offset: [0, -6],
            });
            marker.on("click", () => router.visit(detailUrl));
        });

        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
        return () => map.remove();
    }, [validPositions]);

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Monitoring Unit</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Titik terakhir yang dikirim melalui form AppSheet untuk setiap nopol.</p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-center">
                        <div className="relative w-full sm:w-80">
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Cari nopol, driver, lokasi..."
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                            />
                        </div>
                        <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 px-3 text-xs font-black text-cyan-700">
                            {validPositions.length} titik
                        </span>
                    </div>
                </div>
            </div>
            {filteredPositions.length ? (
                <div className="grid min-w-0 lg:grid-cols-[1.45fr_0.75fr]">
                    {validPositions.length ? (
                        <div ref={mapElement} className="z-0 h-[360px] min-h-[300px] w-full bg-slate-100 sm:h-[430px]" />
                    ) : (
                        <div className="grid h-[360px] min-h-[300px] place-items-center bg-slate-100 p-6 text-center sm:h-[430px]">
                            <div>
                                <MapPin size={28} className="mx-auto text-slate-300" />
                                <p className="mt-3 text-sm font-black text-slate-700">Tidak ada koordinat valid</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">Data hasil pencarian ada, tapi titik lokasinya belum bisa ditampilkan di peta.</p>
                            </div>
                        </div>
                    )}
                    <div className="custom-scrollbar max-h-[430px] overflow-auto border-t border-slate-100 lg:border-l lg:border-t-0">
                        {filteredPositions.map((item) => (
                            <Link
                                key={item.id}
                                href={`/on-the-road/position/${encodeURIComponent(item.id)}`}
                                className="group block border-b border-slate-100 p-4 transition last:border-b-0 hover:bg-cyan-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0"><p className="truncate text-sm font-black text-slate-950">{item.nopol}</p><p className="mt-1 truncate text-xs font-semibold text-slate-500">{item.nama_driver || "Driver belum diisi"}</p></div>
                                    <MapPin size={17} className={item.latitude !== null ? "shrink-0 text-cyan-600 transition group-hover:scale-110" : "shrink-0 text-rose-500"} />
                                </div>
                                <p className="mt-2 text-xs font-bold text-slate-600">{item.tanggal_jam || "Waktu belum diisi"}</p>
                                <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">{item.keterangan || "Tidak ada keterangan."}</p>
                                {item.latitude === null && <p className="mt-2 text-[11px] font-black text-rose-600">Koordinat belum valid: {item.location || "kosong"}</p>}
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid min-h-64 place-items-center p-6 text-center">
                    <div><MapPin size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">Belum ada koordinat unit</p><p className="mt-1 text-xs font-semibold text-slate-500">Peta akan terisi setelah AppSheet mengirim data location dalam format latitude, longitude.</p></div>
                </div>
            )}
        </section>
    );
});

export default function Index({ date, dateOptions = [], summary = {}, cards = [], standbyHref, typeBreakdown = [], areaBreakdown = [], sampleRows = [], latestPositions = [] }) {
    const changeDate = (value) => router.get("/on-the-road", { tanggal: value }, { preserveScroll: true });

    return (
        <AdminLayout>
            <Head title="On The Road" />

            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-400/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200"><Map size={15} /> On The Road</div>
                            <h1 className="mt-4 text-2xl font-black tracking-tight">Unit yang sedang jalan</h1>
                            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">Cek unit jalan, unit standby, tarif, biaya, dan profit untuk tanggal yang dipilih.</p>
                        </div>
                        <CalendarWidget date={date} dateOptions={dateOptions} onChange={changeDate} dark />
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <StatCard title="Total Unit" value={formatNumber(summary.totalUnit)} helper="Armada terdaftar" icon={Truck} />
                    <StatCard title="Unit Jalan" value={formatNumber(summary.runningCount)} helper="Masuk data jalan tanggal ini" icon={Route} />
                    <StatCard title="Unit Standby" value={formatNumber(summary.standbyCount)} helper="Belum muncul di data jalan" icon={Truck} />
                    <StatCard title="Total Tarif" value={formatRp(summary.totalTarif)} helper="Tagihan dari unit yang jalan" icon={CircleDollarSign} />
                    <StatCard title="Profit Hari Ini" value={formatRp(summary.totalProfit)} helper="Tarif dikurangi biaya" icon={CircleDollarSign} />
                </div>

                <LatestPositionMap positions={latestPositions} />

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                    {cards.map((item) => <UnitCard key={item.slug} item={item} />)}
                    <Link href={standbyHref} className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-slate-200/80">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-cyan-700">UNIT STANDBY</p>
                                <h2 className="mt-2 text-3xl font-black text-slate-950">{formatNumber(summary.standbyCount)}</h2>
                                <p className="mt-1 text-xs font-semibold text-slate-500">unit siap jalan</p>
                            </div>
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-950 text-white transition group-hover:bg-cyan-600"><ArrowRight size={19} /></div>
                        </div>
                    </Link>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <Breakdown title="Jenis Unit Yang Jalan Hari Ini" items={typeBreakdown} />
                    <Breakdown title="Area Unit Jalan" items={areaBreakdown} />
                </div>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-4">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Cuplikan Unit Jalan</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Beberapa data unit yang jalan pada tanggal ini.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                            <thead className="bg-slate-50">
                                <tr>{["Tanggal", "Project", "Nopol", "Tipe", "Area", "Driver", "Rute", "Tarif", "Biaya", "Profit"].map((head) => <th key={head} className="border-b border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">{head}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sampleRows.map((row) => (
                                    <tr key={row.id_key} className="hover:bg-cyan-50/40">
                                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.tanggal_normalized || row.tanggal}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.project || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-black text-slate-950">{row.nopol || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.tipe_unit || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.area || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.driver || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{row.rute || "-"}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.tagihan)}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{formatRp(row.total_biaya_operasional)}</td>
                                        <td className="px-4 py-3 text-xs font-black text-blue-600">{formatRp(row.profit_trip)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
