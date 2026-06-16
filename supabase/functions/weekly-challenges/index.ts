import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const method = req.method;

    // GET: health check
    if (method === "GET") {
      return new Response(JSON.stringify({ status: "ok", function: "weekly-challenges" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // POST: generate weekly challenges
    if (method === "POST") {
      const body = await req.json().catch(() => ({}));
      const specificUserId = body?.user_id || null;

      const { data, error } = await supabase.rpc("generate_weekly_challenges", {
        p_user_id: specificUserId,
      });

      if (error) {
        console.error("Error generating weekly challenges:", error);

        // Fallback: generar desafíos manualmente si el RPC falla
        const { error: fallbackError } = await supabase.from("weekly_challenges").upsert(
          [
            {
              user_id: specificUserId || "00000000-0000-0000-0000-000000000000",
              week_start: new Date().toISOString().slice(0, 10),
              challenge_type: "play_matches",
              goal: 3,
              reward_xp: 200,
              reward_fitcoins: 50,
              description: "Juega 3 partidos esta semana",
            },
          ],
          { onConflict: "user_id, week_start, challenge_type" },
        );

        if (fallbackError) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: error.message,
              fallback_error: fallbackError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          generated: data,
          timestamp: new Date().toISOString(),
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed. Use GET or POST." }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error in weekly-challenges Edge Function:", err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
