// Pure builders for WhatsApp Cloud API message bodies (no imports, so they can be tested).
// Shape checked against Meta's current docs (Oct 2026): POST /{version}/{phone-number-id}/messages

export const GRAPH_VERSION = "v25.0";

export function textPayload(to: string, body: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to.replace(/^\+/, ""), // digits only, no plus
    type: "text",
    text: { preview_url: false, body: body.slice(0, 4000) },
  };
}

export function templatePayload(to: string, name: string, language: string, bodyParams: string[]) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to.replace(/^\+/, ""),
    type: "template",
    template: {
      name,
      language: { code: language },
      ...(bodyParams.length > 0
        ? { components: [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }] }
        : {}),
    },
  };
}

/** A short, token-free description of a Cloud API error response. */
export function describeError(status: number, json: unknown): string {
  const e = (json as { error?: { message?: string; code?: number; error_data?: { details?: string } } } | null)?.error;
  const parts = [`HTTP ${status}`, e?.code ? `code ${e.code}` : "", e?.message ?? "", e?.error_data?.details ?? ""].filter(Boolean);
  return parts.join(" | ").replace(/\s+/g, " ").slice(0, 400);
}
