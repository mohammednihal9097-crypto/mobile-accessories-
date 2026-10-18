import { NextResponse } from "next/server";
import { rejectUnlessBot } from "@/lib/bot/auth";
import { claimReadyMessages } from "@/lib/notifications/claim";

// Only needed if you use n8n to send messages. n8n polls this every minute; each call claims a batch
// (so two runs can never send the same message). Without n8n, the website sends them itself (lib/notifications/flush.ts).
export async function POST(request: Request) {
  const denied = rejectUnlessBot(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ ok: true, notifications: await claimReadyMessages(10) });
  } catch (e) {
    console.error("pending notifications failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
