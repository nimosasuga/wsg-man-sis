import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowUpRight, Building2, ChevronRight, Truck, UserRound } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");

const cards = [
    {
        slug: "washeng",
        label: "WASHENG KEKE MANDIRI",
        title: "Armada Washeng",
        description: "Unit milik perusahaan yang dipantau sebagai armada utama.",
        icon: Building2,
        accent: "bg-[#eef2ff] text-[#635bff]",
        line: "bg-[#635bff]",
    },
    {
        slug: "rental",
        label: "RENTAL",
        title: "Unit Rental",
        description: "Armada sewa yang tercatat dalam inventori operasional.",
        icon: Truck,
        accent: "bg-cyan-50 text-cyan-600",
        line: "bg-cyan-500",
    },
    {
        slug: "vendor",
        label: "VENDOR",
        title: "Unit Vendor",
        description: "Armada rekanan yang mendukung kebutuhan distribusi.",
        icon: UserRound,
        accent: "bg-amber-50 text-amber-600",
        line: "bg-amber-400",
    },
];

export default function Index({ summary }) {
    const inventaris = summary?.inventaris || [];
    const totalUnit = Number(summary?.totalUnit || 0);

    const getCount = (slug) => {
        const label = cards.find((card) => card.slug === slug)?.label;
        const found = inventaris.find((item) => item.label === label);

        return Number(found?.value || 0);
    };

    return (
        <AdminLayout>
            <Head title="Daftar Unit" />

            <div className="space-y-5">
                <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Link href="/dashboard" className="transition hover:text-[#635bff]">Dashboard</Link>
                    <ChevronRight size={14} />
                    <span className="text-slate-700">Daftar Unit</span>
                </nav>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f1efff] px-3 py-1.5 text-xs font-bold text-[#635bff]">
                                <Truck size={14} />
                                Inventori armada
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Daftar Unit</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                Pilih kelompok inventori untuk melihat armada, status dokumen, dan rincian setiap unit.
                            </p>
                        </div>

                        <Link
                            href="/inventori/daftar-unit/semua"
                            className="group min-w-[170px] rounded-xl border border-[#e6e4ff] bg-[#fafaff] p-4 transition hover:border-[#bdb8ff] hover:bg-[#f5f3ff]"
                            title="Lihat semua data unit"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-xs font-semibold text-slate-500">Total armada</p>
                                <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-[#635bff]" />
                            </div>
                            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{formatNumber(totalUnit)}</p>
                            <p className="mt-1 text-xs text-slate-400">Lihat semua unit</p>
                        </Link>
                    </div>
                    <div className="h-1 bg-gradient-to-r from-[#635bff] via-cyan-400 to-amber-300" />
                </section>

                <section>
                    <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Kelompok inventori</h2>
                            <p className="mt-1 text-sm text-slate-500">Masuk ke kelompok yang ingin Anda pantau.</p>
                        </div>
                        <span className="hidden text-xs font-semibold text-slate-400 sm:block">3 kategori</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {cards.map((card) => {
                            const count = getCount(card.slug);
                            const Icon = card.icon;

                            return (
                                <Link
                                    key={card.slug}
                                    href={`/inventori/daftar-unit/${card.slug}`}
                                    className="group relative min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#c7c3ff] hover:shadow-lg hover:shadow-[#635bff]/10"
                                >
                                    <div className={`absolute inset-x-0 top-0 h-1 ${card.line}`} />
                                    <div className="flex items-start justify-between gap-4">
                                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.accent}`}>
                                            <Icon size={21} strokeWidth={2} />
                                        </div>
                                        <ArrowUpRight size={18} className="text-slate-300 transition group-hover:text-[#635bff]" />
                                    </div>
                                    <p className="mt-5 text-xs font-semibold text-slate-400">{card.title}</p>
                                    <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{formatNumber(count)}</p>
                                    <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">{card.description}</p>
                                    <div className="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold text-[#635bff]">Lihat daftar unit</div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
