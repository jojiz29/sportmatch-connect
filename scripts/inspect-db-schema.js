import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split(/\r?\n/).forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("Inspecting remote Supabase tables...");

  const tables = ["posts", "squads", "squad_members", "messages"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message, error.code);
    } else {
      console.log(
        `Table ${t} Success! Column names:`,
        data.length > 0 ? Object.keys(data[0]) : "(empty table)",
      );
    }
  }
}

run().catch(console.error);
