import { createClient } from "@supabase/supabase-js";
import fs from "react"; // wait, let's use standard node fs!
import fsNode from "fs";

const envContent = fsNode.readFileSync(".env", "utf8");
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
  const { data: sampleCourts, error } = await supabase.from("courts").select("*").limit(5);

  if (error) {
    console.error(error);
    return;
  }
  console.log("Sample courts count in DB:", sampleCourts.length);
  sampleCourts.forEach((c) => {
    console.log(`- ${c.id}: ${c.name} (${c.district}) (owner_id=${c.owner_id})`);
  });
}

run();
