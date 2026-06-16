import { supabase } from "@/shared/api/supabase";

export async function signInWithGoogle() {
  const redirectTo =
    globalThis.window === undefined
      ? "http://localhost:5173/app"
      : `${globalThis.window.location.origin}/app`;

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
