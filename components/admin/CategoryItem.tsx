"use client";

import { useState } from "react";
import { Edit2, X, Trash2, Check } from "lucide-react";
import { CATEGORY_ICONS, CategoryIcon } from "@/lib/category-icons";
import { deleteCategory, updateCategory } from "@/app/admin/actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
}

const inputClass = "w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm";

export default function CategoryItem({ category: c }: { category: Category }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="p-3 bg-slate-50 border-b border-slate-200">
        <form action={updateCategory} className="space-y-3">
          <input type="hidden" name="id" value={c.id} />
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input name="name" required defaultValue={c.name} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Slug</label>
              <input name="slug" defaultValue={c.slug} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Icon</label>
              <select name="icon" defaultValue={c.icon ?? ""} className={inputClass}>
                <option value="">Auto</option>
                {Object.entries(CATEGORY_ICONS).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input name="description" defaultValue={c.description ?? ""} placeholder="Short description" className={inputClass} />
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
      <span className="flex items-center gap-2">
        <CategoryIcon category={c} className="h-4 w-4 text-brand-600" />
        <strong className="text-slate-800">{c.name}</strong>
        <span className="text-xs text-slate-400">/{c.slug}</span>
        {c.description && <span className="text-xs text-slate-500 italic hidden sm:inline">&mdash; {c.description}</span>}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 text-xs text-brand-700 font-medium hover:underline"
        >
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </button>
        <form action={deleteCategory}>
          <input type="hidden" name="id" value={c.id} />
          <button
            type="submit"
            onClick={(e) => {
              if (!confirm(`Delete category "${c.name}"?`)) e.preventDefault();
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
