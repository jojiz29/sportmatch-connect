import pg from "pg";
import fs from "node:fs";

const env = fs.readFileSync(".env", "utf-8");
for (const line of env.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  if (/^[A-Z_][A-Z0-9_]*$/.test(k) && !process.env[k]) process.env[k] = v;
}

const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();

  const r = await c.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'bookings'
    ORDER BY ordinal_position
  `);
  console.log("bookings columns:");
  r.rows.forEach((row) => console.log(`  ${row.column_name}: ${row.data_type}`));

  await c.end();
})();
