// ============================================================
// api/[...path].ts — Catch-all serverless handler para Vercel
// Vercel detecta archivos en /api como funciones serverless y
// los enruta por catch-all [...path] para que /api/* funcione.
//
// NOTA IMPORTANTE: Este archivo NO se compila a JavaScript; Vercel
// lo lee directamente. Por eso importa desde la versión COMPILED
// del servidor (server/dist/main.js), no desde el TypeScript.
// ============================================================

// Forzar modo serverless para que el bootstrap del servidor NO escuche puerto
process.env.SERVERLESS = "true";

// Importa el módulo compilado del servidor (CommonJS, ya está en JS)
// El bootstrap interno detecta process.env.SERVERLESS y no llama a app.listen()
import { createApp } from "../server/dist/main.js";

// Cache de la app NestJS para reusar entre invocaciones (warm starts)
let cachedHandler: ((req: unknown, res: unknown) => Promise<unknown>) | null = null;

async function getHandler() {
  if (cachedHandler) return cachedHandler;
  const app = await createApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  cachedHandler = (req: unknown, res: unknown) => Promise.resolve(expressInstance(req, res));
  return cachedHandler;
}

// Handler default export para Vercel
export default async function handler(req: unknown, res: unknown) {
  const h = await getHandler();
  return h(req, res);
}
