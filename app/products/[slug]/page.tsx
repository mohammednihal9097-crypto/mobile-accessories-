import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Mail, ShieldCheck, Truck } from "lucide-react";
import { formatMoney, STORE } from "@/lib/config";
import { getCatalog } from "@/lib/catalog";
import AddToCartButton from "@/components/AddToCartButton";
import Breadcrumbs from "@/components/Breadcrumbs";
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
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <div className="self-start md:sticky md:top-24">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <ProductGallery product={product} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            {category && <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{category.name}</p>}
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{product.name}</h1>
            <p className="text-3xl font-semibold text-slate-900">{formatMoney(product.price)}</p>
            <div className="flex flex-wrap items-center gap-2">
              <StockBadge stock={product.stock} />
              {product.stock > 5 && <span className="text-sm text-slate-500">{product.stock} available</span>}
            </div>
          </div>
          {product.description && <p className="leading-relaxed text-slate-700">{product.description}</p>}

          <CompatibilityPanel product={product} />

          <AddToCartButton productId={product.id} stock={product.stock} />

          <ul className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-3 sm:gap-3">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />{STORE.shipping.areaNote}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />Fit listed by model</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />Email updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
