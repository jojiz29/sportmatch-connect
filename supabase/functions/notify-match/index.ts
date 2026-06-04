import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") || "mock-app-id";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") || "mock-api-key";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: "Missing match record" }), { status: 400 });
    }

    // Wait a brief moment to allow participant rows to be inserted if they are in a transaction
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Query participants for this match
    const { data: participants, error: partError } = await supabase
      .from("match_participants")
      .select("user_id")
      .eq("match_id", record.id);

    if (partError) {
      console.error("Error fetching match participants:", partError);
    }

    // Find User_B (any participant that is not the creator)
    const creatorId = record.creator_id;
    const userB = participants?.find((p) => p.user_id !== creatorId);

    if (!userB) {
      console.log("No matched User_B found for match:", record.id);
      return new Response(JSON.stringify({ message: "No recipient user found" }), { status: 200 });
    }

    const recipientId = userB.user_id;

    // Fetch recipient's push_token
    const { data: profile, error: profError } = await supabase
      .from("profiles")
      .select("push_token, name")
      .eq("id", recipientId)
      .single();

    if (profError) {
      console.error("Error fetching recipient profile:", profError);
    }

    const pushToken = profile?.push_token;
    const title = "¡Es un Match! ⚽";
    const content = "Alguien quiere jugar contigo. Entra ahora.";

    // Insert database notification for User_B
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: recipientId,
      type: "MATCH_ALERT",
      title: title,
      content: content,
      is_read: false,
    });

    if (notifError) {
      console.error("Error inserting notification record:", notifError);
    }

    // Send Push Notification if push_token exists
    if (pushToken) {
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_subscription_ids: [pushToken],
          headings: { en: title, es: title },
          contents: { en: content, es: content },
        }),
      });

      const resBody = await response.json();
      console.log("OneSignal push response:", resBody);
    } else {
      console.log("Recipient has no push_token registered.");
    }

    return new Response(JSON.stringify({ success: true, recipient: recipientId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error in notify-match Edge Function:", err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
