import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { rejectUnlessBot } from "@/lib/bot/auth";
import { createSecretClient } from "@/lib/supabase/admin";

// Called hourly by n8n. Cancels orders still unpaid after 24 hours and returns their stock.
// Cancelling is safe to repeat: the database ignores orders that are already cancelled.
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;
  const { data, error } = await createSecretClient().rpc("expire_unpaid_orders", { p_hours: 24 });
  if (error) {
    console.error("expire_unpaid_orders failed", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (typeof data === "number" && data > 0) revalidateTag("catalog", "max"); // stock came back
  return NextResponse.json({ ok: true, cancelled: data });
}