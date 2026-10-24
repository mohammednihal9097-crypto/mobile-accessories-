import Flash from "@/components/admin/Flash";
import { requireAdmin } from "@/lib/supabase/auth";
import { addCategory, addPhoneModel } from "../actions";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import CategoryItem from "@/components/admin/CategoryItem";
import PhoneModelItem from "@/components/admin/PhoneModelItem";

const input = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";

export default async function CataloguePage({ searchParams }: PageProps<"/admin/catalogue">) {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: phones }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, description, icon").order("name"),
    supabase.from("phone_models").select("id, brand, name").order("brand").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categories &amp; Phone Models</h1>
      <Flash searchParams={searchParams} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
          <span className="text-xs text-slate-500">{(categories ?? []).length} categories</span>
        </div>
        <ul className="divide-y rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {(categories ?? []).map((c) => (
            <CategoryItem key={c.id} category={c} />
          ))}
          {(categories ?? []).length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No categories yet.</li>}
        </ul>
        <form action={addCategory} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 shadow-sm">
          <input name="name" required placeholder="Name, e.g. Cases" className={input} />
          <select name="icon" defaultValue="" className={input} aria-label="Icon">
            <option value="">Icon: pick automatically</option>
            {Object.entries(CATEGORY_ICONS).map(([key, { label }]) => (
              <option key={key} value={key}>
                Icon: {label}
              </option>
            ))}
          </select>
          <input name="description" placeholder="Short description" className={input} />
          <button className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Add category
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Phone Models</h2>
          <span className="text-xs text-slate-500">{(phones ?? []).length} phone models</span>
        </div>
        <ul className="divide-y rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {(phones ?? []).map((m) => (
            <PhoneModelItem key={m.id} model={m} />
          ))}
          {(phones ?? []).length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No phone models yet.</li>}
        </ul>
        <form action={addPhoneModel} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3 shadow-sm">
          <input name="brand" required placeholder="Brand, e.g. Apple" className={input} />
          <input name="name" required placeholder="Model name, e.g. iPhone 15 Pro" className={input} />
          <button className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Add phone model
          </button>
        </form>
        <p className="text-xs text-slate-500">
          Type model names exactly as customers know them. Deleting a model removes it from every product&apos;s compatibility list.
        </p>
      </section>
    </div>
  );
}
