// list-tables.mjs — Lista todas las tablas en public
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Tablas en public:");
    for (const row of res.rows) {
      console.log(`  ${row.table_name}`);
    }

    console.log("\nTriggers en profiles:");
    const trig = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'profiles'
    `);
    for (const row of trig.rows) {
      console.log(`  ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`);
    }

    console.log("\nFunciones de trigger:");
    const funcs = await client.query(`
      SELECT n.nspname, p.proname, p.prosecdef
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prokind = 'f'
      ORDER BY p.proname;
    `);
    for (const row of funcs.rows) {
      console.log(`  ${row.proname} (SECURITY DEFINER: ${row.prosecdef})`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
