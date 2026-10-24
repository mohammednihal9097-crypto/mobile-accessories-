"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyCodeButton({ code = "INSTA10" }: { code?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="btn-press flex items-center justify-between w-full rounded-2xl border-2 border-dashed border-brand-400 bg-white/90 backdrop-blur px-4 py-3 shadow-sm transition hover:bg-brand-50/50"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-bold text-sm shadow">
          %
        </span>
        <div className="text-left">
          <p className="text-xs font-semibold text-brand-900">Instagram Follower Discount</p>
          <p className="font-mono text-base font-extrabold tracking-wider text-brand-700">{code}</p>
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" /> Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Tap to Copy
          </>
        )}
      </div>
    </button>
  );
}
