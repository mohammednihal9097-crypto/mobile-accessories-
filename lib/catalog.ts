import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { isSupabaseConfigured, photoPublicUrl } from "./supabase/env";
import * as sample from "./sample-data";
import type { Category, PhoneModel, Product } from "./types";

export type Catalog = {
  categories: Category[];
  phoneModels: PhoneModel[];
  products: Product[];
  /** True when showing made-up sample data (Supabase not configured yet). */
  isSample: boolean;
};

type ProductRow = {
  id: string; slug: string; name: string; description: string; price_minor: number;
  stock_quantity: number; category_id: string;
  product_photos: { storage_path: string; alt: string; sort_order: number }[];
  product_compatibility: { phone_model_id: string }[];
};

const TINTS = ["#dbeafe", "#e2e8f0", "#fef3c7", "#fee2e2", "#ede9fe", "#dcfce7", "#ffedd5"];

/**
 * One cached read of the whole public catalogue (a small shop fits comfortably).
 * Cache tag "catalog": admin actions refresh it immediately; otherwise it refreshes every minute or so.
 * If Supabase IS configured but the read fails, we throw. We never silently show sample products
 * to real customers.
 */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");

  if (!isSupabaseConfigured()) {
    return {
      categories: sample.categories,
      phoneModels: sample.phoneModels,
      products: sample.products,
      isSample: true,
    };
  }

  const db = createPublicClient();
  const [cats, phones, prods] = await Promise.all([
    db.from("categories").select("id, slug, name, description, icon").order("name"),
    db.from("phone_models").select("id, brand, name").order("brand").order("name"),
    db
      .from("products")
      .select(
        "id, slug, name, description, price_minor, stock_quantity, category_id, " +
          "product_photos(storage_path, alt, sort_order), product_compatibility(phone_model_id)",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);
  for (const r of [cats, phones, prods]) if (r.error) throw new Error(`Catalogue read failed: ${r.error.message}`);

  const categoryById = new Map((cats.data ?? []).map((c) => [c.id as string, c]));

  const products: Product[] = ((prods.data ?? []) as unknown as ProductRow[]).flatMap((p, i) => {
    const category = categoryById.get(p.category_id);
    if (!category) return [];
    return [
      {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        categorySlug: category.slug,
        price: p.price_minor,
        stock: p.stock_quantity,
        compatibleModelIds: p.product_compatibility.map((c) => c.phone_model_id),
        photos: [...p.product_photos]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((ph) => ({ url: photoPublicUrl(ph.storage_path), alt: ph.alt || p.name })),
        imageTint: TINTS[i % TINTS.length],
      },
    ];
  });

  return {
    categories: (cats.data ?? []).map((c) => ({
      slug: c.slug, name: c.name, description: c.description, icon: c.icon ?? "📦",
    })),
    phoneModels: phones.data ?? [],
    products,
    isSample: false,
  };
}
