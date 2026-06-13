// ============================================================
// server/src/main.ts — Punto de entrada del backend NestJS
// Compatible con:
//   - Servidor standalone (NestJS CLI / dev): npm run dev → app.listen()
//   - Vercel serverless: el handler en /api/index.ts reusa createApp()
// ============================================================

import * as dotenv from "dotenv";
import * as path from "path";

// === RESOLUCIÓN DE ENTORNO (Dual-URL Prisma) ===
// Carga el .env raíz primero (contiene DATABASE_URL real) y luego el del servidor
// En Vercel serverless estos archivos no existen; las env vars vienen del dashboard.
const serverEnvPath = path.resolve(process.cwd(), ".env");
const rootEnvPath = path.resolve(process.cwd(), "../.env");

dotenv.config({ path: rootEnvPath, override: false });
dotenv.config({ path: serverEnvPath, override: true });

// Si el .env del servidor aún tiene el placeholder, revierte al valor raíz
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("<YOUR_PASSWORD>")) {
  dotenv.config({ path: rootEnvPath, override: true });
}

const finalUrl = process.env.DATABASE_URL || "NOT FOUND";
const maskedUrl = finalUrl.replace(/:([^:@]+)@/, ":****@");
console.log(`[ENV AUDIT] serverEnvPath: ${serverEnvPath}`);
console.log(`[ENV AUDIT] rootEnvPath: ${rootEnvPath}`);
console.log(`[ENV AUDIT] Active Runtime DATABASE_URL: ${maskedUrl}`);

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

/**
 * Lista maestra de orígenes permitidos en CORS.
 * Combina los declarados en FRONTEND_URL con los puertos de desarrollo
 * local de Vite para evitar bloqueos durante el hot-reload.
 */
function buildAllowedOrigins(): string[] {
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

  const merged = new Set<string>([...fromEnv, ...viteDevPorts]);

  if (process.env.NODE_ENV !== "production") {
    for (let p = 5100; p <= 5200; p++) {
      merged.add(`http://localhost:${p}`);
    }
  }

  return Array.from(merged);
}

// ============================================================
// Bootstrap reutilizable (exportado para el handler de Vercel)
// ============================================================
export async function createApp() {
  const app = await NestFactory.create(AppModule);

  // === CORS CONFIGURATION ===
  const allowedOrigins = buildAllowedOrigins();
  console.log(`[CORS AUDIT] Allowed origins: ${allowedOrigins.join(", ")}`);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
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
