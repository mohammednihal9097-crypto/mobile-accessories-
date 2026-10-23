import Link from "next/link";
import { ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { formatMoney } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = async (status: string) =>
    (await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status)).count ?? 0;
  const [pending, paid, processing, shipped, lowStock, refunds, paidOrders] = await Promise.all([
    count("pending_payment"),
    count("paid"),
    count("processing"),
    count("shipped"),
    supabase.from("products").select("id", { count: "exact", head: true }).lte("stock_quantity", 5).eq("is_active", true),
    // Verified payments on orders that are cancelled: the customer paid and needs a refund.
    supabase.from("payments").select("id, orders!inner(status)", { count: "exact", head: true }).eq("verified", true).eq("orders.status", "cancelled"),
    supabase.from("orders").select("total_minor").in("status", ["paid", "processing", "shipped", "delivered"]),
  ]);

  const totalRevenueMinor = (paidOrders.data ?? []).reduce((acc, row) => acc + row.total_minor, 0);

  const tiles = [
    ["Waiting for payment", pending, "/admin/orders?status=pending_payment"],
    ["Paid — to pack", paid, "/admin/orders?status=paid"],
    ["Processing", processing, "/admin/orders?status=processing"],
    ["Shipped", shipped, "/admin/orders?status=shipped"],
    ["Low or no stock (5 or fewer)", lowStock.count ?? 0, "/admin/products"],
    ["Paid but cancelled: refund needed", refunds.count ?? 0, "/admin/orders?status=cancelled"],
  ] as const;

  return (
    <div className="space-y-6">
      {/* Revenue Datasheet Highlight Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Total Revenue Generated</span>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{formatMoney(totalRevenueMinor)}</p>
          <p className="mt-0.5 text-xs text-slate-500">From verified &amp; completed orders</p>
        </div>
        <Link
          href="/admin/analytics"
          className="btn-press inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          View Day-by-Day Datasheet
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-slate-900">Order Pipelines</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles.map(([label, n, href]) => (
            <Link key={label} href={href} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-md">
              <p className="text-3xl font-semibold text-brand-600">{n}</p>
              <p className="text-sm text-slate-600">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
