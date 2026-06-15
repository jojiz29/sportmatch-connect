// ============================================================
// api/[...path].js — Catch-all serverless handler para Vercel
// Vercel detecta archivos en /api como funciones serverless y
// los enruta por catch-all [...path] para que /api/* funcione.
//
// IMPORTANTE: Este archivo es JavaScript puro (no TypeScript)
// porque el builder @vercel/node NO compila TypeScript en /api.
// El servidor NestJS ya está compilado en server/dist/main.js
// gracias al buildCommand del vercel.json.
// ============================================================

// Forzar modo serverless para que el bootstrap del servidor NO escuche puerto
process.env.SERVERLESS = "true";

// Importa el módulo compilado del servidor (CommonJS, ya está en JS)
const { createApp } = require("../server/dist/main.js");

// Cache de la app NestJS para reusar entre invocaciones (warm starts)
let cachedHandler = null;

async function getHandler() {
  if (cachedHandler) return cachedHandler;
  const app = await createApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  cachedHandler = (req, res) => Promise.resolve(expressInstance(req, res));
  return cachedHandler;
}

// Handler default export para Vercel
module.exports = async function handler(req, res) {
  const h = await getHandler();
  return h(req, res);
};
