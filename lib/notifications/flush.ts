import "server-only";
import { createSecretClient } from "@/lib/supabase/admin";
import { sendTemplate, whatsappConfigured } from "@/lib/whatsapp/cloud";
import { claimReadyMessages } from "./claim";

export type FlushResult = { configured: boolean; sent: number; failed: number };

/**
 * Sends the waiting order messages (customer receipts, delivery updates, admin alerts) right now.
 * Called straight after an order changes, so customers don't wait, and again by the daily safety-net job.
 * Safe to run twice at once: each message is claimed by exactly one caller.
 * Does nothing (and claims nothing) until the WhatsApp token and phone number ID are set.
 */
export async function flushNotifications(limit = 10): Promise<FlushResult> {
  if (!whatsappConfigured()) return { configured: false, sent: 0, failed: 0 };
  let ready;
  try {
    ready = await claimReadyMessages(limit);
  } catch (e) {
    console.error("flushNotifications: could not claim messages", e);
    return { configured: true, sent: 0, failed: 0 };
  }

  const db = createSecretClient();
  let sent = 0;
  let failed = 0;
  for (const m of ready) {
    const r = await sendTemplate(m.to, m.template, m.language, m.body_params);
    await db.rpc("ack_notification", { p_id: m.id, p_ok: r.ok, p_error: r.ok ? null : r.error });
    if (r.ok) sent++;
    else {
      failed++;
      console.warn("WhatsApp message not sent:", m.template, r.error);
    }
  }
  return { configured: true, sent, failed };
}
