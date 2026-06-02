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

if (!url || !key) {
  console.error("Missing credentials in .env file");
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const { data: courts, error } = await supabase
    .from("courts")
    .select("id, name, sport, image_url, district");

  if (error) {
    console.error("Error fetching courts:", error);
    process.exit(1);
  }

  console.log(`Total courts fetched: ${courts.length}`);
  const uniqueSports = [...new Set(courts.map((c) => c.sport))];
  console.log("Unique sports in DB:", uniqueSports);

  console.log("\nSample courts with their image_url:");
  const seenUrls = new Set();
  const examples = [];

  for (const court of courts) {
    if (!seenUrls.has(court.image_url)) {
      seenUrls.add(court.image_url);
      examples.push(court);
    }
  }

  examples.forEach((c) => {
    console.log(`- Sport: ${c.sport} | Image: ${c.image_url} | e.g. ${c.name} (${c.district})`);
  });
}

run().catch(console.error);
