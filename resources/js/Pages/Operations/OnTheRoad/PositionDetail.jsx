import React, { useEffect, useRef } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Clock3, ExternalLink, MapPin, Navigation, Truck, UserRound } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AdminLayout from "../../../Layouts/AdminLayout";

function Field({ label, value, wide = false }) {
    return (
        <div className={wide ? "min-w-0 sm:col-span-2" : "min-w-0"}>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-900">{value || "-"}</p>
        </div>
    );
}

function PositionMap({ position }) {
    const mapElement = useRef(null);
    const valid = position.latitude !== null && position.longitude !== null;

    useEffect(() => {
        if (!mapElement.current || !valid) return undefined;

        const point = [position.latitude, position.longitude];
        const map = L.map(mapElement.current).setView(point, 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);
        L.circleMarker(point, {
            radius: 10,
            color: "#ffffff",
            weight: 4,
            fillColor: "#0891b2",
            fillOpacity: 1,
        }).addTo(map).bindTooltip(String(position.nopol || "Unit"), { permanent: true, direction: "top", offset: [0, -10] });

        return () => map.remove();
    }, [position.latitude, position.longitude, position.nopol, valid]);

    if (!valid) {
        return (
            <div className="grid min-h-72 place-items-center bg-slate-50 p-6 text-center">
                <div>
                    <MapPin size={30} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-black text-slate-700">Koordinat belum valid</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Lokasi tersimpan: {position.location || "belum diisi"}</p>
                </div>
            </div>
        );
    }

    return <div ref={mapElement} className="z-0 h-[320px] min-h-[280px] w-full bg-slate-100 sm:h-[420px]" />;
}

export default function PositionDetail({ position = {}, backUrl = "/on-the-road" }) {
    const mapsUrl = position.latitude !== null && position.longitude !== null
        ? `https://www.google.com/maps?q=${position.latitude},${position.longitude}`
        : null;

    return (
        <AdminLayout>
            <Head title={`Posisi ${position.nopol || "Unit"}`} />

            <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={backUrl} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700">
                        <ArrowLeft size={17} /> Kembali
                    </Link>
                    {mapsUrl && (
                        <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-black text-white transition hover:bg-cyan-700">
                            Buka di Google Maps <ExternalLink size={16} />
                        </a>
                    )}
                </div>

                <section className="overflow-hidden rounded-xl bg-slate-950 text-white shadow-xl shadow-slate-200/70">
                    <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div className="min-w-0">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-300">Monitoring unit</p>
                            <h1 className="mt-2 break-words text-2xl font-black sm:text-3xl">{position.nopol || "Nopol belum diisi"}</h1>
                            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">{position.keterangan || "Belum ada keterangan perjalanan."}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm font-bold text-slate-200 sm:grid-cols-2 lg:grid-cols-1">
                            <span className="flex items-center gap-2"><UserRound size={16} className="text-cyan-300" /> {position.nama_driver || "Driver belum diisi"}</span>
                            <span className="flex items-center gap-2"><Clock3 size={16} className="text-cyan-300" /> {position.tanggal_jam || "Waktu belum diisi"}</span>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:p-5">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-cyan-600"><Navigation size={19} /></div>
                        <div><h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Titik Lokasi</h2><p className="mt-1 text-xs font-semibold text-slate-500">Koordinat terakhir yang dikirim dari lapangan.</p></div>
                    </div>
                    <PositionMap position={position} />
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-3"><Truck size={19} className="text-cyan-600" /><h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Detail Update Posisi</h2></div>
                    <div className="grid min-w-0 gap-x-8 gap-y-5 sm:grid-cols-2">
                        <Field label="ID" value={position.id} />
                        <Field label="Tanggal & Jam" value={position.tanggal_jam} />
                        <Field label="Nopol" value={position.nopol} />
                        <Field label="Nama Driver" value={position.nama_driver} />
                        <Field label="Location" value={position.location} wide />
                        <Field label="Keterangan" value={position.keterangan} wide />
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
