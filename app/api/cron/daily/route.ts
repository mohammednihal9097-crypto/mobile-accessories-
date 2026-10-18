import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { flushNotifications } from "@/lib/notifications/flush";
import { createSecretClient } from "@/lib/supabase/admin";

// Safety-net job run by Vercel on a schedule (see vercel.json). It:
//  1) sends any WhatsApp message that failed or was missed earlier, and
//  2) cancels orders still unpaid after 24 hours, returning their stock.
// Vercel's free (Hobby) plan allows one run per day; a paid plan can run it every few minutes.
// Vercel proves it is the caller by sending "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 503 });
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return NextResponse.json({ ok: false }, { status: 401 });

  const sent = await flushNotifications(50);
  const { data: cancelled, error } = await createSecretClient().rpc("expire_unpaid_orders", { p_hours: 24 });
  if (error) console.error("expire_unpaid_orders failed", error.message);
  if (typeof cancelled === "number" && cancelled > 0) revalidateTag("catalog", "max"); // stock came back
  // Cancelling creates "cancelled" messages: send them now too.
  const after = typeof cancelled === "number" && cancelled > 0 ? await flushNotifications(50) : null;
  return NextResponse.json({ ok: true, whatsapp: sent, cancelledUnpaid: cancelled ?? 0, whatsappAfterCancel: after });
}