import { supabase } from "./supabase";
import { Squad, User } from "@/entities/types";

export async function createSquad(
  name: string,
  description: string,
  creatorId: string,
  avatarUrl?: string,
): Promise<Squad> {
  const newSquadId = `squad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const avatar =
    avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;

  // 1. Insert squad in Supabase
  const { data: squad, error: squadError } = await supabase
    .from("squads")
    .insert({
      id: newSquadId,
      name,
      description: description || null,
      creator_id: creatorId,
      avatar_url: avatar,
    })
    .select()
    .single();

  if (squadError || !squad) {
    console.error("Error creating squad in Supabase:", squadError);
    throw squadError || new Error("Failed to create squad");
  }

  // 2. Insert creator as squad member
  const { error: memberError } = await supabase.from("squad_members").insert({
    squad_id: squad.id,
    user_id: creatorId,
  });

  if (memberError) {
    console.error("Error adding creator to squad members:", memberError);
    throw memberError;
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
  const { data, error } = await supabase
    .from("squads")
    .select("*, squad_members(user_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching squads from Supabase:", error);
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
  const { error } = await supabase.from("squad_members").insert({
    squad_id: squadId,
    user_id: userId,
  });

  if (error && error.code !== "23505") {
    // Ignore unique constraint violation (on conflict do nothing)
    console.error("Error joining squad:", error);
    throw error;
  }
}

export async function leaveSquad(squadId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("squad_members")
    .delete()
    .eq("squad_id", squadId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error leaving squad:", error);
    throw error;
  }
}

export async function isMember(squadId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("squad_members")
    .select("user_id")
    .eq("squad_id", squadId)
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    console.error("Error checking squad membership:", error);
    throw error;
  }

  return data && data.length > 0;
}

export async function getSquadMembers(squadId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from("squad_members")
    .select("*, profile:profiles(*)")
    .eq("squad_id", squadId);

  if (error) {
    console.error("Error getting squad members:", error);
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => row.profile).filter(Boolean) as User[];
}
