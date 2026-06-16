// delete-user.mjs — Borra un usuario de la base de datos de Supabase
// Uso:
//   node scripts/db/delete-user.mjs --id <user_id>
//   node scripts/db/delete-user.mjs --email <email>
//   node scripts/db/delete-user.mjs --name "usil"  (búsqueda parcial)
//
// IMPORTANTE: solo usar con usuarios de prueba. El script se niega
// a borrar ciertos emails de administradores (cambiar la lista
// ADMIN_PROTECTED_EMAILS si es necesario).
//
// Borra en cascada:
//   - profiles (la fila principal)
//   - auth.users (con supabase.auth.admin.deleteUser)
//   - wallets, wallet_transactions
//   - user_rewards, user_achievements, user_stats
//   - posts, post_comments, post_comment_reactions
//   - matches creados y match_participants
//   - squads creados, squad_members (los quita de squads ajenos)
//   - conversations donde participaba (mensajes incluidos)
//   - player_challenges, player_connections, venue_activities
//   - notifications, followers (entradas)
//   - business_catalog, business_ads (si es business)

import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split(/\r?\n/)) {
  // Trim CR y whitespace
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (/^[A-Z_][A-Z0-9_]*$/.test(key) && !process.env[key]) {
    process.env[key] = value;
  }
}

const ADMIN_PROTECTED_EMAILS = [
  "ejuniorfloress@gmail.com",
  // Añadir más admins reales aquí si es necesario
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { id: null, email: null, name: null, dryRun: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--id") out.id = args[i + 1];
    else if (args[i] === "--email") out.email = args[i + 1];
    else if (args[i] === "--name") out.name = args[i + 1];
    else if (args[i] === "--dry-run") out.dryRun = true;
  }
  return out;
}

async function findUser(client, args) {
  if (args.id) {
    const r = await client.query("SELECT id, name FROM profiles WHERE id = $1", [args.id]);
    return r.rows[0];
  }
  if (args.email) {
    // email no está en profiles; consultamos auth.users
    const r = await client.query("SELECT id, email FROM auth.users WHERE email = $1", [args.email]);
    if (r.rows[0]) {
      const p = await client.query("SELECT id, name FROM profiles WHERE id = $1", [r.rows[0].id]);
      return p.rows[0];
    }
    return null;
  }
  if (args.name) {
    const r = await client.query(
      "SELECT id, name FROM profiles WHERE LOWER(name) LIKE $1 ORDER BY created_at DESC",
      [`%${args.name.toLowerCase()}%`],
    );
    return r.rows;
  }
  return null;
}

async function main() {
  const args = parseArgs();
  if (!args.id && !args.email && !args.name) {
    console.error(
      "Uso: node scripts/db/delete-user.mjs --id <uuid> | --email <email> | --name <partial>",
    );
    process.exit(1);
  }

  const pgClient = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    await pgClient.connect();
    const user = await findUser(pgClient, args);
    if (!user) {
      console.log("No se encontró el usuario.");
      return;
    }
    const users = Array.isArray(user) ? user : [user];
    if (users.length === 0) {
      console.log("No se encontró el usuario.");
      return;
    }
    if (users.length > 1) {
      console.log(`Se encontraron ${users.length} usuarios:`);
      for (const u of users) console.log(`  ${u.id}  ${u.name}`);
      console.log("Usa --id con el ID exacto para borrar uno específico.");
      return;
    }

    const target = users[0];

    // Buscar email en auth.users para la lista de protegidos
    const authRes = await pgClient.query("SELECT email FROM auth.users WHERE id = $1", [target.id]);
    const targetEmail = authRes.rows[0]?.email;
    if (targetEmail && ADMIN_PROTECTED_EMAILS.includes(targetEmail)) {
      console.error(`⛔ El email ${targetEmail} está protegido. No se puede borrar.`);
      process.exit(1);
    }

    console.log(`\n🎯 Usuario a eliminar:`);
    console.log(`  ID:    ${target.id}`);
    console.log(`  Name:  ${target.name}`);
    if (targetEmail) console.log(`  Email: ${targetEmail}`);
    console.log();

    if (args.dryRun) {
      console.log("DRY RUN: mostrando qué se eliminaría sin borrar nada.");
    }

    // Contar dependencias antes de borrar (columnas reales de cada tabla)
    const tables = [
      ["profiles (fila)", "SELECT COUNT(*) FROM profiles WHERE id = $1"],
      ["wallets", "SELECT COUNT(*) FROM wallets WHERE profile_id = $1"],
      ["wallet_transactions", "SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1"],
      ["user_rewards", "SELECT COUNT(*) FROM user_rewards WHERE user_id = $1"],
      ["user_achievements", "SELECT COUNT(*) FROM user_achievements WHERE user_id = $1"],
      ["user_stats", "SELECT COUNT(*) FROM user_stats WHERE user_id = $1"],
      ["posts", "SELECT COUNT(*) FROM posts WHERE user_id = $1"],
      ["post_comments", "SELECT COUNT(*) FROM post_comments WHERE user_id = $1"],
      ["post_comment_reactions", "SELECT COUNT(*) FROM post_comment_reactions WHERE user_id = $1"],
      ["matches creados", "SELECT COUNT(*) FROM matches WHERE creator_id = $1"],
      ["match_participants", "SELECT COUNT(*) FROM match_participants WHERE user_id = $1"],
      ["squads creados", "SELECT COUNT(*) FROM squads WHERE creator_id = $1"],
      ["squad_members (este user)", "SELECT COUNT(*) FROM squad_members WHERE profile_id = $1"],
      [
        "conversations (este user)",
        "SELECT COUNT(*) FROM conversation_participants WHERE user_id = $1",
      ],
      ["messages enviados", "SELECT COUNT(*) FROM messages WHERE sender_id = $1"],
      [
        "player_challenges (challenger)",
        "SELECT COUNT(*) FROM player_challenges WHERE challenger_id = $1",
      ],
      [
        "player_challenges (challenged)",
        "SELECT COUNT(*) FROM player_challenges WHERE challenged_id = $1",
      ],
      ["player_connections (origen)", "SELECT COUNT(*) FROM player_connections WHERE user_id = $1"],
      [
        "player_connections (destino)",
        "SELECT COUNT(*) FROM player_connections WHERE connected_user_id = $1",
      ],
      ["venue_activities creados", "SELECT COUNT(*) FROM venue_activities WHERE creator_id = $1"],
      [
        "venue_activities participaciones",
        "SELECT COUNT(*) FROM venue_activities WHERE $1 = ANY(participant_ids)",
      ],
      ["notifications", "SELECT COUNT(*) FROM notifications WHERE user_id = $1"],
      ["bookings", "SELECT COUNT(*) FROM bookings WHERE user_id = $1"],
      ["reviews", "SELECT COUNT(*) FROM reviews WHERE user_id = $1"],
      ["followers (siguiendo)", "SELECT COUNT(*) FROM followers WHERE follower_id = $1"],
      ["followers (seguidores)", "SELECT COUNT(*) FROM followers WHERE following_id = $1"],
      ["courts registrados", "SELECT COUNT(*) FROM courts WHERE owner_id = $1"],
      ["business_catalog", "SELECT COUNT(*) FROM business_catalog WHERE business_id = $1"],
    ];

    console.log("📊 Registros asociados:");
    let totalToDelete = 0;
    for (const [label, query] of tables) {
      const r = await pgClient.query(query, [target.id]);
      const count = Number(r.rows[0].count);
      if (count > 0) console.log(`  ${label}: ${count}`);
      totalToDelete += count;
    }
    console.log(`  TOTAL: ${totalToDelete} registros\n`);

    if (args.dryRun) {
      console.log("DRY RUN completo. Ejecuta sin --dry-run para borrar.");
      return;
    }

    // Confirmar
    console.log("⚠️  Esto borrará TODOS los registros del usuario. NO se puede deshacer.");
    console.log("   Para confirmar, ejecuta con --confirm");
    if (!process.argv.includes("--confirm")) {
      console.log("   Abortando. Vuelve a ejecutar con --confirm para proceder.");
      return;
    }

    console.log("\n🗑️  Borrando...");

    // Borrar en orden de dependencias (FK)
    const deletes = [
      "DELETE FROM wallet_transactions WHERE user_id = $1",
      "DELETE FROM user_rewards WHERE user_id = $1",
      "DELETE FROM user_achievements WHERE user_id = $1",
      "DELETE FROM user_stats WHERE user_id = $1",
      "DELETE FROM post_comment_reactions WHERE user_id = $1",
      "DELETE FROM post_comments WHERE user_id = $1",
      "DELETE FROM posts WHERE user_id = $1",
      "DELETE FROM match_participants WHERE user_id = $1",
      "DELETE FROM matches WHERE creator_id = $1",
      "DELETE FROM squad_members WHERE profile_id = $1",
      "DELETE FROM squads WHERE creator_id = $1",
      "DELETE FROM messages WHERE sender_id = $1",
      "DELETE FROM player_challenges WHERE challenger_id = $1 OR challenged_id = $1",
      "DELETE FROM player_connections WHERE user_id = $1 OR connected_user_id = $1",
      "DELETE FROM venue_activities WHERE creator_id = $1 OR $1 = ANY(participant_ids)",
      "DELETE FROM notifications WHERE user_id = $1",
      "DELETE FROM bookings WHERE user_id = $1",
      "DELETE FROM reviews WHERE user_id = $1",
      "DELETE FROM followers WHERE follower_id = $1 OR following_id = $1",
      "DELETE FROM courts WHERE owner_id = $1",
      "DELETE FROM business_catalog WHERE business_id = $1",
      "DELETE FROM conversation_participants WHERE user_id = $1",
      "DELETE FROM wallets WHERE profile_id = $1",
    ];

    await pgClient.query("BEGIN");
    for (const del of deletes) {
      await pgClient.query(del, [target.id]);
    }
    // Borrar conversations huérfanas (donde ya no quedan participantes)
    await pgClient.query(`
      DELETE FROM conversations
      WHERE id NOT IN (SELECT DISTINCT conversation_id FROM conversation_participants)
    `);
    // Borrar la fila principal
    await pgClient.query("DELETE FROM profiles WHERE id = $1", [target.id]);
    await pgClient.query("COMMIT");

    console.log("✅ Registros de la DB borrados.");

    // Borrar el usuario de Supabase Auth
    console.log("🗑️  Borrando de Supabase Auth...");
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(target.id);
    if (authError) {
      console.error(`⚠️  No se pudo borrar de Supabase Auth: ${authError.message}`);
    } else {
      console.log("✅ Usuario borrado de Supabase Auth.");
    }

    console.log("\n🎉 Usuario eliminado completamente.");
  } catch (err) {
    try {
      await pgClient.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    await pgClient.end();
  }
}

main();
