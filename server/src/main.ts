import * as dotenv from "dotenv";
import * as path from "path";

// Resolve absolute paths to environment assets
// This ensures Prisma finds DATABASE_URL regardless of dist/ or root execution context
const serverEnvPath = path.resolve(process.cwd(), ".env");
const rootEnvPath = path.resolve(process.cwd(), "../.env");

// Load root-level .env first (contains real DATABASE_URL), then server-level overrides
dotenv.config({ path: rootEnvPath, override: false });
dotenv.config({ path: serverEnvPath, override: true });

// If server .env still has the placeholder, revert to the root value (already loaded)
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

  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("SportMatch API")
    .setDescription("SportMatch 2026 Backend API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
