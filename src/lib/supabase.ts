/**
 * src/lib/supabase.ts
 * Supabase client con Hybrid Mode para demo resiliente.
 *
 * - Si VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están definidos → conecta a Supabase real.
 * - Si no → activa modo mock automáticamente (VITE_USE_MOCKS = true).
 *
 * El profesor puede verificar la integración en: Settings > API > URL + anon key
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const USE_SUPABASE = true;

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Verifica la conexión con Supabase.
 * Útil para el health-check en la presentación.
 */
export async function pingSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase.from("courts").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
