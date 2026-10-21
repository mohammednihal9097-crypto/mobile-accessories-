import "server-only";
import { siteUrl } from "@/lib/bot/data";
import { formatMoney } from "@/lib/config";
import { tokenFor } from "@/lib/order-token";
import { createSecretClient } from "@/lib/supabase/admin";
import { buildBodyParams, isKnownTemplate, TEMPLATE_LANGUAGE, type NotificationParams, type TemplateName } from "./templates";

export type Channel = "whatsapp" | "email";

export type ReadyMessage = {
  id: string; to: string; template: TemplateName; language: string; body_params: string[];
  params: NotificationParams; order_id: string; order_link: string | null;
};

type Claimed = {
  id: string; order_id: string; whatsapp_number: string; template: string; audience: string;
  params: NotificationParams;
};

/**
 * Claims a batch of waiting messages for one channel (rows are locked and marked "sending", so two runs can never
 * send the same message; an unacknowledged claim returns after 10 minutes, up to 5 tries) and prepares each one:
 * template name, recipient, and the ordered values for {{1}}, {{2}}, ...
 * Email rows keep their recipient as "email:<address>" in the same column; `to` is the bare address for email.
 */
export async function claimReadyMessages(limit = 10, channel: Channel = "whatsapp"): Promise<ReadyMessage[]> {
  const db = createSecretClient();
  const { data, error } = await db.rpc("claim_notifications", { p_limit: limit, p_channel: channel });
  if (error) throw new Error(`claim_notifications failed: ${error.message}`);
  const rows = (data ?? []) as Claimed[];

  // The customer's private order link is rebuilt from the order's stored checkout key (same HMAC as at checkout).
  const orderIds = [...new Set(rows.map((r) => r.order_id))];
  const keys = new Map<string, string>();
  if (orderIds.length > 0) {
    const { data: orders } = await db.from("orders").select("id, idempotency_key").in("id", orderIds);
    for (const o of orders ?? []) keys.set(o.id, o.idempotency_key);
  }

  const ready: ReadyMessage[] = [];
  for (const n of rows) {
    if (!isKnownTemplate(n.template)) {
      await db.rpc("ack_notification", { p_id: n.id, p_ok: false, p_error: `unknown template ${n.template}` });
      continue;
    }
    const key = keys.get(n.order_id);
    const orderLink = key && n.params.order_number ? `${siteUrl()}/order/${n.params.order_number}?t=${tokenFor(key)}` : null;
    ready.push({
      id: n.id,
      to: channel === "email" ? n.whatsapp_number.replace(/^email:/, "") : n.whatsapp_number.replace(/^\+/, ""),
      template: n.template,
      language: TEMPLATE_LANGUAGE,
      body_params: buildBodyParams(n.template, n.params, { formatMoney, orderLink }),
      params: n.params,
      order_id: n.order_id,
      order_link: orderLink,
    });
  }
  return ready;
}
