import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Check, ChevronRight, ClipboardCheck, X } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

const identityFields = [
    { label: "ID", key: "id_key" },
    { label: "Tanggal", key: "tanggal" },
    { label: "Nopol", key: "nopol" },
    { label: "Tipe Unit", key: "tipe_unit" },
    { label: "Area", key: "area" },
    { label: "Driver", key: "driver" },
    { label: "Status Checklist", key: "status_checklist" },
    { label: "HP Driver", key: "hp_driver" },
    { label: "Email", key: "email" },
];

const checklistFields = [
    { label: "Surat Kendaraan", key: "surat_kendaraan" },
    { label: "Kebersihan Kabin", key: "kebersihan_unit_kabin" },
    { label: "Mesin/Oli", key: "kondisi_mesin_oli" },
    { label: "Service Berkala", key: "service_berkala" },
    { label: "Air Radiator", key: "air_radiator" },
    { label: "Air Aki", key: "air_aki" },
    { label: "Kondisi Rem", key: "kondisi_rem" },
    { label: "Indikator Dashboard", key: "indikator_dashboard" },
    { label: "Kebersihan Box", key: "kondisi_kebersihan_box" },
    { label: "Klakson", key: "klakson" },
    { label: "Lampu", key: "lampu_lampu" },
    { label: "APAR", key: "apar" },
    { label: "Safety Belt", key: "safety_belt" },
    { label: "P3K", key: "p3k" },
    { label: "Dongkrak", key: "dongkrak" },
    { label: "Kunci Roda", key: "kunci_roda" },
    { label: "Engsel Pengunci Pintu", key: "engsel_pengunci_pintu" },
    { label: "Gembok", key: "gembok" },
    { label: "Kondisi Ban", key: "kondisi_ban" },
    { label: "Tekanan Angin Ban", key: "tekanan_angin_ban" },
];

const mediaFields = [
    { label: "Foto Ban", key: "foto_ban" },
    { label: "Foto Unit", key: "foto_unit" },
    { label: "Paraf", key: "paraf" },
    { label: "Respon Admin Maintenance", key: "respon_admin_maintenance" },
];

const normalize = (value) => (value ? String(value).trim().toUpperCase() : "TIDAK DIKETAHUI");

function isChecked(value) {
    const text = normalize(value);
    const raw = value ? String(value) : "";

    if (
        raw.includes("\u274c") ||
        raw.includes("\u2716") ||
        raw.includes("\u00d7") ||
        raw.includes("\u009d") ||
        text === "X" ||
        text === "SILANG" ||
        text === "CROSS"
    ) {
        return false;
    }

    if (
        raw.includes("\u2705") ||
        raw.includes("\u2714") ||
        raw.includes("\u2713") ||
        raw.includes("\u0153") ||
        ["OK", "BAIK", "ADA", "YA", "YES", "TRUE", "1", "CHECK", "CHECKED"].includes(text)
    ) {
        return true;
    }

    return ![
        "",
        "0",
        "NO",
        "N",
        "FALSE",
        "TIDAK",
        "TIDAK ADA",
        "TIDAK BAIK",
        "RUSAK",
        "N/A",
        "TIDAK DIKETAHUI",
    ].includes(text);
}

function InfoItem({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-2 break-words text-sm font-black text-slate-950">{value || "-"}</p>
        </div>
    );
}

function ChecklistItem({ label, value }) {
    const checked = isChecked(value);

    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-white p-3 shadow-sm shadow-slate-950/5">
            <div>
                <p className="text-sm font-black text-slate-800">{label}</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{value || "-"}</p>
            </div>
            <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${
                    checked
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                        : "border-rose-200 bg-rose-50 text-rose-600"
                }`}
            >
                {checked ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
            </span>
        </div>
    );
}

export default function ToolkitDetail({ checklist }) {
    const checkedCount = checklistFields.filter((field) => isChecked(checklist?.[field.key])).length;
    const issueCount = checklistFields.length - checkedCount;

    return (
        <AdminLayout>
            <Head title={`${checklist?.nopol || "Toolkit"} - Detail Checklist`} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                    <Link href="/inventori/daftar-asset" className="transition hover:text-cyan-600">
                        Daftar Asset
                    </Link>
                    <ChevronRight size={16} />
                    <Link href="/inventori/daftar-asset/toolkit" className="transition hover:text-cyan-600">
                        Toolkit
                    </Link>
                    <ChevronRight size={16} />
                    <span className="text-slate-950">{checklist?.nopol || "Detail"}</span>
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                                <ClipboardCheck size={23} />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wide text-cyan-600">
                                    Detail Checklist Toolkit
                                </p>
                                <h1 className="mt-2 text-2xl font-black text-slate-950">
                                    {checklist?.nopol || "-"}
                                </h1>
                                <p className="mt-2 text-sm font-semibold text-slate-500">
                                    {checklist?.tanggal || "-"} · {checklist?.area || "-"} · {checklist?.status_checklist || "-"}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/inventori/daftar-asset/toolkit"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={16} />
                            Kembali
                        </Link>
                    </div>
                </section>

                <div className="grid gap-4 md:grid-cols-3">
                    <InfoItem label="Checklist Lengkap" value={checkedCount} />
                    <InfoItem label="Perlu Perhatian" value={issueCount} />
                    <InfoItem label="Total Item" value={checklistFields.length} />
                </div>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Informasi Unit</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {identityFields.map((field) => (
                            <InfoItem key={field.key} label={field.label} value={checklist?.[field.key]} />
                        ))}
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Hasil Checklist</h2>
                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {checklistFields.map((field) => (
                            <ChecklistItem key={field.key} label={field.label} value={checklist?.[field.key]} />
                        ))}
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Keluhan</h2>
                        <p className="mt-4 min-h-28 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                            {checklist?.keluhan || "Tidak ada keluhan."}
                        </p>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                        <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Lampiran</h2>
                        <div className="mt-5 space-y-3">
                            {mediaFields.map((field) => (
                                <InfoItem key={field.key} label={field.label} value={checklist?.[field.key]} />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
