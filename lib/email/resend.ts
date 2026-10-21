import "server-only";

// Sends email through Resend's HTTPS API. No extra package needed.
// Settings (Vercel > Environment Variables):
//   RESEND_API_KEY  from resend.com > API Keys (a secret)
//   EMAIL_FROM      optional sender, e.g. "Trio Store <orders@yourdomain.com>". Until you verify your own domain
//                   in Resend, leave it unset: Resend's test sender then delivers ONLY to the email you signed up with.

export type EmailResult = { ok: true } | { ok: false; error: string };

function config(): { key: string; from: string } | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key.startsWith("paste-") || key.startsWith("your-")) return null;
  return { key, from: process.env.EMAIL_FROM?.trim() || "Trio Store <onboarding@resend.dev>" };
}

export function emailConfigured(): boolean {
  return config() !== null;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<EmailResult> {
  const c = config();
  if (!c) return { ok: false, error: "Email sending is not configured (RESEND_API_KEY missing)" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${c.key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: c.from, to: [to], subject, text }),
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return { ok: true };
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, error: `Resend ${res.status}: ${json?.message ?? "request failed"}`.slice(0, 300) };
  } catch (e) {
    return { ok: false, error: `network error: ${e instanceof Error ? e.message : "unknown"}`.slice(0, 300) };
  }
}
