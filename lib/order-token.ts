import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Customers see their order through a link that contains a secret token. Only a hash of the token
// is stored in the database, so a database leak does not expose working links.
// The token is derived from the checkout's idempotency key, so a repeated submit can rebuild the same link.

export function linkSecret(): string {
  const s = process.env.ORDER_LINK_SECRET?.trim();
  if (!s || s.length < 24 || s.startsWith("your-")) throw new Error("ORDER_LINK_SECRET is not set (see .env.example)");
  return s;
}

export function tokenFor(idempotencyKey: string): string {
  return createHmac("sha256", linkSecret()).update(`order:${idempotencyKey}`).digest("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string, storedHash: string): boolean {
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---- Signed "continue on the website" links sent over WhatsApp --------------------------------
// The link carries the customer's WhatsApp number plus an expiry, signed so it cannot be edited.

export function signWaLink(whatsapp: string, ttlSeconds = 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = createHmac("sha256", linkSecret()).update(`wa:${whatsapp}:${exp}`).digest("base64url");
  return { wa: whatsapp, exp, sig };
}

export function verifyWaLink(wa: string, exp: string, sig: string): boolean {
  const expNum = Number(exp);
  if (!Number.isInteger(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", linkSecret()).update(`wa:${wa}:${expNum}`).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
