// resources/js/Layouts/AdminLayout.jsx
import { Link, router, usePage } from "@inertiajs/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    ChevronDown,
    LogOut,
    Menu,
    X,
    ShieldCheck,
    ArrowUpRight,
    Database,
    Gauge,
    Pin,
    PinOff,
    PanelLeftClose,
    PanelLeftOpen,
    Grid2X2,
    CheckCheck,
    CircleAlert,
} from "lucide-react";


const SIDEBAR_OPEN_WIDTH = 288;
const SIDEBAR_CLOSED_WIDTH = 88;
const DESKTOP_QUERY = "(min-width: 1024px)";
const SIDEBAR_STORAGE_KEY = "washeng:admin-sidebar-open";
const SIDEBAR_PIN_STORAGE_KEY = "washeng:admin-sidebar-pinned";

const menus = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", permission: "dashboard.view" },
    {
        name: "Business Control",
        icon: Gauge,
        children: [
            { name: "Performance", path: "/business-control/performance", permission: "dashboard.view" },
            { name: "Data Health", path: "/business-control/health", permission: "dashboard.view" },
        ],
        permission: "dashboard.view",
    },
    { name: "Biaya", icon: DollarSign, path: "/biaya", permission: "biaya.view" },
        { name: "Profit Unit", icon: TrendingUp, path: "/profit-unit", permission: "profit-unit.view" },
    {
        name: "Daftar Unit",
        icon: Truck,
        path: "/inventori/daftar-unit",
        activePaths: ["/inventori/daftar-unit", "/inventori/pajak", "/inventori/stnk", "/inventori/kir"],
        permission: "inventory.view",
    },
    {
        name: "Daftar Asset",
        icon: Box,
        path: "/inventori/daftar-asset",
        activePaths: ["/inventori/daftar-asset"],
        permission: "inventory.view",
    },
    { name: "On The Road", icon: Map, path: "/on-the-road", permission: "on-the-road.view" },
    { name: "Need Approval", icon: CheckSquare, path: "/need-approval", permission: "approval.view" },
    { name: "Daftar Karyawan", icon: Users, path: "/daftar-karyawan", permission: "employees.view" },
    { name: "Riwayat Service Unit", icon: PenTool, path: "/riwayat-service-unit", permission: "service.view" },
    { name: "System Activity Log", icon: Activity, path: "/system/data-health", permission: "system.view" },
    {
        name: "CRUD Data",
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
    { name: "Role & Akses", icon: ShieldCheck, path: "/system/access-control", permission: "access-control.manage" },
];

function notificationTime(value) {
    if (!value) return "Baru saja";

    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "Baru saja";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    return `${Math.floor(seconds / 86400)} hari lalu`;
}

export default function AdminLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }

        return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "false";
    });
    const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
        if (typeof window === "undefined") {
            return true;
        }

        return window.localStorage.getItem(SIDEBAR_PIN_STORAGE_KEY) !== "false";
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [globalSearch, setGlobalSearch] = useState("");
    const [globalResults, setGlobalResults] = useState([]);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [isGlobalSearchLoading, setIsGlobalSearchLoading] = useState(false);
    const [isAppsOpen, setIsAppsOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
    const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
    const [notificationMigrationRequired, setNotificationMigrationRequired] = useState(false);
    const [collapsedMenus, setCollapsedMenus] = useState({});
    const searchInputRef = useRef(null);
    const appMenuRef = useRef(null);
    const notificationMenuRef = useRef(null);
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
    const appShortcuts = useMemo(() => visibleMenus.flatMap((menu) => menu.children
        ? menu.children.map((child) => ({ ...child, icon: menu.icon }))
        : [menu]), [visibleMenus]);

    const setDesktopSidebarOpen = (value) => {
        setIsSidebarOpen(value);
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
    };

    const toggleSidebarPin = () => {
        const nextPinnedState = !isSidebarPinned;
        setIsSidebarPinned(nextPinnedState);
        window.localStorage.setItem(SIDEBAR_PIN_STORAGE_KEY, String(nextPinnedState));

        if (nextPinnedState) {
            setDesktopSidebarOpen(true);
        }
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
        const focusSearch = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "/") {
                event.preventDefault();
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", focusSearch);

        return () => window.removeEventListener("keydown", focusSearch);
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

    const loadNotifications = () => {
        setIsNotificationsLoading(true);
        fetch("/notifications", { headers: { Accept: "application/json" } })
            .then((response) => response.ok ? response.json() : { items: [], unreadCount: 0 })
            .then((payload) => {
                setNotifications(Array.isArray(payload.items) ? payload.items : []);
                setNotificationUnreadCount(Number(payload.unreadCount || 0));
                setNotificationMigrationRequired(Boolean(payload.requiresMigration));
            })
            .catch(() => {
                setNotifications([]);
                setNotificationUnreadCount(0);
            })
            .finally(() => setIsNotificationsLoading(false));
    };

    useEffect(() => {
        if (isNotificationOpen) loadNotifications();
    }, [isNotificationOpen]);

    useEffect(() => {
        const closeMenus = (event) => {
            if (!appMenuRef.current?.contains(event.target)) setIsAppsOpen(false);
            if (!notificationMenuRef.current?.contains(event.target)) setIsNotificationOpen(false);
        };
        document.addEventListener("mousedown", closeMenus);
        return () => document.removeEventListener("mousedown", closeMenus);
    }, []);

    const isExpanded = isDesktop ? isSidebarOpen : true;
    const sidebarWidthClass = isExpanded ? "w-72" : "w-[88px]";
    const mainMenus = visibleMenus.filter((menu) => !["CRUD Data", "Role & Akses"].includes(menu.name));
    const administrationMenus = visibleMenus.filter((menu) => ["CRUD Data", "Role & Akses"].includes(menu.name));
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

    const markAllNotificationsRead = () => {
        if (notificationUnreadCount === 0) return;

        router.put("/notifications/read-all", {}, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setNotificationUnreadCount(0);
                setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
            },
        });
    };

    const openNotification = (notification) => {
        const visit = () => {
            setIsNotificationOpen(false);
            router.visit(notification.url || "/dashboard");
        };

        if (notification.readAt) {
            visit();
            return;
        }

        router.put(`/notifications/${notification.id}/read`, {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setNotificationUnreadCount((count) => Math.max(0, count - 1));
                setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
                visit();
            },
        });
    };

    return (
        <>
            <div
                className={`${isMobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"} fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[2px] transition-opacity lg:hidden`}
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-hidden="true"
            />

            <aside
                className={`${sidebarWidthClass} font-[Manrope] fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-[#e7e3eb] bg-white text-slate-700 shadow-[8px_0_24px_rgba(75,70,92,0.08)] transition-[width,transform] duration-300 ease-out ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:inset-auto lg:z-auto lg:h-full lg:shrink-0 lg:translate-x-0`}
                onMouseEnter={() => {
                    if (isDesktop && !isSidebarPinned) setDesktopSidebarOpen(true);
                }}
                onMouseLeave={() => {
                    if (isDesktop && !isSidebarPinned) setDesktopSidebarOpen(false);
                }}
            >
                <div className={`h-[74px] shrink-0 ${isExpanded ? "px-5" : "px-0"} flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
                    <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
                        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-transparent">
                            <img
                                src="/Icon-512x512-px.webp"
                                alt="Logo Washeng"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div className={`${isExpanded ? "block" : "hidden"} min-w-0`}>
                            <p className="truncate text-sm font-extrabold tracking-[0.08em] text-slate-800">
                                Washeng
                            </p>
                            <p className="truncate text-[11px] font-semibold text-slate-400">
                                Manajemen Sistem
                            </p>
                        </div>
                    </Link>
                    <div className={`${isExpanded ? "flex" : "hidden"} items-center gap-1`}>
                        {isDesktop && (
                            <button
                                type="button"
                                onClick={toggleSidebarPin}
                                className={`grid h-8 w-8 place-items-center rounded-lg transition-colors duration-200 ${isSidebarPinned ? "bg-[#f5f3ff] text-[#7367f0]" : "text-slate-400 hover:bg-[#f5f3ff] hover:text-[#7367f0]"}`}
                                title={isSidebarPinned ? "Sidebar terkunci" : "Sidebar mengikuti kursor"}
                            >
                                {isSidebarPinned ? <Pin size={15} /> : <PinOff size={15} />}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => isDesktop ? setDesktopSidebarOpen(false) : setIsMobileSidebarOpen(false)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-[#f5f3ff] hover:text-[#7367f0]"
                            title={isDesktop ? "Sembunyikan label menu" : "Tutup Sidebar"}
                        >
                            {isDesktop ? <PanelLeftClose size={17} /> : <X size={17} />}
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setDesktopSidebarOpen(true)}
                    className={`${isDesktop && !isSidebarOpen ? "grid" : "hidden"} mx-auto mt-3 h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f5f3ff] text-[#7367f0] transition-colors duration-150 hover:bg-[#7367f0] hover:text-white`}
                    title="Buka Menu"
                >
                    <PanelLeftOpen size={17} />
                </button>

                <div className="flex-1 overflow-y-auto px-3 pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <nav className="space-y-0.5" role="navigation">
                        <p className={`${isExpanded ? "block" : "hidden"} mb-2 px-2.5 text-[10px] font-semibold tracking-[0.04em] text-slate-400`}>Menu utama</p>
                        {mainMenus.map((menu) => {
                            if (menu.children) {
                                const isAnyChildActive = menu.children.some((child) =>
                                    activePath.startsWith(child.path)
                                );
                                const isOpen = collapsedMenus[menu.name] !== false;
                                return (
                                    <div key={menu.name} className="space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isExpanded) {
                                                    setDesktopSidebarOpen(true);
                                                    return;
                                                }

                                                setCollapsedMenus((prev) => ({ ...prev, [menu.name]: isOpen ? false : true }));
                                            }}
                                            className={`group relative flex min-h-[40px] w-full items-center overflow-hidden rounded-lg text-[12px] font-semibold tracking-normal transition-colors duration-150 ${
                                                isExpanded ? "gap-2.5 px-2.5 py-1.5 pr-3" : "justify-center px-0"
                                            } ${isAnyChildActive ? "bg-[#f5f3ff] text-[#7367f0]" : "mt-2 text-slate-500 hover:bg-[#f5f3ff] hover:text-[#7367f0]"}`}
                                        >
                                            <span
                                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition group-hover:bg-white group-hover:text-[#7367f0]`}
                                            >
                                                <menu.icon size={18} strokeWidth={1.5} className="shrink-0" />
                                            </span>
                                            <span className={`${isExpanded ? "block" : "hidden"} flex-1 truncate text-left`}>
                                                {menu.name}
                                            </span>
                                            {isExpanded && (
                                                <span className="shrink-0 text-slate-400 transition-transform duration-200">
                                                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </span>
                                            )}
                                        </button>
                                        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isExpanded && isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                        <div className="min-h-0 space-y-1 overflow-hidden">
                                        {menu.children.map((child) => {
                                            const isChildActive = activePath.startsWith(child.path);
                                            return (
                                                <Link
                                                    key={child.name}
                                                    href={child.path}
                                                    aria-current={isChildActive ? "page" : undefined}
                                                    onClick={() => { if (!isDesktop) setIsMobileSidebarOpen(false); }}
                                                    className={`group relative flex min-h-[30px] items-center overflow-hidden rounded-md text-[11px] font-medium transition-colors duration-150 gap-2 pl-10 pr-3 border-l-2 ${
                                                        isChildActive
                                                            ? "bg-[#f5f3ff] text-[#7367f0] font-bold border-[#7367f0]"
                                                            : "text-slate-500 hover:bg-[#f5f3ff] hover:text-[#7367f0] border-transparent"
                                                    }`}
                                                >
                                                    <span className="block truncate">{child.name}</span>
                                                </Link>
                                            );
                                        })}
                                        </div>
                                        </div>
                                    </div>
                                );
                            }

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
                                    className={`group relative flex min-h-[40px] items-center overflow-visible rounded-lg text-[12px] font-semibold transition-colors duration-150 ${isExpanded ? "gap-2.5 px-2.5 py-1.5 pr-3" : "justify-center px-0"} ${isActive ? "bg-[#f5f3ff] text-[#7367f0]" : "text-slate-600 hover:bg-[#f5f3ff] hover:text-[#7367f0]"}`}
                                >
                                    <span
                                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${isActive ? "bg-white text-[#7367f0] shadow-sm" : "text-slate-500 group-hover:bg-white group-hover:text-[#7367f0]"}`}
                                    >
                                    <menu.icon
                                        size={18}
                                        strokeWidth={1.5}
                                        className="shrink-0"
                                    />
                                    </span>
                                    <span className={`${isExpanded ? "block" : "hidden"} truncate`}>
                                        {menu.name}
                                    </span>
                                    {!isExpanded && (
                                        <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
                                            {menu.name}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                        {administrationMenus.length > 0 && (
                            <>
                                <p className={`${isExpanded ? "block" : "hidden"} mb-2 mt-4 px-2.5 text-[10px] font-semibold tracking-[0.04em] text-slate-400`}>Administrasi</p>
                                {administrationMenus.map((menu) => {
                                    const activePaths = menu.activePaths || [menu.path];
                                    const isActive = activePaths.some((path) => activePath.startsWith(path));
                                    return (
                                        <Link
                                            key={menu.name}
                                            href={menu.path}
                                            title={!isExpanded ? menu.name : ""}
                                            aria-current={isActive ? "page" : undefined}
                                            onClick={() => { if (!isDesktop) setIsMobileSidebarOpen(false); }}
                                            className={`group relative flex min-h-[40px] items-center overflow-visible rounded-lg text-[12px] font-semibold transition-colors duration-150 ${isExpanded ? "gap-2.5 px-2.5 py-1.5 pr-3" : "justify-center px-0"} ${isActive ? "bg-[#f5f3ff] text-[#7367f0]" : "text-slate-600 hover:bg-[#f5f3ff] hover:text-[#7367f0]"}`}
                                        >
                                            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${isActive ? "bg-white text-[#7367f0] shadow-sm" : "text-slate-500 group-hover:bg-white group-hover:text-[#7367f0]"}`}>
                                                <menu.icon size={18} strokeWidth={1.5} />
                                            </span>
                                            <span className={`${isExpanded ? "block" : "hidden"} truncate`}>{menu.name}</span>
                                            {!isExpanded && <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">{menu.name}</span>}
                                        </Link>
                                    );
                                })}
                            </>
                        )}
                    </nav>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f8f7fa]">
            <header
                className="relative z-20 shrink-0 flex h-[74px] min-w-0 items-center justify-between border-b border-[#e7e3eb] bg-white px-4 text-slate-800 sm:px-6"
            >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 lg:hidden"
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
                            ref={searchInputRef}
                            type="text"
                            value={globalSearch}
                            onChange={(event) => {
                                setGlobalSearch(event.target.value);
                                setIsGlobalSearchOpen(true);
                            }}
                            onFocus={() => setIsGlobalSearchOpen(true)}
                            onBlur={() => window.setTimeout(() => setIsGlobalSearchOpen(false), 140)}
                            placeholder="Cari data, unit, atau dokumen..."
                            className="h-10 w-full rounded-lg border border-[#e7e3eb] bg-[#f8f7fa] pl-9 pr-3 text-[13px] font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#7367f0]/40 focus:ring-2 focus:ring-[#7367f0]/10"
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
                    <div ref={appMenuRef} className="relative hidden sm:block">
                        <button type="button" onClick={() => setIsAppsOpen((open) => !open)} className={`grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-[#f5f3ff] hover:text-[#7367f0] ${isAppsOpen ? "bg-[#f5f3ff] text-[#7367f0]" : ""}`} title="Menu aplikasi" aria-expanded={isAppsOpen}><Grid2X2 size={18} /></button>
                        {isAppsOpen && <div className="absolute right-0 top-11 z-50 w-[min(29rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_55px_rgba(15,23,42,0.22)]"><div className="mb-3 flex items-center justify-between px-1"><div><p className="text-sm font-extrabold text-slate-900">Menu aplikasi</p><p className="mt-0.5 text-xs text-slate-500">Akses cepat sesuai hak pengguna.</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{appShortcuts.length} menu</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{appShortcuts.map((menu) => { const Icon = menu.icon; const isActive = activePath.startsWith(menu.path); return <Link key={menu.path} href={menu.path} onClick={() => setIsAppsOpen(false)} className={`group flex min-w-0 flex-col gap-2 rounded-xl border p-3 text-left transition ${isActive ? "border-violet-200 bg-violet-50" : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${isActive ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-violet-600"}`}><Icon size={16} /></span><span className="truncate text-xs font-bold text-slate-800">{menu.name}</span></Link>; })}</div></div>}
                    </div>
                    <button onClick={() => router.reload()} className="hidden h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-[#f5f3ff] hover:text-[#7367f0] sm:grid" title="Muat Ulang">
                        <RefreshCw size={16} />
                    </button>
                    <div ref={notificationMenuRef} className="relative">
                        <button type="button" onClick={() => { setIsNotificationOpen((open) => !open); setIsAppsOpen(false); }} className={`relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition hover:bg-[#f5f3ff] hover:text-[#7367f0] ${isNotificationOpen ? "bg-[#f5f3ff] text-[#7367f0]" : ""}`} title="Notifikasi" aria-label="Buka notifikasi" aria-expanded={isNotificationOpen}>
                            <Bell size={18} />
                            {notificationUnreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">{notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}</span>}
                        </button>
                        {isNotificationOpen && <div className="absolute right-0 top-11 z-50 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.22)]"><div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3"><div><p className="text-sm font-extrabold text-slate-900">Notifikasi</p><p className="mt-0.5 text-xs text-slate-500">Hal yang perlu diperhatikan hari ini.</p></div>{notificationUnreadCount > 0 && <button type="button" onClick={markAllNotificationsRead} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-violet-600 transition hover:text-violet-800"><CheckCheck size={15} />Tandai dibaca</button>}</div><div className="custom-scrollbar max-h-[min(31rem,70vh)] overflow-y-auto">{isNotificationsLoading && <p className="px-4 py-5 text-sm text-slate-500">Memuat notifikasi...</p>}{!isNotificationsLoading && notificationMigrationRequired && <div className="m-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">Pusat notifikasi akan aktif setelah migration database dijalankan.</div>}{!isNotificationsLoading && !notificationMigrationRequired && notifications.length === 0 && <div className="px-4 py-8 text-center"><CheckCheck size={23} className="mx-auto text-emerald-500" /><p className="mt-2 text-sm font-bold text-slate-800">Tidak ada perhatian baru</p><p className="mt-1 text-xs text-slate-500">Semuanya sudah terlihat aman untuk saat ini.</p></div>}{!isNotificationsLoading && notifications.map((notification) => <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-violet-50/60 ${notification.readAt ? "bg-white" : "bg-violet-50/40"}`}><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${notification.severity === "danger" ? "bg-rose-100 text-rose-600" : notification.severity === "warning" ? "bg-amber-100 text-amber-600" : notification.severity === "success" ? "bg-emerald-100 text-emerald-600" : "bg-cyan-100 text-cyan-600"}`}><CircleAlert size={16} /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-sm font-bold text-slate-900">{notification.title}</span>{!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span><span className="mt-1.5 block text-[11px] font-medium text-slate-400">{notificationTime(notification.createdAt)}</span></span></button>)}</div></div>}
                    </div>
                    <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />
                    <div className="hidden text-right md:block">
                        <p className="text-xs font-black leading-tight text-slate-800">{auth.user?.nik || "Pengguna"}</p>
                        <p className="text-xs font-semibold text-slate-500">{roles[0] ? roles[0].replaceAll("-", " ").toUpperCase() : "Tanpa role"}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        title={isLoggingOut ? "Sedang keluar..." : "Keluar dari Sistem"}
                        aria-label={isLoggingOut ? "Sedang keluar dari sistem" : "Keluar dari Sistem"}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-[#7367f0] text-white shadow-lg shadow-violet-200 transition hover:bg-[#6258dc] disabled:cursor-wait disabled:opacity-60"
                    >
                        <LogOut size={16} className={isLoggingOut ? "animate-pulse" : ""} />
                    </button>
                </div>
            </header>

            <main
                className="app-main custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6"
            >
                {children}
            </main>
            </div>
        </>
    );
}
