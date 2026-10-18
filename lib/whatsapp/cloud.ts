import "server-only";
import { describeError, GRAPH_VERSION, templatePayload, textPayload } from "./payload";

// Sends messages straight through Meta's WhatsApp Cloud API. No n8n needed.
// Settings (Vercel > Environment Variables):
//   WHATSAPP_ACCESS_TOKEN     a PERMANENT token from a Meta "system user" (never a 24-hour test token for real use)
//   WHATSAPP_PHONE_NUMBER_ID  the "Phone number ID" shown in Meta's API Setup page

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string };

function config(): { token: string; phoneId: string } | null {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId || token.startsWith("paste-") || token.startsWith("your-") || !/^\d{6,20}$/.test(phoneId)) return null;
  return { token, phoneId };
}

export function whatsappConfigured(): boolean {
  return config() !== null;
}

async function post(payload: unknown): Promise<SendResult> {
  const c = config();
  if (!c) return { ok: false, error: "WhatsApp sending is not configured (token or phone number ID missing)" };
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${c.phoneId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${c.token}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: describeError(res.status, json) };
    return { ok: true, id: (json as { messages?: { id?: string }[] } | null)?.messages?.[0]?.id ?? null };
  } catch (e) {
    return { ok: false, error: `network error: ${e instanceof Error ? e.message : "unknown"}`.slice(0, 300) };
  }
}

/** Plain text. Works only inside the customer's open 24-hour chat window (that is, as a reply). */
export function sendText(to: string, body: string): Promise<SendResult> {
  return post(textPayload(to, body));
}

/** An approved template. Works any time, but the template must be APPROVED in Meta first. */
export function sendTemplate(to: string, name: string, language: string, bodyParams: string[]): Promise<SendResult> {
  return post(templatePayload(to, name, language, bodyParams));
}
