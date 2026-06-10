import { supabase } from "@/shared/api/supabase";

export async function signInWithGoogle() {
  const redirectTo =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("Error in signInWithGoogle:", error);
    throw error;
  }
  return data;
}
