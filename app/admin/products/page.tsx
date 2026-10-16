import Link from "next/link";
import Flash from "@/components/admin/Flash";
import StockBadge from "@/components/StockBadge";
import { formatMoney } from "@/lib/config";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  const { supabase } = await requireAdmin();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_minor, stock_quantity, is_active, categories(name)")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Add product</Link>
      </div>
      <Flash searchParams={searchParams} />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="p-3">Name</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Visible</th></tr>
          </thead>
          <tbody className="divide-y">
            {(products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="p-3"><Link href={`/admin/products/${p.id}`} className="font-medium text-brand-600 hover:underline">{p.name}</Link></td>
                <td className="p-3">{(p.categories as unknown as { name: string } | null)?.name ?? "—"}</td>
                <td className="p-3">{formatMoney(p.price_minor)}</td>
                <td className="p-3"><span className="mr-2">{p.stock_quantity}</span><StockBadge stock={p.stock_quantity} /></td>
                <td className="p-3">{p.is_active ? "Yes" : "Hidden"}</td>
              </tr>
            ))}
            {(products ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No products yet. Add your first one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
