// ============================================================
// vite.config.ts — Configuración de Vite
// Plugins: React, TanStack Router, Tailwind v4, PWA, visualizer
// Servidor en puerto 5178 con alias @ y modo analyze
// ============================================================

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
        // SCRUM-411: Runtime caching strategies
        runtimeCaching: [
          {
            // API GET: NetworkFirst con timeout 3s y fallback a cache
            urlPattern: /^https:\/\/[^/]+\/api\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 dias
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase REST queries: StaleWhileRevalidate
            urlPattern: /^https:\/\/[^/]+\/rest\/v1\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-rest",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
            },
          },
          {
            // Imagenes: CacheFirst con expiracion 30 dias
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            // Google Fonts: StaleWhileRevalidate
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            // Leaflet tiles: CacheFirst con expiracion 7 dias
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "leaflet-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
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
    validateProductionApiUrl(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
    },
  },
  build: {
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["@tanstack/react-router", "@tanstack/react-query"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
          ],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          charts: ["recharts"],
          maps: ["leaflet", "react-leaflet"],
          ml: ["@tensorflow/tfjs", "nsfwjs"],
          i18n: ["i18next", "react-i18next", "i18next-browser-languagedetector"],
        },
      },
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

// ============================================================
//  Guardarraíl: detecta configuración incorrecta de VITE_API_URL
// ------------------------------------------------------------
//  IMPORTANTE (15-jun-2026): Este plugin solo EMITE WARNINGS, no falla
//  el build. Razón: si las env vars de Vercel están mal configuradas
//  (VITE_API_URL apuntando a *.vercel.app en vez del backend en Render),
//  bloquear el build deja el sitio en producción roto indefinidamente.
//  Mejor detectar el problema, loguearlo y dejar que el dev lo arregle
//  en el dashboard de Vercel sin impedir el deploy.
//
//  - WARN: si VITE_API_URL apunta al frontend de Vercel (*.vercel.app)
//    → bug real visto en producción el 13-jun-2026 (respuestas random).
//  - WARN: si VITE_API_URL es localhost en build de producción.
//  - WARN: si VITE_API_URL no está definida (permite builds locales
//    sin entorno, pero avisa al desarrollador).
//  - OK: si VITE_API_URL es una URL válida apuntando al backend.
// ============================================================
function validateProductionApiUrl() {
  return {
    name: "validate-production-api-url",
    configResolved(config: { command: string; mode: string }) {
      if (config.command !== "build") return;
      if (config.mode === "development") return;
      const apiUrl = process.env.VITE_API_URL;
      if (apiUrl?.includes(".vercel.app")) {
        console.warn(
          `[vite] ⚠️  VITE_API_URL="${apiUrl}" apunta al frontend de Vercel. Debería ser la URL del BACKEND NestJS (e.g. https://sportmatch-api.onrender.com). Corrige la variable en Vercel Dashboard → Settings → Environment Variables.`,
        );
        return;
      }
      if (apiUrl?.startsWith("http://localhost")) {
        console.warn(
          `[vite] ⚠️  VITE_API_URL="${apiUrl}" apunta a localhost. En producción, debería ser la URL pública del backend NestJS.`,
        );
        return;
      }
      if (!apiUrl) {
        console.warn(
          "[vite] ⚠️  VITE_API_URL no está definida. El frontend intentará conectarse a http://localhost:3000. Define la variable en Vercel Dashboard antes de hacer deploy.",
        );
        return;
      }
      console.log(`[vite] ✓ VITE_API_URL validado: ${apiUrl}`);
    },
  };
}
