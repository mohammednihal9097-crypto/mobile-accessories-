import "server-only";
import { formatMoney, STORE } from "../config";
import { signWaLink } from "../order-token";
import { ORDER_STATUS_LABEL } from "../order-status";
import { createSecretClient } from "../supabase/admin";
import type { BotCatalog, BotDeps, BotOrder } from "./router";

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Fresh (uncached) read, so the bot never quotes stale stock. */
export async function loadBotCatalog(): Promise<BotCatalog> {
  const db = createSecretClient();
  const [cats, phones, prods] = await Promise.all([
    db.from("categories").select("slug, name").order("name"),
    db.from("phone_models").select("id, brand, name"),
    db
      .from("products")
      .select("id, slug, name, price_minor, stock_quantity, categories(slug), product_compatibility(phone_model_id)")
      .eq("is_active", true),
  ]);
  for (const r of [cats, phones, prods]) if (r.error) throw new Error(r.error.message);

  type Row = {
    id: string; slug: string; name: string; price_minor: number; stock_quantity: number;
    categories: { slug: string } | null; product_compatibility: { phone_model_id: string }[];
  };
  return {
    categories: cats.data ?? [],
    phones: phones.data ?? [],
    products: ((prods.data ?? []) as unknown as Row[]).flatMap((p) =>
      p.categories
        ? [{
            id: p.id, slug: p.slug, name: p.name, categorySlug: p.categories.slug,
            price: p.price_minor, stock: p.stock_quantity,
            compatibleModelIds: p.product_compatibility.map((c) => c.phone_model_id),
          }]
        : [],
    ),
  };
}

/** Only ever returns orders placed with exactly this WhatsApp number. */
async function findOrders(whatsapp: string, orderNumber?: string): Promise<BotOrder[]> {
  const db = createSecretClient();
  let q = db
    .from("orders")
    .select("order_number, status, total_minor, order_items(product_name, quantity)")
    .eq("whatsapp_number", whatsapp)
    .order("created_at", { ascending: false })
    .limit(3);
  if (orderNumber) q = q.eq("order_number", orderNumber);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  type Row = { order_number: string; status: string; total_minor: number; order_items: { product_name: string; quantity: number }[] };
  return ((data ?? []) as unknown as Row[]).map((o) => ({
    orderNumber: o.order_number,
    status: o.status,
    totalMinor: o.total_minor,
    items: o.order_items.map((i) => ({ name: i.product_name, quantity: i.quantity })),
  }));
}

export async function buildBotDeps(): Promise<BotDeps> {
  return {
    catalog: await loadBotCatalog(),
    storeName: STORE.name,
    siteUrl: siteUrl(),
    formatMoney,
    statusLabel: ORDER_STATUS_LABEL,
    findOrders,
    makeCheckoutLink: (whatsapp) => {
      const { wa, exp, sig } = signWaLink(whatsapp, 24 * 3600);
      return `${siteUrl()}/start?${new URLSearchParams({ wa, exp: String(exp), sig })}`;
    },
  };
}
