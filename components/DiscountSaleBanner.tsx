"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Check, Copy, RefreshCw, Tag, Zap } from "lucide-react";
import { formatMoney } from "@/lib/config";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";

interface Props {
  products: Product[];
  code?: string;
}

export default function DiscountSaleBanner({ products, code = "SALE10" }: Props) {
  const [randomGadgets, setRandomGadgets] = useState<Product[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Pick 3 random gadgets safely on client to avoid hydration mismatch
  const pickRandom = () => {
    if (!products || products.length === 0) return;
    setIsSpinning(true);
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    setRandomGadgets(shuffled.slice(0, Math.min(3, shuffled.length)));
    setTimeout(() => setIsSpinning(false), 400);
  };

  useEffect(() => {
    pickRandom();
  }, [products]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-slate-950 via-brand-950 to-indigo-950 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
      {/* Decorative background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl animate-pulse-glow"
      />

      <div className="relative space-y-6">
        {/* Banner Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                LIMITED TIME SALE
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20">
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                FLAT 10% OFF
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Random Gadgets &bull; 10% Discount Special
            </h2>
            <p className="text-sm text-slate-300 sm:text-base">
              Handpicked gadget deals refreshed for you. Apply coupon code{" "}
              <strong className="font-mono text-amber-300">{code}</strong> at checkout to get an extra 10% off!
            </p>
          </div>

          {/* Action buttons: Copy Code + Shuffle */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={copyCode}
              className="btn-press inline-flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-rose-500/20 px-4 py-2.5 text-xs font-bold text-amber-200 backdrop-blur transition hover:bg-amber-500/30"
            >
              <Tag className="h-4 w-4 text-amber-300" />
              <span>Coupon: {code}</span>
              {copied ? (
                <span className="inline-flex items-center gap-1 text-green-300">
                  <Check className="h-3.5 w-3.5" /> Copied!
                </span>
              ) : (
                <Copy className="h-3.5 w-3.5 text-amber-300/80" />
              )}
            </button>

            {products.length > 3 && (
              <button
                type="button"
                onClick={pickRandom}
                title="Shuffle Random Gadgets"
                className="btn-press inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                <span>Shuffle Gadgets</span>
              </button>
            )}
          </div>
        </div>

        {/* Random Gadgets Showcase Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {randomGadgets.map((product) => {
            const originalPrice = product.price;
            const discountedPrice = Math.round(originalPrice * 0.9);

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/50 hover:bg-white/10 hover:shadow-xl hover:shadow-brand-900/40"
              >
                {/* 10% OFF Badge */}
                <span className="absolute right-3 top-3 z-10 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
                  10% OFF
                </span>

                {/* Product Image */}
                <div className="overflow-hidden rounded-xl bg-slate-900/60 aspect-square">
                  <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
                    <ProductImage product={product} />
                  </div>
                </div>

                {/* Product Info */}
                <div className="mt-3 flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {product.stock > 0 ? (
                        <span className="text-emerald-400">In Stock &bull; Ready to ship</span>
                      ) : (
                        <span className="text-rose-400">Low stock</span>
                      )}
                    </p>
                  </div>

                  {/* Pricing row with 10% discount calculation */}
                  <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-2.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-amber-300 sm:text-lg">
                        {formatMoney(discountedPrice)}
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        {formatMoney(originalPrice)}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-300 group-hover:text-white transition-colors">
                      Grab Deal <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer info strip inside banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Discount applies automatically when code <strong>{code}</strong> is used at checkout.</span>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 hover:underline"
          >
            Explore all gadgets &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
