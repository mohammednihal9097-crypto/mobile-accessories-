import Link from "next/link";
import {
  Instagram,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Sparkles,
  Bot,
  MessageSquare,
  ShieldAlert,
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
  const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || "triostore_instagram_verify_token";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <Instagram className="h-6 w-6 text-rose-600" />
            Instagram Auto-Reply &amp; Hub
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Automate customer DMs on @triostore_india and manage your link-in-bio storefront.
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
                configured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {configured ? <CheckCircle2 className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Instagram Auto-Reply Status:{" "}
                <span className={configured ? "text-green-700" : "text-amber-700"}>
                  {configured ? "Active & Listening" : "Setup Required (Waiting for Meta Token)"}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {configured
                  ? "Incoming DMs from Instagram are automatically answered with product suggestions and tracking links."
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
            Preview Link-in-Bio Page
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Meta Webhook Endpoint Credentials */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b pb-2">
          <MessageSquare className="h-4 w-4 text-brand-600" />
          Meta Graph API Webhook Configuration
        </h2>
        <p className="text-xs text-slate-600">
          Paste these credentials into your <strong>Meta for Developers &rarr; App &rarr; Instagram Webhooks</strong> dashboard:
        </p>

        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Callback URL (Webhook)</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={webhookUrl}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Verify Token</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={verifyToken}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-mono text-xs text-slate-800 outline-none"
              />
            </div>
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

      {/* Step-by-Step Meta Setup Guide */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <ShieldAlert className="h-4 w-4 text-brand-600" />
          How to Connect Your Instagram Account in Meta (3 Steps)
        </h2>
        <ol className="list-decimal space-y-2 pl-4 text-xs text-slate-600 sm:text-sm">
          <li>
            Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline font-medium">developers.facebook.com</a> &rarr; <strong>My Apps</strong> (or create a Business type app).
          </li>
          <li>
            Under <strong>Add Products</strong>, add <strong>Instagram Graph API</strong>.
          </li>
          <li>
            In <strong>Webhooks &rarr; Instagram</strong>, click <strong>Subscribe to this object</strong>, paste the <strong>Callback URL</strong> and <strong>Verify Token</strong> above, and check the <strong>messages</strong> subscription field.
          </li>
          <li>
            Add your <code>INSTAGRAM_ACCESS_TOKEN</code> in your Vercel Environment Variables.
          </li>
        </ol>
      </div>
    </div>
  );
}
