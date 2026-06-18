const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://gzyoxfhzuxknqacplapi.supabase.co";
const supabaseKey = "sb_publishable_RWQAc4K1J0zI3RZKRDXHYw_QRIF30D9";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Querying premium_nutrition_logs...");
  try {
    const { data, error } = await supabase.from("premium_nutrition_logs").select("*").limit(5);

    if (error) {
      console.error("Error from Supabase:", error);
    } else {
      console.log("Data from Supabase:", data);
    }
  } catch (err) {
    console.error("Caught exception:", err);
  }
}

run();
