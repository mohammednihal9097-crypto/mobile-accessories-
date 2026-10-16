import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Gate for every admin page and admin action.
 * 1) getClaims() verifies the login token signature (never trust getSession on the server).
 * 2) The user must have a row in admin_users (row rules let users see only their own row).
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: row } = await supabase.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  if (!row) redirect("/login?error=not-admin");

  return { supabase, userId, email: (data?.claims?.email as string | undefined) ?? "" };
}
