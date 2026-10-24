"use client";

import { useState } from "react";
import { Edit2, X, Trash2, Check } from "lucide-react";
import { deletePhoneModel, updatePhoneModel } from "@/app/admin/actions";

interface PhoneModel {
  id: string;
  brand: string;
  name: string;
}

const inputClass = "w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm";

export default function PhoneModelItem({ model: m }: { model: PhoneModel }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="p-3 bg-slate-50 border-b border-slate-200">
        <form action={updatePhoneModel} className="space-y-3">
          <input type="hidden" name="id" value={m.id} />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Brand</label>
              <input name="brand" required defaultValue={m.brand} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Model Name</label>
              <input name="name" required defaultValue={m.name} className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              <Check className="h-3.5 w-3.5" /> Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50/60 transition">
      <span>
        <strong className="text-slate-800">{m.brand}</strong> &mdash; <span>{m.name}</span>
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 text-xs text-brand-700 font-medium hover:underline"
        >
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
        <form action={deletePhoneModel}>
          <input type="hidden" name="id" value={m.id} />
          <button
            type="submit"
            onClick={(e) => {
              if (!confirm(`Delete phone model "${m.brand} ${m.name}"? This removes it from compatibility lists.`)) {
                e.preventDefault();
              }
            }}
            className="inline-flex items-center gap-1 text-xs text-red-600 font-medium hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </form>
      </div>
    </li>
  );
}
