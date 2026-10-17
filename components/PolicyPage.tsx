import { TriangleAlert } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import { STORE } from "@/lib/config";

/** Shared layout for policy pages: readable column, headings, and a draft notice until reviewed. */
export default function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        <p className="text-sm text-slate-500">Last updated {STORE.legal.lastUpdated}</p>
      </header>

      {!STORE.legal.reviewed && (
        <div role="note" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p><strong>Draft.</strong> This page is a starting template and has not been checked by a lawyer yet. It is not legal advice.</p>
        </div>
      )}

      <article
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 leading-relaxed text-slate-700 sm:p-8
          [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2:first-child]:mt-0
          [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-brand-700 [&_a]:underline"
      >
        {children}
      </article>
    </div>
  );
}
