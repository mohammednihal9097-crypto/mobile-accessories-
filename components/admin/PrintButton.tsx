"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ label = "Print Packing Slip / Invoice" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-press inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 print:hidden"
    >
      <Printer className="h-4 w-4 text-slate-500" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
