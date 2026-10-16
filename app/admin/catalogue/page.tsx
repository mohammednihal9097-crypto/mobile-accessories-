import Flash from "@/components/admin/Flash";
import { requireAdmin } from "@/lib/supabase/auth";
import { addCategory, addPhoneModel, deleteCategory, deletePhoneModel } from "../actions";

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default async function CataloguePage({ searchParams }: PageProps<"/admin/catalogue">) {
  const { supabase } = await requireAdmin();
  const [{ data: categories }, { data: phones }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon").order("name"),
    supabase.from("phone_models").select("id, brand, name").order("brand").order("name"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Categories &amp; phone models</h1>
      <Flash searchParams={searchParams} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categories</h2>
        <ul className="divide-y rounded-xl border border-slate-200 bg-white">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>{c.icon} {c.name} <span className="text-slate-400">/{c.slug}</span></span>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-red-700 hover:underline">Delete</button>
              </form>
            </li>
          ))}
          {(categories ?? []).length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No categories yet.</li>}
        </ul>
        <form action={addCategory} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
          <input name="name" required placeholder="Name, e.g. Cases" className={input} />
          <input name="icon" placeholder="Emoji (optional)" className={input} />
          <input name="description" placeholder="Short description" className={input} />
          <button className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Add category</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Phone models</h2>
        <ul className="divide-y rounded-xl border border-slate-200 bg-white">
          {(phones ?? []).map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>{m.brand} — {m.name}</span>
              <form action={deletePhoneModel}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-red-700 hover:underline">Delete</button>
              </form>
            </li>
          ))}
          {(phones ?? []).length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No phone models yet.</li>}
        </ul>
        <form action={addPhoneModel} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <input name="brand" required placeholder="Brand" className={input} />
          <input name="name" required placeholder="Model name" className={input} />
          <button className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Add phone model</button>
        </form>
        <p className="text-xs text-slate-500">Type model names exactly as customers know them. Deleting a model removes it from every product&apos;s compatibility list.</p>
      </section>
    </div>
  );
}
