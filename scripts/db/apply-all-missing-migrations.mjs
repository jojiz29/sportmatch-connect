// apply-all-missing-migrations.mjs — Aplica todas las migraciones faltantes a Supabase
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar env vars del archivo .env
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const cleanLine = line.trim();
    const match = cleanLine.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      // Remover comillas si existen
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[match[1]] = val;
    }
  }
}

// Usar DIRECT_URL por seguridad (evita PgBouncer/pooler transaction-mode issues)
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DIRECT_URL o DATABASE_URL no están definidas en .env");
  process.exit(1);
}

// Lista ordenada de migraciones a comprobar/aplicar
const migrationsToApply = [
  "20260604_realtime_engagement.sql",
  "20260618000000_make_edwin_admin.sql",
  "20260618000100_weekly_challenges.sql",
  "20260618000200_favorite_courts.sql",
  "20260618000300_challenge_invitations.sql",
  "20260618000500_user_inactivity.sql",
  "20260618001000_followers_rls_and_rpc.sql",
  "20260618001200_feed_privacy.sql",
  "20260618002000_post_likes.sql",
  "20260618003000_player_ratings.sql",
  "20260618003100_match_results.sql",
  "20260618003200_matchmaking_queue.sql"
];

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log("✅ Conectado a Supabase PostgreSQL usando direct connection");

    // Asegurar que la tabla schema_migrations existe
    await client.query("CREATE SCHEMA IF NOT EXISTS supabase_migrations;");
    await client.query(`
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version varchar(255) PRIMARY KEY,
        inserted_at timestamp with time zone DEFAULT now()
      );
    `);

    // Obtener las versiones ya aplicadas
    const appliedRes = await client.query("SELECT version FROM supabase_migrations.schema_migrations;");
    const appliedVersions = new Set(appliedRes.rows.map(row => row.version));

    console.log(`ℹ️ Migraciones registradas previamente en DB: ${appliedVersions.size}`);

    for (const file of migrationsToApply) {
      // Extraer version del nombre del archivo (ej. 20260618000000)
      const versionMatch = file.match(/^(\d+)/);
      if (!versionMatch) {
        console.warn(`⚠️ Nombre de archivo inválido, omitiendo: ${file}`);
        continue;
      }
      const version = versionMatch[1];

      if (appliedVersions.has(version)) {
        console.log(`⏭️ Migración ${file} ya está marcada como aplicada.`);
        continue;
      }

      const filePath = path.resolve(__dirname, "../../supabase/migrations", file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo de migración no encontrado: ${filePath}`);
        process.exit(1);
      }

      console.log(`🚀 Aplicando migración: ${file} (Versión: ${version})...`);
      const sql = fs.readFileSync(filePath, "utf-8");

      // Iniciar transacción para aplicar esta migración de forma segura y atómica
      await client.query("BEGIN;");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1);",
          [version]
        );
        await client.query("COMMIT;");
        console.log(`✅ Migración ${file} aplicada y registrada exitosamente.`);
      } catch (err) {
        await client.query("ROLLBACK;");
        console.error(`❌ Error al aplicar migración ${file}:`, err.message);
        throw err;
      }
    }

    console.log("🔄 Recargando esquema de PostgREST...");
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log("🎉 ¡Sincronización de base de datos completada exitosamente!");

  } catch (err) {
    console.error("❌ Fallo general durante la sincronización:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
