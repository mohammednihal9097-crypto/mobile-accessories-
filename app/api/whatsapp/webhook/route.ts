import { createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { normalizeWhatsapp } from "@/lib/bot/auth";
import { respondToCustomer } from "@/lib/bot/respond";
import { createSecretClient } from "@/lib/supabase/admin";
import { sendText, whatsappConfigured } from "@/lib/whatsapp/cloud";

// Meta (WhatsApp Cloud API) sends customer messages HERE first. We check that the request really came
// from Meta, drop repeats, then pass a clean copy to n8n. n8n never sees unverified traffic.
// Set this URL as the webhook callback in your Meta app (see docs/stage6-whatsapp-n8n.md).

/** Step 1: Meta's one-time "is this really your server?" handshake. */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN?.trim(); // .trim(): pasted settings can carry a hidden line break
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new Response(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

function signatureValid(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!secret || secret.startsWith("your-") || secret.startsWith("paste-") || !header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length);
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

type WaMessage = { id: string; from: string; timestamp: string; type: string; text?: { body: string }; button?: { text: string }; interactive?: { button_reply?: { title: string }; list_reply?: { title: string } } };

/** Step 2: every real message. */
export async function POST(request: Request) {
  const rawBody = await request.text(); // the signature covers the exact raw bytes
  if (!signatureValid(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new Response("invalid signature", { status: 401 }); // not from Meta: ignore completely
  }

  let payload: { entry?: { changes?: { value?: { messages?: WaMessage[]; contacts?: { wa_id: string; profile?: { name?: string } }[] } }[] }[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  // n8n is optional. A setting that still holds placeholder text (REPLACE..., your-..., paste-...) counts as "not set".
  const real = (v: string | undefined) => (v && !/REPLACE|your-|paste-|choose-|generate-/i.test(v) ? v : undefined);
  const forwardUrl = real(process.env.N8N_INBOUND_WEBHOOK_URL?.trim());
  const forwardKey = real(process.env.N8N_INBOUND_SHARED_SECRET?.trim());
  const db = createSecretClient();
  const direct: { whatsapp: string; name?: string; text: string }[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      for (const m of value?.messages ?? []) {
        // Only text and button/list replies are handled. Other kinds (photos, voice) go to a person.
        const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
        const name = value?.contacts?.find((c) => c.wa_id === m.from)?.profile?.name;

        // Remember the message id so Meta's retries don't get answered twice.
        const { error: dupe } = await db.from("webhook_events").insert({ source: "whatsapp", event_id: m.id });
        if (dupe) {
          if (dupe.code === "23505") continue; // already handled
          console.error("webhook_events insert failed", dupe.message);
          return new Response("error", { status: 500 }); // Meta will retry
        }

        // Without n8n: the website answers the customer itself (after replying 200 to Meta, so Meta never waits).
        if (!forwardUrl || !forwardKey) {
          if (!whatsappConfigured()) {
            console.error("No n8n and no WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID: cannot answer messages");
            await db.from("webhook_events").delete().match({ source: "whatsapp", event_id: m.id });
            return new Response("not configured", { status: 500 });
          }
          const whatsapp = normalizeWhatsapp(m.from);
          if (whatsapp) direct.push({ whatsapp, name, text: (text || "5").slice(0, 1000) }); // no text (photo, voice): hand over to a person
          continue;
        }

        try {
          const res = await fetch(forwardUrl, {
            method: "POST",
            headers: { "content-type": "application/json", "x-api-key": forwardKey },
            body: JSON.stringify({
              messageId: m.id, from: m.from, name, type: m.type, text, unsupported: !text,
            }),
            signal: AbortSignal.timeout(8000),
          });
          if (!res.ok) throw new Error(`n8n answered ${res.status}`);
        } catch (e) {
          console.error("forward to n8n failed", e);
          await db.from("webhook_events").delete().match({ source: "whatsapp", event_id: m.id }); // allow Meta's retry
          return new Response("forward failed", { status: 502 });
        }
      }
    }
  }
  if (direct.length > 0) {
    after(async () => {
      for (const d of direct) {
        const r = await respondToCustomer(d);
        const sent = await sendText(d.whatsapp, r.reply);
        if (!sent.ok) console.error("WhatsApp reply not sent:", sent.error);
      }
    });
  }
  return new Response("ok", { status: 200 });
}
