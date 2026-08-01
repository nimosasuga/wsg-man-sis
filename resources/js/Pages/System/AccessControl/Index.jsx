import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowRight, Check, Plus, ShieldCheck, Users } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

export default function Index({ users = [] }) {
    const { flash = {} } = usePage().props;

    return (
        <AdminLayout>
            <Head title="Role dan Hak Akses" />
            <div className="space-y-5">
                <section className="rounded-xl bg-slate-950 p-5 text-white shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-lg bg-violet-400/15 px-3 py-1.5 text-xs font-black tracking-wider text-violet-200"><ShieldCheck size={15} /> Kontrol Akses</div>
                            <h1 className="mt-4 text-2xl font-black">Role dan Hak Akses</h1>
                            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">Atur bagian sistem yang boleh dibuka dan dikelola oleh setiap pengguna.</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3"><p className="text-[11px] font-black uppercase text-slate-400">Pengguna terdaftar</p><p className="mt-1 text-2xl font-black">{users.length}</p></div>
                    </div>
                </section>

                {flash.success && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"><Check size={17} />{flash.success}</div>}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><div className="flex items-center gap-2"><Users size={18} className="text-violet-600" /><h2 className="text-sm font-black uppercase text-slate-950">Tabel User</h2></div><p className="mt-1 text-xs font-semibold text-slate-500">Klik row pengguna untuk melihat profil dan mengatur aksesnya.</p></div><Link href="/system/access-control/users/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-black text-white transition hover:bg-violet-700"><Plus size={16} />Tambah Pengguna</Link></div>
                    <div className="custom-scrollbar overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left">
                            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500"><tr><th className="px-4 py-3">NIK</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="w-14 px-4 py-3"><span className="sr-only">Detail</span></th></tr></thead>
                            <tbody className="divide-y divide-slate-100">{users.map((user) => <tr key={user.id} role="link" tabIndex={0} onClick={() => router.visit(`/system/access-control/users/${user.id}`)} onKeyDown={(event) => { if (!["Enter", " "].includes(event.key)) return; event.preventDefault(); router.visit(`/system/access-control/users/${user.id}`); }} className="cursor-pointer transition hover:bg-violet-50/60 focus:bg-violet-50 focus:outline-none"><td className="px-4 py-4 text-sm font-black text-slate-950">{user.nik}</td><td className="px-4 py-4 text-sm font-semibold text-slate-600">{user.email}</td><td className="px-4 py-4"><span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black uppercase text-slate-700">{user.role_label}</span></td><td className="px-4 py-4"><ArrowRight size={17} className="text-slate-400" /></td></tr>)}</tbody>
                        </table>
                    </div>
                </section>

            </div>
        </AdminLayout>
    );
}
