import React, { useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { ArrowRight, Check, Plus, Search, ShieldCheck, Users, X } from "lucide-react";
import AdminLayout from "../../../Layouts/AdminLayout";

export default function Index({ users = [] }) {
    const { flash = {} } = usePage().props;
    const [search, setSearch] = useState("");
    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return users;

        return users.filter((user) => [user.nik, user.email, user.role_label]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query)));
    }, [search, users]);

    return (
        <AdminLayout>
            <Head title="Role dan Hak Akses" />
            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                    <Link href="/dashboard" className="transition hover:text-violet-600">Dashboard</Link>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-900">Role & Akses</span>
                </div>

                <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:p-7">
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-300" />
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                                <ShieldCheck size={15} /> Kontrol akses
                            </div>
                            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Role dan hak akses</h1>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Atur peran dan akses kerja setiap pengguna dari satu tempat. Pilih pengguna untuk melihat rincian izinnya.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:w-[260px]">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-semibold text-slate-500">Pengguna</p>
                                <p className="mt-1 text-2xl font-extrabold tabular-nums text-slate-950">{users.length}</p>
                            </div>
                            <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                                <p className="text-xs font-semibold text-violet-600">Ditemukan</p>
                                <p className="mt-1 text-2xl font-extrabold tabular-nums text-violet-950">{filteredUsers.length}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {flash.success && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><Check size={17} />{flash.success}</div>}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2"><Users size={19} className="text-violet-600" /><h2 className="text-base font-extrabold text-slate-950">Pengguna sistem</h2></div>
                            <p className="mt-1 text-sm text-slate-500">Klik satu baris untuk mengatur profil, role, dan aksesnya.</p>
                        </div>
                        <Link href="/system/access-control/users/create" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700"><Plus size={17} />Tambah pengguna</Link>
                    </div>
                    <div className="border-b border-slate-100 p-3 sm:p-4">
                        <div className="relative max-w-xl">
                            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input id="access-control-user-search" name="access-control-user-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari NIK, email, atau role..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200/50" />
                            {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700" aria-label="Hapus pencarian"><X size={17} /></button>}
                        </div>
                    </div>
                    <div className="custom-scrollbar overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">NIK</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th><th className="w-16 px-5 py-3"><span className="sr-only">Detail</span></th></tr></thead>
                            <tbody className="divide-y divide-slate-100">{filteredUsers.map((user) => <tr key={user.id} role="link" tabIndex={0} onClick={() => router.visit(`/system/access-control/users/${user.id}`)} onKeyDown={(event) => { if (!["Enter", " "].includes(event.key)) return; event.preventDefault(); router.visit(`/system/access-control/users/${user.id}`); }} className="cursor-pointer transition hover:bg-violet-50/60 focus:bg-violet-50 focus:outline-none"><td className="px-5 py-4 text-sm font-bold text-slate-950">{user.nik}</td><td className="px-5 py-4 text-sm text-slate-600">{user.email}</td><td className="px-5 py-4"><span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{user.role_label}</span></td><td className="px-5 py-4"><ArrowRight size={17} className="text-slate-400" /></td></tr>)}</tbody>
                        </table>
                    </div>
                    {!filteredUsers.length && <div className="p-8 text-center text-sm font-medium text-slate-500">Tidak ada pengguna yang cocok dengan pencarian ini.</div>}
                </section>
            </div>
        </AdminLayout>
    );
}
