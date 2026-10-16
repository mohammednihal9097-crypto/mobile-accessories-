import { NextResponse } from "next/server";
import { normalizeWhatsapp, rejectUnlessBot } from "@/lib/bot/auth";
import { buildBotDeps } from "@/lib/bot/data";
import { handleMessage } from "@/lib/bot/router";
import { fromEnglish, toEnglish } from "@/lib/bot/sarvam";
import { createSecretClient } from "@/lib/supabase/admin";

// n8n calls this for every validated incoming WhatsApp text message.
// It answers from the database and, when it can't help, records a hand-over request for a person.
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
  const text = String(body.text ?? "").slice(0, 1000);
  const name = typeof body.name === "string" ? body.name.slice(0, 60) : undefined;

  try {
    // Optional (off by default): understand the chosen Indian languages by translating to English first.
    const translated = await toEnglish(text);
    const result = await handleMessage({ whatsapp, name, text: translated?.english ?? text }, await buildBotDeps());

    if (result.handoff) {
      const db = createSecretClient();
      // One open request per number; a newer message just refreshes it.
      const { data: open } = await db
        .from("handoff_requests").select("id").eq("whatsapp_number", whatsapp).eq("status", "open").maybeSingle();
      const { error } = open
        ? await db.from("handoff_requests").update({ last_message: text, reason: result.handoff.reason }).eq("id", open.id)
        : await db.from("handoff_requests").insert({
            whatsapp_number: whatsapp, customer_name: name ?? null, reason: result.handoff.reason, last_message: text,
          });
      if (error) console.error("handoff save failed", error.message);
    }
    const reply = translated ? await fromEnglish(result.reply, translated.language) : result.reply;
    return NextResponse.json({ ok: true, intent: result.intent, reply, handoff: !!result.handoff });
  } catch (e) {
    console.error("bot error", e);
    // Never guess. Tell the customer honestly and let a person pick it up.
    return NextResponse.json({
      ok: true,
      intent: "error",
      handoff: true,
      reply: "Sorry, I'm having trouble right now. Please try again in a few minutes, or our team will follow up.",
    });
  }
}
