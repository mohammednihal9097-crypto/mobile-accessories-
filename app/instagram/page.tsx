import Link from "next/link";
import { connection } from "next/server";
import {
  ShoppingBag,
  Truck,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import CopyCodeButton from "@/components/CopyCodeButton";
import { formatMoney, STORE } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata = {
  title: "Trio Store on Instagram | Shop Official Accessories",
  description: "Official Instagram hub for Trio Store India. Shop trending phone accessories, phone cases, chargers, and exclusive follower discounts.",
};
export const instant = false;

export default async function InstagramLandingPage() {
  await connection();
  const supabase = createPublicClient();

  const { data: rawProducts } = await supabase
    .from("products")
    .select("id, name, slug, price_minor, stock_quantity, product_photos(storage_path)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const products = rawProducts ?? [];
  const instagramUrl = STORE.social.instagramUrl || "https://www.instagram.com/triostore_india/";

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/70 via-slate-50 to-white pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-sm">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Welcome Instagram Fam! Enjoy Free Delivery over ₹{(STORE.shipping.freeOver / 100).toFixed(0)} Across India
        </span>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-6 space-y-6">
        {/* Profile Card */}
        <div className="rounded-3xl border border-white bg-white/80 p-6 text-center shadow-xl shadow-brand-900/5 backdrop-blur-md">
          {/* Avatar with Instagram Ring */}
          <div className="relative mx-auto mb-3 h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-white font-extrabold text-2xl tracking-wider">
              TRIO
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{STORE.name}</h1>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] text-white" title="Verified">
              ✓
            </span>
          </div>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
          >
            <InstagramIcon className="h-3.5 w-3.5" />
            @triostore_india
            <ExternalLink className="h-3 w-3" />
          </a>

          <p className="mt-2 text-xs text-slate-600">
            {STORE.tagline} &bull; Premium Phone Accessories &amp; Gadgets across India
          </p>

          {/* Follower Voucher */}
          <div className="mt-5">
            <CopyCodeButton code="INSTA10" />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Apply code at checkout for <strong>10% instant discount</strong> on any order!
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="btn-press flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 font-semibold text-white shadow-md transition hover:bg-slate-800"
          >
            <span className="flex items-center gap-3 text-sm">
              <ShoppingBag className="h-5 w-5 text-amber-400" />
              Shop All Products &amp; Best Sellers
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            href="/track"
            className="btn-press flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 font-semibold text-slate-800 shadow-sm transition hover:border-brand-300 hover:bg-slate-50"
          >
            <span className="flex items-center gap-3 text-sm">
              <PackageCheck className="h-5 w-5 text-brand-600" />
              Track My Existing Order
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>

          <a
            href={`https://wa.me/${STORE.legal.whatsappDigits}?text=Hi%20Trio%20Store%2C%20I%20found%20you%20on%20Instagram%20and%20have%20a%20question.`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press flex items-center justify-between rounded-2xl border border-green-200 bg-green-50/70 px-5 py-4 font-semibold text-green-900 shadow-sm transition hover:bg-green-100/70"
          >
            <span className="flex items-center gap-3 text-sm">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Chat on WhatsApp Support
            </span>
            <ArrowRight className="h-4 w-4 text-green-600" />
          </a>
        </div>

        {/* Trending on Instagram Showcase */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Zap className="h-4 w-4 text-amber-500" />
              Featured On Instagram
            </h2>
            <Link href="/" className="text-xs font-semibold text-brand-600 hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => {
              const photo = p.product_photos?.[0]?.storage_path;
              const photoUrl = photo
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${photo}`
                : null;

              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        {p.name}
                      </div>
                    )}
                    {p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                      <span className="absolute left-2 top-2 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2.5 line-clamp-1 text-xs font-semibold text-slate-900 group-hover:text-brand-600">
                    {p.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{formatMoney(p.price_minor)}</p>
                    <span className="text-[11px] font-semibold text-brand-600 group-hover:underline">
                      Buy &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {products.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              No products found. Explore our full catalog on the homepage!
            </div>
          )}
        </div>

        {/* Trust Strip */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-center text-[11px] text-slate-600 shadow-sm">
          <div className="flex flex-col items-center gap-1">
            <Truck className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-800">Free Delivery</span>
            <span className="text-[10px] text-slate-400">Orders &gt; ₹499</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-slate-100">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-800">Verified Quality</span>
            <span className="text-[10px] text-slate-400">100% Genuine</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-800">Fast Dispatch</span>
            <span className="text-[10px] text-slate-400">All India</span>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center text-xs text-slate-400 pt-4">
          <p>&copy; {new Date().getFullYear()} {STORE.name}. All rights reserved.</p>
          <div className="mt-1 space-x-3">
            <Link href="/shipping" className="hover:underline">Shipping</Link>
            <span>&bull;</span>
            <Link href="/returns" className="hover:underline">Returns</Link>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
