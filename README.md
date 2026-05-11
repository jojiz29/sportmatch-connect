# SportMatch

Prototipo SPA (Vite + React 19 + TanStack Router + Tailwind v4).

## Desarrollo
```bash
npm install
npm run dev
```

## Build
```bash
npm run build   # genera ./dist
```

## Deploy en Vercel
1. Push a GitHub.
2. Vercel → Add New → Project → Import.
3. Framework Preset: **Other** (respeta `vercel.json`).
   - buildCommand: `vite build`
   - outputDirectory: `dist`
   - SPA rewrite a `/index.html`.
4. Deploy.

100% client-side: sin SSR ni server functions. Routing por archivos en `src/routes/`.
