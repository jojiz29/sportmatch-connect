// ============================================================
// main.ts — Punto de entrada del backend NestJS
// Carga variable de entorno, configura CORS, Swagger y ValidationPipe
// ============================================================

import * as dotenv from "dotenv";
import * as path from "path";

// === RESOLUCIÓN DE ENTORNO (Dual-URL Prisma) ===
// Carga el .env raíz primero (contiene DATABASE_URL real) y luego el del servidor
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

  // Puertos por defecto que Vite usa para hot-reload
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

  // Auto-permitir cualquier puerto 51xx (rango de Vite) en desarrollo
  if (process.env.NODE_ENV !== "production") {
    for (let p = 5100; p <= 5200; p++) {
      merged.add(`http://localhost:${p}`);
    }
  }

  return Array.from(merged);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === CORS CONFIGURATION ===
  const allowedOrigins = buildAllowedOrigins();
  console.log(`[CORS AUDIT] Allowed origins: ${allowedOrigins.join(", ")}`);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (curl, Postman, server-to-server)
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
  // Whitelist elimina campos no decorados, transform convierte tipos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // === PREFIJO GLOBAL ===
  app.setGlobalPrefix("api/v1");

  // === SWAGGER ===
  const config = new DocumentBuilder()
    .setTitle("SportMatch API")
    .setDescription("SportMatch 2026 Backend API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  // === INICIO DEL SERVIDOR ===
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[SERVER] Application running on port ${port}`);
  console.log(`[SERVER] Swagger docs: http://localhost:${port}/docs`);
  console.log(`[SERVER] AI endpoint: http://localhost:${port}/api/v1/ai/chat`);
}

bootstrap();
