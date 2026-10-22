import { createClient, processLock } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_KEY as string;

if (!url || !key) {
  throw new Error("Missing Supabase environment variables. Check your .env file.");
}

/**
 * processLock avoids the cross-tab Navigator LockManager, which otherwise races
 * with React StrictMode's double-invoked effects in development.
 */
export const supabase = createClient(url, key, {
  auth: { lock: processLock },
});