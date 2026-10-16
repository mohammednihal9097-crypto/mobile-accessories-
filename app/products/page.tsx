import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import ProductGrid from "@/components/ProductGrid";

export const metadata = { title: "All products" };

export default async function ProductsPage() {
  const { categories, products } = await getCatalog();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All products</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-full border border-slate-300 bg-white px-3 py-1 hover:border-blue-700">
            {c.name}
          </Link>
        ))}
      </div>
      <ProductGrid products={products} />
    </div>
  );
}