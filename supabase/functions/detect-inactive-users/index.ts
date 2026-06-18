/* eslint-disable prefer-const */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") || "";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface InactiveUser {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  last_login_at: string | null;
  push_token: string | null;
  is_admin: boolean | null;
  inactivity_days: number;
}

interface AlertResult {
  user_id: string;
  name: string | null;
  alert_level: number;
  days_since: number;
  push_sent: boolean;
  fitcoin_bonus: number;
  error?: string;
}

function getAlertConfig(daysSince: number): {
  level: number;
  message: string;
  fitcoinBonus: number;
} {
  if (daysSince >= 28) {
    return {
      level: 3,
      message:
        "Llevas 28 días sin entrenar. Tu cuenta será desactivada si no vuelves. Contáctanos para más información.",
      fitcoinBonus: 0,
    };
  }
  if (daysSince >= 21) {
    return {
      level: 2,
      message:
        "¡Te extrañamos! Vuelve a SportMatch y completa un desafío especial. Te esperan 100 FitCoins.",
      fitcoinBonus: 100,
    };
  }
  // 14+ days
  return {
    level: 1,
    message: "¡Te extrañamos! Te regalamos 50 FitCoins para tu próximo partido. 🎁",
    fitcoinBonus: 50,
  };
}

async function sendPushNotification(pushToken: string, message: string): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn("OneSignal not configured; skipping push notification.");
    return false;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_subscription_ids: [pushToken],
        headings: { en: "¡Te extrañamos! 🏟️", es: "¡Te extrañamos! 🏟️" },
        contents: { en: message, es: message },
        url: "https://sportmatch-connect.vercel.app/app",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("OneSignal push failed:", response.status, errorBody);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error sending OneSignal push:", err);
    return false;
  }
}

async function grantFitcoinBonus(
  userId: string,
  amount: number,
  daysSince: number,
): Promise<boolean> {
  if (amount <= 0) return true;

  try {
    const { error } = await supabase.from("wallet_transactions").insert({
      user_id: userId,
      amount: amount,
      type: "EARN",
      description: `Bono de bienvenida por regresar (${daysSince} días inactivo)`,
    });

    if (error) {
      console.error("Error granting FitCoin bonus:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in grantFitcoinBonus:", err);
    return false;
  }
}

async function logAlert(
  userId: string,
  alertLevel: number,
  alertData: Record<string, unknown>,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_inactivity_log").upsert(
      {
        user_id: userId,
        alert_level: alertLevel,
        alert_data: alertData,
        alert_sent_at: new Date().toISOString(),
      },
      { onConflict: "user_id, alert_level" },
    );

    if (error) {
      console.error("Error logging inactivity alert:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in logAlert:", err);
    return false;
  }
}

serve(async (req) => {
  try {
    const method = req.method;

    // GET: health check
    if (method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          function: "detect-inactive-users",
          config: {
            onesignal_configured: Boolean(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY),
            supabase_configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
          },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // POST: execute detection
    if (method === "POST") {
      const body = await req.json().catch(() => ({}));
      const simulateDate = body?.simulate_date ? new Date(body.simulate_date) : new Date();
      const dryRun = body?.dry_run === true;

      // Query inactive users via the view
      let { data: inactiveUsers, error: queryError } = await supabase
        .from("view_inactive_users")
        .select("*");

      if (queryError) {
        // Fallback: query profiles directly
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, email, avatar_url, last_login_at, push_token, is_admin, deleted_at")
          .is("deleted_at", null)
          .or(
            "last_login_at.lt." +
              new Date(simulateDate.getTime() - 14 * 86400000).toISOString() +
              ",last_login_at.is.null",
          );

        if (profilesError) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "Failed to query inactive users: " + profilesError.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        inactiveUsers = (profiles || [])
          .map((p) => ({
            ...p,
            inactivity_days: p.last_login_at
              ? Math.floor(
                  (simulateDate.getTime() - new Date(p.last_login_at).getTime()) / 86400000,
                )
              : 999,
          }))
          .filter((u) => !u.is_admin);
      }

      const users: InactiveUser[] = (inactiveUsers || []) as InactiveUser[];

      if (users.length === 0) {
        return new Response(
          JSON.stringify({
            ok: true,
            processed: 0,
            message: "No inactive users found",
            timestamp: simulateDate.toISOString(),
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      const results: AlertResult[] = [];

      for (const user of users) {
        const daysSince = user.inactivity_days;
        const config = getAlertConfig(daysSince);

        // Skip admins
        if (user.is_admin) continue;

        const result: AlertResult = {
          user_id: user.id,
          name: user.name,
          alert_level: config.level,
          days_since: daysSince,
          push_sent: false,
          fitcoin_bonus: config.fitcoinBonus,
        };

        if (dryRun) {
          result.push_sent = false;
          results.push(result);
          continue;
        }

        try {
          // 1. Log the alert
          await logAlert(user.id, config.level, {
            days_since: daysSince,
            fitcoin_bonus: config.fitcoinBonus,
            message: config.message,
          });

          // 2. Send push notification
          if (user.push_token) {
            const pushSent = await sendPushNotification(user.push_token, config.message);
            result.push_sent = pushSent;
          }

          // 3. Grant FitCoin bonus (level 1 and 2 only)
          if (config.fitcoinBonus > 0) {
            await grantFitcoinBonus(user.id, config.fitcoinBonus, daysSince);
          }

          results.push(result);
        } catch (err) {
          result.error = err instanceof Error ? err.message : String(err);
          results.push(result);
        }
      }

      const summary = {
        total_inactive: users.length,
        processed: results.length,
        level_1: results.filter((r) => r.alert_level === 1).length,
        level_2: results.filter((r) => r.alert_level === 2).length,
        level_3: results.filter((r) => r.alert_level === 3).length,
        push_sent: results.filter((r) => r.push_sent).length,
        bonuses_granted: results.filter((r) => r.fitcoin_bonus > 0).length,
        errors: results.filter((r) => r.error).length,
      };

      return new Response(
        JSON.stringify({
          ok: true,
          summary,
          results: dryRun
            ? results
            : results.map((r) => ({
                user_id: r.user_id,
                alert_level: r.alert_level,
                days_since: r.days_since,
                push_sent: r.push_sent,
                fitcoin_bonus: r.fitcoin_bonus,
                error: r.error || null,
              })),
          dry_run: dryRun,
          timestamp: simulateDate.toISOString(),
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
    console.error("Error in detect-inactive-users Edge Function:", err);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
