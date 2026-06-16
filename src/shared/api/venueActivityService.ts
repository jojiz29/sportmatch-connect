import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "./supabase";
import { withTimeout } from "./timeoutHelper";

const DEMO_STORAGE_KEY = "sportmatch_demo_venue_activities";
const VENUE_ACTIVITY_TIMEOUT_MS = 10000;

export type VenueActivityType = "PLAYER_CHALLENGE" | "TEAM_CHALLENGE";

export interface VenueActivity {
  id: string;
  venue_id: string;
  creator_id: string;
  squad_id: string | null;
  sport: string;
  activity_type: VenueActivityType;
  status: "open" | "matched" | "cancelled";
  participant_id: string | null;
  participant_ids: string[];
  required_players: number;
  created_at: string;
}

function getDemoActivities(): VenueActivity[] {
  if (typeof globalThis.window === "undefined") return [];
  const activities = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || "[]") as VenueActivity[];

  // Normalizamos registros antiguos para que las pruebas locales no fallen al agregar cupos.
  return activities.map((activity) => ({
    ...activity,
    participant_ids:
      activity.participant_ids || (activity.participant_id ? [activity.participant_id] : []),
    required_players: activity.required_players || 2,
  }));
}

function saveDemoActivities(activities: VenueActivity[]) {
  if (typeof globalThis.window !== "undefined") {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(activities));
  }
}

export async function getVenueActivities(venueIds: string[]): Promise<VenueActivity[]> {
  if (venueIds.length === 0) return [];
  if (useAuthStore.getState().isDemoMode) {
    return getDemoActivities().filter(
      (activity) => venueIds.includes(activity.venue_id) && activity.status !== "cancelled",
    );
  }

  const { data, error } = await withTimeout(
    supabase
      .from("venue_activities")
      .select("*")
      .in("venue_id", venueIds)
      .in("status", ["open", "matched"])
      .order("created_at", { ascending: false }),
    VENUE_ACTIVITY_TIMEOUT_MS,
  );
  if (error) throw error;
  return (data || []) as VenueActivity[];
}

export async function createVenueActivity(input: {
  venueId: string;
  creatorId: string;
  sport: string;
  activityType: VenueActivityType;
  squadId?: string;
  requiredPlayers: number;
}): Promise<VenueActivity> {
  if (useAuthStore.getState().isDemoMode) {
    const activity: VenueActivity = {
      id: `venue-activity-${Date.now()}`,
      venue_id: input.venueId,
      creator_id: input.creatorId,
      squad_id: input.squadId || null,
      sport: input.sport,
      activity_type: input.activityType,
      status: "open",
      participant_id: null,
      participant_ids: [],
      required_players: input.requiredPlayers,
      created_at: new Date().toISOString(),
    };
    saveDemoActivities([activity, ...getDemoActivities()]);
    return activity;
  }

  const { data, error } = await withTimeout(
    supabase
      .from("venue_activities")
      .insert({
        venue_id: input.venueId,
        creator_id: input.creatorId,
        squad_id: input.squadId || null,
        sport: input.sport,
        activity_type: input.activityType,
        required_players: input.requiredPlayers,
      })
      .select("*")
      .single(),
    VENUE_ACTIVITY_TIMEOUT_MS,
  );
  if (error) throw error;
  return data as VenueActivity;
}

export async function joinVenueActivity(
  activityId: string,
  participantId: string,
): Promise<VenueActivity> {
  console.info("[venue-activity] join:start", { activityId, participantId });

  if (useAuthStore.getState().isDemoMode) {
    const activities = getDemoActivities();
    const activity = activities.find((item) => item.id === activityId && item.status === "open");
    if (
      !activity ||
      activity.creator_id === participantId ||
      activity.participant_ids.includes(participantId)
    ) {
      throw new Error("La actividad ya no está disponible o ya te uniste.");
    }
    const participantIds = [...activity.participant_ids, participantId];
    const updated: VenueActivity = {
      ...activity,
      participant_id: participantId,
      participant_ids: participantIds,
      status: participantIds.length + 1 >= activity.required_players ? "matched" : "open",
    };
    saveDemoActivities(activities.map((item) => (item.id === activityId ? updated : item)));
    console.info("[venue-activity] join:success", {
      activityId,
      occupied: participantIds.length + 1,
      required: updated.required_players,
    });
    return updated;
  }

  const { data, error } = await withTimeout(
    supabase.rpc("join_venue_activity", {
      target_activity_id: activityId,
    }),
    VENUE_ACTIVITY_TIMEOUT_MS,
  );
  if (error) {
    console.error("[venue-activity] join:error", {
      activityId,
      code: error.code,
      message: error.message,
    });
    if (error.code === "PGRST202" || error.message.includes("join_venue_activity")) {
      throw new Error("Falta aplicar la migración de actividades en Supabase.");
    }
    throw error;
  }

  const joinedActivity = data as VenueActivity;
  console.info("[venue-activity] join:success", {
    activityId,
    occupied: joinedActivity.participant_ids.length + 1,
    required: joinedActivity.required_players,
  });
  return joinedActivity;
}
