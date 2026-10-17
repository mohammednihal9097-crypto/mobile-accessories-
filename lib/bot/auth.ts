import "server-only";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * n8n proves who it is with a shared secret in the "x-api-key" header.
 * Returns an error response if the key is missing or wrong, otherwise null.
 */
export function rejectUnlessBot(request: Request): NextResponse | null {
  const expected = process.env.N8N_API_SHARED_SECRET?.trim();
  if (!expected || expected.length < 24 || expected.startsWith("your-")) {
    return NextResponse.json({ ok: false, error: "bot API not configured" }, { status: 503 });
  }
  const given = Buffer.from(request.headers.get("x-api-key") ?? "");
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return null;
}

/** WhatsApp sends numbers like 919876543210 (no plus). We store and compare +919876543210. */
export function normalizeWhatsapp(input: unknown): string | null {
  const digits = String(input ?? "").replace(/[^\d]/g, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}
