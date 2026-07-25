import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Building2, Truck, ChevronRight } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

const cards = [
    { slug: "washeng", label: "WASHENG KEKE MANDIRI", title: "Washeng", icon: Building2, tone: "bg-cyan-50 text-cyan-700 ring-cyan-100" },
    { slug: "rental", label: "RENTAL", title: "Inventaris Rental", icon: Truck, tone: "bg-blue-50 text-blue-700 ring-blue-100" },
];

export default function Index({ summary }) {
    const inventaris = summary?.inventaris || [];

    const getCount = (slug) => {
        const label = cards.find((c) => c.slug === slug)?.label;
        const found = inventaris.find((item) => item.label === label);
        return found ? found.value : 0;
    };

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
                                Klik card untuk membuka daftar unit berdasarkan inventaris.
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-950 px-5 py-4 text-white">
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Total Unit</p>
                            <p className="mt-1 text-3xl font-black">{formatNumber(summary?.totalUnit)}</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2">
                    {cards.map((card) => {
                        const count = getCount(card.slug);
                        const Icon = card.icon;

                        return (
                            <Link
                                key={card.slug}
                                href={`/inventori/daftar-unit/${card.slug}`}
                                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">Inventaris</p>
                                        <h2 className="mt-2 text-lg font-black text-slate-950">{card.title}</h2>
                                    </div>
                                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${card.tone}`}>
                                        <Icon size={21} strokeWidth={2.4} />
                                    </div>
                                </div>

                                <div className="mt-5 flex items-end justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Unit</p>
                                        <p className="mt-1 text-3xl font-black text-slate-950">{formatNumber(count)}</p>
                                    </div>
                                    <div className="text-right text-xs font-black text-cyan-600">Lihat detail</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}