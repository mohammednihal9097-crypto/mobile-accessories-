import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = async (status: string) =>
    (await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status)).count ?? 0;
  const [pending, paid, processing, shipped, lowStock] = await Promise.all([
    count("pending_payment"),
    count("paid"),
    count("processing"),
    count("shipped"),
    supabase.from("products").select("id", { count: "exact", head: true }).lte("stock_quantity", 5).eq("is_active", true),
  ]);

  const tiles = [
    ["Waiting for payment", pending, "/admin/orders?status=pending_payment"],
    ["Paid — to pack", paid, "/admin/orders?status=paid"],
    ["Processing", processing, "/admin/orders?status=processing"],
    ["Shipped", shipped, "/admin/orders?status=shipped"],
    ["Low or no stock (5 or fewer)", lowStock.count ?? 0, "/admin/products"],
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, n, href]) => (
          <Link key={label} href={href} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md">
            <p className="text-3xl font-bold text-blue-700">{n}</p>
            <p className="text-sm text-slate-600">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
