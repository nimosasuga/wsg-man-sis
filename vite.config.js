import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
    server: {
        host: "127.0.0.1",
        hmr: {
            host: "127.0.0.1",
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return;

                    if (id.includes("recharts") || id.includes("d3-")) {
                        return "vendor-recharts";
                    }

                    if (id.includes("chart.js")) {
                        return "vendor-chartjs";
                    }

                    if (id.includes("lucide-react")) {
                        return "vendor-icons";
                    }

                    if (id.includes("framer-motion")) {
                        return "vendor-motion";
                    }

                    if (id.includes("tsparticles") || id.includes("react-tsparticles")) {
                        return "vendor-particles";
                    }

                    if (
                        id.includes("/react/") ||
                        id.includes("/react-dom/") ||
                        id.includes("/@inertiajs/")
                    ) {
                        return "vendor-react";
                    }

                    return "vendor";
                },
            },
        },
    },
    plugins: [
        laravel({
            input: ["resources/js/app.jsx"],
            refresh: true,
        }),
        react(),
    ],
});
