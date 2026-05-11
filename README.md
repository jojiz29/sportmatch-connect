# SportMatch

Prototipo funcional de matchmaking deportivo construido con **TanStack Start + React 19 + Tailwind v4**.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí http://localhost:5173

## Build

```bash
npm run build
```

Genera la salida en `.output/` (assets estáticos en `.output/public`).

## Deploy en Vercel

Este repo incluye `vercel.json` listo para usar.

1. Subí el repo a GitHub.
2. En Vercel: **Add New → Project → Import Git Repository**.
3. Framework Preset: **Other** (Vercel respetará `vercel.json`).
4. Deploy.

Configuración aplicada por `vercel.json`:

- `buildCommand`: `vite build`
- `outputDirectory`: `.output/public`
- Rewrite SPA: cualquier ruta no encontrada cae en `/index.html` para que funcione el routing del lado del cliente (`/app/match`, `/app/map`, etc.).

> Nota: el prototipo es **client-side only** (sin server functions ni base de datos). Si más adelante agregás endpoints (`createServerFn`) o backend, tendrás que migrar a un adapter SSR de Vercel o usar Lovable Cloud.

## Estructura

- `src/routes/` — rutas (file-based routing TanStack Router)
- `src/components/` — UI compartida (AppShell, PageHeader, shadcn/ui)
- `src/lib/mock.ts` — datos simulados (jugadores, canchas, partidos, IoT)
- `src/styles.css` — design tokens (OKLCH), gradientes, animaciones
