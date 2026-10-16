import { NextResponse } from "next/server";
import { rejectUnlessBot } from "@/lib/bot/auth";
import { createSecretClient } from "@/lib/supabase/admin";

// n8n polls this every minute. Each call "claims" a batch (rows are locked and marked "sending"),
// so two runs can never send the same message. Unacknowledged claims return after 10 minutes, up to 5 tries.
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  const { data, error } = await createSecretClient().rpc("claim_notifications", { p_limit: 10 });
  if (error) {
    console.error("claim_notifications failed", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  const rows = (data ?? []) as {
    id: string; whatsapp_number: string; template: string; params: Record<string, string>;
  }[];
  return NextResponse.json({
    ok: true,
    notifications: rows.map((n) => ({
      id: n.id,
      // WhatsApp wants digits only, no plus
      to: n.whatsapp_number.replace(/^\+/, ""),
      template: n.template,
      customer_name: n.params.customer_name,
      order_number: n.params.order_number,
    })),
  });
}
