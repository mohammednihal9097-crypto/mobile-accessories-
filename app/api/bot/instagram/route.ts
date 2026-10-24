import { NextResponse } from "next/server";
import { rejectUnlessBot } from "@/lib/bot/auth";
import { processInstagramMessage } from "@/lib/instagram/bot";

/**
 * Endpoint for n8n to ask the store bot for an Instagram reply.
 * Protected by N8N_API_SHARED_SECRET in the "x-api-key" header.
 */
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  let body: { senderId?: unknown; text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const senderId = String(body.senderId ?? "").trim();
  const text = String(body.text ?? "").trim();

  if (!senderId) {
    return NextResponse.json({ ok: false, error: "missing senderId" }, { status: 400 });
  }

  const reply = await processInstagramMessage(text);
  return NextResponse.json({ ok: true, senderId, reply });
}
