import "server-only";
import nodemailer from "nodemailer";
import { STORE } from "@/lib/config";
import { emailConfigured as resendConfigured, sendEmail as sendViaResend, type EmailResult } from "./resend";

// Sends order emails. The first of these that is set up (Vercel > Environment Variables) is used:
//   1. Any SMTP service, e.g. Brevo:  SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASSWORD, EMAIL_FROM
//        EMAIL_FROM is the verified sender address shown to customers, e.g. "Trio Store <triostoreindia@gmail.com>"
//   2. Gmail:  GMAIL_USER, GMAIL_APP_PASSWORD (a Google App Password)
//   3. Resend: RESEND_API_KEY (only delivers to your own address until you verify a domain)

type Smtp = { host: string; port: number; user: string; pass: string; from: string };

const real = (v: string | undefined) => (v && !v.trim().startsWith("paste-") ? v.trim() : "");

function smtpConfig(): Smtp | null {
  const host = real(process.env.SMTP_HOST);
  const user = real(process.env.SMTP_USER);
  const pass = real(process.env.SMTP_PASSWORD);
  const from = real(process.env.EMAIL_FROM);
  if (host && user && pass && from) return { host, port: Number(process.env.SMTP_PORT) || 587, user, pass, from };
  const gUser = real(process.env.GMAIL_USER);
  const gPass = real(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, "");
  if (gUser && gPass) return { host: "smtp.gmail.com", port: 465, user: gUser, pass: gPass, from: `${STORE.name} <${gUser}>` };
  return null;
}

export function emailConfigured(): boolean {
  return smtpConfig() !== null || resendConfigured();
}

export async function sendEmail(to: string, subject: string, text: string): Promise<EmailResult> {
  const c = smtpConfig();
  if (!c) return sendViaResend(to, subject, text);
  try {
    const transport = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.port === 465,
      auth: { user: c.user, pass: c.pass },
      connectionTimeout: 10000,
      socketTimeout: 12000,
    });
    await transport.sendMail({ from: c.from, to, subject, text });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `SMTP: ${e instanceof Error ? e.message : "send failed"}`.slice(0, 300) };
  }
}
