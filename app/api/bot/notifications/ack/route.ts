import { NextResponse } from "next/server";
import { rejectUnlessBot } from "@/lib/bot/auth";
import { createSecretClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// n8n reports whether WhatsApp accepted the message. Repeating the call changes nothing.
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as { id?: unknown; ok?: unknown; error?: unknown };
  if (typeof body.id !== "string" || !UUID.test(body.id) || typeof body.ok !== "boolean") {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }
  const { data, error } = await createSecretClient().rpc("ack_notification", {
    p_id: body.id, p_ok: body.ok, p_error: typeof body.error === "string" ? body.error : null,
  });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, changed: data === true });
}
