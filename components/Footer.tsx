"use client";

import Link from "next/link";
import { MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { STORE } from "@/lib/config";
import { useCatalog } from "./CatalogProvider";
import Logo from "./Logo";

const SUPPORT = [
  { href: "/track", label: "Track your order" },
  { href: "/shipping", label: "Shipping and delivery" },
  { href: "/returns", label: "Returns and refunds" },
  { href: "/contact", label: "Contact us" },
];
const LEGAL = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export default function Footer() {
  const { categories } = useCatalog();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-slate-600">{STORE.tagline}. Gadgets for every need, with compatibility you can check before you buy.</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />Fit listed for every product</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-600" aria-hidden="true" />{STORE.shipping.areaNote}</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-brand-600" aria-hidden="true" />Order updates on WhatsApp</li>
          </ul>
        </div>

        <nav aria-label="Shop">
          <p className="text-sm font-semibold text-slate-900">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/products" className="hover:text-brand-700">All products</Link></li>
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}`} className="hover:text-brand-700">{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Support">
          <p className="text-sm font-semibold text-slate-900">Support</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {SUPPORT.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-brand-700">{l.label}</Link></li>)}
          </ul>
        </nav>

        <nav aria-label="Legal">
          <p className="text-sm font-semibold text-slate-900">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {LEGAL.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-brand-700">{l.label}</Link></li>)}
          </ul>
        </nav>
        {(STORE.social.facebookUrl || STORE.social.instagramUrl) && (
          <nav aria-label="Social media">
            <p className="text-sm font-semibold text-slate-900">Follow us</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {[
                { label: "Facebook", url: STORE.social.facebookUrl },
                { label: "Instagram", url: STORE.social.instagramUrl },
              ].filter(({ url }) => {
                try {
                  return new URL(url).protocol === "https:";
                } catch {
                  return false;
                }
              }).map(({ label, url }) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
      <div className="border-t border-slate-200">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">© {STORE.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
