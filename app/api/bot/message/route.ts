import { NextResponse } from "next/server";
import { normalizeWhatsapp, rejectUnlessBot } from "@/lib/bot/auth";
import { respondToCustomer } from "@/lib/bot/respond";

// Only needed if you use n8n: it calls this for every validated incoming WhatsApp text message.
// Without n8n, the website's own WhatsApp webhook does the same job directly (app/api/whatsapp/webhook).
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;

  let body: { whatsapp?: unknown; name?: unknown; text?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const whatsapp = normalizeWhatsapp(body.whatsapp);
  if (!whatsapp) return NextResponse.json({ ok: false, error: "bad whatsapp number" }, { status: 400 });

  const r = await respondToCustomer({
    whatsapp,
    name: typeof body.name === "string" ? body.name.slice(0, 60) : undefined,
    text: String(body.text ?? "").slice(0, 1000),
  });
  return NextResponse.json({ ok: true, intent: r.intent, reply: r.reply, handoff: r.handoff });
}
