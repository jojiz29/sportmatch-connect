/**
 * ===================================================================
 * ARCHIVO: src/shared/api/supabase.ts
 * PROPÓSITO: Re-export del cliente Supabase desde su ubicación
 *            canónica (src/lib/supabase.ts).
 * -------------------------------------------------------------------
 * Este archivo existe para mantener compatibilidad con imports
 * que ya usan la ruta "~/shared/api/supabase" (FSD layer).
 * La configuración REAL está en src/lib/supabase.ts.
 * ===================================================================
 */
export { supabase, USE_SUPABASE, pingSupabase } from "@/lib/supabase";
