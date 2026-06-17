#!/usr/bin/env node
// =============================================================================
// scripts/dev-stack.mjs
// Orquestador unificado de desarrollo para SportMatch Connect.
//
// Responsabilidades:
//   1. Verificar/instalar dependencias del backend (server/) si no existen.
//   2. Iniciar frontend (Vite) y backend (NestJS) en paralelo con `concurrently`.
//   3. Mostrar URLs de acceso claras y diferenciadas por color.
// =============================================================================

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SERVER_DIR = resolve(ROOT, "server");
const SERVER_NODE_MODULES = resolve(SERVER_DIR, "node_modules");
const SERVER_NEST = resolve(SERVER_DIR, "node_modules/.bin/nest");
const SERVER_TS_NODE = resolve(SERVER_DIR, "node_modules/.bin/ts-node");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function header(text) {
  const line = "═".repeat(60);
  console.log(`\n${COLORS.bold}${COLORS.cyan}${line}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}  ${text}${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.cyan}${line}${COLORS.reset}\n`);
}

function info(text) {
  console.log(`${COLORS.blue}ℹ${COLORS.reset} ${text}`);
}

function success(text) {
  console.log(`${COLORS.green}✓${COLORS.reset} ${text}`);
}

function warn(text) {
  console.log(`${COLORS.yellow}⚠${COLORS.reset} ${text}`);
}

function error(text) {
  console.log(`${COLORS.red}✗${COLORS.reset} ${text}`);
}

// ============================================================
// Paso 1: Verificar e instalar dependencias del backend
// ============================================================
header("SportMatch Connect — Full Stack Development");

info(`Root:     ${ROOT}`);
info(`Backend:  ${SERVER_DIR}`);

if (!existsSync(SERVER_NODE_MODULES) || !existsSync(SERVER_TS_NODE)) {
  warn("Dependencias del backend no encontradas. Instalando...");
  const install = spawn("npm", ["install", "--silent"], {
    cwd: SERVER_DIR,
    stdio: "inherit",
    shell: true,
  });

  await new Promise((resolve, reject) => {
    install.on("exit", (code) => {
      if (code === 0) {
        success("Dependencias del backend instaladas correctamente");
        resolve();
      } else {
        error(`Falló la instalación de dependencias (código ${code})`);
        reject(new Error("npm install failed"));
      }
    });
  });
} else {
  success("Dependencias del backend verificadas");
}

// ============================================================
// Paso 2: Verificar archivo de credenciales Vertex AI
// ============================================================
const credentialsPath = resolve(SERVER_DIR, "credentials/google-cloud-credentials.json");
if (!existsSync(credentialsPath)) {
  warn("Archivo de credenciales Vertex AI no encontrado en:");
  warn(`  ${credentialsPath}`);
  warn("El endpoint /api/v1/ai/chat fallará hasta que se coloque el JSON.");
} else {
  success("Credenciales Vertex AI detectadas");
}

// ============================================================
// Paso 3: Verificar variables de entorno mínimas
// ============================================================
import { readFileSync } from "node:fs";
let envOk = true;
try {
  const envContent = readFileSync(resolve(SERVER_DIR, ".env"), "utf-8");
  const required = [
    "DATABASE_URL",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "GOOGLE_CLOUD_PROJECT",
    "VERTEX_AI_LOCATION",
    "VERTEX_AI_MODEL_ID",
  ];
  for (const key of required) {
    if (!envContent.includes(`${key}=`)) {
      error(`Variable requerida no encontrada en server/.env: ${key}`);
      envOk = false;
    }
  }
  if (envOk) success("Variables de entorno del backend verificadas");
} catch (err) {
  warn(`No se pudo leer server/.env: ${err.message}`);
}

// ============================================================
// Paso 4: Mostrar resumen de servicios
// ============================================================
console.log("");
console.log(`${COLORS.bold}Servicios que se iniciarán:${COLORS.reset}`);
console.log(
  `  ${COLORS.cyan}[FRONTEND]${COLORS.reset} Vite dev server       http://localhost:5173`,
);
console.log(
  `  ${COLORS.magenta}[BACKEND]${COLORS.reset}  NestJS API + AI      http://localhost:3000`,
);
console.log(
  `  ${COLORS.magenta}[BACKEND]${COLORS.reset}  Swagger docs         http://localhost:3000/docs`,
);
console.log(
  `  ${COLORS.magenta}[BACKEND]${COLORS.reset}  AI Chat endpoint     POST /api/v1/ai/chat`,
);
console.log("");

if (!envOk) {
  error("Faltan variables de entorno críticas. Revisa server/.env antes de continuar.");
  process.exit(1);
}

// ============================================================
// Paso 4.5: Liberar puertos colgados si están en uso (Windows)
// ============================================================
function killPort(port) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, { stdio: "pipe" }).toString().trim();
    if (!stdout) return;

    const lines = stdout.split("\n");
    const pids = new Set();

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }

    for (const pid of pids) {
      if (pid === "0" || pid === process.pid.toString()) continue;
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        success(`Puerto ${port} liberado (PID ${pid} terminado)`);
      } catch {
        // ignorar fallos de taskkill individual
      }
    }
  } catch {
    // netstat devuelve código 1 si no encuentra coincidencia, es normal
  }
}

info("Verificando y liberando puertos 5173 y 3000...");
killPort(5173);
killPort(3000);
console.log("");

// ============================================================
// Paso 5: Lanzar ambos procesos con concurrently
// ============================================================
info("Iniciando stack completo (Ctrl+C para detener)...\n");

const concurrently = spawn(
  "npx",
  [
    "concurrently",
    "-n",
    "FRONTEND,BACKEND",
    "-c",
    "cyan,magenta",
    "--kill-others-on-fail",
    "npm:dev:frontend",
    "npm:dev:backend",
  ],
  {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" },
  },
);

concurrently.on("exit", (code) => {
  process.exit(code ?? 0);
});

// Manejar Ctrl+C para terminar limpiamente
process.on("SIGINT", () => {
  concurrently.kill("SIGINT");
  process.exit(0);
});
