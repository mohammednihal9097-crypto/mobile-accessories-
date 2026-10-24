import { Settings, Save, AlertCircle, Shield, Truck, HelpCircle, Store } from "lucide-react";
import Flash from "@/components/admin/Flash";
import { STORE } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSecretClient } from "@/lib/supabase/admin";
import { saveStoreSettings } from "../actions";

export const metadata = { title: "Store Settings - Admin" };

const inputClass =
  "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export default async function StoreSettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin();
  const sc = createSecretClient();

  const settingsMap: Record<string, string> = {};
  let tableMissing = false;

  try {
    const { data, error } = await sc.from("store_settings").select("key, value");
    if (error) {
      tableMissing = true;
    } else {
      for (const row of data ?? []) {
        settingsMap[row.key] = row.value;
      }
    }
  } catch {
    tableMissing = true;
  }

  // Fallbacks from config
  const storeName = settingsMap["store_name"] ?? STORE.name;
  const storeTagline = settingsMap["store_tagline"] ?? STORE.tagline;
  const supportEmail = settingsMap["support_email"] ?? STORE.legal.email;
  const supportWhatsapp = settingsMap["support_whatsapp"] ?? STORE.legal.phone;
  const shippingFeeInr = settingsMap["shipping_fee_inr"] ?? (STORE.shipping.flatFee / 100).toString();
  const freeShippingThresholdInr = settingsMap["free_shipping_threshold_inr"] ?? (STORE.shipping.freeOver / 100).toString();
  const gstNumber = settingsMap["gst_number"] ?? STORE.legal.gstin;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <Settings className="h-6 w-6 text-brand-600" />
            Store Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure store branding, shipping thresholds, customer support channels, and legal details.
          </p>
        </div>
        <Flash searchParams={searchParams} />
      </div>

      {tableMissing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Database Migration Note</p>
            <p className="mt-1 text-xs text-amber-700">
              The <code>store_settings</code> table migration is prepared at <code>supabase/migrations/0010_store_settings.sql</code>. Apply it in Supabase SQL editor to persist database-backed overrides.
            </p>
          </div>
        </div>
      )}

      <form action={saveStoreSettings} className="space-y-6">
        {/* Brand Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b pb-2">
            <Store className="h-4 w-4 text-brand-600" />
            Brand &amp; Identity
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Store Name</label>
              <input
                name="store_name"
                defaultValue={storeName}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tagline / Motto</label>
              <input
                name="store_tagline"
                defaultValue={storeTagline}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Fees */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b pb-2">
            <Truck className="h-4 w-4 text-brand-600" />
            Shipping &amp; Delivery Rules
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Standard Shipping Flat Fee (₹)
              </label>
              <input
                name="shipping_fee_inr"
                type="number"
                defaultValue={shippingFeeInr}
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">Charged on orders below the free delivery threshold.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Free Delivery Above (₹)
              </label>
              <input
                name="free_shipping_threshold_inr"
                type="number"
                defaultValue={freeShippingThresholdInr}
                required
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">Orders equal or exceeding this receive free delivery.</p>
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b pb-2">
            <HelpCircle className="h-4 w-4 text-brand-600" />
            Customer Contact &amp; Support Channels
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Support Email</label>
              <input
                name="support_email"
                type="email"
                defaultValue={supportEmail}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Support Phone / WhatsApp</label>
              <input
                name="support_whatsapp"
                defaultValue={supportWhatsapp}
                placeholder="+91 ..."
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Legal & Taxation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 border-b pb-2">
            <Shield className="h-4 w-4 text-brand-600" />
            Business &amp; Tax Registration
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">GSTIN / Tax ID Number</label>
            <input
              name="gst_number"
              defaultValue={gstNumber}
              placeholder="e.g. 32AAAAA0000A1Z5 (optional)"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-500">Printed on official invoices and customer packing slips.</p>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Save className="h-4 w-4" />
            Save Store Settings
          </button>
        </div>
      </form>
    </div>
  );
}
