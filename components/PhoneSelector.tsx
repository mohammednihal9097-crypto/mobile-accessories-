"use client";

import { useCatalog } from "./CatalogProvider";
import { setMyPhone, useMyPhone } from "@/lib/phone";

export default function PhoneSelector({ className = "" }: { className?: string }) {
  const { phoneModels } = useCatalog();
  const phone = useMyPhone();
  const brands = [...new Set(phoneModels.map((m) => m.brand))];
  return (
    <label className={`block text-sm font-medium ${className}`}>
      My phone
      <select
        value={phone ?? ""}
        onChange={(e) => setMyPhone(e.target.value || null)}
        className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-normal"
      >
        <option value="">Choose your phone model…</option>
        {brands.map((b) => (
          <optgroup key={b} label={b}>
            {phoneModels.filter((m) => m.brand === b).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
