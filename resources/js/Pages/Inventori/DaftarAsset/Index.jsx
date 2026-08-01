import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowUpRight, Boxes, Building2, Car, ChevronRight, Wrench } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const assetMenus = [
    {
        title: "Asset HO",
        label: "Kantor pusat",
        description: "Laptop dan perlengkapan kerja yang digunakan di lingkungan kantor pusat.",
        icon: Building2,
        tone: "bg-[#eef2ff] text-[#635bff]",
        line: "bg-[#635bff]",
        href: "/inventori/daftar-asset/asset-ho",
    },
    {
        title: "Kendaraan Operasional",
        label: "Operasional lapangan",
        description: "Kendaraan pendukung yang disiapkan untuk kebutuhan operasional harian.",
        icon: Car,
        tone: "bg-cyan-50 text-cyan-600",
        line: "bg-cyan-500",
        href: "/inventori/daftar-asset/kendaraan-operasional",
    },
    {
        title: "Toolkit",
        label: "Kesiapan unit",
        description: "Catatan pemeriksaan perlengkapan teknis dan kelayakan operasional unit.",
        icon: Wrench,
        tone: "bg-amber-50 text-amber-600",
        line: "bg-amber-400",
        href: "/inventori/daftar-asset/toolkit",
    },
];

function AssetCard({ item }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className="group relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#c7c3ff] hover:shadow-lg hover:shadow-[#635bff]/10"
        >
            <div className={`absolute inset-x-0 top-0 h-1 ${item.line}`} />
            <div className="flex items-start justify-between gap-4">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>
                    <Icon size={21} strokeWidth={2} />
                </div>
                <ArrowUpRight size={18} className="text-slate-300 transition group-hover:text-[#635bff]" />
            </div>
            <p className="mt-5 text-xs font-semibold text-slate-400">{item.label}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{item.title}</h2>
            <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">{item.description}</p>
            <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-[#635bff]">Buka data asset</div>
        </Link>
    );
}

export default function Index() {
    return (
        <AdminLayout>
            <Head title="Daftar Asset" />

            <div className="space-y-5">
                <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Link href="/dashboard" className="transition hover:text-[#635bff]">Dashboard</Link>
                    <ChevronRight size={14} />
                    <span className="text-slate-700">Daftar Asset</span>
                </nav>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f1efff] px-3 py-1.5 text-xs font-bold text-[#635bff]">
                                <Boxes size={14} />
                                Inventori asset
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Daftar Asset</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Satu pintu untuk memantau asset kantor, kendaraan operasional, dan kesiapan perlengkapan unit.
                            </p>
                        </div>

                        <div className="min-w-[170px] rounded-xl border border-[#e6e4ff] bg-[#fafaff] p-4">
                            <p className="text-xs font-semibold text-slate-500">Kelompok asset</p>
                            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">3</p>
                            <p className="mt-1 text-xs text-slate-400">Siap ditinjau per kategori</p>
                        </div>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-[#635bff] via-cyan-400 to-amber-300" />
                </section>

                <section>
                    <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Pilih kategori asset</h2>
                            <p className="mt-1 text-sm text-slate-500">Buka kategori untuk melihat data dan rincian yang tersedia.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {assetMenus.map((item) => <AssetCard key={item.title} item={item} />)}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
