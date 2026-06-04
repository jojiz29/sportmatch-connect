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
  const { data: allProfiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);
  if (fetchError || allProfiles.length === 0) {
    console.error("Error fetching profile:", fetchError);
    return;
  }
  const testId = allProfiles[0].id;
  console.log("Found profile to test:", testId);

  // Payload containing non-existent columns (onboarding_completed, user_sports, sport_preferences)
  const initialPayload = {
    gender: "Masculino",
    bio: "Soy un deportista activo",
    onboarding_completed: true,
    user_sports: [],
    sport_preferences: {
      sports_matrix: {},
      behavioral_intent: { weekly_hours: 6, intent: "Recreativo" },
    },
  };

  let currentPayload = { ...initialPayload };
  let retries = 10;
  let success = false;
  let lastError = null;

  console.log("Executing self-healing retry logic simulation...");

  while (retries > 0 && !success) {
    console.log(`Attempt with payload keys: ${Object.keys(currentPayload).join(", ")}`);
    const { data, error } = await supabase
      .from("profiles")
      .update(currentPayload)
      .eq("id", testId)
      .select();

    if (!error) {
      success = true;
      console.log("Success! Updated data:", data);
    } else {
      lastError = error;
      console.log(`Failed with code ${error.code}: ${error.message}`);

      // Handle both PostgreSQL (42703) and PostgREST (PGRST204) missing column errors
      if (error.code === "42703" || error.code === "PGRST204") {
        // Try PostgREST match first: "Could not find the 'column_name' column of 'profiles' in the schema cache"
        let columnMatch = error.message.match(/Could not find the '([a-zA-Z0-9_]+)' column/);

        // Match standard Postgres message: "column \"column_name\" of relation \"profiles\" does not exist"
        if (!columnMatch) {
          columnMatch = error.message.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+of\s+relation/);
        }

        // Match standard Postgres message: "column profiles.column_name does not exist"
        if (!columnMatch) {
          columnMatch = error.message.match(
            /column\s+profiles\.([a-zA-Z0-9_]+)\s+does\s+not\s+exist/,
          );
        }

        if (columnMatch && columnMatch[1]) {
          const missingColumn = columnMatch[1];
          console.log(`Detected missing column: "${missingColumn}". Stripping and retrying...`);
          delete currentPayload[missingColumn];
          retries--;
          continue;
        }
      }
      break;
    }
  }

  if (success) {
    console.log("Final outcome: SUCCESS!");
  } else {
    console.log("Final outcome: FAILED! Error:", lastError);
  }
}

run().catch(console.error);
