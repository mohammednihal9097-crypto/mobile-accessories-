import { STORE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">{STORE.name}</p>
        <p>{STORE.tagline}</p>
        <p className="mt-2 text-xs">{STORE.shipping.areaNote}</p>
      </div>
    </footer>
  );
}
