import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { CategoryIcon } from "@/lib/category-icons";
import ProductGrid from "@/components/ProductGrid";

export const metadata = { title: "All products" };

export default async function ProductsPage() {
  const { categories, products } = await getCatalog();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">All products</h1>
        <p className="mt-1 text-slate-600">Choose your phone to see what fits.</p>
      </div>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {categories.map((c) => {
            return (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
              >
                <CategoryIcon category={c} className="h-4 w-4" />
                {c.name}
              </Link>
            );
          })}
        </div>
      )}
      <ProductGrid products={products} />
    </div>
  );
}
