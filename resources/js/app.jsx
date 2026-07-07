import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function NavigationLoader() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let loadingTimer;

        const removeStartListener = router.on('start', () => {
            loadingTimer = window.setTimeout(() => setIsLoading(true), 120);
        });
        const removeFinishListener = router.on('finish', () => {
            window.clearTimeout(loadingTimer);
            setIsLoading(false);
        });

        return () => {
            window.clearTimeout(loadingTimer);
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    return (
        <div
            className={`pointer-events-none fixed inset-x-0 top-0 z-[9999] transition-opacity duration-200 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={!isLoading}
        >
            <div className="h-1 overflow-hidden bg-slate-950/10">
                <div className="h-full w-full origin-left animate-[washeng-loading-bar_1.1s_ease-in-out_infinite] bg-cyan-400" />
            </div>
            <div className="relative h-9">
                <div className="absolute left-0 top-1 animate-[washeng-truck-drive_1.45s_ease-in-out_infinite]">
                    <div className="flex h-8 items-center gap-2 rounded-lg border border-cyan-200 bg-white px-3 text-xs font-black text-slate-800 shadow-lg shadow-slate-950/15">
                        <Truck size={17} className="text-cyan-600" />
                        Loading
                    </div>
                </div>
            </div>
        </div>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <NavigationLoader />
                <App {...props} />
            </>,
        );
    },
    progress: {
        color: 'transparent',
    },
});
