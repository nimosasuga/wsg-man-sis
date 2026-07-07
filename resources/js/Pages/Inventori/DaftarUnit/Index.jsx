import React from "react";
import { Head, Link } from "@inertiajs/react";
import { CalendarDays, ChevronRight, Fuel, Gauge, IdCard, ShieldCheck, Truck } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const cardMeta = [
    { key: "tipeUnit", slug: "tipe-unit", title: "Tipe Unit", subtitle: "Distribusi jenis armada", icon: Truck, tone: "cyan" },
    { key: "pajakStnk", slug: "pajak-stnk", title: "Pajak STNK", subtitle: "Status legalitas kendaraan", icon: IdCard, tone: "blue" },
    { key: "dataKir", slug: "data-kir", title: "Data KIR", subtitle: "Kelayakan operasional", icon: ShieldCheck, tone: "emerald" },
    { key: "myPertamina", slug: "my-pertamina", title: "My Pertamina", subtitle: "Kesiapan akses BBM", icon: Fuel, tone: "amber" },
    { key: "gpsUnit", slug: "gps-unit", title: "GPS Unit", subtitle: "Status perangkat pelacakan", icon: Gauge, tone: "violet" },
    { key: "tahunUnit", slug: "tahun-unit", title: "Tahun Unit", subtitle: "Komposisi tahun armada", icon: CalendarDays, tone: "rose" },
];

const toneClasses = {
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
};

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

function normalizeItems(summary, key) {
    if (key !== "pajakStnk") return summary?.[key] || [];

    const pajak = summary?.pajakStnk?.pajak || [];
    const stnk = summary?.pajakStnk?.stnk || [];

    return [
        ...pajak.map((item) => ({ label: `PAJAK ${item.label}`, value: item.value })),
        ...stnk.map((item) => ({ label: `STNK ${item.label}`, value: item.value })),
    ];
}

function SummaryCard({ meta, summary }) {
    const Icon = meta.icon;
    const items = normalizeItems(summary, meta.key);
    const total = meta.key === "pajakStnk"
        ? summary?.totalUnit || 0
        : items.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const topItems = items.slice(0, 5);

    return (
        <Link
            href={`/inventori/daftar-unit/${meta.slug}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">{meta.subtitle}</p>
                    <h2 className="mt-2 text-lg font-black text-slate-950">{meta.title}</h2>
                </div>
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${toneClasses[meta.tone]}`}>
                    <Icon size={21} strokeWidth={2.4} />
                </div>
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Record</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{formatNumber(total)}</p>
                </div>
                <div className="text-right text-xs font-black text-cyan-600">Lihat detail</div>
            </div>

            <div className="mt-5 space-y-3">
                {topItems.map((item) => {
                    const percent = total > 0 ? Math.round((Number(item.value || 0) / total) * 100) : 0;

                    return (
                        <div key={item.label}>
                            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                                <span className="truncate">{item.label}</span>
                                <span>{formatNumber(item.value)}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.max(percent, item.value > 0 ? 5 : 0)}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Link>
    );
}

export default function Index({ summary }) {
    return (
        <AdminLayout>
            <Head title="Daftar Unit" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-cyan-600">Dashboard</Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">Daftar Unit</span>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-cyan-600">Inventori Armada</p>
                            <h1 className="mt-2 text-2xl font-black text-slate-950">Daftar Unit</h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                                Klik card untuk membuka halaman detail unit sesuai kategori.
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-950 px-5 py-4 text-white">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Total Unit</p>
                            <p className="mt-1 text-3xl font-black">{formatNumber(summary?.totalUnit)}</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {cardMeta.map((meta) => (
                        <SummaryCard key={meta.key} meta={meta} summary={summary} />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
