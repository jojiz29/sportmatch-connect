import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
      },
      manifest: {
        name: "SportMatch Connect",
        short_name: "SportMatch",
        description: "Matchmaking deportivo inteligente, reservas de canchas y comunidad amateur.",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
    mode === "analyze" && visualizer({ open: false, filename: "dist/stats.html", gzipSize: true }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "buffer": "buffer",
    },
  },
  server: {
    host: "::",
    port: 5178,
    strictPort: false,
    open: true,
    watch: {
      ignored: ["**/playwright-report/**", "**/test-results/**"],
    },
  },
  define: process.env.VITE_USE_MOCKS
    ? {
        "import.meta.env.VITE_USE_MOCKS": JSON.stringify(process.env.VITE_USE_MOCKS),
      }
    : {},
}));
