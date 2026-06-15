// ============================================================
// server/src/main.ts — Punto de entrada del backend NestJS
// Compatible con:
//   - Servidor standalone (NestJS CLI / dev): npm run dev → app.listen()
//   - Vercel serverless: el handler en /api/index.ts reusa createApp()
// ============================================================

import * as dotenv from "dotenv";
import * as path from "path";

// === RESOLUCIÓN DE ENTORNO (Dual-URL Prisma) ===
//
// Política de precedencia (15-jun-2026):
//   1. Variables del proceso (process.env) tienen prioridad ABSOLUTA.
//      En Render/Vercel el operador las define en el dashboard y NO deben
//      ser sobrescritas por archivos .env.
//   2. Si una variable NO está en process.env, se carga desde `server/.env`.
//      Este archivo puede tener overrides puntuales por servicio (puerto,
//      FRONTEND_URL específico, etc.) y se considera la segunda fuente.
//   3. Como último fallback, se carga el `.env` raíz del monorepo.
//      Contiene los secretos compartidos (DATABASE_URL, DIRECT_URL, claves
//      de Supabase) y se usa solo en desarrollo local.
//
// Esto evita el bug histórico donde un `server/.env` con placeholder
// `<YOUR_PASSWORD>` sobrescribía el valor real del `.env` raíz.
const serverEnvPath = path.resolve(process.cwd(), ".env");
const rootEnvPath = path.resolve(process.cwd(), "../.env");

dotenv.config({ path: serverEnvPath, override: false });
dotenv.config({ path: rootEnvPath, override: false });

const finalUrl = process.env.DATABASE_URL || "NOT FOUND";
const finalDirectUrl = process.env.DIRECT_URL || "NOT FOUND";
const maskedUrl = finalUrl.replace(/:([^:@]+)@/, ":****@");
const maskedDirectUrl = finalDirectUrl.replace(/:([^:@]+)@/, ":****@");
console.log(`[ENV AUDIT] serverEnvPath: ${serverEnvPath}`);
console.log(`[ENV AUDIT] rootEnvPath: ${rootEnvPath}`);
console.log(`[ENV AUDIT] Active Runtime DATABASE_URL: ${maskedUrl}`);
console.log(`[ENV AUDIT] Active Runtime DIRECT_URL: ${maskedDirectUrl}`);
if (finalDirectUrl === "NOT FOUND") {
  console.warn(
    "[ENV AUDIT] ⚠️  DIRECT_URL no está definida. Prisma puede colgarse o " +
      "fallar al iniciar. Defínela en Render → Environment Variables.",
  );
}

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

/**
 * Lista maestra de orígenes permitidos en CORS.
 *
 * Fuentes (en orden de precedencia):
 *  1. `FRONTEND_URL` env var (CSV). El operador lo declara en Render dashboard.
 *  2. Patrones wildcard: `*.vercel.app` (cubre los 3 deployments de Vercel del
 *     proyecto sportmatch-connect: sportmatch-connect, sportmatch-connect-czs5,
 *     sportmatch-connect-juan-alonso). Esto evita que CORS rompa cuando se
 *     añade un nuevo alias/preview de Vercel sin tocar el dashboard de Render.
 *  3. Puertos locales de Vite (5173..5180) para hot-reload en desarrollo.
 *  4. Rango localhost:5100-5200 solo en desarrollo.
 *
 * Cualquier origin que NO matchea se loguea y se rechaza con un error de CORS
 * (mantenemos el logging de auditoría que ya teníamos).
 */
function buildAllowedOrigins(): { exact: Set<string>; patterns: RegExp[] } {
  const fromEnv = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const viteDevPorts = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    "http://localhost:5179",
    "http://localhost:5180",
  ];

  const exact = new Set<string>([...fromEnv, ...viteDevPorts]);

  if (process.env.NODE_ENV !== "production") {
    for (let p = 5100; p <= 5200; p++) {
      exact.add(`http://localhost:${p}`);
    }
  }

  // Patrones wildcard para hosts conocidos que sirven el frontend.
  // Cubre *.vercel.app (cualquier deployment/preview/alias de Vercel).
  // Para añadir otro proveedor: /^https:\/\/.*\.tu-proveedor\.com$/
  const patterns: RegExp[] = [
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
    /^https:\/\/[a-z0-9-]+--[a-z0-9-]+\.vercel\.app$/i,
  ];

  return { exact, patterns };
}

// ============================================================
// Bootstrap reutilizable (exportado para el handler de Vercel)
// ============================================================
export async function createApp() {
  const app = await NestFactory.create(AppModule);

  // === CORS CONFIGURATION ===
  const { exact: allowedOrigins, patterns: allowedPatterns } = buildAllowedOrigins();
  console.log(
    `[CORS AUDIT] Allowed exact origins: ${Array.from(allowedOrigins).join(", ") || "(none)"}`,
  );
  console.log(
    `[CORS AUDIT] Allowed pattern origins: ${allowedPatterns.map((p) => p.source).join(", ")}`,
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Sin origin (server-to-server, curl, healthchecks) → permitir
      if (!origin) {
        callback(null, true);
        return;
      }
      // Match exacto (env var + localhost dev ports)
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      // Match por patrón (e.g. *.vercel.app)
      if (allowedPatterns.some((pattern) => pattern.test(origin))) {
        callback(null, true);
        return;
      }
      // Origen desconocido: loguear y rechazar
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  // === VALIDACIÓN GLOBAL ===
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // === PREFIJO GLOBAL ===
  app.setGlobalPrefix("api/v1");

  // === SWAGGER (solo si no es serverless para evitar overhead) ===
  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
    const config = new DocumentBuilder()
      .setTitle("SportMatch API")
      .setDescription("SportMatch 2026 Backend API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  await app.init();
  return app;
}

// ============================================================
// Modo standalone: escuchar puerto (npm run dev, ts-node, etc.)
// ============================================================
async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[SERVER] Application running on port ${port}`);
  console.log(`[SERVER] Swagger docs: http://localhost:${port}/docs`);
  console.log(`[SERVER] AI endpoint: http://localhost:${port}/api/v1/ai/chat`);
}

// Solo arrancar el listener si NO estamos en serverless
// (Vercel invoca createApp() a través del handler en /api/[...path].ts)
if (!process.env.SERVERLESS && process.env.VERCEL !== "1") {
  bootstrap();
}
