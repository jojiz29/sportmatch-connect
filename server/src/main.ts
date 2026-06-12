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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === CORS CONFIGURATION ===
  // Permite orígenes definidos en FRONTEND_URL o los defaults locales
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5178")
    .split(",")
    .map((url) => url.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    credentials: true,
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
  console.log(`Application running on port ${port}`);
}

bootstrap();
