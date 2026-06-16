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

  console.log("Renaming profiles.level to profiles.level_label...");
  await c.query("ALTER TABLE profiles RENAME COLUMN level TO level_label");
  console.log("Adding profiles.level INTEGER NOT NULL DEFAULT 1...");
  await c.query("ALTER TABLE profiles ADD COLUMN level INTEGER NOT NULL DEFAULT 1");
  console.log("OK");

  const r = await c.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name IN ('level', 'level_label', 'xp', 'xp_to_next_level')
    ORDER BY column_name
  `);
  console.log("\nResulting columns:");
  r.rows.forEach((row) => console.log(`  ${row.column_name}: ${row.data_type}`));

  await c.end();
})();
