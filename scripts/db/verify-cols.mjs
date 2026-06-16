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

  const cols = await c.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    ORDER BY ordinal_position
  `);
  console.log("All profiles columns:");
  cols.rows.forEach((r) =>
    console.log(
      `  ${r.column_name.padEnd(30)} ${r.data_type.padEnd(20)} ${r.column_default || ""}`,
    ),
  );

  await c.end();
})();
