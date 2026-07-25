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
    ShieldCheck,
    ArrowUpRight,
    Database,
} from "lucide-react";

const NAV_BG = "#0f172a";
const PAGE_BG = "#f4f7fb";
const SIDEBAR_OPEN_WIDTH = 236;
const SIDEBAR_CLOSED_WIDTH = 72;
const DESKTOP_QUERY = "(min-width: 1024px)";
const SIDEBAR_STORAGE_KEY = "washeng:admin-sidebar-open";

const menus = [
    { name: "DASHBOARD", icon: LayoutDashboard, path: "/dashboard", permission: "dashboard.view" },
        { name: "BIAYA", icon: DollarSign, path: "/biaya", permission: "biaya.view" },
        { name: "PROFIT UNIT", icon: TrendingUp, path: "/profit-unit", permission: "profit-unit.view" },
    {
        name: "DAFTAR UNIT",
        icon: Truck,
        path: "/inventori/daftar-unit",
        activePaths: ["/inventori/daftar-unit", "/inventori/pajak", "/inventori/stnk", "/inventori/kir"],
        permission: "inventory.view",
    },
    {
        name: "DAFTAR ASSET",
        icon: Box,
        path: "/inventori/daftar-asset",
        activePaths: ["/inventori/daftar-asset"],
        permission: "inventory.view",
    },
    { name: "ON THE ROAD", icon: Map, path: "/on-the-road", permission: "on-the-road.view" },
    { name: "NEED APPROVAL", icon: CheckSquare, path: "/need-approval", permission: "approval.view" },
    { name: "DAFTAR KARYAWAN", icon: Users, path: "/daftar-karyawan", permission: "employees.view" },
    { name: "RIWAYAT SERVICE UNIT", icon: PenTool, path: "/riwayat-service-unit", permission: "service.view" },
    { name: "SYSTEM ACTIVITY LOG", icon: Activity, path: "/system/data-health", permission: "system.view" },
    {
        name: "CRUD DATA",
        icon: Database,
        path: "/module-records",
        activePaths: ["/module-records"],
        anyPermissions: [
            "biaya.manage",
            "profit-unit.manage",
            "inventory.manage",
            "on-the-road.manage",
            "approval.manage",
            "finance-documents.manage",
            "system.manage",
        ],
    },
    { name: "ROLE & AKSES", icon: ShieldCheck, path: "/system/access-control", permission: "access-control.manage" },
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
    const [globalSearch, setGlobalSearch] = useState("");
    const [globalResults, setGlobalResults] = useState([]);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [isGlobalSearchLoading, setIsGlobalSearchLoading] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window === "undefined"
            ? true
            : window.matchMedia(DESKTOP_QUERY).matches,
    );
    const { url, props } = usePage();
    const auth = props.auth || {};
    const permissions = auth.permissions || [];
    const roles = auth.roles || [];
    const visibleMenus = useMemo(() => menus.filter((menu) => {
        if (menu.permission) {
            return permissions.includes(menu.permission);
        }

        return (menu.anyPermissions || []).some((permission) => permissions.includes(permission));
    }), [permissions]);
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

    useEffect(() => {
        const keyword = globalSearch.trim();

        if (keyword.length < 2) {
            setGlobalResults([]);
            setIsGlobalSearchLoading(false);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setIsGlobalSearchLoading(true);

            fetch(`/global-search?q=${encodeURIComponent(keyword)}`, {
                headers: { Accept: "application/json" },
                signal: controller.signal,
            })
                .then((response) => response.ok ? response.json() : { results: [] })
                .then((payload) => {
                    setGlobalResults(Array.isArray(payload.results) ? payload.results : []);
                    setIsGlobalSearchOpen(true);
                })
                .catch((error) => {
                    if (error.name !== "AbortError") {
                        setGlobalResults([]);
                    }
                })
                .finally(() => setIsGlobalSearchLoading(false));
        }, 180);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [globalSearch]);

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

    const openGlobalResult = (url) => {
        setIsGlobalSearchOpen(false);
        setGlobalSearch("");
        setGlobalResults([]);
        router.visit(url);
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
                        {visibleMenus.map((menu) => {
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
                            value={globalSearch}
                            onChange={(event) => {
                                setGlobalSearch(event.target.value);
                                setIsGlobalSearchOpen(true);
                            }}
                            onFocus={() => setIsGlobalSearchOpen(true)}
                            onBlur={() => window.setTimeout(() => setIsGlobalSearchOpen(false), 140)}
                            placeholder="Cari data, unit, atau dokumen..."
                            className="h-9 w-full rounded-lg border border-white/10 bg-white/10 pl-9 pr-3 text-[13px] font-semibold text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-300/50 focus:bg-white/15 focus:ring-4 focus:ring-cyan-300/10"
                        />
                        {isGlobalSearchOpen && globalSearch.trim().length >= 2 && (
                            <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_18px_55px_rgba(15,23,42,0.22)]">
                                <div className="max-h-[min(420px,70vh)] overflow-y-auto py-2">
                                    {isGlobalSearchLoading && (
                                        <div className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">
                                            Mencari data...
                                        </div>
                                    )}
                                    {!isGlobalSearchLoading && globalResults.length === 0 && (
                                        <div className="px-4 py-3 text-sm font-semibold text-slate-500">
                                            Belum ada data yang cocok.
                                        </div>
                                    )}
                                    {!isGlobalSearchLoading && globalResults.map((item, index) => (
                                        <button
                                            key={`${item.url}-${index}`}
                                            type="button"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => openGlobalResult(item.url)}
                                            className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none"
                                        >
                                            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                                                <Search size={15} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-black text-slate-950">
                                                    {item.title}
                                                </span>
                                                <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                                                    {item.subtitle || "Detail data tersedia"}
                                                </span>
                                                <span className="mt-1 inline-flex max-w-full rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                                                    {item.module}
                                                </span>
                                            </span>
                                            <ArrowUpRight className="mt-1 shrink-0 text-slate-300" size={15} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ml-3 flex shrink-0 items-center gap-2 sm:ml-4 sm:gap-3">
                    <button onClick={() => router.reload()} className="hidden h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white sm:grid" title="Muat Ulang">
                        <RefreshCw size={16} />
                    </button>
                    <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white" title="Notifikasi">
                        <Bell size={18} />
                        <span className="absolute right-2.5 top-2.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                    </button>
                    <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />
                    <div className="hidden text-right md:block">
                        <p className="text-xs font-black leading-tight text-white">{auth.user?.nik || "Pengguna"}</p>
                        <p className="text-xs font-semibold text-slate-400">{roles[0] ? roles[0].replaceAll("-", " ").toUpperCase() : "Tanpa role"}</p>
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

            <main
                className="app-main custom-scrollbar fixed bottom-0 right-0 overflow-y-auto px-3 py-3 transition-[left] duration-300 ease-out sm:px-4 sm:py-4 lg:px-5 lg:py-5"
                style={{ left: shellOffset, top: 56, backgroundColor: PAGE_BG }}
            >
                {children}
            </main>
        </div>
    );
}
