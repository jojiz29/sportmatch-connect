// apply-migration.mjs — Aplica una migración SQL a la base de datos de Supabase
// Uso: node scripts/db/apply-migration.mjs <path-to-sql>
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlPath = process.argv[2];
if (!sqlPath) {
  console.error("Uso: node scripts/db/apply-migration.mjs <path-to-sql>");
  process.exit(1);
}

const absolutePath = path.resolve(sqlPath);
if (!fs.existsSync(absolutePath)) {
  console.error(`Archivo no encontrado: ${absolutePath}`);
  process.exit(1);
}

const sql = fs.readFileSync(absolutePath, "utf-8");

// Cargar env vars
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL no está definida en .env");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log(`Conectado a Supabase PostgreSQL`);
  console.log(`Aplicando migración: ${absolutePath}`);
  console.log(`---`);
  await client.query(sql);
  console.log(`---`);
  console.log(`Migración aplicada con éxito.`);
  await client.end();
} catch (err) {
  console.error(`Error aplicando migración:`, err.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
}
