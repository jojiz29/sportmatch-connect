/**
 * src/lib/supabase.ts
 * Supabase client con inicialización resiliente y protección contra White Screen.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrlRaw = (import.meta.env.VITE_SUPABASE_URL || "") as string;
// Eliminar diagonales al final si existen
const supabaseUrl = supabaseUrlRaw.replace(/\/+$/, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "") as string;

let isUrlValid = false;
try {
  if (supabaseUrl) {
    new URL(supabaseUrl);
    isUrlValid = true;
  }
} catch {
  isUrlValid = false;
}

const isConfigured = isUrlValid && supabaseAnonKey !== "";

let client: SupabaseClient;

if (isConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Critical: Failed to initialize Supabase client:", e);
    client = createFallbackClient();
  }
} else {
  console.warn(
    "Supabase configuration variables are missing. App is running in resilient client-fallback mode.",
  );
  client = createFallbackClient();
}

function createFallbackClient(): SupabaseClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy({} as any, {
    get(target, prop) {
      if (prop === "auth") {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: () => Promise.resolve({ data: { session: null } }),
          signInWithPassword: () =>
            Promise.resolve({ error: new Error("Supabase not configured") }),
          signUp: () => Promise.resolve({ error: new Error("Supabase not configured") }),
          signOut: () => Promise.resolve({ error: null }),
        };
      }
      if (prop === "from") {
        return (table: string) => {
          console.warn(`Called supabase.from('${table}') but Supabase is not configured.`);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chainObj: any = {
            select: () => chainObj,
            insert: () => chainObj,
            update: () => chainObj,
            delete: () => chainObj,
            eq: () => chainObj,
            neq: () => chainObj,
            lt: () => chainObj,
            gt: () => chainObj,
            limit: () => chainObj,
            order: () => chainObj,
            single: () =>
              Promise.resolve({
                data: null,
                count: null,
                error: new Error("Supabase not configured"),
              }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            then: (resolve: any) =>
              resolve({ data: null, count: null, error: new Error("Supabase not configured") }),
          };
          return chainObj;
        };
      }
      if (prop === "channel") {
        return (name: string) => {
          console.warn(`Called supabase.channel('${name}') but Supabase is not configured.`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dummyChannel: any = {
            on: () => dummyChannel,
            subscribe: () => dummyChannel,
            unsubscribe: () => {},
          };
          return dummyChannel;
        };
      }
      if (prop === "removeChannel") {
        return () => {
          console.warn("Called supabase.removeChannel but Supabase is not configured.");
        };
      }

      // Default fallback for any other method
      return () => {
        console.warn(`Attempted to call supabase.${String(prop)} but Supabase is not configured.`);
        return Promise.resolve({ data: null, error: new Error("Supabase not configured") });
      };
    },
  }) as unknown as SupabaseClient;
}

export const supabase = client;
export const USE_SUPABASE = isConfigured;

/**
 * Verifica la conexión con Supabase.
 */
export async function pingSupabase(): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    const { error } = await supabase.from("courts").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
