import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync("./.env", "utf8");
const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : "";
const supabaseKey = keyMatch ? keyMatch[1].trim() : "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
  const authId = "cde4af78-4e7b-43ef-8ec2-8ef019fe8755";
  console.log(`Checking profile for ID ${authId}...`);
  const { data, error } = await supabase.from("profiles").select("*").eq("id", authId);

  if (error) {
    console.error("Error fetching profile:", error.message);
  } else {
    console.log("Profile records found:", data);
  }
}

checkProfile();
