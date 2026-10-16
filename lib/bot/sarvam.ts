import "server-only";
import { protect, restore } from "./protect";

// Sarvam is used ONLY to translate the customer's words into English and the bot's English reply back.
// The shop database stays the source of truth: prices, stock, fit, payment and order status are
// produced by the router in English and are protected from change during translation (protect.ts).
//
// OFF unless BOTH are set:  SARVAM_API_KEY  and  SARVAM_LANGUAGES (comma list, e.g. "hi-IN,ta-IN").
// Languages you choose are the ONLY ones translated; anything else is treated as English.
// Only the message text is sent to Sarvam: never names, phone numbers or order data.

const ENDPOINT = "https://api.sarvam.ai/translate"; // checked against Sarvam's docs, Oct 2026
const ENGLISH = "en-IN";

export function sarvamLanguages(): string[] {
  const key = process.env.SARVAM_API_KEY;
  if (!key || key.startsWith("your-")) return [];
  return (process.env.SARVAM_LANGUAGES ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

async function translate(input: string, source: string, target: string): Promise<{ text: string; source: string } | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY! },
      body: JSON.stringify({
        input, source_language_code: source, target_language_code: target,
        model: "mayura:v1", mode: "formal", numerals_format: "international",
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { translated_text?: string; source_language_code?: string };
    return j.translated_text ? { text: j.translated_text, source: j.source_language_code ?? source } : null;
  } catch {
    return null;
  }
}

/** Customer text -> English. Returns the language to answer in, or null to just use the original text. */
export async function toEnglish(text: string): Promise<{ english: string; language: string } | null> {
  const allowed = sarvamLanguages();
  if (allowed.length === 0 || !text.trim() || text.length > 1000) return null;
  const r = await translate(text, "auto", ENGLISH);
  if (!r || r.source === ENGLISH || !allowed.includes(r.source)) return null;
  return { english: r.text, language: r.source };
}

/** English reply -> customer's language. Falls back to the English original if anything looks off. */
export async function fromEnglish(reply: string, language: string): Promise<string> {
  const lines = reply.split("\n");
  const out = await Promise.all(
    lines.map(async (line) => {
      if (!line.trim()) return line;
      const p = protect(line);
      if (p.text.replace(/QQ\d+QQ/g, "").trim().length === 0) return line; // nothing but facts
      const r = await translate(p.text, ENGLISH, language);
      if (!r) return null;
      return restore(r.text, p.tokens);
    }),
  );
  // One bad line and the whole reply stays English: better plain than wrong.
  return out.some((l) => l === null) ? reply : out.join("\n");
}
