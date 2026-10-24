import Link from "next/link";
import {
  Instagram,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Bot,
  MessageSquare,
  ShieldAlert,
  Workflow,
  Code2,
} from "lucide-react";
import Flash from "@/components/admin/Flash";
import { requireAdmin } from "@/lib/supabase/auth";
import { isInstagramConfigured } from "@/lib/instagram/api";

export const metadata = { title: "Instagram Auto-Reply & Automation - Admin" };

export default async function AdminInstagramPage({ searchParams }: PageProps<"/admin/instagram">) {
  await requireAdmin();
  const configured = isInstagramConfigured();

  const siteUrl = process.env.SITE_URL?.replace(/\/$/, "") || "https://triostore-india.vercel.app";
  const webhookUrl = `${siteUrl}/api/instagram/webhook`;
  const botEndpoint = `${siteUrl}/api/bot/instagram`;
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || "triostore_instagram_verify_token";
  const hasN8n = Boolean(process.env.N8N_INSTAGRAM_WEBHOOK_URL);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <Instagram className="h-6 w-6 text-rose-600" />
            Instagram Auto-Reply &amp; Hub
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Automate customer DMs on @triostore_india using n8n or the built-in bot.
          </p>
        </div>
        <Flash searchParams={searchParams} />
      </div>

      {/* Connection Status Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                hasN8n || configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {hasN8n || configured ? <CheckCircle2 className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Instagram Automation:{" "}
                <span className={hasN8n ? "text-purple-700 font-bold" : configured ? "text-green-700" : "text-amber-700"}>
                  {hasN8n
                    ? "Routing via n8n Workflow"
                    : configured
                    ? "Active via Built-in Bot"
                    : "Ready to connect"}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {hasN8n
                  ? "Incoming Instagram DMs are routed through your custom n8n workflow."
                  : "Webhook endpoint is live and ready to receive Meta events."}
              </p>
            </div>
          </div>
          <Link
            href="/instagram"
            target="_blank"
            className="btn-press inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <Sparkles className="h-4 w-4" />
            Preview Link-in-Bio
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* n8n Automation Workflow Card */}
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50/50 to-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-purple-100 pb-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Workflow className="h-5 w-5 text-purple-600" />
            n8n Automation Setup (Recommended)
          </h2>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
            Workflow Ready
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          We have prepared a complete, ready-to-import n8n workflow file:{" "}
          <code className="rounded bg-purple-100/70 px-1.5 py-0.5 font-mono text-purple-800">
            n8n/4-instagram-inbound-bot.json
          </code>
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Bot API Endpoint for n8n
            </label>
            <input
              readOnly
              value={botEndpoint}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              n8n calls this endpoint to get answers about products, stock, prices, tracking &amp; coupons. Protected with header{" "}
              <code>x-api-key: N8N_API_SHARED_SECRET</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Forward to n8n Webhook URL (Environment Variable)
            </label>
            <input
              readOnly
              value={process.env.N8N_INSTAGRAM_WEBHOOK_URL || "Set N8N_INSTAGRAM_WEBHOOK_URL in Vercel to your n8n Production Webhook"}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-purple-100 bg-white p-3 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">How to activate in n8n in 2 minutes:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>In n8n, click <strong>Workflows &rarr; Import from File</strong> &rarr; select <code>n8n/4-instagram-inbound-bot.json</code>.</li>
            <li>In the <strong>&ldquo;Ask the store bot&rdquo;</strong> node, set the URL to <code>{botEndpoint}</code>.</li>
            <li>In the <strong>&ldquo;Send Instagram DM&rdquo;</strong> node, connect your Meta Page Access Token.</li>
            <li>Activate the workflow and copy its <strong>Production URL</strong> into <code>N8N_INSTAGRAM_WEBHOOK_URL</code> in Vercel.</li>
          </ol>
        </div>
      </div>

      {/* Meta Webhook Endpoint Credentials */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b pb-2">
          <MessageSquare className="h-4 w-4 text-brand-600" />
          Meta for Developers Webhook Configuration
        </h2>
        <p className="text-xs text-slate-600">
          Paste these credentials into your <strong>Meta for Developers &rarr; App &rarr; Instagram Webhooks</strong> dashboard:
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Callback URL (Webhook)</label>
            <input
              readOnly
              value={webhookUrl}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Verify Token</label>
            <input
              readOnly
              value={verifyToken}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* How It Works & Auto-Reply Capabilities */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-2xl">🤖</span>
          <h3 className="mt-2 text-sm font-bold text-slate-900">Instant Greetings</h3>
          <p className="mt-1 text-xs text-slate-500">
            Automatically welcomes users who message &ldquo;hi&rdquo; or &ldquo;hello&rdquo; and gives them quick options to shop.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-2xl">🏷️</span>
          <h3 className="mt-2 text-sm font-bold text-slate-900">Coupon Code Giver</h3>
          <p className="mt-1 text-xs text-slate-500">
            Replies with your <strong>INSTA10</strong> 10% discount voucher whenever anyone asks for prices, offers, or discounts.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-2xl">📦</span>
          <h3 className="mt-2 text-sm font-bold text-slate-900">Live Order Tracking</h3>
          <p className="mt-1 text-xs text-slate-500">
            Detects order numbers or &ldquo;track&rdquo; questions and sends direct self-service tracking links.
          </p>
        </div>
      </div>
    </div>
  );
}
