import { Link } from "@inertiajs/react";
import { ExternalLink } from "lucide-react";
import React from "react";
import AdminLayout from "../Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, FileCheck, Truck, ShieldAlert } from "lucide-react";

// Komponen KPI Card Atas (Analitik Cepat)
const KpiCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    colorClass,
}) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_20px_-6px_rgba(6,81,237,0.15)] transition-all duration-300">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">
                    {title}
                </p>
                <h4 className="text-2xl font-black text-gray-800">{value}</h4>
            </div>
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
        </div>
        <div className="mt-4 flex items-center text-xs font-medium">
            <span
                className={
                    trend === "up" ? "text-emerald-500" : "text-rose-500"
                }
            >
                {trend === "up" ? "▲" : "▼"} {trendLabel}
            </span>
            <span className="text-gray-400 ml-2">dari bulan lalu</span>
        </div>
    </div>
);

// Komponen Reusable Donut Chart yang diperhalus
const DonutCard = ({
    title,
    subtitle,
    data,
    centerText,
    colors,
    detailLink,
}) => {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col h-full hover:border-blue-100 transition-colors relative group">
            {/* Tombol Detail (Muncul & Aktif jika detailLink ada) */}
            {detailLink && (
                <Link
                    href={detailLink}
                    className="absolute top-4 right-4 text-gray-300 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-blue-50 cursor-pointer z-20"
                    title="Lihat Detail Data"
                >
                    <ExternalLink size={18} />
                </Link>
            )}

            <div className="mb-2 min-h-[44px] pr-8">
                <h3 className="text-[13px] font-black text-gray-800 tracking-wide leading-tight">
                    {title}
                </h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">
                    {subtitle}
                </p>
            </div>

            <div className="flex-1 relative w-full flex items-center justify-center min-h-[220px]">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                    {centerText && (
                        <>
                            <span className="text-3xl font-black text-gray-800 leading-none">
                                {centerText.value}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-wider">
                                {centerText.label}
                            </span>
                        </>
                    )}
                </div>

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    className="relative z-10"
                >
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius="65%"
                            outerRadius="85%"
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index % colors.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            cursor={{ fill: "transparent" }}
                            wrapperStyle={{ zIndex: 100 }}
                            contentStyle={{
                                backgroundColor: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                boxShadow:
                                    "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                                padding: "8px 12px",
                            }}
                            itemStyle={{ fontWeight: "900", color: "#1f2937" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center content-start gap-x-3 gap-y-2 mt-4 min-h-[48px]">
                {data.map((entry, index) => (
                    <div
                        key={`legend-${index}`}
                        className="flex items-center text-[11px] font-bold text-gray-600"
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full mr-1.5 shadow-sm"
                            style={{
                                backgroundColor: colors[index % colors.length],
                            }}
                        ></span>
                        {entry.name}
                        <span className="ml-1.5 text-gray-400">
                            ({entry.value})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function Dashboard() {
    // Data dummy tetap sama agar struktur tidak pecah
    const chartData = {
        pajak: [
            { name: "AKTIF", value: 259 },
            { name: "EXPIRED", value: 15 },
            { name: "HAMPIR EXPIRED", value: 0 },
        ],
        stnk: [
            { name: "AKTIF", value: 262 },
            { name: "EXPIRED", value: 15 },
        ],
        kir: [
            { name: "AKTIF", value: 229 },
            { name: "EXPIRED", value: 17 },
            { name: "HAMPIR EXPIRED", value: 31 },
        ],
        docInv: [
            { name: "LENGKAP", value: 2507 },
            { name: "BELUM LENGKAP", value: 836 },
            { name: "[blank]", value: 52 },
        ],
        aktifitasPrimary: [
            { name: "Februari", value: 25 },
            { name: "Maret", value: 106 },
            { name: "April", value: 107 },
            { name: "Mei", value: 36 },
            { name: "Juni", value: 16 },
        ],
        aktifitasSecondary: [{ name: "Juni", value: 45 }],
        fatDocPrimary: [
            { name: "BELUM NAIK", value: 514 },
            { name: "DITERIMA", value: 2390 },
        ],
        fatDocSecondary: [
            { name: "BELUM NAIK", value: 869 },
            { name: "DITERIMA", value: 3852 },
        ],
    };

    const cBlue = ["#3B82F6", "#93C5FD", "#F59E0B"];
    const cDoc = ["#10B981", "#EF4444", "#F59E0B"];

    return (
        <AdminLayout>
            <Head title="Dashboard Analitik" />

            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                        Executive Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Ringkasan operasional dan status armada Washeng.
                    </p>
                </div>
            </div>

            {/* KPI Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KpiCard
                    title="Total Armada Aktif"
                    value="262"
                    icon={Truck}
                    trend="up"
                    trendLabel="4.2%"
                    colorClass="bg-blue-50 text-blue-600"
                />
                <KpiCard
                    title="Dokumen Lengkap"
                    value="2,507"
                    icon={FileCheck}
                    trend="up"
                    trendLabel="12.5%"
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <KpiCard
                    title="Pajak Expired"
                    value="15"
                    icon={AlertCircle}
                    trend="down"
                    trendLabel="2.1%"
                    colorClass="bg-rose-50 text-rose-600"
                />
                <KpiCard
                    title="KIR Hampir Expired"
                    value="31"
                    icon={ShieldAlert}
                    trend="up"
                    trendLabel="8.4%"
                    colorClass="bg-amber-50 text-amber-600"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
                <DonutCard
                    title="STATUS PAJAK"
                    subtitle="Legalitas Kendaraan"
                    data={chartData.pajak}
                    colors={cBlue}
                    centerText={{ label: "Total", value: 274 }}
                    detailLink="/inventori/pajak"
                />
                <DonutCard
                    title="STATUS STNK"
                    subtitle="Legalitas Kendaraan"
                    data={chartData.stnk}
                    colors={cBlue}
                    centerText={{ label: "Total", value: 277 }}
                />
                <DonutCard
                    title="STATUS KIR"
                    subtitle="Kelaikan Kendaraan"
                    data={chartData.kir}
                    colors={cBlue}
                    centerText={{ label: "Total", value: 277 }}
                />
                <DonutCard
                    title="DOKUMEN INVOICE"
                    subtitle="Progress Pemberkasan"
                    data={chartData.docInv}
                    colors={cDoc}
                    centerText={{ label: "Total", value: 3395 }}
                />

                <DonutCard
                    title="AKTIFITAS PRIMARY"
                    subtitle="Distribusi Bulanan"
                    data={chartData.aktifitasPrimary}
                    colors={[
                        "#EF4444",
                        "#F97316",
                        "#EAB308",
                        "#22C55E",
                        "#06B6D4",
                    ]}
                    centerText={{ label: "Total", value: 290 }}
                />
                <DonutCard
                    title="AKTIFITAS SECONDARY"
                    subtitle="Distribusi Bulanan"
                    data={chartData.aktifitasSecondary}
                    colors={["#F97316"]}
                    centerText={{ label: "Total", value: 45 }}
                />
                <DonutCard
                    title="FAT DOC PRIMARY"
                    subtitle="Finance & Tax"
                    data={chartData.fatDocPrimary}
                    colors={["#EF4444", "#10B981"]}
                    centerText={{ label: "Total", value: 2904 }}
                />
                <DonutCard
                    title="FAT DOC SECONDARY"
                    subtitle="Finance & Tax"
                    data={chartData.fatDocSecondary}
                    colors={["#EF4444", "#10B981"]}
                    centerText={{ label: "Total", value: 4721 }}
                />
            </div>
        </AdminLayout>
    );
}
