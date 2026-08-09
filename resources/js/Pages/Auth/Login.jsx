import React, { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Database,
    Eye,
    EyeOff,
    LockKeyhole,
    LogIn,
    ShieldCheck,
    Truck,
    UserRound,
} from "lucide-react";

const capabilityItems = [
    {
        icon: Truck,
        title: "Operasional terpantau",
        description: "Armada, perjalanan, dan dokumen dalam satu sistem.",
    },
    {
        icon: Database,
        title: "Data terpusat",
        description: "Informasi kerja tersedia sesuai kewenangan pengguna.",
    },
    {
        icon: ShieldCheck,
        title: "Akses terlindungi",
        description: "Setiap modul mengikuti role dan hak akses akun.",
    },
];

export default function Login({ status }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        nik: "",
        password: "",
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route("login"));
    };

    return (
        <div className="min-h-[100dvh] bg-[#fffaf7] font-sans text-slate-950 lg:grid lg:grid-cols-[minmax(320px,0.82fr)_minmax(480px,1.18fr)]">
            <Head title="Masuk - Washeng Manajemen Sistem" />

            <aside className="login-brand-panel relative hidden h-[100dvh] overflow-hidden bg-orange-600 p-6 text-white lg:flex lg:flex-col lg:justify-between xl:p-8">
                <div className="pointer-events-none absolute -right-20 top-20 h-40 w-40 rounded-[36px] border border-white/20" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-[48px] border border-white/15" />

                <div className="relative flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white shadow-lg shadow-orange-950/15">
                        <img
                            src="/Icon-512x512-px.webp"
                            alt="Logo Washeng"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-base font-extrabold leading-tight">Washeng</p>
                        <p className="mt-0.5 text-[11px] font-medium text-orange-100">
                            Manajemen Sistem
                        </p>
                    </div>
                </div>

                <div className="relative my-4 max-w-lg xl:my-5">
                    <span className="inline-flex items-center rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-orange-50">
                        Pusat kendali perusahaan
                    </span>
                    <h1 className="mt-3 max-w-lg text-[1.65rem] font-black leading-[1.12] tracking-tight xl:text-3xl">
                        Satu akses untuk pekerjaan yang lebih tertata.
                    </h1>
                    <p className="mt-2.5 max-w-lg text-xs leading-5 text-orange-100 xl:text-sm">
                        Pantau kegiatan operasional dan kelola informasi perusahaan
                        dengan alur kerja yang jelas.
                    </p>

                    <div className="mt-4 grid gap-2">
                        {capabilityItems.map(({ icon: Icon, title, description }) => (
                            <div
                                key={title}
                                className="flex items-start gap-2.5 rounded-xl border border-white/20 bg-white/10 p-2.5"
                            >
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-orange-600">
                                    <Icon size={15} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold leading-4 text-white xl:text-xs">{title}</p>
                                    <p className="mt-0.5 text-[10px] leading-4 text-orange-100 xl:text-[11px]">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-[10px] font-medium text-orange-100 xl:text-[11px]">
                    Washeng Keke Mandiri
                </p>
            </aside>

            <main className="flex min-h-[100dvh] min-w-0 flex-col overflow-y-auto">
                <header className="flex items-center gap-3 border-b border-orange-100 bg-white px-5 py-4 lg:hidden">
                    <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
                        <img
                            src="/Icon-512x512-px.webp"
                            alt="Logo Washeng"
                            className="h-full w-full object-cover"
                        />
                    </div>
                    <div>
                        <p className="font-extrabold text-slate-950">Washeng</p>
                        <p className="text-xs font-medium text-slate-500">
                            Manajemen Sistem
                        </p>
                    </div>
                </header>

                <div className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8 lg:px-10 lg:py-5 xl:px-14">
                    <div className="login-form-panel w-full max-w-[420px]">
                        <div className="mb-6">
                            <div className="mb-3 hidden h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600 lg:grid">
                                <ShieldCheck size={21} strokeWidth={2.2} />
                            </div>
                            <p className="text-sm font-bold text-orange-600">Selamat datang</p>
                            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                Masuk ke sistem
                            </h2>
                            <p className="mt-2 text-sm leading-5 text-slate-600">
                                Gunakan NIK dan kata sandi yang terdaftar pada akun Anda.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="login-nik"
                                    className="mb-2 block text-sm font-bold text-slate-700"
                                >
                                    NIK / ID karyawan
                                </label>
                                <div className="relative">
                                    <UserRound
                                        size={19}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        id="login-nik"
                                        name="nik"
                                        type="text"
                                        value={data.nik}
                                        onChange={(event) => setData("nik", event.target.value)}
                                        className="block h-11 w-full rounded-xl border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm placeholder:font-normal placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500"
                                        placeholder="Masukkan NIK"
                                        required
                                        autoComplete="username"
                                        autoFocus
                                    />
                                </div>
                                {errors.nik && (
                                    <p className="mt-2 text-sm font-medium text-red-600">
                                        {errors.nik}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                        htmlFor="login-password"
                                        className="text-sm font-bold text-slate-700"
                                    >
                                        Kata sandi
                                    </label>
                                    <Link
                                        href={route("password.request")}
                                        className="text-sm font-bold text-orange-600 transition hover:text-orange-700"
                                    >
                                        Lupa sandi?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <LockKeyhole
                                        size={19}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        id="login-password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(event) =>
                                            setData("password", event.target.value)
                                        }
                                        className="block h-11 w-full rounded-xl border-slate-200 bg-white pl-11 pr-12 text-sm font-semibold text-slate-900 shadow-sm placeholder:font-normal placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500"
                                        placeholder="Masukkan kata sandi"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((visible) => !visible)}
                                        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        aria-label={
                                            showPassword
                                                ? "Sembunyikan kata sandi"
                                                : "Tampilkan kata sandi"
                                        }
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm font-medium text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-600">
                                <input
                                    id="login-remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(event) =>
                                        setData("remember", event.target.checked)
                                    }
                                    className="rounded border-slate-300 text-orange-600 shadow-sm focus:ring-orange-500"
                                />
                                Ingat saya di perangkat ini
                            </label>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? "Memeriksa akun..." : "Masuk ke sistem"}
                                <LogIn size={18} strokeWidth={2.3} />
                            </button>
                        </form>

                        <div className="mt-6 flex items-center gap-3 text-xs font-medium text-slate-400">
                            <span className="h-px flex-1 bg-slate-200" />
                            Akses internal perusahaan
                            <span className="h-px flex-1 bg-slate-200" />
                        </div>

                        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                            &copy; {new Date().getFullYear()} Washeng Manajemen Sistem
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
