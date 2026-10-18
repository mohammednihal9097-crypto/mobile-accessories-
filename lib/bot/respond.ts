import "server-only";
import { createSecretClient } from "@/lib/supabase/admin";
import { buildBotDeps } from "./data";
import { handleMessage } from "./router";
import { fromEnglish, toEnglish } from "./sarvam";

export type BotReply = { intent: string; reply: string; handoff: boolean };

/**
 * The whole "answer a customer" step, used both by the website's own WhatsApp handling and by the n8n route.
 * Answers come only from the database. If something goes wrong, the customer is told honestly and a person is flagged.
 */
export async function respondToCustomer(input: { whatsapp: string; name?: string; text: string }): Promise<BotReply> {
  const { whatsapp, name, text } = input;
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
    return { intent: result.intent, reply, handoff: !!result.handoff };
  } catch (e) {
    console.error("bot error", e);
    return {
      intent: "error",
      handoff: true,
      reply: "Sorry, I'm having trouble right now. Please try again in a few minutes, or our team will follow up.",
    };
  }
}
