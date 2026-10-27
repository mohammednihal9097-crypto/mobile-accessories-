"use client";

import { useState } from "react";
import { MessageCircle, X, Sparkles } from "lucide-react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import { STORE } from "@/lib/config";

export default function FloatingInstagramWidget() {
  const [showTooltip, setShowTooltip] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const instagramHandle = "triostore_india";
  // ig.me opens Instagram DM directly in the native Instagram app on mobile and web on desktop
  const igDmUrl = `https://ig.me/m/${instagramHandle}`;
  const whatsappUrl = `https://wa.me/${STORE.legal.whatsappDigits}?text=Hi%20Trio%20Store%2C%20I%20have%20a%20question%20about%20your%20products.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">
      {/* Expanded Multi-Channel Contact Menu */}
      {showMenu && (
        <div className="animate-fade-in-up mb-2 flex w-64 flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl shadow-slate-900/15 backdrop-blur-lg">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              Need Help? Chat With Us
            </span>
            <button
              type="button"
              onClick={() => setShowMenu(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Primary Option: Instagram DM */}
          <a
            href={igDmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-600/10 p-2.5 transition hover:from-amber-500/20 hover:via-rose-500/20 hover:to-purple-600/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm">
              <InstagramIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                Instagram Direct
              </p>
              <p className="truncate text-[11px] text-slate-500">DM @{instagramHandle}</p>
            </div>
          </a>

          {/* Secondary Option: WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl bg-emerald-50/80 p-2.5 transition hover:bg-emerald-100/80"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                WhatsApp Support
              </p>
              <p className="truncate text-[11px] text-slate-500">Quick answers on WhatsApp</p>
            </div>
          </a>
        </div>
      )}

      {/* Floating Pill Tooltip */}
      {!showMenu && showTooltip && (
        <div className="animate-fade-in-up flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 py-1.5 pl-3 pr-2 text-xs font-semibold text-slate-800 shadow-lg shadow-slate-900/10 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <a
            href={igDmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-rose-600 transition-colors"
          >
            DM us on Instagram!
          </a>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="rounded-full p-0.5 text-slate-400 hover:text-slate-600"
            aria-label="Dismiss tooltip"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Main Floating Instagram Button */}
      <div className="relative group">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 opacity-70 blur-sm transition duration-300 group-hover:opacity-100 animate-pulse" />
        
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Contact us on Instagram"
          className="btn-press relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <InstagramIcon className="h-7 w-7 transition-transform duration-300 group-hover:rotate-6" />
          {/* Notification badge */}
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          </span>
        </button>
      </div>
    </div>
  );
}
