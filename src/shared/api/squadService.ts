import { supabase } from "./supabase";
import { Squad, User } from "@/entities/types";
import { withTimeout } from "./timeoutHelper";
import { useAuthStore } from "@/entities/user/useAuth";

const LOCAL_STORAGE_KEY_SQUADS = "sportmatch_demo_squads";
const LOCAL_STORAGE_KEY_MEMBERSHIPS = "sportmatch_demo_memberships";

const DEFAULT_MOCK_SQUADS: Squad[] = [
  {
    id: "squad-1",
    name: "Pádel Club Surco",
    description: "Para organizar partidos de pádel de nivel intermedio/avanzado.",
    created_at: new Date().toISOString(),
    creator_id: "user-1",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=PadelClubSurco",
    members_count: 5,
  },
  {
    id: "squad-2",
    name: "Pichangeros FC",
    description: "Fútbol 7 todos los viernes por la noche.",
    created_at: new Date().toISOString(),
    creator_id: "user-2",
    avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=PichangerosFC",
    members_count: 12,
  },
];

const DEFAULT_MEMBERSHIPS: Record<string, string[]> = {
  "squad-1": ["user-1", "user-3", "demo-user-id"],
  "squad-2": ["user-2", "user-4"],
};

function getMockSquads(): Squad[] {
  if (typeof window === "undefined") return DEFAULT_MOCK_SQUADS;
  try {
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY_SQUADS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load mock squads from localStorage:", e);
  }
  return DEFAULT_MOCK_SQUADS;
}

function saveMockSquads(squads: Squad[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY_SQUADS, JSON.stringify(squads));
  } catch (e) {
    console.warn("Failed to save mock squads to localStorage:", e);
  }
}

function getMockMemberships(): Record<string, string[]> {
  if (typeof window === "undefined") return DEFAULT_MEMBERSHIPS;
  try {
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY_MEMBERSHIPS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load mock memberships from localStorage:", e);
  }
  return DEFAULT_MEMBERSHIPS;
}

function saveMockMemberships(memberships: Record<string, string[]>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY_MEMBERSHIPS, JSON.stringify(memberships));
  } catch (e) {
    console.warn("Failed to save mock memberships to localStorage:", e);
  }
}

export async function createSquad(
  name: string,
  description: string,
  creatorId: string,
  avatarUrl?: string,
): Promise<Squad> {
  if (useAuthStore.getState().isDemoMode) {
    const avatar =
      avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
    const newSquad: Squad = {
      id: `squad-demo-${Date.now()}`,
      name,
      description: description || null,
      created_at: new Date().toISOString(),
      creator_id: creatorId,
      avatar_url: avatar,
      members_count: 1,
    };
    const squads = getMockSquads();
    squads.unshift(newSquad);
    saveMockSquads(squads);

    const memberships = getMockMemberships();
    memberships[newSquad.id] = [creatorId];
    saveMockMemberships(memberships);

    return newSquad;
  }
  const avatar =
    avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;

  // 1. Insert squad in Supabase (let database generate UUID)
  const { data: squad, error: squadError } = await withTimeout(
    supabase
      .from("squads")
      .insert({
        name,
        description: description || null,
        creator_id: creatorId,
        avatar_url: avatar,
      })
      .select()
      .single(),
  );

  if (squadError || !squad) {
    const code = squadError ? squadError.code : "UNKNOWN";
    console.error(`Error creating squad in Supabase (code: ${code}):`, squadError);
    throw squadError || new Error("Failed to create squad");
  }

  // 2. Insert creator as squad member
  const { error: memberError } = await withTimeout(
    supabase.from("squad_members").insert({
      id: `${squad.id}_${creatorId}`,
      squad_id: squad.id,
      profile_id: creatorId,
      role: "CREATOR",
    }),
  );

  if (memberError) {
    console.error(
      `Error adding creator to squad members in Supabase (code: ${memberError.code}):`,
      memberError,
    );
    throw memberError;
  }

  // 3. Inject squad chat ledger initial system message in messages table
  try {
    const systemMsgId = `msg_system_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    await supabase.from("messages").insert({
      id: systemMsgId,
      chat_id: `chat_squad_${squad.id}`,
      sender_id: creatorId,
      text: `Squad "${name}" creado. ¡Comiencen a chatear!`,
    });
  } catch (err) {
    console.warn("Could not insert squad ledger system message:", err);
  }

  return {
    id: squad.id,
    name: squad.name,
    description: squad.description,
    created_at: squad.created_at,
    creator_id: squad.creator_id,
    avatar_url: squad.avatar_url,
    members_count: 1,
  };
}

export async function getSquads(): Promise<Squad[]> {
  if (useAuthStore.getState().isDemoMode) {
    const squads = getMockSquads();
    const memberships = getMockMemberships();
    return squads.map((s) => ({
      ...s,
      members_count: memberships[s.id]?.length || 0,
    }));
  }

  const { data, error } = await supabase
    .from("squads")
    .select("*, squad_members(profile_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching squads from Supabase (code: ${error.code}):`, error);
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    created_at: row.created_at as string,
    creator_id: row.creator_id as string,
    avatar_url: row.avatar_url as string | null,
    members_count: (row.squad_members as unknown[])?.length || 0,
  })) as Squad[];
}

export async function joinSquad(squadId: string, userId: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    const memberships = getMockMemberships();
    if (!memberships[squadId]) {
      memberships[squadId] = [];
    }
    if (!memberships[squadId].includes(userId)) {
      memberships[squadId].push(userId);
    }
    saveMockMemberships(memberships);
    return;
  }

  const { error } = await withTimeout(
    supabase.from("squad_members").insert({
      id: `${squadId}_${userId}`,
      squad_id: squadId,
      profile_id: userId,
      role: "MEMBER",
    }),
  );

  if (error && error.code !== "23505") {
    // Ignore unique constraint violation (on conflict do nothing)
    console.error(`Error joining squad in Supabase (code: ${error.code}):`, error);
    throw error;
  }
}

export async function leaveSquad(squadId: string, userId: string): Promise<void> {
  if (useAuthStore.getState().isDemoMode) {
    const memberships = getMockMemberships();
    if (memberships[squadId]) {
      memberships[squadId] = memberships[squadId].filter((id) => id !== userId);
      saveMockMemberships(memberships);
    }
    return;
  }

  const { error } = await supabase
    .from("squad_members")
    .delete()
    .eq("squad_id", squadId)
    .eq("profile_id", userId);

  if (error) {
    console.error(`Error leaving squad in Supabase (code: ${error.code}):`, error);
    throw error;
  }
}

export async function isMember(squadId: string, userId: string): Promise<boolean> {
  if (useAuthStore.getState().isDemoMode) {
    const memberships = getMockMemberships();
    return memberships[squadId]?.includes(userId) || false;
  }

  const { data, error } = await supabase
    .from("squad_members")
    .select("profile_id")
    .eq("squad_id", squadId)
    .eq("profile_id", userId)
    .limit(1);

  if (error) {
    if (import.meta.env.DEV) console.error("Error checking squad membership:", error);
    throw error;
  }

  return data && data.length > 0;
}

export async function getSquadMembers(squadId: string): Promise<User[]> {
  if (useAuthStore.getState().isDemoMode) {
    return [
      {
        id: "demo-user-id",
        name: "Edwin (Demo)",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=EdwinDemo",
        level: "Intermedio",
        trust_score: 95,
        preferred_sports: ["Pádel"],
        created_at: new Date().toISOString(),
        age: 26,
        city: "Surco, Lima",
        bio: "Jugador de Pádel nivel intermedio en modo demostración.",
        fitcoins_balance: 1500,
        matches_played: 12,
        last_location_lat: -12.14,
        last_location_lng: -76.995,
      } as User,
    ];
  }

  const { data, error } = await supabase
    .from("squad_members")
    .select("*, profile:profiles(*)")
    .eq("squad_id", squadId);

  if (error) {
    if (import.meta.env.DEV) console.error("Error getting squad members:", error);
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => row.profile).filter(Boolean) as User[];
}
