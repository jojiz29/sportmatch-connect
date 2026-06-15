// test-redeem.mjs — Testea el RPC redeem_reward
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
    console.log("=== TEST: redeem_reward RPC ===\n");

    // Obtener usuario y recompensa
    const userRes = await client.query("SELECT id, fitcoins_balance FROM profiles LIMIT 1");
    const user = userRes.rows[0];
    const rewardRes = await client.query(
      "SELECT id, cost_fitcoins, stock FROM rewards WHERE cost_fitcoins <= 50 ORDER BY cost_fitcoins ASC LIMIT 1",
    );
    const reward = rewardRes.rows[0];

    if (!user || !reward) {
      console.log("Faltan datos de prueba");
      return;
    }

    console.log(`Usuario: ${user.id}, saldo actual: ${user.fitcoins_balance} FC`);
    console.log(
      `Recompensa: ${reward.id}, costo: ${reward.cost_fitcoins} FC, stock: ${reward.stock}`,
    );

    // Preparar balance suficiente
    await client.query("UPDATE profiles SET fitcoins_balance = 100 WHERE id = $1", [user.id]);
    await client.query("UPDATE wallets SET fitcoins_balance = 100 WHERE profile_id = $1", [
      user.id,
    ]);

    const beforeBalance = 100;
    const beforeStock = reward.stock;

    // Ejecutar RPC
    console.log("\nEjecutando redeem_reward RPC...");
    await client.query("BEGIN");
    try {
      const result = await client.query("SELECT public.redeem_reward($1, $2) as success", [
        user.id,
        reward.id,
      ]);
      console.log(`Resultado: success=${result.rows[0].success}`);

      // Verificar saldo y stock
      const afterUser = await client.query("SELECT fitcoins_balance FROM profiles WHERE id = $1", [
        user.id,
      ]);
      const afterWallet = await client.query(
        "SELECT fitcoins_balance FROM wallets WHERE profile_id = $1",
        [user.id],
      );
      const afterReward = await client.query("SELECT stock FROM rewards WHERE id = $1", [
        reward.id,
      ]);
      const afterUserRewards = await client.query(
        "SELECT COUNT(*) as count FROM user_rewards WHERE user_id = $1 AND reward_id = $2",
        [user.id, reward.id],
      );

      console.log(`\nDespués:`);
      console.log(
        `  profiles.fitcoins_balance: ${afterUser.rows[0].fitcoins_balance} (era ${beforeBalance})`,
      );
      console.log(`  wallets.fitcoins_balance: ${afterWallet.rows[0].fitcoins_balance}`);
      console.log(`  rewards.stock: ${afterReward.rows[0].stock} (era ${beforeStock})`);
      console.log(`  user_rewards count: ${afterUserRewards.rows[0].count}`);

      if (afterUser.rows[0].fitcoins_balance === beforeBalance - reward.cost_fitcoins) {
        console.log(`\n✅ ÉXITO: redeem_reward funciona correctamente`);
      } else {
        console.log(`\n❌ FALLO: saldo no se actualizó correctamente`);
      }
    } finally {
      await client.query("ROLLBACK");
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
