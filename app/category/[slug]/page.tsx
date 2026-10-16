import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import ProductGrid from "@/components/ProductGrid";

export default function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}

async function CategoryContent({ params }: { params: PageProps<"/category/[slug]">["params"] }) {
  const { slug } = await params;
  const { categories, products } = await getCatalog();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const items = products.filter((p) => p.categorySlug === slug);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        <Link href="/" className="hover:underline">Home</Link> / {category.name}
      </p>
      <h1 className="text-2xl font-semibold">{category.name}</h1>
      <p className="text-slate-600">{category.description}</p>
      <ProductGrid products={items} />
    </div>
  );
}