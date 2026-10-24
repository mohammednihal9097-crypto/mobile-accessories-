import Link from "next/link";
import { Download, FileSpreadsheet, TrendingUp, ShoppingBag, CheckCircle2, Clock, Calendar, ArrowUpRight, BarChart3, Package } from "lucide-react";
import { formatMoney } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/auth";

export const metadata = { title: "Revenue & Datasheet - Admin" };

const PAID_STATUSES = new Set(["paid", "processing", "shipped", "delivered"]);

type DailyAggregate = {
  dateKey: string;
  displayDate: string;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  revenueMinor: number;
};

export default async function AnalyticsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: orders }, { data: orderItems }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total_minor, currency, created_at, customer_name")
      .order("created_at", { ascending: false }),
    supabase
      .from("order_items")
      .select("order_id, product_name, unit_price_minor, quantity"),
  ]);

  const allOrders = orders ?? [];

  let totalRevenueMinor = 0;
  let paidOrdersCount = 0;
  let pendingOrdersCount = 0;
  let pendingRevenueMinor = 0;

  const dailyMap = new Map<string, DailyAggregate>();
  const todayKey = new Date().toISOString().split("T")[0];

  for (const o of allOrders) {
    const isPaid = PAID_STATUSES.has(o.status);
    if (isPaid) {
      totalRevenueMinor += o.total_minor;
      paidOrdersCount += 1;
    } else if (o.status === "pending_payment") {
      pendingOrdersCount += 1;
      pendingRevenueMinor += o.total_minor;
    }

    const d = new Date(o.created_at);
    const dateKey = d.toISOString().split("T")[0];

    const current = dailyMap.get(dateKey) ?? {
      dateKey,
      displayDate: d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      revenueMinor: 0,
    };

    current.totalOrders += 1;
    if (isPaid) {
      current.paidOrders += 1;
      current.revenueMinor += o.total_minor;
    } else if (o.status === "pending_payment") {
      current.pendingOrders += 1;
    } else if (o.status === "cancelled") {
      current.cancelledOrders += 1;
    }

    dailyMap.set(dateKey, current);
  }

  const dailyList = Array.from(dailyMap.values());
  const todayStats = dailyMap.get(todayKey);

  const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalRevenueMinor / paidOrdersCount) : 0;

  // Sales by Product aggregation
  const paidOrderIds = new Set(allOrders.filter((o) => PAID_STATUSES.has(o.status)).map((o) => o.id));
  const productSalesMap = new Map<string, { name: string; unitsSold: number; revenueMinor: number; orderCount: number }>();

  for (const item of (orderItems ?? [])) {
    if (!paidOrderIds.has(item.order_id)) continue;
    const current = productSalesMap.get(item.product_name) ?? {
      name: item.product_name,
      unitsSold: 0,
      revenueMinor: 0,
      orderCount: 0,
    };
    current.unitsSold += item.quantity;
    current.revenueMinor += item.unit_price_minor * item.quantity;
    current.orderCount += 1;
    productSalesMap.set(item.product_name, current);
  }

  const productSalesList = Array.from(productSalesMap.values()).sort((a, b) => b.revenueMinor - a.revenueMinor);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Revenue &amp; Order Datasheet</h1>
          <p className="mt-1 text-sm text-slate-600">
            Day-by-day sales reports, product-level analytics, and downloadable datasheets.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/export/daily"
            download
            className="btn-press inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            <Download className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Download Daily CSV
          </a>
          <a
            href="/api/admin/export/orders"
            download
            className="btn-press inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            Export Orders Datasheet
          </a>
        </div>
      </div>

      {/* KPI Revenue Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Revenue</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{formatMoney(totalRevenueMinor)}</p>
          <p className="mt-1 text-xs text-slate-500">From {paidOrdersCount} paid orders</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today&apos;s Revenue</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Calendar className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-brand-600">
            {formatMoney(todayStats?.revenueMinor ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {todayStats?.paidOrders ?? 0} paid today ({todayStats?.totalOrders ?? 0} total)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Order Value</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{formatMoney(averageOrderValue)}</p>
          <p className="mt-1 text-xs text-slate-500">Per completed order</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Payment</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{formatMoney(pendingRevenueMinor)}</p>
          <p className="mt-1 text-xs text-slate-500">{pendingOrdersCount} orders awaiting payment</p>
        </div>
      </div>

      {/* Feature 4: Sales by Product Report */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BarChart3 className="h-5 w-5 text-brand-600" aria-hidden="true" />
            Sales by Product Report
          </h2>
          <span className="text-xs text-slate-500">
            {productSalesList.length} product{productSalesList.length === 1 ? "" : "s"} sold
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Units Sold</th>
                  <th className="p-3.5">Orders Count</th>
                  <th className="p-3.5">Total Revenue</th>
                  <th className="p-3.5">Avg Selling Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productSalesList.map((p) => {
                  const avgPrice = p.unitsSold > 0 ? Math.round(p.revenueMinor / p.unitsSold) : 0;
                  return (
                    <tr key={p.name} className="transition-colors hover:bg-slate-50/60">
                      <td className="p-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400" />
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {p.unitsSold}
                      </td>
                      <td className="p-3.5 text-slate-600">{p.orderCount}</td>
                      <td className="p-3.5 font-semibold text-green-700">{formatMoney(p.revenueMinor)}</td>
                      <td className="p-3.5 text-slate-600">{formatMoney(avgPrice)}</td>
                    </tr>
                  );
                })}
                {productSalesList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-slate-500">
                      No product sales recorded yet. Once paid orders come in, best-selling products will be ranked here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Day by Day Datasheet Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Day-by-Day Revenue &amp; Orders</h2>
          <span className="text-xs text-slate-500">Showing {dailyList.length} recorded day{dailyList.length === 1 ? "" : "s"}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Total Revenue</th>
                  <th className="p-3.5">Paid Orders</th>
                  <th className="p-3.5">Orders Placed</th>
                  <th className="p-3.5">Pending</th>
                  <th className="p-3.5">Cancelled</th>
                  <th className="p-3.5">Avg Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyList.map((day) => {
                  const dayAov = day.paidOrders > 0 ? Math.round(day.revenueMinor / day.paidOrders) : 0;
                  return (
                    <tr key={day.dateKey} className="transition-colors hover:bg-slate-50/60">
                      <td className="p-3.5 font-medium text-slate-900">
                        {day.displayDate}
                        {day.dateKey === todayKey && (
                          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-semibold text-green-700">
                        {formatMoney(day.revenueMinor)}
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        <span className="inline-flex items-center gap-1 text-slate-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                          {day.paidOrders}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{day.totalOrders}</td>
                      <td className="p-3.5">
                        {day.pendingOrders > 0 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            {day.pendingOrders}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {day.cancelledOrders > 0 ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                            {day.cancelledOrders}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {day.paidOrders > 0 ? formatMoney(dayAov) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {dailyList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                      No orders have been recorded yet. Once orders are placed, day-by-day revenue will appear here automatically.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Google Sheets / External Spreadsheet Integration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900">Connect Directly to Google Sheets</h3>
            <p className="text-sm text-slate-600">
              You can import this live datasheet directly into Google Sheets so your team always has the latest numbers:
            </p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-600 sm:text-sm">
              <li>Open a new or existing Google Sheet.</li>
              <li>Click <strong>File &rarr; Import &rarr; Upload</strong> and upload the exported CSV above, or</li>
              <li>Use the Google Sheets <code>IMPORTDATA</code> formula with your exported link to sync live numbers automatically.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
