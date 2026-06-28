// resources/js/Layouts/AdminLayout.jsx
import { Link, router } from "@inertiajs/react";
import React, { useState } from "react";
import {
    LayoutDashboard,
    DollarSign,
    TrendingUp,
    Truck,
    Box,
    Map,
    CheckSquare,
    Users,
    PenTool,
    Activity,
    RefreshCw,
    Search,
    Bell,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const menus = [
        {
            name: "DASHBOARD",
            icon: LayoutDashboard,
            path: "/dashboard",
            active: true,
        },
        { name: "BIAYA", icon: DollarSign, path: "#" },
        { name: "PROFIT UNIT", icon: TrendingUp, path: "#" },
        { name: "DAFTAR UNIT", icon: Truck, path: "#" },
        { name: "DAFTAR ASSET", icon: Box, path: "#" },
        { name: "ON THE ROAD", icon: Map, path: "#" },
        { name: "NEED APPROVAL", icon: CheckSquare, path: "#" },
        { name: "DAFTAR KARYAWAN", icon: Users, path: "#" },
        { name: "RIWAYAT SERVICE UNIT", icon: PenTool, path: "#" },
        { name: "SYSTEM ACTIVITY LOG", icon: Activity, path: "#" },
    ];

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
            {/* Sidebar ditambahkan class 'relative' agar tombol Chevron bisa melayang di batas kanannya */}
            <aside
                className={`relative ${isSidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
            >
                {/* Tombol Toggle Melayang (Floating Chevron Button) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3.5 top-5 bg-white border border-gray-200 text-gray-500 hover:text-blue-600 rounded-full p-1 shadow-sm transition-transform hover:scale-110 z-50 flex items-center justify-center cursor-pointer"
                    title={isSidebarOpen ? "Tutup Menu" : "Buka Menu"}
                >
                    {isSidebarOpen ? (
                        <ChevronLeft size={18} />
                    ) : (
                        <ChevronRight size={18} />
                    )}
                </button>

                {/* Bagian Header Sidebar (Logo statis di kiri) */}
                <div
                    className={`h-16 flex items-center border-b border-gray-100 ${isSidebarOpen ? "px-6" : "justify-center px-0"}`}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-blue-500/30">
                            W
                        </div>
                        <span
                            className={`font-bold text-gray-800 tracking-wider text-sm whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? "opacity-100 block" : "opacity-0 hidden w-0"}`}
                        >
                            WASHENG
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
                    <nav className="space-y-1.5 px-3">
                        {menus.map((menu, idx) => (
                            <Link
                                key={idx}
                                href={menu.path}
                                title={!isSidebarOpen ? menu.name : ""}
                                className={`flex items-center rounded-lg transition-all duration-200 group ${menu.active ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"} ${isSidebarOpen ? "px-3 py-2.5" : "justify-center py-3"}`}
                            >
                                <menu.icon
                                    size={20}
                                    className={`shrink-0 transition-colors ${menu.active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"} ${isSidebarOpen ? "mr-3" : "mr-0"}`}
                                />
                                <span
                                    className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? "opacity-100 block" : "opacity-0 hidden w-0"}`}
                                >
                                    {menu.name}
                                </span>
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search
                                    size={18}
                                    className="text-gray-400 group-focus-within:text-blue-500 transition-colors"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari data, unit, atau dokumen..."
                                className="block w-full pl-10 pr-3 py-2.5 border border-transparent rounded-xl leading-5 bg-gray-100/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 sm:text-sm transition-all duration-200"
                            />
                        </div>
                    </div>
                    <div className="ml-4 flex items-center gap-5">
                        <button className="text-gray-400 hover:text-gray-700 transition-colors">
                            <RefreshCw size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        {/* Bagian Profil & Tombol Logout di Topbar */}
                        <div className="ml-4 flex items-center gap-3 cursor-pointer group relative">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-700 leading-tight">
                                    Admin System
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                    Washeng ID
                                </p>
                            </div>

                            {/* Tombol Logout (Mengeksekusi endpoint /logout via Inertia POST) */}
                            <button
                                onClick={() => router.post("/logout")}
                                title="Keluar dari Sistem"
                                className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:bg-rose-600 transition-all cursor-pointer"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
