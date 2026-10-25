"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X, Tag } from "lucide-react";

export default function AnnouncementBar({ code = "SALE10" }: { code?: string }) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="relative z-30 flex items-center justify-between bg-gradient-to-r from-purple-700 via-brand-600 to-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-sm sm:px-6">
      <div className="mx-auto flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase">
          <Sparkles className="h-3 w-3 text-amber-300" />
          10% Off Sale
        </span>
        <span>
          Use coupon code <span className="font-mono underline decoration-amber-300 decoration-2 font-bold">{code}</span> for 10% discount on all gadgets!
        </span>
        <Link
          href="/products"
          className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-brand-900 transition hover:bg-amber-300 hover:text-slate-900"
        >
          Shop Now &rarr;
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setClosed(true)}
        className="text-white/70 hover:text-white"
        aria-label="Close sale announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
