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

    if (!record || !record.chat_id) {
      return new Response(JSON.stringify({ error: "Missing message record" }), { status: 400 });
    }

    const chatId = record.chat_id;
    if (!chatId.startsWith("chat_squad_")) {
      return new Response(JSON.stringify({ message: "Not a squad chat message" }), { status: 200 });
    }

    const squadId = chatId.replace("chat_squad_", "");
    const senderId = record.sender_id;

    // Fetch Squad Name
    const { data: squad, error: squadError } = await supabase
      .from("squads")
      .select("name")
      .eq("id", squadId)
      .single();

    if (squadError || !squad) {
      console.error("Error fetching squad name:", squadError);
      return new Response(JSON.stringify({ error: "Squad not found" }), { status: 404 });
    }

    // Fetch squad members excluding the sender
    const { data: members, error: memError } = await supabase
      .from("squad_members")
      .select("profile_id")
      .eq("squad_id", squadId)
      .neq("profile_id", senderId);

    if (memError || !members || members.length === 0) {
      console.log("No squad members to notify or error:", memError);
      return new Response(JSON.stringify({ message: "No recipients to notify" }), { status: 200 });
    }

    const recipientIds = members.map((m) => m.profile_id);

    // Fetch push tokens for all recipients
    const { data: profiles, error: profError } = await supabase
      .from("profiles")
      .select("id, push_token")
      .in("id", recipientIds);

    if (profError) {
      console.error("Error fetching member profiles:", profError);
    }

    const title = `Nuevo mensaje en ${squad.name} 🛡️`;
    const content = record.text || "Has recibido un nuevo mensaje en el grupo.";

    // Insert database notifications for all recipients
    const notifInserts = recipientIds.map((recId) => ({
      user_id: recId,
      type: "SQUAD_MESSAGE",
      title: title,
      content: content,
      is_read: false,
    }));

    const { error: notifError } = await supabase.from("notifications").insert(notifInserts);

    if (notifError) {
      console.error("Error inserting squad notifications:", notifError);
    }

    // Filter push tokens
    const pushTokens =
      profiles?.map((p) => p.push_token).filter((token): token is string => !!token) || [];

    if (pushTokens.length > 0) {
      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_subscription_ids: pushTokens,
          headings: { en: title, es: title },
          contents: { en: content, es: content },
        }),
      });

      const resBody = await response.json();
      console.log("OneSignal push response for squad message:", resBody);
    } else {
      console.log("No squad recipients have a push_token registered.");
    }

    return new Response(JSON.stringify({ success: true, count: recipientIds.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error in notify-squad-msg Edge Function:", err);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});
