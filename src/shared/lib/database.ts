import { createPool } from "@vercel/postgres";

// Detect if we are running in local mock mode
// Note: We check both process.env (Node.js/server functions) and import.meta.env (Vite client-side fallback)
const USE_MOCKS =
  (typeof process !== "undefined" && process.env?.VITE_USE_MOCKS !== "false") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_MOCKS !== "false");

// Validate required environment variables in production / non-mock mode
if (!USE_MOCKS) {
  const requiredVars = [
    "POSTGRES_URL",
    "POSTGRES_USER",
    "POSTGRES_HOST",
    "POSTGRES_PASSWORD",
    "POSTGRES_DATABASE",
  ];

  // We only run this check on server-side environment
  if (typeof process !== "undefined" && process.env) {
    const missing = requiredVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(
        `CRITICAL SERVERLESS ENGINE ERROR: Missing required Vercel Postgres environment variables: ${missing.join(", ")}. Please link your database on Vercel.`,
      );
    }
  }
}

/**
 * Serverless Vercel Postgres pool instance.
 * Initialized only when USE_MOCKS is false.
 */
export const pool = !USE_MOCKS
  ? createPool({
      connectionString: typeof process !== "undefined" ? process.env.POSTGRES_URL : undefined,
    })
  : null;

/**
 * Execute raw SQL query against Vercel Postgres database.
 * If USE_MOCKS is enabled, it throws a descriptive error to prevent unintended database calls.
 */
export const query = async (text: string, params?: unknown[]) => {
  if (USE_MOCKS) {
    throw new Error(
      `Database query attempted but Mocks are enabled. Ensure you handle mock fallback in your data services.`,
    );
  }
  if (!pool) {
    throw new Error("Vercel Postgres Pool is not initialized.");
  }
  return pool.query(text, params);
};
