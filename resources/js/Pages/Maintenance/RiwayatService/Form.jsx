import React, { useEffect } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Save } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
            {children}
            {error && <span className="mt-1 block text-xs font-bold text-rose-600">{error}</span>}
        </label>
    );
}

function TextInput({ value, onChange, type = "text", placeholder, readOnly = false }) {
    return (
        <input
            type={type}
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`h-11 w-full rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${readOnly ? "bg-slate-100 text-slate-600" : "bg-white"}`}
        />
    );
}

function TextArea({ value, onChange, placeholder }) {
    return (
        <textarea
            value={value || ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        />
    );
}

function UnitSelect({ value, units, onChange }) {
    return (
        <select
            value={value || ""}
            onChange={(event) => {
                const unit = units.find((item) => item.nopol === event.target.value);
                onChange(event.target.value, unit);
            }}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
        >
            <option value="">Pilih nopol</option>
            {units.map((unit) => (
                <option key={unit.nopol} value={unit.nopol}>{unit.nopol} - {unit.area || "Tanpa area"}</option>
            ))}
        </select>
    );
}

const serviceFields = [
    ["area", "Area"],
    ["driver", "Driver"],
    ["mode_service", "Mode Service"],
    ["tanggal_services", "Tanggal Service", "date"],
    ["odo_services", "Odo Service", "number"],
    ["tipe_service", "Tipe Service"],
    ["spare_parts", "Spare Parts"],
    ["jenis_spare_parts", "Jenis Spare Parts"],
    ["harga_parts", "Harga Parts", "number"],
    ["nama_bengkel", "Nama Bengkel"],
    ["total_biaya_service", "Total Biaya Service", "number"],
    ["status_penbayaran", "Status Pembayaran"],
    ["nama", "Nama Input"],
];

const banFields = [
    ["area", "Area"],
    ["driver", "Driver"],
    ["tanggal_ganti_ban", "Tanggal Ganti Ban"],
    ["jenis_pengerjaan", "Jenis Pengerjaan"],
    ["posisi", "Posisi"],
    ["kilometer_ganti_ban", "KM Ganti Ban", "number"],
    ["kilometer_ganti_ban_sebelumnya", "KM Ganti Sebelumnya", "number"],
    ["total_kilometer_pemakaian_ban", "Total KM Pemakaian", "number"],
    ["qty_ban", "Qty Ban", "number"],
    ["no_seri_ban_lama", "No Seri Ban Lama"],
    ["no_seri_ban_baru", "No Seri Ban Baru"],
    ["jenis_ban", "Jenis Ban"],
    ["tipe_ban", "Tipe Ban"],
    ["harga_ban", "Harga Ban", "number"],
    ["tools", "Tools"],
    ["ban_dalam", "Ban Dalam"],
    ["harga_ban_dalam", "Harga Ban Dalam", "number"],
    ["marset", "Marset"],
    ["harga_marset", "Harga Marset", "number"],
    ["total_harga", "Total Harga", "number"],
    ["nama_toko", "Nama Toko"],
    ["email", "Email"],
];

export default function Form({ type = "service", mode = "create", record = {}, options = {}, submitUrl = "", backUrl = "/riwayat-service-unit" }) {
    const isService = type === "service";
    const title = `${mode === "create" ? "Tambah" : "Edit"} ${isService ? "Service Umum" : "Service Ban"}`;
    const fields = isService ? serviceFields : banFields;
    const { data, setData, post, put, processing, errors } = useForm(record);
    const readOnlyBanFields = ["total_kilometer_pemakaian_ban", "total_harga"];

    const toNumber = (value) => {
        if (value === null || value === undefined || value === "") return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    useEffect(() => {
        if (isService) return;

        const kmNow = toNumber(data.kilometer_ganti_ban);
        const kmBefore = toNumber(data.kilometer_ganti_ban_sebelumnya);
        const totalKm = kmNow !== null && kmBefore !== null ? Math.max(0, kmNow - kmBefore) : "";
        const totalHarga =
            (toNumber(data.harga_ban) || 0)
            + (toNumber(data.harga_ban_dalam) || 0)
            + (toNumber(data.harga_marset) || 0);

        const nextTotalHarga = totalHarga > 0 ? totalHarga : "";
        if (String(data.total_kilometer_pemakaian_ban || "") === String(totalKm) && String(data.total_harga || "") === String(nextTotalHarga)) {
            return;
        }

        setData((values) => ({
            ...values,
            total_kilometer_pemakaian_ban: totalKm,
            total_harga: nextTotalHarga,
        }));
    }, [
        isService,
        data.kilometer_ganti_ban,
        data.kilometer_ganti_ban_sebelumnya,
        data.harga_ban,
        data.harga_ban_dalam,
        data.harga_marset,
    ]);

    const submit = (event) => {
        event.preventDefault();
        if (mode === "create") {
            post(submitUrl);
            return;
        }
        put(submitUrl);
    };

    const handleUnit = (nopol, unit) => {
        setData((values) => ({
            ...values,
            nopol,
            area: unit?.area || values.area || "",
            driver: unit?.driver || values.driver || "",
        }));
    };

    return (
        <AdminLayout>
            <Head title={title} />

            <form onSubmit={submit} className="space-y-5">
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50">
                                <ArrowLeft size={19} />
                            </Link>
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-wide text-cyan-700">Riwayat Service Unit</p>
                                <h1 className="truncate text-xl font-black uppercase text-slate-950">{title}</h1>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-xs font-black uppercase tracking-wide text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} />
                            Simpan Data
                        </button>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Identitas Unit</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Pilih nopol untuk menarik area dan driver dari data unit lokal bila tersedia.</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        <Field label="Nopol" error={errors.nopol}>
                            <UnitSelect value={data.nopol} units={options.units || []} onChange={handleUnit} />
                        </Field>
                        <Field label="Area" error={errors.area}>
                            <TextInput value={data.area} onChange={(value) => setData("area", value)} />
                        </Field>
                        <Field label="Driver" error={errors.driver}>
                            <TextInput value={data.driver} onChange={(value) => setData("driver", value)} />
                        </Field>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Detail Pekerjaan</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {fields.filter(([name]) => !["area", "driver"].includes(name)).map(([name, label, inputType]) => (
                            <Field key={name} label={label} error={errors[name]}>
                                <TextInput
                                    value={data[name]}
                                    type={inputType || "text"}
                                    readOnly={!isService && readOnlyBanFields.includes(name)}
                                    onChange={(value) => setData(name, value)}
                                />
                                {!isService && name === "total_kilometer_pemakaian_ban" && (
                                    <p className="mt-1 text-xs font-semibold text-slate-400">Dihitung dari KM ganti ban dikurangi KM sebelumnya.</p>
                                )}
                                {!isService && name === "total_harga" && (
                                    <p className="mt-1 text-xs font-semibold text-slate-400">Dihitung dari harga ban, ban dalam, dan marset.</p>
                                )}
                            </Field>
                        ))}
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {isService ? (
                            <>
                                <Field label="Keluhan" error={errors.keluhan}>
                                    <TextArea value={data.keluhan} onChange={(value) => setData("keluhan", value)} />
                                </Field>
                                <Field label="Keterangan" error={errors.keterangan}>
                                    <TextArea value={data.keterangan} onChange={(value) => setData("keterangan", value)} />
                                </Field>
                                <Field label="Komentar Admin Maintenance" error={errors.komentar_admin_maintenance}>
                                    <TextArea value={data.komentar_admin_maintenance} onChange={(value) => setData("komentar_admin_maintenance", value)} />
                                </Field>
                            </>
                        ) : (
                            <Field label="Keterangan" error={errors.keterangan}>
                                <TextArea value={data.keterangan} onChange={(value) => setData("keterangan", value)} />
                            </Field>
                        )}
                    </div>
                </section>
            </form>
        </AdminLayout>
    );
}
