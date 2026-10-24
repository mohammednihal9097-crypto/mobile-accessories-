import Link from "next/link";
import { Search, X } from "lucide-react";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { requireAdmin } from "@/lib/supabase/auth";
import OrdersTable from "@/components/admin/OrdersTable";
import Flash from "@/components/admin/Flash";

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const { status, search } = await searchParams;
  const { supabase } = await requireAdmin();
  const q = typeof search === "string" ? search.trim() : "";

  let query = supabase
    .from("orders")
    .select("id, order_number, status, customer_name, whatsapp_number, total_minor, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (typeof status === "string" && status in ORDER_STATUS_LABEL) query = query.eq("status", status);
  if (q) query = query.or(`customer_name.ilike.%${q}%,order_number.ilike.%${q}%,whatsapp_number.ilike.%${q}%`);
  const { data: orders } = await query;

  const statusQs = typeof status === "string" && status in ORDER_STATUS_LABEL ? `status=${status}` : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Flash searchParams={searchParams} />
      </div>

      {/* Search bar */}
      <form method="GET" className="relative flex max-w-md items-center gap-2">
        {typeof status === "string" && status in ORDER_STATUS_LABEL && (
          <input type="hidden" name="status" value={status} />
        )}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            name="search"
            defaultValue={q}
            placeholder="Search name, phone or order #…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          {q && (
            <Link
              href={`/admin/orders${statusQs ? `?${statusQs}` : ""}`}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Link>
          )}
        </div>
        <button type="submit" className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href={q ? `/admin/orders?search=${encodeURIComponent(q)}` : "/admin/orders"}
          className={`rounded-full border px-3 py-1 transition ${!status ? "border-brand-400 bg-brand-50 text-brand-700 font-medium" : "bg-white hover:bg-slate-50"}`}
        >
          All
        </Link>
        {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
          <Link
            key={k}
            href={q ? `/admin/orders?search=${encodeURIComponent(q)}&status=${k}` : `/admin/orders?status=${k}`}
            className={`rounded-full border px-3 py-1 transition ${status === k ? "border-brand-400 bg-brand-50 text-brand-700 font-medium" : "bg-white hover:bg-slate-50"}`}
          >
            {v}
          </Link>
        ))}
      </div>

      {q && (
        <p className="text-sm text-slate-500">
          {orders?.length ?? 0} result{orders?.length !== 1 ? "s" : ""} for <strong>&ldquo;{q}&rdquo;</strong>
        </p>
      )}

      {/* Interactive Orders Table with Selection and Bulk Actions */}
      <OrdersTable
        orders={orders ?? []}
        emptyText={q ? "No orders match your search." : "No orders here yet."}
      />
    </div>
  );
}
