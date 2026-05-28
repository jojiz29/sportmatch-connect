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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// ──────────────────────────────────────────────────────────────
// HYBRID MODE DETECTION
// Si las variables de entorno de Supabase no existen o tienen
// los valores placeholder, se activa el modo mock automáticamente.
// Esto asegura que la demo funcione sin internet en el salón.
// ──────────────────────────────────────────────────────────────
const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  !supabaseUrl.includes("placeholder") &&
  !supabaseAnonKey.includes("placeholder");

export const USE_SUPABASE = isSupabaseConfigured;

if (!USE_SUPABASE) {
  console.info(
    "[SportMatch] Supabase no configurado → Modo Mock activado automáticamente. " +
      "Para conectar Supabase, añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY al .env",
  );
}

// Siempre creamos el cliente (incluso con placeholders), pero USE_SUPABASE
// controla si realmente lo usamos en los servicios.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────

/**
 * Verifica la conexión con Supabase.
 * Útil para el health-check en la presentación.
 */
export async function pingSupabase(): Promise<boolean> {
  if (!USE_SUPABASE) return false;
  try {
    const { error } = await supabase.from("courts").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
