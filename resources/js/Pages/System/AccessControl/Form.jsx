import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

function Field({ label, error, children }) {
    return <label className="block"><span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>{children}{error && <span className="mt-1 block text-xs font-bold text-rose-600">{error}</span>}</label>;
}

export default function Form({ mode = "create", userRecord = {}, roles = [], submitUrl, backUrl }) {
    const isEdit = mode === "edit";
    const { data, setData, post, put, processing, errors } = useForm({
        nik: userRecord.nik || "",
        email: userRecord.email || "",
        role: userRecord.role || roles.find((role) => role.name === "viewer")?.name || "",
        password: "",
        password_confirmation: "",
    });
    const submit = (event) => { event.preventDefault(); isEdit ? put(submitUrl) : post(submitUrl); };
    const inputClass = "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

    return <AdminLayout><Head title={isEdit ? "Edit User" : "Tambah User"}/><div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm"><div className="flex items-start gap-3"><Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 hover:bg-white hover:text-slate-950"><ArrowLeft size={18}/></Link><div><div className="inline-flex items-center gap-2 text-xs font-black tracking-wider text-violet-200"><UserPlus size={15}/>{isEdit ? "Edit User" : "User Baru"}</div><h1 className="mt-2 text-2xl font-black">{isEdit ? userRecord.nik : "Tambah Pengguna"}</h1></div></div></section>
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-5 sm:grid-cols-2">
            <Field label="NIK / ID Login" error={errors.nik}><input value={data.nik} onChange={(event) => setData("nik", event.target.value)} className={inputClass} required/></Field>
            <Field label="Email" error={errors.email}><input type="email" value={data.email} onChange={(event) => setData("email", event.target.value)} className={inputClass} required/></Field>
            <Field label="Role" error={errors.role}><select value={data.role} onChange={(event) => setData("role", event.target.value)} className={inputClass} required><option value="" disabled>Pilih role</option>{roles.map((role) => <option key={role.name} value={role.name}>{role.label}</option>)}</select></Field>
            <div className="hidden sm:block"/>
            <Field label={isEdit ? "Password Baru (opsional)" : "Password"} error={errors.password}><input type="password" value={data.password} onChange={(event) => setData("password", event.target.value)} className={inputClass} required={!isEdit}/></Field>
            <Field label="Konfirmasi Password" error={errors.password_confirmation}><input type="password" value={data.password_confirmation} onChange={(event) => setData("password_confirmation", event.target.value)} className={inputClass} required={!isEdit || data.password !== ""}/></Field>
        </div><div className="mt-6 flex justify-end"><button type="submit" disabled={processing} className="inline-flex h-11 items-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-50"><Save size={16}/>{isEdit ? "Simpan Perubahan" : "Buat Pengguna"}</button></div></form>
    </div></AdminLayout>;
}
