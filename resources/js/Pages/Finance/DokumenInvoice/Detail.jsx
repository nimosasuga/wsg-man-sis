import React from "react";
import AdminLayout from "../../../Layouts/AdminLayout";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Calendar, ChevronRight, FileText, WalletCards } from "lucide-react";

const formatRp = (value) =>
    `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const DataItem = ({ label, value, isBadge = false }) => (
    <div className="border-b border-gray-50 py-2 last:border-0">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {label}
        </span>
        {isBadge ? (
            <span className="inline-flex rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                {value || "-"}
            </span>
        ) : (
            <span className="text-xs font-medium text-gray-800">
                {value || "-"}
            </span>
        )}
    </div>
);

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className={`rounded-lg p-3 ${colorClass}`}>
            <Icon size={20} strokeWidth={2.5} />
        </div>
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {title}
            </p>
            <h4 className="text-lg font-black leading-tight text-gray-800">
                {value || "0"}
            </h4>
        </div>
    </div>
);

export default function Detail({ invoiceData }) {
    if (!invoiceData) return <div>Data tidak ditemukan...</div>;

    return (
        <AdminLayout>
            <Head title={`Detail Invoice - ${invoiceData.no_invoice || invoiceData.id_key}`} />

            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="mb-2 flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <Link
                            href="/finance/dokumen-invoice"
                            className="hover:text-blue-600"
                        >
                            DOKUMEN INVOICE
                        </Link>
                        <ChevronRight size={12} className="mx-1" />
                        <span className="text-gray-800">DETAIL INVOICE</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/finance/dokumen-invoice"
                            className="rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-gray-800">
                                {invoiceData.no_invoice || invoiceData.id_key}
                            </h1>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                {invoiceData.vendor_supplier || "Vendor belum tersedia"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <StatCard
                    title="Total Payment"
                    value={formatRp(invoiceData.total_payment)}
                    icon={WalletCards}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Invoice Amount"
                    value={formatRp(invoiceData.invoice_amount)}
                    icon={FileText}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Due Date"
                    value={invoiceData.due_date || "-"}
                    icon={Calendar}
                    colorClass="bg-amber-50 text-amber-600"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-gray-800">
                        Informasi Invoice
                    </h3>
                    <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                        <DataItem label="No Invoice" value={invoiceData.no_invoice} />
                        <DataItem label="Status Dokumen Asli" value={invoiceData.status_dokumen_asli} isBadge />
                        <DataItem label="Tanggal Invoice" value={invoiceData.invoice_date} />
                        <DataItem label="Tanggal Input" value={invoiceData.create_date} />
                        <DataItem label="TOP" value={invoiceData.top} />
                        <DataItem label="Days" value={invoiceData.days} />
                        <DataItem label="Regional" value={invoiceData.regional} />
                        <DataItem label="Area" value={invoiceData.area} />
                        <DataItem label="Divisi" value={invoiceData.divisi} />
                        <DataItem label="Pengajuan" value={invoiceData.pengajuan} />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-gray-800">
                        Nilai & Dokumen
                    </h3>
                    <DataItem label="Vendor / Supplier" value={invoiceData.vendor_supplier} />
                    <DataItem label="Deskripsi Invoice" value={invoiceData.dekripsi_invoice} />
                    <DataItem label="PPN" value={formatRp(invoiceData.ppn)} />
                    <DataItem label="PPH" value={formatRp(invoiceData.pph)} />
                    <DataItem label="Biaya Lainnya" value={formatRp(invoiceData.biaya_lainnya)} />
                    <DataItem label="Upload Invoice" value={invoiceData.upload_invoice} />
                    <DataItem label="Email" value={invoiceData.email} />
                </div>
            </div>
        </AdminLayout>
    );
}
