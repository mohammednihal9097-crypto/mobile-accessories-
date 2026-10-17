import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
            {it.href ? (
              <Link href={it.href} className="hover:text-brand-700">{it.label}</Link>
            ) : (
              <span aria-current="page" className="font-medium text-slate-700">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
