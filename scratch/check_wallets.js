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

const supabase = createClient(url, key);

async function run() {
  console.log("Checking if wallets table exists...");
  const { data, error } = await supabase.from("wallets").select("*").limit(1);
  if (error) {
    console.log("Error querying wallets table:", error.message, error.code);
  } else {
    console.log("wallets table exists! Data:", data);
  }
}

run().catch(console.error);
