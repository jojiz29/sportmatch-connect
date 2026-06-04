import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join("=").trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("🔐 Signing in...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: "ejuniorfloress@gmail.com",
    password: "EdwinFlores123?",
  });
  if (authErr) { console.error("❌ Auth:", authErr); return; }
  console.log("✅ Signed in:", auth.user.id);

  const tables = [
    "matches",
    "courts",
    "match_participants",
    "user_stats",
    "notifications",
    "sports",
  ];

  console.log("\n📊 Testing all tables used in /app loader & components...\n");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`  ❌ ${table.padEnd(20)} [${error.code}] ${error.message}`);
    } else {
      console.log(`  ✅ ${table.padEnd(20)} OK (${data?.length ?? 0} rows returned)`);
    }
  }

  // Test the exact matches query (with joins)
  console.log("\n🔗 Testing matches with full join (exact loader query)...");
  const { data: matchData, error: matchErr } = await supabase.from("matches").select(`
    *,
    court:courts(*),
    match_participants(
      status,
      profile:profiles(*)
    )
  `).limit(2);

  if (matchErr) {
    console.log(`  ❌ matches JOIN query FAILED: [${matchErr.code}] ${matchErr.message}`);
  } else {
    console.log(`  ✅ matches JOIN query OK (${matchData?.length ?? 0} rows)`);
  }

  // Test apiClient.users.getMatches equivalent
  console.log("\n👥 Testing profiles table (users.getMatches)...");
  const { data: profileData, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_role", "PLAYER")
    .limit(3);

  if (profileErr) {
    console.log(`  ❌ profiles query FAILED: [${profileErr.code}] ${profileErr.message}`);
  } else {
    console.log(`  ✅ profiles query OK (${profileData?.length ?? 0} rows)`);
  }
}

run().catch(console.error);
