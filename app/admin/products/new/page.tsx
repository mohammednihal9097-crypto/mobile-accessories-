import Link from "next/link";
import Flash from "@/components/admin/Flash";
import ProductForm from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function NewProduct({ searchParams }: PageProps<"/admin/products/new">) {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: phones }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("phone_models").select("id, brand, name").order("brand").order("name"),
  ]);

  return (
    <div className="space-y-4">
      <p className="text-sm"><Link href="/admin/products" className="text-slate-500 hover:underline">← Products</Link></p>
      <h1 className="text-2xl font-semibold">Add product</h1>
      <Flash searchParams={searchParams} />
      {(categories ?? []).length === 0 ? (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Add at least one category first under <Link href="/admin/catalogue" className="underline">Categories &amp; phones</Link>.
        </p>
      ) : (
        <ProductForm categories={categories ?? []} phones={phones ?? []} />
      )}
    </div>
  );
}
