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
  const { data: courts, error } = await supabase.from("courts").select("id, name, district");

  if (error) {
    console.error(error);
    return;
  }
  const limaCourts = courts.filter((c) => String(c.id).startsWith("lima"));
  console.log("Total courts in DB:", courts.length);
  console.log("Lima courts count in DB:", limaCourts.length);
  limaCourts.forEach((c) => console.log(`- ${c.id}: ${c.name} (${c.district})`));
}

run();
