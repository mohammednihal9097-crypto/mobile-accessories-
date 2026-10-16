import { saveProduct } from "@/app/admin/actions";
import { photoPublicUrl } from "@/lib/supabase/env";

type Props = {
  categories: { id: string; name: string }[];
  phones: { id: string; brand: string; name: string }[];
  product?: {
    id: string; name: string; slug: string; description: string; category_id: string;
    price_minor: number; is_active: boolean;
  };
  selectedPhoneIds?: string[];
  photos?: { id: string; storage_path: string; alt: string }[];
};

const input = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm";

export default function ProductForm({ categories, phones, product, selectedPhoneIds = [], photos = [] }: Props) {
  const brands = [...new Set(phones.map((p) => p.brand))];
  return (
    <form action={saveProduct} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">Name
          <input name="name" required defaultValue={product?.name} className={input} />
        </label>
        <label className="block text-sm">Category
          <select name="category_id" required defaultValue={product?.category_id ?? ""} className={input}>
            <option value="" disabled>Choose…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">Price (main units, e.g. 499 or 499.50)
          <input name="price" required inputMode="decimal" defaultValue={product ? (product.price_minor / 100).toFixed(2) : ""} className={input} />
        </label>
        {!product && (
          <label className="block text-sm">Starting stock
            <input name="stock" inputMode="numeric" defaultValue="0" className={input} />
          </label>
        )}
        <label className="block text-sm">Web address (optional)
          <input name="slug" defaultValue={product?.slug} placeholder="made from the name if empty" className={input} />
        </label>
        <label className="block text-sm sm:col-span-2">Description
          <textarea name="description" rows={4} defaultValue={product?.description} className={input} />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} />
          Visible in the shop (untick to hide without deleting)
        </label>
      </div>

      <fieldset className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">Compatible phone models</legend>
        <p className="text-xs text-slate-500">Tick every phone this fits. Tick none if it fits all phones (like a charger). Add missing phones under Categories &amp; phones.</p>
        {brands.map((b) => (
          <div key={b}>
            <p className="text-sm font-medium">{b}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {phones.filter((p) => p.brand === b).map((p) => (
                <label key={p.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="phone_model_id" value={p.id} defaultChecked={selectedPhoneIds.includes(p.id)} />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        {phones.length === 0 && <p className="text-sm text-amber-700">No phone models yet.</p>}
      </fieldset>

      <fieldset className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">Photos</legend>
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {photos.map((ph) => (
              <label key={ph.id} className="space-y-1 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPublicUrl(ph.storage_path)} alt={ph.alt} className="h-24 w-24 rounded-xl object-cover" />
                <span className="flex items-center gap-1"><input type="checkbox" name="delete_photo" value={ph.id} /> Remove</span>
              </label>
            ))}
          </div>
        )}
        <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple className="text-sm" />
        <p className="text-xs text-slate-500">JPG, PNG or WebP, under 5MB each, up to 4 at a time. The first photo is the main one.</p>
      </fieldset>

      <button className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white">Save product</button>
    </form>
  );
}
