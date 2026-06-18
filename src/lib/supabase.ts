/**
 * ===================================================================
 * ARCHIVO: src/lib/supabase.ts
 * PROPÓSITO: Inicializar el cliente de Supabase con protección
 *            contra fallos de configuración (modo fallback).
 * FLUJO: Lee variables de entorno -> valida URL -> crea cliente
 *        real o un Proxy fallback que no rompe la app.
 * EXPORTA: supabase (cliente), USE_SUPABASE (boolean), pingSupabase()
 * ===================================================================
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ------------------------------------------------------------------
// VARIABLES DE ENTORNO: URL y clave anónima de Supabase
// ------------------------------------------------------------------
// Se obtienen del archivo .env mediante Vite (import.meta.env).
// Si no existen, se asigna cadena vacía para activar el modo fallback.
const supabaseUrlRaw = (import.meta.env.VITE_SUPABASE_URL || "") as string;
let supabaseUrl = supabaseUrlRaw;
while (supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "") as string;

// ------------------------------------------------------------------
// VALIDACIÓN: Verifica que la URL sea una URL real
// ------------------------------------------------------------------
let isUrlValid = false;
try {
  if (supabaseUrl) {
    new URL(supabaseUrl); // Lanza error si no es URL válida
    isUrlValid = true;
  }
} catch {
  isUrlValid = false;
}

// La configuración es válida SOLO si hay URL válida Y clave anónima
const isConfigured = isUrlValid && supabaseAnonKey !== "";

// ------------------------------------------------------------------
// CREACIÓN DEL CLIENTE: Real o fallback
// ------------------------------------------------------------------
let client: SupabaseClient;

if (isConfigured) {
  // --- MODO REAL: Inicializa cliente Supabase auténtico ---
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Critical: Failed to initialize Supabase client:", e);
    client = createFallbackClient();
  }
} else {
  // --- MODO FALLBACK: Sin conexión a Supabase, la app no se rompe ---
  console.warn(
    "Supabase configuration variables are missing. App is running in resilient client-fallback mode.",
  );
  client = createFallbackClient();
}

/**
 * ------------------------------------------------------------------
 * createFallbackClient(): Proxy que imita el cliente Supabase
 * ------------------------------------------------------------------
 * Este Proxy devuelve objetos "tontos" para cada método de Supabase
 * (auth, from, channel, storage, etc.) que:
 *   - No hacen llamadas reales a la red
 *   - Devuelven errores descriptivos en lugar de lanzar excepciones
 *   - Permiten encadenamiento de métodos (.select().eq().single())
 *   - Muestran warnings en consola para debug
 *
 * Esto evita el temido "White Screen of Death" cuando las variables
 * de entorno no están configuradas (ej: en desarrollo local).
 * ------------------------------------------------------------------
 */
function createFallbackClient(): SupabaseClient {
  return new Proxy(
    {},
    {
      get(target, prop) {
        // --- MÓDULO AUTH: login, registro, sesión ---
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

        // --- MÓDULO FROM: Consultas a tablas (SELECT, INSERT, UPDATE, DELETE) ---
        if (prop === "from") {
          return (table: string) => {
            console.warn(`Called supabase.from('${table}') but Supabase is not configured.`);

            const dummyPromise = Promise.resolve({
              data: null,
              count: null,
              error: new Error("Supabase not configured"),
            });
            const chainObj: any = Object.assign(dummyPromise, {
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
            });
            return chainObj;
          };
        }

        // --- MÓDULO CHANNEL: Suscripciones en tiempo real (Realtime) ---
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

        // --- MÓDULO REMOVE CHANNEL: Limpieza de canales ---
        if (prop === "removeChannel") {
          return () => {
            console.warn("Called supabase.removeChannel but Supabase is not configured.");
          };
        }

        // --- MÓDULO GET CHANNELS: Listar canales activos ---
        if (prop === "getChannels") {
          return () => {
            console.warn("Called supabase.getChannels but Supabase is not configured.");
            return [];
          };
        }

        // --- MÓDULO STORAGE: Subida/descarga de archivos ---
        if (prop === "storage") {
          const dummyStorageBucket = {
            upload: () =>
              Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
            getPublicUrl: () => ({
              data: { publicUrl: "" },
            }),
            remove: () =>
              Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
          };
          return {
            from: () => {
              console.warn(`Called supabase.storage.from() but Supabase is not configured.`);
              return dummyStorageBucket;
            },
          };
        }

        // --- FALLBACK GENÉRICO: Cualquier otro método no contemplado ---
        return () => {
          console.warn(
            `Attempted to call supabase.${String(prop)} but Supabase is not configured.`,
          );
          return Promise.resolve({ data: null, error: new Error("Supabase not configured") });
        };
      },
    },
  ) as unknown as SupabaseClient;
}

// ==================================================================
// EXPORTACIONES PRINCIPALES
// ==================================================================

/** Cliente Supabase listo para usar (real o fallback) */
export const supabase = client;

/** Flag booleano: true si Supabase está correctamente configurado */
export const USE_SUPABASE = isConfigured;

/**
 * pingSupabase(): Verifica conectividad real con Supabase
 * ------------------------------------------------------------------
 * Hace una consulta mínima a la tabla "courts" para comprobar que
 * la conexión funciona. Útil para mostrar estado en la UI.
 * Retorna: Promise<boolean>
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
