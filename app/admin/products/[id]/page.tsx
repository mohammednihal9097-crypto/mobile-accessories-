import Link from "next/link";
import { notFound } from "next/navigation";
import Flash from "@/components/admin/Flash";
import ProductForm from "@/components/admin/ProductForm";
import StockBadge from "@/components/StockBadge";
import { requireAdmin } from "@/lib/supabase/auth";
import { adjustStock } from "../../actions";

const input = "rounded-xl border border-slate-300 px-3 py-2 text-sm";

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  // Not a valid uuid => Postgres rejects it; treat as not found.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: product }, { data: categories }, { data: phones }, { data: compat }, { data: photos }, { data: moves }] =
    await Promise.all([
      supabase.from("products").select("id, name, slug, description, category_id, price_minor, stock_quantity, is_active").eq("id", id).maybeSingle(),
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("phone_models").select("id, brand, name").order("brand").order("name"),
      supabase.from("product_compatibility").select("phone_model_id").eq("product_id", id),
      supabase.from("product_photos").select("id, storage_path, alt").eq("product_id", id).order("sort_order"),
      supabase.from("stock_movements").select("id, delta, reason, created_at").eq("product_id", id).order("created_at", { ascending: false }).limit(10),
    ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <p className="text-sm"><Link href="/admin/products" className="text-slate-500 hover:underline">← Products</Link></p>
      <h1 className="text-2xl font-semibold">{product.name}</h1>
      <Flash searchParams={searchParams} />

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Stock</h2>
        <p className="text-sm">In stock: <strong>{product.stock_quantity}</strong> <StockBadge stock={product.stock_quantity} /></p>
        <form action={adjustStock} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="product_id" value={product.id} />
          <label className="text-sm">Add or remove
            <input name="delta" required inputMode="numeric" placeholder="e.g. 10 or -2" className={`${input} block w-32`} />
          </label>
          <label className="text-sm">Reason
            <select name="reason" className={`${input} block`}>
              <option value="restock">Restock</option>
              <option value="correction">Count correction</option>
              <option value="damaged">Damaged / lost</option>
            </select>
          </label>
          <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Apply</button>
        </form>
        <p className="text-xs text-slate-500">Stock changes are logged and can never go below zero. Orders subtract stock automatically.</p>
        {(moves ?? []).length > 0 && (
          <ul className="text-xs text-slate-600">
            {moves!.map((m) => (
              <li key={m.id}>{new Date(m.created_at).toLocaleString()} — {m.delta > 0 ? "+" : ""}{m.delta} ({m.reason})</li>
            ))}
          </ul>
        )}
      </section>

      <ProductForm
        categories={categories ?? []}
        phones={phones ?? []}
        product={product}
        selectedPhoneIds={(compat ?? []).map((c) => c.phone_model_id)}
        photos={photos ?? []}
      />
    </div>
  );
}
