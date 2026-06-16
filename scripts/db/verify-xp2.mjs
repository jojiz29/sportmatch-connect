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
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name IN ('id', 'user_id', 'xp', 'level', 'xp_to_next_level')
    ORDER BY column_name
  `);
  console.log("Profiles columns:", cols.rows);

  // Top 5
  const top = await c.query(`
    SELECT id, name, xp, level, xp_to_next_level
    FROM profiles
    ORDER BY level DESC NULLS LAST, xp DESC NULLS LAST
    LIMIT 5
  `);
  console.log("\nTop 5 by XP:");
  top.rows.forEach((r) =>
    console.log(
      `  ${(r.name || "").padEnd(20)} | L${String(r.level).padStart(2)} | ${r.xp}/${r.xp_to_next_level} xp`,
    ),
  );

  // Test add_user_xp with id (no user_id)
  if (top.rows[0]) {
    const uid = top.rows[0].id;
    const before = await c.query("SELECT xp, level FROM profiles WHERE id = $1", [uid]);
    console.log(`\nBefore: xp=${before.rows[0].xp} level=${before.rows[0].level}`);

    const add = await c.query("SELECT * FROM add_user_xp($1, $2)", [uid, 50]);
    console.log("After +50:", add.rows[0]);

    // Reset
    await c.query("UPDATE profiles SET xp = $1 WHERE id = $2", [before.rows[0].xp, uid]);
  }

  await c.end();
})();
