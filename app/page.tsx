import Link from "next/link";
import { STORE } from "@/lib/config";
import { getCatalog } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export default async function Home() {
  const { categories, products } = await getCatalog();
  return (
    <div className="space-y-10">
<section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-6 py-12 text-white sm:px-10 lg:px-14 lg:py-16">
        <span className="inline-block rounded-full bg-brand-500/30 px-3 py-1 text-xs font-semibold text-brand-100">Phone accessories, made easy</span>
        <h1 className="mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{STORE.tagline}</h1>
        <p className="mt-3 max-w-md text-brand-100">
          Check compatibility with your phone model before you buy. Order updates arrive on WhatsApp.
        </p>
        <Link href="/products" className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-brand-50">
          Shop all products
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Shop by category</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-medium hover:border-brand-300 hover:shadow-md"
              >
                <span className="text-3xl">{c.icon}</span>
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Featured</h2>
        {products.length === 0 ? (
          <p className="text-sm text-slate-500">Products are coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 text-sm sm:grid-cols-3">
        {[
          ["Fit checked", "Every product lists the phone models it fits."],
          ["Clear stock", "You see what is in stock before you order."],
          ["WhatsApp updates", "Order and delivery updates on WhatsApp (coming later)."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold">{t}</p>
            <p className="text-slate-600">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}