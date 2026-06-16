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

  // Verify calculate_user_level function
  const fnTest = await c.query(`
    SELECT
      calculate_user_level(0) AS xp0,
      calculate_user_level(99) AS xp99,
      calculate_user_level(100) AS xp100,
      calculate_user_level(400) AS xp400,
      calculate_user_level(899) AS xp899,
      calculate_user_level(900) AS xp900,
      calculate_user_level(10000) AS xp10000
  `);
  console.log("Function calculate_user_level tests:");
  console.log("  xp=0    =>", fnTest.rows[0].xp0, "(expected 1)");
  console.log("  xp=99   =>", fnTest.rows[0].xp99, "(expected 1)");
  console.log("  xp=100  =>", fnTest.rows[0].xp100, "(expected 2)");
  console.log("  xp=400  =>", fnTest.rows[0].xp400, "(expected 3)");
  console.log("  xp=899  =>", fnTest.rows[0].xp899, "(expected 3)");
  console.log("  xp=900  =>", fnTest.rows[0].xp900, "(expected 4)");
  console.log("  xp=10000 =>", fnTest.rows[0].xp10000, "(expected 11)");

  // Verify trigger
  const trigTest = await c.query(`
    SELECT user_id, name, xp, level, xp_to_next_level
    FROM profiles
    ORDER BY level DESC NULLS LAST, xp DESC NULLS LAST
    LIMIT 5
  `);
  console.log("\nTop 5 by XP:");
  trigTest.rows.forEach((r) => {
    console.log(
      `  ${(r.name || "").padEnd(20)} | L${String(r.level).padStart(2)} | ${r.xp}/${r.xp_to_next_level} xp`,
    );
  });

  // Test add_user_xp
  const sample = await c.query(`
    SELECT user_id FROM profiles LIMIT 1
  `);
  if (sample.rows[0]) {
    const uid = sample.rows[0].user_id;
    const beforeXp = await c.query(
      "SELECT xp, level FROM profiles WHERE user_id = $1",
      [uid],
    );
    console.log(`\nBefore add_user_xp: xp=${beforeXp.rows[0].xp} level=${beforeXp.rows[0].level}`);

    const add = await c.query("SELECT * FROM add_user_xp($1, $2)", [uid, 50]);
    console.log("After add 50:", add.rows[0]);

    // Reset
    await c.query("UPDATE profiles SET xp = $1 WHERE user_id = $2", [
      beforeXp.rows[0].xp,
      uid,
    ]);
  }

  await c.end();
})();
