// check-missing.mjs — Verifica objetos faltantes
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

    // Check if redeem_reward exists
    const r1 = await client.query(`
      SELECT proname, prosecdef FROM pg_proc
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND proname IN ('redeem_reward', 'sync_profile_wallet_balance', 'sync_profile_to_wallet', 'protect_profile_fields', 'check_booking_balance', 'check_participant_balance')
      ORDER BY proname;
    `);
    console.log("Funciones del módulo wallet:");
    for (const row of r1.rows) {
      console.log(`  ${row.proname} (SECURITY DEFINER: ${row.prosecdef})`);
    }

    // Check if the trigger on wallet_transactions exists
    const r2 = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'wallet_transactions';
    `);
    console.log("\nTriggers en wallet_transactions:");
    for (const row of r2.rows) {
      console.log(`  ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`);
    }

    // Check sample wallet_transactions
    const r3 = await client.query(`
      SELECT COUNT(*) as total FROM wallet_transactions;
    `);
    console.log(`\nTotal wallet_transactions: ${r3.rows[0].total}`);

    // Try to insert a test transaction
    console.log("\nProbando INSERT en wallet_transactions...");
    try {
      const userRes = await client.query("SELECT id, fitcoins_balance FROM profiles LIMIT 1");
      const user = userRes.rows[0];
      if (user) {
        const before = user.fitcoins_balance;
        await client.query("BEGIN");
        const txRes = await client.query(
          "INSERT INTO wallet_transactions (user_id, amount, description, type) VALUES ($1, $2, $3, $4) RETURNING id, amount",
          [user.id, 50, "TEST: verify wallet fix", "EARN"],
        );
        const afterRes = await client.query("SELECT fitcoins_balance FROM profiles WHERE id = $1", [
          user.id,
        ]);
        const after = afterRes.rows[0].fitcoins_balance;
        await client.query("ROLLBACK");
        console.log(`  Antes: ${before} FC`);
        console.log(`  Después: ${after} FC`);
        if (after === before + 50) {
          console.log(`  ✅ ÉXITO: el trigger funciona correctamente`);
        } else {
          console.log(`  ❌ FALLO`);
        }
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
