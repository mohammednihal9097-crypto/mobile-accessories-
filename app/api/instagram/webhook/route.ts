import { after } from "next/server";
import { processInstagramMessage } from "@/lib/instagram/bot";
import { sendInstagramMessage } from "@/lib/instagram/api";

/**
 * Step 1: Meta Webhook Verification Handshake
 * Meta sends a GET request when you register the webhook URL in developers.facebook.com
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const expectedToken =
    process.env.INSTAGRAM_VERIFY_TOKEN?.trim() ||
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() ||
    "triostore_instagram_verify_token";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

interface InboundMessage {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
  };
}

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: InboundMessage[];
}

/**
 * Step 2: Handle Incoming Messages from Instagram DMs
 */
export async function POST(request: Request) {
  let body: { object?: string; entry?: WebhookEntry[] };

  try {
    body = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Ensure this is an Instagram event
  if (body.object !== "instagram" && body.object !== "page") {
    return Response.json({ status: "ignored_unknown_object" }, { status: 200 });
  }

  const entries = body.entry ?? [];

  // n8n forwarding configuration
  const n8nUrl = process.env.N8N_INSTAGRAM_WEBHOOK_URL?.trim();
  const n8nSecret = process.env.N8N_INBOUND_SHARED_SECRET?.trim();
  const hasN8n = n8nUrl && !/REPLACE|your-|paste-/i.test(n8nUrl);

  for (const entry of entries) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const message = event.message;

      // Ignore echoes (messages sent by our own bot/page) or messages without text
      if (!senderId || !message || message.is_echo || !message.text) {
        continue;
      }

      const text = message.text;
      const timestamp = event.timestamp ?? Date.now();

      // Process in background after returning 200 to Meta
      after(async () => {
        try {
          if (hasN8n) {
            // Forward to n8n workflow
            await fetch(n8nUrl, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                ...(n8nSecret ? { "x-api-key": n8nSecret } : {}),
              },
              body: JSON.stringify({
                senderId,
                text,
                timestamp,
                platform: "instagram",
              }),
              signal: AbortSignal.timeout(10000),
            }).catch((err) => console.error("Failed to forward Instagram DM to n8n:", err));
          } else {
            // Fallback: built-in responder
            const replyText = await processInstagramMessage(text);
            await sendInstagramMessage(senderId, replyText);
          }
        } catch (err) {
          console.error("Failed to handle Instagram DM:", err);
        }
      });
    }
  }

  return Response.json({ status: "ok" }, { status: 200 });
}
