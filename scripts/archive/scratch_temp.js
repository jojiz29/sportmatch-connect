import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", url);
const supabase = createClient(url, key);

async function run() {
  console.log("Checking connection...");

  const tables = ["matches", "match_participants", "profiles", "users"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else {
      console.log(
        `Table ${t} success! Columns:`,
        data.length > 0 ? Object.keys(data[0]) : "No rows",
      );
    }
  }

  // Query check constraints on matches and match_participants
  const { data: constraints, error: constError } = await supabase.rpc(
    "get_constraints_info_if_any",
  );
  // Wait, if there is no RPC, let's run a query on information_schema or pg_constraint
  // Since supabase-js cannot run arbitrary SQL, let's see if we can query from a generic view or use information_schema via standard select?
  // Let's try selecting from pg_catalog or information_schema. Wait, standard postgrest doesn't expose pg_catalog or information_schema unless explicitly exposed. Let's see if we get an error or if we can run it.
  const { data: checkData, error: checkError } = await supabase
    .from("pg_constraint")
    .select("*")
    .limit(1);
  console.log("pg_constraint query result:", checkData, checkError);

  const { data: matchesData } = await supabase.from("matches").select("*").limit(5);
  console.log("Matches rows:", matchesData);

  const { data: partData } = await supabase.from("match_participants").select("*").limit(5);
  console.log("Match participants rows:", partData);
}

run().catch(console.error);
