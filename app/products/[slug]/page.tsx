import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/config";
import { getCatalog } from "@/lib/catalog";
import AddToCartButton from "@/components/AddToCartButton";
import CompatibilityPanel from "@/components/CompatibilityPanel";
import ProductGallery from "@/components/ProductGallery";
import StockBadge from "@/components/StockBadge";

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const { slug } = await params;
  const { categories, products } = await getCatalog();
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();
  const category = categories.find((c) => c.slug === product.categorySlug);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        <Link href="/" className="hover:underline">Home</Link> /{" "}
        {category && <Link href={`/category/${category.slug}`} className="hover:underline">{category.name}</Link>}
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <ProductGallery product={product} />
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-2xl font-semibold text-brand-600">{formatMoney(product.price)}</p>
          <div className="flex items-center gap-2">
            <StockBadge stock={product.stock} />
            {product.stock > 5 && <span className="text-sm text-slate-500">{product.stock} available</span>}
          </div>
          <p className="text-slate-700">{product.description}</p>

          <CompatibilityPanel product={product} />

          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>
    </div>
  );
}