import pg from "pg";
import fs from "node:fs";

const env = fs.readFileSync(".env", "utf-8");
for (const line of env.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (v.startsWith('"') && v.endsWith('"')) {
    v = v.slice(1, -1);
  }
  if (/^[A-Z_][A-Z0-9_]*$/.test(k) && !process.env[k]) process.env[k] = v;
}

const url = process.env.DATABASE_URL;
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await c.connect();

const migration = process.argv[2];
if (!migration) {
  console.error("Usage: node apply-migration.mjs <migration-file>");
  process.exit(1);
}

const sql = fs.readFileSync(migration, "utf-8");
console.log(`Applying: ${migration}`);

try {
  await c.query(sql);
  console.log("OK");
} catch (err) {
  console.error("ERR:", err.message);
  process.exit(1);
} finally {
  await c.end();
}
