import "server-only";
import nodemailer from "nodemailer";
import { STORE } from "@/lib/config";
import { emailConfigured as resendConfigured, sendEmail as sendViaResend, type EmailResult } from "./resend";

// Sends order emails. Gmail is used when these are set (Vercel > Environment Variables):
//   GMAIL_USER          the Gmail address that sends, e.g. triostoreindia@gmail.com
//   GMAIL_APP_PASSWORD  a 16-character Google App Password (not the normal Gmail password)
// If they are not set, Resend (RESEND_API_KEY) is used instead.

function gmailConfig(): { user: string; pass: string } | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass || user.startsWith("paste-") || pass.startsWith("paste-")) return null;
  return { user, pass };
}

export function emailConfigured(): boolean {
  return gmailConfig() !== null || resendConfigured();
}

export async function sendEmail(to: string, subject: string, text: string): Promise<EmailResult> {
  const g = gmailConfig();
  if (!g) return sendViaResend(to, subject, text);
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: g.user, pass: g.pass },
      connectionTimeout: 10000,
      socketTimeout: 12000,
    });
    await transport.sendMail({ from: `${STORE.name} <${g.user}>`, to, subject, text, replyTo: g.user });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Gmail: ${e instanceof Error ? e.message : "send failed"}`.slice(0, 300) };
  }
}
