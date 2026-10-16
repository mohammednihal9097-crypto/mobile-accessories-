import Link from "next/link";
import { formatMoney } from "@/lib/config";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const { status } = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("orders")
    .select("id, order_number, status, customer_name, whatsapp_number, total_minor, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (typeof status === "string" && status in ORDER_STATUS_LABEL) query = query.eq("status", status);
  const { data: orders } = await query;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders" className="rounded-full border bg-white px-3 py-1">All</Link>
        {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => (
          <Link key={k} href={`/admin/orders?status=${k}`} className="rounded-full border bg-white px-3 py-1">{v}</Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Placed</th></tr>
          </thead>
          <tbody className="divide-y">
            {(orders ?? []).map((o) => (
              <tr key={o.id}>
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-blue-700 hover:underline">{o.order_number}</Link></td>
                <td className="p-3">{o.customer_name}<br /><span className="text-xs text-slate-500">{o.whatsapp_number}</span></td>
                <td className="p-3">{formatMoney(o.total_minor)}</td>
                <td className="p-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLOR[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span></td>
                <td className="p-3 text-slate-500">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(orders ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No orders here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
