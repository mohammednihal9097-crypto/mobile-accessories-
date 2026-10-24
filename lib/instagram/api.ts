import "server-only";

const GRAPH_VERSION = "v21.0";

export type InstagramSendResult =
  | { ok: true; messageId: string | null }
  | { ok: false; error: string };

function getToken(): string | null {
  const token =
    process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ||
    process.env.META_PAGE_ACCESS_TOKEN?.trim();
  if (!token || token.startsWith("paste-") || token.startsWith("your-")) {
    return null;
  }
  return token;
}

export function isInstagramConfigured(): boolean {
  return getToken() !== null;
}

/**
 * Sends a direct message reply to an Instagram user using the Meta Graph API.
 * @param recipientId The Instagram-scoped ID (IGSID) of the customer.
 * @param text The text message to send.
 */
export async function sendInstagramMessage(
  recipientId: string,
  text: string
): Promise<InstagramSendResult> {
  const token = getToken();
  if (!token) {
    return {
      ok: false,
      error: "Instagram access token is not configured (INSTAGRAM_ACCESS_TOKEN)",
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/me/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: text.slice(0, 1000) },
      }),
      signal: AbortSignal.timeout(12000),
    });

    const json = (await res.json().catch(() => null)) as {
      message_id?: string;
      error?: { message: string };
    } | null;

    if (!res.ok) {
      return {
        ok: false,
        error: json?.error?.message ?? `Meta API returned HTTP ${res.status}`,
      };
    }

    return { ok: true, messageId: json?.message_id ?? null };
  } catch (err) {
    return {
      ok: false,
      error: `Network error: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }
}
