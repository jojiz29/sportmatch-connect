// verify-wallet-fix.mjs — Verifica que el fix de wallet funciona
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
    console.log(
      "=== TEST: Insertar wallet_transaction y verificar que profiles.fitcoins_balance se actualiza ===\n",
    );

    // 1. Obtener un usuario de prueba
    const userRes = await client.query("SELECT id, fitcoins_balance FROM profiles LIMIT 1");
    const user = userRes.rows[0];
    if (!user) {
      console.log("No hay usuarios en la tabla profiles");
      return;
    }
    console.log(`Usuario: ${user.id}`);
    console.log(`Saldo antes: ${user.fitcoins_balance} FC`);

    // 2. Insertar transacción de prueba (EARN +50)
    const beforeBalance = user.fitcoins_balance;
    console.log(`\nInsertando transacción EARN +50...`);
    const txRes = await client.query(
      "INSERT INTO wallet_transactions (user_id, amount, description, type) VALUES ($1, $2, $3, $4) RETURNING id, amount",
      [user.id, 50, "TEST: verify wallet fix", "EARN"],
    );
    console.log(`Transacción creada: ${txRes.rows[0].id} amount=${txRes.rows[0].amount}`);

    // 3. Verificar que profiles.fitcoins_balance se actualizó
    const afterRes = await client.query("SELECT fitcoins_balance FROM profiles WHERE id = $1", [
      user.id,
    ]);
    const afterBalance = afterRes.rows[0].fitcoins_balance;
    console.log(`Saldo después: ${afterBalance} FC`);

    if (afterBalance === beforeBalance + 50) {
      console.log(`\n✅ ÉXITO: el saldo se actualizó correctamente (+50)`);
    } else {
      console.log(`\n❌ FALLO: esperado ${beforeBalance + 50}, obtenido ${afterBalance}`);
    }

    // 4. Rollback: deshacer la transacción
    console.log(`\nRevirtiendo cambios...`);
    await client.query("DELETE FROM wallet_transactions WHERE id = $1", [txRes.rows[0].id]);
    await client.query("UPDATE profiles SET fitcoins_balance = $1 WHERE id = $2", [
      beforeBalance,
      user.id,
    ]);
    await client.query(
      "UPDATE wallets SET fitcoins_balance = fitcoins_balance - 50 WHERE profile_id = $1",
      [user.id],
    );
    console.log(`Rollback completado.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
