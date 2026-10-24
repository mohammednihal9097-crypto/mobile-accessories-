import Link from "next/link";
import { AlertTriangle, ArrowUpRight, FileSpreadsheet } from "lucide-react";
import { formatMoney } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = async (status: string) =>
    (await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status)).count ?? 0;
  const [pending, paid, processing, shipped, lowStockProducts, refunds, paidOrders] = await Promise.all([
    count("pending_payment"),
    count("paid"),
    count("processing"),
    count("shipped"),
    supabase.from("products").select("id, name, stock_quantity").lte("stock_quantity", 5).eq("is_active", true).order("stock_quantity"),
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
    ["Low or no stock (5 or fewer)", (lowStockProducts.data ?? []).length, "/admin/products"],
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

      {/* Low Stock Alert Section */}
      {(lowStockProducts.data ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Low / No Stock Products
          </h2>
          <ul className="divide-y rounded-xl border border-amber-200 bg-amber-50">
            {(lowStockProducts.data ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <Link href={`/admin/products/${p.id}`} className="font-medium text-slate-800 hover:text-brand-700 hover:underline">{p.name}</Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock_quantity === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                  {p.stock_quantity === 0 ? "Out of stock" : `${p.stock_quantity} left`}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/admin/products" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
            Manage all products <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
