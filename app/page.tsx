import Link from "next/link";
import { ArrowRight, BadgeCheck, MessageCircle, PackageCheck, ShieldCheck, Smartphone, Truck } from "lucide-react";
import { STORE } from "@/lib/config";
import { getCatalog } from "@/lib/catalog";
import { CategoryIcon } from "@/lib/category-icons";
import ProductCard from "@/components/ProductCard";

const FEATURES = [
  { Icon: BadgeCheck, title: "Fit checked", text: "Products list the phone models and devices they work with." },
  { Icon: PackageCheck, title: "Clear stock", text: "See what is in stock before you order. No surprises." },
  { Icon: MessageCircle, title: "WhatsApp updates", text: "Order and delivery updates on WhatsApp (coming soon)." },
];

export default async function Home() {
  const { categories, products } = await getCatalog();
  return (
    <div className="space-y-14 sm:space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-white/15">
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              Gadgets, made easy
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{STORE.tagline}</h1>
            <p className="mt-4 max-w-md text-base text-brand-100 sm:text-lg">
              Shop smart gadgets for every need. Check compatibility with your phone before you buy, and get order updates on WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-brand-50">
                Shop all products <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {categories[0] && (
                <Link href={`/category/${categories[0].slug}`} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/10">
                  Browse {categories[0].name}
                </Link>
              )}
            </div>
          </div>

          {/* Decorative preview of the fit check (illustration only, no product data) */}
          <div aria-hidden="true" className="hidden lg:block">
            <div className="ml-auto max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl shadow-brand-950/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Smartphone className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-semibold">Will it fit my phone?</p>
                  <p className="text-xs text-slate-500">Pick your model once, check everything</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500">Your phone model</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {["Audio & earbuds", "Chargers & power", "Smart wearables"].map((t) => (
                  <li key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <span>{t}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><BadgeCheck className="h-4 w-4" />Compatibility shown</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { Icon: ShieldCheck, t: "Fit listed on every product" },
          { Icon: Truck, t: STORE.shipping.areaNote },
          { Icon: MessageCircle, t: "Updates on WhatsApp" },
        ].map(({ Icon, t }) => (
          <div key={t} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 backdrop-blur">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" /></span>
            {t}
          </div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Shop by category</h2>
            <p className="mt-1 text-sm text-slate-500">Find the right gadget by what you need.</p>
          </div>
          <Link href="/products" className="hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {categories.map((c) => {
              return (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 sm:p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                    <CategoryIcon category={c} className="h-5 w-5" />
                  </span>
                  <span className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                    {c.name}
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Featured</h2>
            <p className="mt-1 text-sm text-slate-500">Popular picks from the store.</p>
          </div>
          <Link href="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Products are coming soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Why us */}
      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <p className="mt-4 font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
