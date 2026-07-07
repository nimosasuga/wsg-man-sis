import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Boxes, Building2, Car, ChevronRight, Wrench } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const assetMenus = [
    {
        title: "Asset HO",
        subtitle: "Inventaris kantor pusat",
        icon: Building2,
        tone: "cyan",
        href: "/inventori/daftar-asset/asset-ho",
    },
    {
        title: "Kendaraan Operasional",
        subtitle: "Asset kendaraan pendukung operasional",
        icon: Car,
        tone: "emerald",
        href: "/inventori/daftar-asset/kendaraan-operasional",
    },
    {
        title: "Toolkit",
        subtitle: "Peralatan kerja dan perlengkapan teknis",
        icon: Wrench,
        tone: "amber",
        href: "/inventori/daftar-asset/toolkit",
    },
];

const toneClasses = {
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
};

function AssetCard({ item }) {
    const Icon = item.icon;

    return (
        <Link href={item.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        {item.subtitle}
                    </p>
                    <h2 className="mt-2 text-xl font-black text-slate-950">
                        {item.title}
                    </h2>
                </div>
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ${toneClasses[item.tone]}`}>
                    <Icon size={23} strokeWidth={2.4} />
                </div>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-600">
                Buka menu
                <ChevronRight size={16} />
            </div>
        </Link>
    );
}

export default function Index() {
    return (
        <AdminLayout>
            <Head title="Daftar Asset" />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-cyan-600">
                        Dashboard
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">Daftar Asset</span>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
                            <Boxes size={23} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-cyan-600">
                                Inventori Asset
                            </p>
                            <h1 className="mt-1 text-2xl font-black text-slate-950">
                                Daftar Asset
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                                Pilih kategori asset yang akan dikelola.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {assetMenus.map((item) => (
                        <AssetCard key={item.title} item={item} />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
