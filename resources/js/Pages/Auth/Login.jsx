// resources/js/Pages/Auth/Login.jsx
import React from "react";
import { Head, useForm } from "@inertiajs/react";
import { Mail, Lock, LogIn, ShieldCheck } from "lucide-react";

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        nik: "", // Ganti email menjadi nik
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        // Mengarah ke route login bawaan Breeze sementara waktu
        post(route("login"));
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 font-sans">
            <Head title="Log in - Washeng System" />

            {/* Efek Background Gradient */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-blue-900/40 to-slate-900"></div>

            {/* Dekorasi Orb Melayang */}
            <div className="login-orb login-orb-a absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl z-0" />
            <div className="login-orb login-orb-b absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl z-0" />

            {/* Container Login Card (Glassmorphism) */}
            <div className="relative z-10 w-full max-w-md px-6">
                <div className="login-card backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden">
                    {/* Aksen Garis Atas */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>

                    <div className="text-center mb-8">
                        <div className="login-badge w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 border border-white/20">
                            <ShieldCheck size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-wide">
                            WASHENG ID
                        </h2>
                        <p className="text-sm text-blue-200 mt-1 font-medium">
                            Enterprise Management System
                        </p>
                    </div>

                    {status && (
                        <div className="mb-4 font-medium text-sm text-green-400 text-center">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Input Email/Username */}
                        <div>
                            <label className="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2">
                                NIK / ID Karyawan
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail
                                        size={18}
                                        className="text-blue-300 group-focus-within:text-white transition-colors"
                                    />
                                </div>
                                <input
                                    type="text" // Ubah type menjadi text
                                    value={data.nik} // Ganti data.email menjadi data.nik
                                    onChange={(e) =>
                                        setData("nik", e.target.value)
                                    } // Ganti 'email' menjadi 'nik'
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all sm:text-sm"
                                    placeholder="Masukkan NIK anda..."
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            {errors.nik && (
                                <p className="mt-2 text-xs text-red-400 font-medium">
                                    {errors.nik}
                                </p>
                            )}
                        </div>

                        {/* Input Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                                    Kata Sandi
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock
                                        size={18}
                                        className="text-blue-300 group-focus-within:text-white transition-colors"
                                    />
                                </div>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all sm:text-sm"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-xs text-red-400 font-medium">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember Me & Lupa Password */}
                        <div className="flex items-center justify-between mt-4">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                    className="rounded border-white/20 bg-slate-900/50 text-blue-500 shadow-sm focus:ring-blue-500/50 transition-colors"
                                />
                                <span className="ml-2 text-xs font-medium text-blue-200 group-hover:text-white transition-colors">
                                    Ingat Saya
                                </span>
                            </label>
                            <a
                                href="#"
                                className="text-xs font-medium text-blue-300 hover:text-white transition-colors"
                            >
                                Lupa sandi?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-6 flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white p-3 rounded-xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50"
                        >
                            {processing ? "MENGOTENTIKASI..." : "MASUK SISTEM"}{" "}
                            <LogIn size={18} />
                        </button>
                    </form>
                </div>

                {/* Footer Copyright */}
                <p className="text-center text-[10px] font-medium text-blue-300/50 mt-8 tracking-widest uppercase">
                    &copy; 2026 Washeng Manajemen Sistem. All Rights Reserved.
                </p>
            </div>
        </div>
    );
}
