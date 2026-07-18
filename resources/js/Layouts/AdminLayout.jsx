// resources/js/Layouts/AdminLayout.jsx
import { Link, router, usePage } from "@inertiajs/react";
import React, { useEffect, useMemo, useState } from "react";
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
    Menu,
    X,
} from "lucide-react";

const NAV_BG = "#0f172a";
const PAGE_BG = "#f4f7fb";
const SIDEBAR_OPEN_WIDTH = 236;
const SIDEBAR_CLOSED_WIDTH = 72;
const DESKTOP_QUERY = "(min-width: 1024px)";
const SIDEBAR_STORAGE_KEY = "washeng:admin-sidebar-open";

const menus = [
    { name: "DASHBOARD", icon: LayoutDashboard, path: "/dashboard" },
        { name: "BIAYA", icon: DollarSign, path: "/biaya" },
        { name: "PROFIT UNIT", icon: TrendingUp, path: "/profit-unit" },
    {
        name: "DAFTAR UNIT",
        icon: Truck,
        path: "/inventori/daftar-unit",
        activePaths: ["/inventori/daftar-unit", "/inventori/pajak", "/inventori/stnk", "/inventori/kir"],
    },
    {
        name: "DAFTAR ASSET",
        icon: Box,
        path: "/inventori/daftar-asset",
        activePaths: ["/inventori/daftar-asset"],
    },
    { name: "ON THE ROAD", icon: Map, path: "/on-the-road" },
    { name: "NEED APPROVAL", icon: CheckSquare, path: "/need-approval" },
    { name: "DAFTAR KARYAWAN", icon: Users, path: "/daftar-karyawan" },
    { name: "RIWAYAT SERVICE UNIT", icon: PenTool, path: "/riwayat-service-unit" },
    { name: "SYSTEM ACTIVITY LOG", icon: Activity, path: "/system/data-health" },
];

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }

        return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window === "undefined"
            ? true
            : window.matchMedia(DESKTOP_QUERY).matches,
    );
    const { url } = usePage();
    const activePath = useMemo(() => url?.split("?")[0] || "/dashboard", [url]);

    const setDesktopSidebarOpen = (value) => {
        setIsSidebarOpen(value);
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
    };

    useEffect(() => {
        const mediaQuery = window.matchMedia(DESKTOP_QUERY);
        const handleChange = (event) => {
            setIsDesktop(event.matches);
            if (event.matches) {
                setIsMobileSidebarOpen(false);
            }
        };

        setIsDesktop(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);

        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const sidebarWidth = isDesktop
        ? isSidebarOpen
            ? SIDEBAR_OPEN_WIDTH
            : SIDEBAR_CLOSED_WIDTH
        : SIDEBAR_OPEN_WIDTH;
    const isExpanded = isDesktop ? isSidebarOpen : true;
    const sidebarWidthClass = isExpanded ? "w-[236px]" : "w-[72px]";
    const shellOffset = isDesktop ? sidebarWidth : 0;
    const handleLogout = () => {
        if (isLoggingOut) return;

        router.post("/logout", {}, {
            onStart: () => setIsLoggingOut(true),
            onFinish: () => setIsLoggingOut(false),
        });
    };

    return (
        <div className="h-screen overflow-hidden font-sans" style={{ backgroundColor: PAGE_BG }}>
            <div
                className={`${isMobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"} fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-[2px] transition-opacity lg:hidden`}
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-hidden="true"
            />

            <aside
                className={`${sidebarWidthClass} fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden text-slate-100 shadow-[18px_0_55px_rgba(15,23,42,0.18)] transition-[width,transform] duration-300 ease-out ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
                style={{ backgroundColor: NAV_BG }}
            >
                <div className={`h-14 shrink-0 border-b border-white/10 ${isExpanded ? "px-4" : "px-0"} flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
                    <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/10">
                            W
                        </div>
                        <div className={`${isExpanded ? "block" : "hidden"} min-w-0`}>
                            <p className="truncate text-xs font-black tracking-[0.16em] text-white">
                                WASHENG
                            </p>
                            <p className="truncate text-[10px] font-semibold text-cyan-200/80">
                                Fleet ERP
                            </p>
                        </div>
                    </Link>
                    <button
                        onClick={() =>
                            isDesktop
                                ? setDesktopSidebarOpen(false)
                                : setIsMobileSidebarOpen(false)
                        }
                        className={`${isExpanded ? "grid" : "hidden"} h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white hover:text-slate-950`}
                        title={isDesktop ? "Tutup Menu" : "Tutup Sidebar"}
                    >
                        {isDesktop ? <ChevronLeft size={15} /> : <X size={15} />}
                    </button>
                </div>

                <button
                    onClick={() => setDesktopSidebarOpen(true)}
                    className={`${isDesktop && !isSidebarOpen ? "grid" : "hidden"} mx-auto mt-3 h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white hover:text-slate-950`}
                    title="Buka Menu"
                >
                    <ChevronRight size={15} />
                </button>

                <div className="flex-1 overflow-y-auto px-2.5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <nav className="space-y-1.5" role="navigation">
                        {menus.map((menu) => {
                            const activePaths = menu.activePaths || [menu.path];
                            const isActive =
                                menu.path !== "#" &&
                                activePaths.some((path) => activePath.startsWith(path));

                            return (
                                <Link
                                    key={menu.name}
                                    href={menu.path}
                                    title={!isExpanded ? menu.name : ""}
                                    aria-current={isActive ? "page" : undefined}
                                    onClick={() => {
                                        if (!isDesktop) {
                                            setIsMobileSidebarOpen(false);
                                        }
                                    }}
                                    className={`group relative flex min-h-[44px] items-center overflow-hidden rounded-lg text-[13px] font-black tracking-[0.01em] transition duration-200 ${isExpanded ? "gap-2.5 px-2.5 pr-7" : "justify-center px-0"} ${isActive ? "bg-white text-slate-950 shadow-[0_12px_26px_rgba(2,8,23,0.18)]" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                                >
                                    <span
                                        className={`absolute inset-y-2 right-2 w-1 rounded-full transition ${isActive ? "bg-cyan-500 opacity-100" : "bg-white/30 opacity-0 group-hover:opacity-60"}`}
                                    />
                                    <span
                                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${isActive ? "bg-cyan-50 text-cyan-600" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-cyan-200"}`}
                                    >
                                    <menu.icon
                                        size={17}
                                        strokeWidth={2.35}
                                        className="shrink-0"
                                    />
                                    </span>
                                    <span className={`${isExpanded ? "block" : "hidden"} truncate`}>
                                        {menu.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            <header
                className="fixed right-0 top-0 z-20 flex h-14 min-w-0 items-center justify-between border-b border-white/10 px-3 text-slate-100 shadow-[0_14px_38px_rgba(15,23,42,0.12)] transition-[left] duration-300 ease-out sm:px-4 lg:px-5"
                style={{ left: shellOffset, backgroundColor: NAV_BG }}
            >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white hover:text-slate-950 lg:hidden"
                        title="Buka Sidebar"
                    >
                        <Menu size={18} />
                    </button>
                    <div className="relative hidden w-full max-w-xl min-w-0 sm:block">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Cari data, unit, atau dokumen..."
                            className="h-9 w-full rounded-lg border border-white/10 bg-white/10 pl-9 pr-3 text-[13px] font-semibold text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-300/50 focus:bg-white/15 focus:ring-4 focus:ring-cyan-300/10"
                        />
                    </div>
                </div>

                <div className="ml-3 flex shrink-0 items-center gap-2 sm:ml-4 sm:gap-3">
                    <button className="hidden h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white sm:grid" title="Muat Ulang">
                        <RefreshCw size={16} />
                    </button>
                    <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white" title="Notifikasi">
                        <Bell size={18} />
                        <span className="absolute right-2.5 top-2.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                    </button>
                    <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />
                    <div className="hidden text-right md:block">
                        <p className="text-xs font-black leading-tight text-white">Admin System</p>
                        <p className="text-xs font-semibold text-slate-400">Washeng ID</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        title={isLoggingOut ? "Sedang keluar..." : "Keluar dari Sistem"}
                        aria-label={isLoggingOut ? "Sedang keluar dari sistem" : "Keluar dari Sistem"}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-950 shadow-lg shadow-black/10 transition hover:bg-rose-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                    >
                        <LogOut size={16} className={isLoggingOut ? "animate-pulse" : ""} />
                    </button>
                </div>
            </header>

            <div
                className="pointer-events-none fixed z-10 hidden h-8 w-8 transition-[left] duration-300 ease-out lg:block"
                style={{ left: shellOffset, top: 56, backgroundColor: NAV_BG }}
                aria-hidden="true"
            >
                <div className="h-full w-full rounded-tl-[100px]" style={{ backgroundColor: PAGE_BG }} />
            </div>

            <main
                className="app-main custom-scrollbar fixed bottom-0 right-0 overflow-y-auto px-3 py-3 transition-[left] duration-300 ease-out sm:px-4 sm:py-4 lg:px-5 lg:py-5"
                style={{ left: shellOffset, top: 56, backgroundColor: PAGE_BG }}
            >
                {children}
            </main>
        </div>
    );
}
