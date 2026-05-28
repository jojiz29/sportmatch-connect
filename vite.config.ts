import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";

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
    mode === "analyze" && visualizer({ open: false, filename: "dist/stats.html", gzipSize: true }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@vercel/postgres": path.resolve(__dirname, "./src/shared/lib/vercel-postgres-mock.ts"),
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
}));
