import { query } from "@/shared/lib/database";
import { Squad, User } from "@/entities/types";
import { useSquadStore } from "@/features/squads/model/useSquadStore";
import { MOCK_USERS } from "@/lib/mock";

const USE_MOCKS = 
  (typeof process !== "undefined" && process.env?.VITE_USE_MOCKS !== "false") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_MOCKS !== "false");

/**
 * Creates a new squad (club/team).
 * In mock mode, saves to the local Zustand store.
 * In production mode, inserts the squad and the creator as a member in Vercel Postgres.
 */
export async function createSquad(
  name: string,
  description: string,
  creatorId: string,
  avatarUrl?: string
): Promise<Squad> {
  const newSquad: Squad = {
    id: `squad-${Date.now()}`,
    name,
    description: description || null,
    created_at: new Date().toISOString(),
    creator_id: creatorId,
    avatar_url: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
  };

  if (USE_MOCKS) {
    useSquadStore.getState().createSquad(newSquad);
    return Promise.resolve(newSquad);
  }

  try {
    const sqlQuery = `
      INSERT INTO public.squads (id, name, description, creator_id, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, description, created_at, creator_id, avatar_url;
    `;
    await query(sqlQuery, [newSquad.id, name, description || null, creatorId, newSquad.avatar_url]);

    const memberQuery = `
      INSERT INTO public.squad_members (squad_id, user_id)
      VALUES ($1, $2);
    `;
    await query(memberQuery, [newSquad.id, creatorId]);

    return {
      ...newSquad,
      members_count: 1,
    };
  } catch (error) {
    console.error("Vercel Postgres createSquad query failed:", error);
    throw error;
  }
}

/**
 * Gets all squads with members count aggregated in a single query.
 * In mock mode, queries useSquadStore.
 * In production mode, performs a LEFT JOIN group by query.
 */
export async function getSquads(): Promise<Squad[]> {
  if (USE_MOCKS) {
    const squads = useSquadStore.getState().squads;
    return Promise.resolve(
      squads.map(s => ({
        ...s,
        members_count: useSquadStore.getState().getMembersCount(s.id),
      }))
    );
  }

  const sqlQuery = `
    SELECT 
      s.id, 
      s.name, 
      s.description, 
      s.created_at, 
      s.creator_id, 
      s.avatar_url,
      COUNT(sm.user_id)::int as members_count
    FROM public.squads s
    LEFT JOIN public.squad_members sm ON s.id = sm.squad_id
    GROUP BY s.id
    ORDER BY s.created_at DESC;
  `;

  try {
    const result = await query(sqlQuery);
    return (result.rows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      creator_id: row.creator_id,
      avatar_url: row.avatar_url,
      members_count: row.members_count,
    }));
  } catch (error) {
    console.error("Vercel Postgres getSquads query failed:", error);
    throw error;
  }
}

/**
 * Joins a user to a squad.
 */
export async function joinSquad(squadId: string, userId: string): Promise<void> {
  if (USE_MOCKS) {
    useSquadStore.getState().joinSquad(squadId, userId);
    return Promise.resolve();
  }

  const sqlQuery = `
    INSERT INTO public.squad_members (squad_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (squad_id, user_id) DO NOTHING;
  `;

  try {
    await query(sqlQuery, [squadId, userId]);
  } catch (error) {
    console.error("Vercel Postgres joinSquad query failed:", error);
    throw error;
  }
}

/**
 * Leaves a squad.
 */
export async function leaveSquad(squadId: string, userId: string): Promise<void> {
  if (USE_MOCKS) {
    useSquadStore.getState().leaveSquad(squadId, userId);
    return Promise.resolve();
  }

  const sqlQuery = `
    DELETE FROM public.squad_members
    WHERE squad_id = $1 AND user_id = $2;
  `;

  try {
    await query(sqlQuery, [squadId, userId]);
  } catch (error) {
    console.error("Vercel Postgres leaveSquad query failed:", error);
    throw error;
  }
}

/**
 * Checks if a user is a member of a squad.
 */
export async function isMember(squadId: string, userId: string): Promise<boolean> {
  if (USE_MOCKS) {
    return Promise.resolve(useSquadStore.getState().isMember(squadId, userId));
  }

  const sqlQuery = `
    SELECT EXISTS (
      SELECT 1 FROM public.squad_members 
      WHERE squad_id = $1 AND user_id = $2
    ) as member_exists;
  `;

  try {
    const result = await query(sqlQuery, [squadId, userId]);
    return result.rows?.[0]?.member_exists || false;
  } catch (error) {
    console.error("Vercel Postgres isMember query failed:", error);
    throw error;
  }
}

/**
 * Returns all members of a squad.
 */
export async function getSquadMembers(squadId: string): Promise<User[]> {
  if (USE_MOCKS) {
    const memberships = useSquadStore.getState().memberships.filter(m => m.squad_id === squadId);
    const memberIds = memberships.map(m => m.user_id);
    const members = MOCK_USERS.filter(u => memberIds.includes(u.id));
    return Promise.resolve(members);
  }

  const sqlQuery = `
    SELECT u.* 
    FROM public.users u
    JOIN public.squad_members sm ON u.id = sm.user_id
    WHERE sm.squad_id = $1;
  `;

  try {
    const result = await query(sqlQuery, [squadId]);
    return (result.rows || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      name: row.name,
      age: parseInt(row.age, 10),
      city: row.city,
      avatar_url: row.avatar_url,
      bio: row.bio,
      trust_score: parseInt(row.trust_score, 10),
      fitcoins_balance: parseInt(row.fitcoins_balance, 10),
      level: row.level as any,
      preferred_sports: row.preferred_sports || [],
      matches_played: parseInt(row.matches_played, 10),
      last_location_lat: row.last_location_lat ? parseFloat(row.last_location_lat) : null,
      last_location_lng: row.last_location_lng ? parseFloat(row.last_location_lng) : null,
    }));
  } catch (error) {
    console.error("Vercel Postgres getSquadMembers query failed:", error);
    throw error;
  }
}
