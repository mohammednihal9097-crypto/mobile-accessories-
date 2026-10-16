import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * Elevated client using the SECRET key. It bypasses all row rules, so:
 *  - only import it in server code (the "server-only" import enforces this),
 *  - only call it after you have checked who the caller is (see requireAdmin()).
 */
export function createSecretClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key || key.startsWith("your-")) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(supabaseUrl!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
