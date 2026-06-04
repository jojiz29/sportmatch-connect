import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read env variables
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
  console.log("Fetching profile for tomeaguita2@gmail.com ...");

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "tomeaguita2@gmail.com",
    password: "Palta950?",
  });

  if (authError) {
    console.error("Error signing in:", authError);
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return;
  }

  console.log("Profile data:", profile);
}

run().catch(console.error);
