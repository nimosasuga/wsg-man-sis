import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowLeft, Check, Edit3, LockKeyhole, Save, ShieldCheck, Trash2, User } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

export default function Detail({ userRecord, roles = [], permissions = [], backUrl = "/system/access-control" }) {
    const { flash = {}, errors = {} } = usePage().props;
    const [role, setRole] = useState(userRecord.role || "");
    const [directPermissions, setDirectPermissions] = useState(userRecord.directPermissions || []);
    const [processing, setProcessing] = useState(false);
    const selectedRolePermissions = useMemo(() => roles.find((item) => item.name === role)?.permissions || [], [roles, role]);
    const rolePermissionNames = useMemo(() => new Set(selectedRolePermissions), [selectedRolePermissions]);
    const allPermissionNames = useMemo(() => permissions.map((permission) => permission.name), [permissions]);
    const isSuperAdmin = role === "super-admin";
    const hasFullAccess = isSuperAdmin || allPermissionNames.every((name) => rolePermissionNames.has(name) || directPermissions.includes(name));

    const togglePermission = (permission) => {
        if (isSuperAdmin || rolePermissionNames.has(permission)) return;
        setDirectPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
    };

    const toggleFullAccess = () => {
        if (isSuperAdmin) return;
        setDirectPermissions(hasFullAccess ? [] : allPermissionNames.filter((name) => !rolePermissionNames.has(name)));
    };

    const saveAccess = () => {
        setProcessing(true);
        router.put(`/system/access-control/users/${userRecord.id}/access`, { role, permissions: directPermissions }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const destroy = () => {
        if (userRecord.isCurrentUser || !window.confirm(`Hapus pengguna ${userRecord.nik}?`)) return;
        router.delete(`/system/access-control/users/${userRecord.id}`);
    };

    return <AdminLayout><Head title={`Akses User - ${userRecord.nik}`} />
        <div className="space-y-5">
            <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3"><Link href={backUrl} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-white hover:bg-white hover:text-slate-950"><ArrowLeft size={18} /></Link><div><p className="text-xs font-black uppercase tracking-wider text-cyan-200">Detail User</p><h1 className="mt-2 break-words text-2xl font-black">{userRecord.nik}</h1><p className="mt-1 break-all text-sm font-semibold text-slate-300">{userRecord.email}</p></div></div>
                    <div className="flex flex-wrap gap-2"><Link href={`/system/access-control/users/${userRecord.id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-black text-white hover:bg-cyan-500"><Edit3 size={16} />Edit User</Link>{!userRecord.isCurrentUser && <button type="button" onClick={destroy} className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/15 px-4 text-sm font-black text-rose-200 hover:bg-rose-500 hover:text-white"><Trash2 size={16} />Hapus</button>}</div>
                </div>
            </section>

            {flash.success && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><Check size={17} />{flash.success}</div>}
            {Object.values(errors).map((error) => <div key={error} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>)}

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2"><User size={18} className="text-cyan-600"/><h2 className="text-sm font-black uppercase text-slate-950">Role Utama</h2></div>
                <label className="mt-4 block max-w-md"><span className="mb-1 block text-[11px] font-black uppercase text-slate-500">Role pengguna</span><select value={role} onChange={(event) => { setRole(event.target.value); setDirectPermissions([]); }} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">{roles.map((item) => <option key={item.name} value={item.name}>{item.label}</option>)}</select></label>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-2"><LockKeyhole size={18} className="text-cyan-600"/><h2 className="text-sm font-black uppercase text-slate-950">Akses User</h2></div>
                <p className="mt-1 text-xs font-semibold text-slate-500">Izin dari role aktif otomatis. Centang izin tambahan khusus untuk pengguna ini.</p>
                <label className={`mt-4 flex items-center justify-between gap-4 rounded-xl border p-4 ${hasFullAccess ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><span><span className="flex items-center gap-2 text-sm font-black text-slate-950"><ShieldCheck size={17}/>Akses penuh semua modul</span><span className="mt-1 block text-xs font-semibold text-slate-500">Satu pilihan untuk seluruh akses baca dan kelola.</span></span><input type="checkbox" checked={hasFullAccess} disabled={isSuperAdmin} onChange={toggleFullAccess} className="h-5 w-5 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"/></label>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{permissions.map((permission) => { const inherited = isSuperAdmin || rolePermissionNames.has(permission.name); const checked = inherited || directPermissions.includes(permission.name); return <label key={permission.name} className={`flex items-start gap-3 rounded-lg border p-3 ${checked ? "border-cyan-200 bg-cyan-50/60" : "border-slate-200"}`}><input type="checkbox" checked={checked} disabled={inherited} onChange={() => togglePermission(permission.name)} className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"/><span><span className="block text-sm font-black text-slate-800">{permission.label}</span><span className="mt-0.5 block text-[11px] font-semibold text-slate-400">{inherited ? "Dari role" : permission.name}</span></span></label>; })}</div>
                <div className="mt-5 flex justify-end"><button type="button" disabled={processing} onClick={saveAccess} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white hover:bg-cyan-700 disabled:opacity-50"><Save size={16}/>Simpan Akses User</button></div>
            </section>
        </div>
    </AdminLayout>;
}
