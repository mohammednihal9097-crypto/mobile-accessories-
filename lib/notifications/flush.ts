import "server-only";
import { siteUrl } from "@/lib/bot/data";
import { formatMoney, STORE } from "@/lib/config";
import { renderAdminEmail } from "@/lib/email/admin-order";
import { renderCustomerEmail } from "@/lib/email/customer-order";
import { emailConfigured, sendEmail } from "@/lib/email/mailer";
import { createSecretClient } from "@/lib/supabase/admin";
import { sendTemplate, whatsappConfigured } from "@/lib/whatsapp/cloud";
import { claimReadyMessages, type Channel } from "./claim";

export type FlushResult = { configured: boolean; sent: number; failed: number };

/** Claims and sends one channel's waiting messages. Each channel is claimed only once it is set up. */
async function flushChannel(channel: Channel, limit: number): Promise<FlushResult> {
  const configured = channel === "email" ? emailConfigured() : whatsappConfigured();
  if (!configured) return { configured: false, sent: 0, failed: 0 };
  let ready;
  try {
    ready = await claimReadyMessages(limit, channel);
  } catch (e) {
    console.error(`flushNotifications: could not claim ${channel} messages`, e);
    return { configured: true, sent: 0, failed: 0 };
  }

  const db = createSecretClient();
  let sent = 0;
  let failed = 0;
  for (const m of ready) {
    let r: { ok: true } | { ok: false; error: string };
    if (channel === "email") {
      const mail = m.template.startsWith("admin_")
        ? renderAdminEmail(m.template, m.params, { formatMoney, adminUrl: `${siteUrl()}/admin/orders/${m.order_id}` })
        : renderCustomerEmail(m.template, m.params, {
            formatMoney, orderLink: m.order_link, storeName: STORE.name, supportEmail: STORE.legal.email,
          });
      r = mail ? await sendEmail(m.to, mail.subject, mail.text) : { ok: false, error: `no email for template ${m.template}` };
    } else {
      r = await sendTemplate(m.to, m.template, m.language, m.body_params);
    }
    await db.rpc("ack_notification", { p_id: m.id, p_ok: r.ok, p_error: r.ok ? null : r.error });
    if (r.ok) sent++;
    else {
      failed++;
      console.warn(`${channel} message not sent:`, m.template, r.error);
    }
  }
  return { configured: true, sent, failed };
}

/**
 * Sends the waiting order messages (WhatsApp customer receipts, delivery updates and admin alerts, plus admin
 * emails) right now. Called straight after an order changes, so nobody waits, and again by the daily safety-net job.
 * Safe to run twice at once: each message is claimed by exactly one caller.
 * A channel does nothing (and claims nothing) until it is set up: the WhatsApp token and phone number ID, or RESEND_API_KEY.
 */
export async function flushNotifications(limit = 10): Promise<FlushResult> {
  const [wa, mail] = await Promise.all([flushChannel("whatsapp", limit), flushChannel("email", limit)]);
  return { configured: wa.configured || mail.configured, sent: wa.sent + mail.sent, failed: wa.failed + mail.failed };
}
