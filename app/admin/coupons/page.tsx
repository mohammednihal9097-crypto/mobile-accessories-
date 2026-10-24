import { Tag, Plus, CheckCircle, XCircle, Trash2, Calendar, AlertCircle } from "lucide-react";
import Flash from "@/components/admin/Flash";
import { formatMoney } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSecretClient } from "@/lib/supabase/admin";
import { createCoupon, deleteCoupon, toggleCoupon } from "../actions";

export const metadata = { title: "Coupons & Discounts - Admin" };

const inputClass = "w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export default async function CouponsPage({ searchParams }: PageProps<"/admin/coupons">) {
  await requireAdmin();
  const sc = createSecretClient();

  let coupons: any[] = [];
  let tableMissing = false;

  try {
    const { data, error } = await sc
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      tableMissing = true;
    } else {
      coupons = data ?? [];
    }
  } catch {
    tableMissing = true;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            <Tag className="h-6 w-6 text-brand-600" />
            Coupons &amp; Discount Codes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create promotional discount codes for percentage-off or flat-amount savings.
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
              The <code>coupons</code> table migration is prepared at <code>supabase/migrations/0009_coupons.sql</code>. If you are running against a fresh Supabase instance, apply this migration in your Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* Create Coupon Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Plus className="h-4 w-4 text-brand-600" />
          Create New Coupon
        </h2>

        <form action={createCoupon} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code</label>
            <input
              name="code"
              required
              placeholder="e.g. TRIO10"
              className={`${inputClass} uppercase tracking-wider font-mono font-bold`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
            <select name="discount_type" defaultValue="percent" className={inputClass}>
              <option value="percent">Percentage Off (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Value</label>
            <input
              name="discount_value"
              required
              placeholder="e.g. 10 or 100"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Min Order (₹, Optional)</label>
            <input
              name="min_order"
              placeholder="e.g. 499"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date (Optional)</label>
            <input
              name="expires_at"
              type="date"
              className={inputClass}
            />
          </div>

          <div className="lg:col-span-5 flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Create Coupon
            </button>
          </div>
        </form>
      </div>

      {/* Coupons List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Active &amp; Past Coupons</h2>
          <span className="text-xs text-slate-500">{coupons.length} coupon{coupons.length === 1 ? "" : "s"}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Discount</th>
                  <th className="p-3.5">Min Order</th>
                  <th className="p-3.5">Usage</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Expires</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map((c) => {
                  const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="p-3.5">
                        <span className="font-mono font-bold tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg">
                          {c.code}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {c.discount_type === "percent" ? `${c.discount_value}% OFF` : `${formatMoney(c.discount_value)} OFF`}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.min_order_minor > 0 ? formatMoney(c.min_order_minor) : "No minimum"}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.usage_count} times
                      </td>
                      <td className="p-3.5">
                        {isExpired ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Expired
                          </span>
                        ) : c.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            <XCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-slate-500">
                        {c.expires_at ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(c.expires_at).toLocaleDateString("en-IN")}
                          </span>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <form action={toggleCoupon}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="is_active" value={String(c.is_active)} />
                            <button
                              type="submit"
                              className="text-xs font-medium text-slate-600 hover:text-brand-700 underline"
                            >
                              {c.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </form>
                          <form action={deleteCoupon}>
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              onClick={(e) => {
                                if (!confirm(`Delete coupon "${c.code}"?`)) e.preventDefault();
                              }}
                              className="text-xs font-medium text-red-600 hover:text-red-800 inline-flex items-center gap-0.5 ml-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                      No coupons created yet. Use the form above to add your first promo code.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
