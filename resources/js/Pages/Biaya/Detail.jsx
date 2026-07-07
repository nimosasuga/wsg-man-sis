import React from "react";
import AdminLayout from "../../Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, ChevronRight } from "lucide-react";

const moneyKeys = new Set([
    "biaya_pajak",
    "biaya_kir",
    "tarif_unit",
    "ad_hock",
    "total_biaya_service",
    "total_biaya_ganti_ban",
    "total_biaya_operasional",
    "total_tarif_unit_berjalan",
    "total_profit_hari_ini",
]);

const inventoriFields = [
    ["NOPOL", "nopol"],
    ["ID", "id_key"],
    ["REGION", "region"],
    ["AREA", "area"],
    ["AREA ASAL", "area_asal"],
    ["INVENTARIS", "inventaris"],
    ["TIPE", "tipe"],
    ["PABRIKAN", "pabrikan"],
    ["MODEL", "model"],
    ["JENIS", "jenis"],
    ["GPS", "gps"],
    ["NO. MESIN", "no_mesin"],
    ["NO. RANGKA", "no_rangka"],
    ["PROJECT", "project"],
    ["TAHUN PERAKITAN", "tahun"],
    ["TAHUN PEMBELIAN", "tahun_pembelian"],
    ["DISTRIBUSI", "distribusi"],
    ["STATUS PEMBELIAN", "status"],
    ["FOTO STNK", "foto_stnk"],
    ["JATUH TEMPO STNK", "jatuh_tempo_stnk"],
    ["MASA AKTIF STNK", "masa_aktif_stnk"],
    ["STATUS STNK", "status_stnk"],
    ["KETERANGAN STNK", "keterangan_stnk"],
    ["JATUH TEMPO PAJAK", "jatuh_tempo_pajak"],
    ["MASA AKTIF PAJAK", "masa_aktif_pajak"],
    ["STATUS PAJAK", "status_pajak"],
    ["BIAYA PAJAK", "biaya_pajak"],
    ["FOTO PAJAK", "foto_pajak"],
    ["JATUH TEMPO KIR", "jatuh_tempo_kir"],
    ["MASA AKTIF KIR", "masa_aktif_kir"],
    ["STATUS KIR", "status_kir"],
    ["BIAYA KIR", "biaya_kir"],
    ["FOTO BUKU KIR", "foto_buku_kir"],
    ["MY PERTAMINA", "my_pertamina"],
    ["TARIF UNIT", "tarif_unit"],
    ["AD-HOCK", "ad_hock"],
];

const relatedLabels = [
    "Related TABUNGAN MITRAs",
    "Related FILTER BANs",
    "Related FILTERs",
    "RIWAYAT SERVICE",
    "RIWAYAT GANTI BAN",
];

const statFields = [
    ["QTY SERVICE", "qty_service"],
    ["TOTAL BIAYA SERVICE", "total_biaya_service"],
    ["QTY GANTI BAN", "qty_ganti_ban"],
    ["TOTAL BIAYA GANTI BAN", "total_biaya_ganti_ban"],
    ["TOTAL BIAYA OPERASIONAL", "total_biaya_operasional"],
    ["PRIMARY", "primary"],
    ["SECONDARY", "secondary"],
];

const formatRp = (value) =>
    `Rp${Number(value || 0).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatValue = (key, value) => {
    if (moneyKeys.has(key)) return formatRp(value);
    if (value === null || value === undefined || value === "") return "-";
    return String(value);
};

const FieldItem = ({ label, value }) => (
    <div className="border-b border-slate-100 py-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
            {value}
        </p>
    </div>
);

function InventoriDetail({ record, relatedStats }) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
                    {inventoriFields.map(([label, key]) => (
                        <FieldItem
                            key={key}
                            label={label}
                            value={formatValue(key, record[key])}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {relatedLabels.map((label) => (
                    <div
                        key={label}
                        className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-black text-slate-800 shadow-sm"
                    >
                        {label}
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 xl:grid-cols-3">
                    {statFields.map(([label, key]) => (
                        <FieldItem
                            key={key}
                            label={label}
                            value={formatValue(key, relatedStats?.[key])}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function GenericDetail({ record }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(record || {}).map(([key, value]) => (
                    <FieldItem
                        key={key}
                        label={key.replaceAll("_", " ")}
                        value={formatValue(key, value)}
                    />
                ))}
            </div>
        </div>
    );
}

export default function Detail({ category, record, relatedStats }) {
    return (
        <AdminLayout>
            <Head title={`Detail Biaya - ${category.title}`} />

            <div className="mb-5 flex items-center gap-3">
                <Link
                    href={`/biaya/${category.slug}`}
                    className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="mb-1 flex flex-wrap items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <Link href="/biaya" className="hover:text-blue-600">BIAYA</Link>
                        <ChevronRight size={12} className="mx-1" />
                        <Link href={`/biaya/${category.slug}`} className="hover:text-blue-600">
                            RINCIAN BIAYA {category.title}
                        </Link>
                        <ChevronRight size={12} className="mx-1" />
                        <span className="text-slate-900">DETAIL</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">
                        {record?.nopol || record?.id_key || "Detail"} - {category.title}
                    </h1>
                </div>
            </div>

            {category.source === "inventori" ? (
                <InventoriDetail record={record} relatedStats={relatedStats} />
            ) : (
                <GenericDetail record={record} />
            )}
        </AdminLayout>
    );
}
