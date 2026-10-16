"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSecretClient } from "@/lib/supabase/admin";

// Every action here starts with requireAdmin(): a logged-in non-admin can never get past it,
// even if they call the action directly instead of using the page.

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_SAVE = 4;
const ORDER_STATUSES = ["pending_payment", "paid", "processing", "shipped", "delivered", "cancelled"];

function fail(path: string, message: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
}

function text(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
}

/** "499.50" -> 49950 (smallest currency unit). Returns null if not a valid non-negative amount. */
function toMinor(input: string): number | null {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(input)) return null;
  return Math.round(parseFloat(input) * 100);
}

function toInt(input: string): number | null {
  return /^-?\d{1,9}$/.test(input) ? parseInt(input, 10) : null;
}

function refresh(...paths: string[]) {
  updateTag("catalog"); // storefront shows the change straight away
  paths.forEach((p) => revalidatePath(p));
}

// ---------------------------------------------------------------- products

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = text(formData, "id");
  const back = id ? `/admin/products/${id}` : "/admin/products/new";

  const name = text(formData, "name");
  const description = text(formData, "description");
  const categoryId = text(formData, "category_id");
  const price = toMinor(text(formData, "price"));
  const slug = slugify(text(formData, "slug") || name);
  const isActive = formData.get("is_active") === "on";
  const phoneIds = formData.getAll("phone_model_id").map(String);

  if (!name) fail(back, "Name is required.");
  if (!slug) fail(back, "Could not make a web address from the name.");
  if (!categoryId) fail(back, "Choose a category.");
  if (price === null) fail(back, "Price must be a number like 499 or 499.50.");

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS_PER_SAVE) fail(back, `Upload at most ${MAX_PHOTOS_PER_SAVE} photos at a time.`);
  for (const f of files) {
    if (!PHOTO_TYPES[f.type]) fail(back, "Photos must be JPG, PNG or WebP.");
    if (f.size > MAX_PHOTO_BYTES) fail(back, "Each photo must be under 5MB.");
  }

  let productId = id;
  if (id) {
    const { error } = await supabase
      .from("products")
      .update({ name, slug, description, category_id: categoryId, price_minor: price, is_active: isActive })
      .eq("id", id);
    if (error) fail(back, error.message.includes("duplicate") ? "That web address is already used." : error.message);
  } else {
    const stock = toInt(text(formData, "stock") || "0");
    if (stock === null || stock < 0) fail(back, "Stock must be a whole number, 0 or more.");
    const { data, error } = await supabase
      .from("products")
      .insert({ name, slug, description, category_id: categoryId, price_minor: price, is_active: isActive, stock_quantity: stock })
      .select("id")
      .single();
    if (error || !data) fail(back, error?.message.includes("duplicate") ? "That web address is already used." : (error?.message ?? "Could not save."));
    productId = data.id;
    if (stock > 0) {
      await createSecretClient().from("stock_movements").insert({ product_id: productId, delta: stock, reason: "initial_stock" });
    }
  }

  // Compatibility: replace the list. No rows = "fits all phones".
  await supabase.from("product_compatibility").delete().eq("product_id", productId);
  if (phoneIds.length > 0) {
    const { error } = await supabase
      .from("product_compatibility")
      .insert(phoneIds.map((phone_model_id) => ({ product_id: productId, phone_model_id })));
    if (error) fail(`/admin/products/${productId}`, error.message);
  }

  // Remove photos that were ticked
  const removeIds = formData.getAll("delete_photo").map(String);
  if (removeIds.length > 0) {
    const { data: rows } = await supabase.from("product_photos").select("id, storage_path").eq("product_id", productId).in("id", removeIds);
    if (rows?.length) {
      await supabase.storage.from("product-images").remove(rows.map((r) => r.storage_path));
      await supabase.from("product_photos").delete().in("id", rows.map((r) => r.id));
    }
  }

  // Upload new photos
  if (files.length > 0) {
    const { count } = await supabase.from("product_photos").select("id", { count: "exact", head: true }).eq("product_id", productId);
    let order = count ?? 0;
    for (const f of files) {
      const path = `${productId}/${randomUUID()}.${PHOTO_TYPES[f.type]}`;
      const up = await supabase.storage.from("product-images").upload(path, f, { contentType: f.type });
      if (up.error) fail(`/admin/products/${productId}`, `Photo upload failed: ${up.error.message}`);
      await supabase.from("product_photos").insert({ product_id: productId, storage_path: path, alt: name, sort_order: order++ });
    }
  }

  refresh("/admin/products", `/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function adjustStock(formData: FormData) {
  await requireAdmin();
  const productId = text(formData, "product_id");
  const back = `/admin/products/${productId}`;
  const delta = toInt(text(formData, "delta"));
  const reason = text(formData, "reason") || "admin_adjustment";
  if (delta === null || delta === 0) fail(back, "Enter a whole number such as 10 or -2.");

  const { error } = await createSecretClient().rpc("adjust_stock", { p_product_id: productId, p_delta: delta, p_reason: reason });
  if (error) fail(back, error.message.includes("stock_quantity_check") ? "Stock can't go below zero." : error.message);
  refresh("/admin/products", back);
  redirect(`${back}?saved=1`);
}

// ---------------------------------------------------------------- categories & phone models

export async function addCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = text(formData, "name");
  const slug = slugify(text(formData, "slug") || name);
  if (!name || !slug) fail("/admin/catalogue", "Category name is required.");
  const { error } = await supabase.from("categories").insert({
    name, slug, description: text(formData, "description"), icon: text(formData, "icon") || null,
  });
  if (error) fail("/admin/catalogue", error.message.includes("duplicate") ? "That category already exists." : error.message);
  refresh("/admin/catalogue");
  redirect("/admin/catalogue?saved=1");
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", text(formData, "id"));
  if (error) fail("/admin/catalogue", "Can't delete a category that still has products.");
  refresh("/admin/catalogue");
  redirect("/admin/catalogue?saved=1");
}

export async function addPhoneModel(formData: FormData) {
  const { supabase } = await requireAdmin();
  const brand = text(formData, "brand");
  const name = text(formData, "name");
  if (!brand || !name) fail("/admin/catalogue", "Brand and model are both required.");
  const { error } = await supabase.from("phone_models").insert({ brand, name });
  if (error) fail("/admin/catalogue", error.message.includes("duplicate") ? "That phone model already exists." : error.message);
  refresh("/admin/catalogue");
  redirect("/admin/catalogue?saved=1");
}

export async function deletePhoneModel(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("phone_models").delete().eq("id", text(formData, "id"));
  if (error) fail("/admin/catalogue", error.message);
  refresh("/admin/catalogue");
  redirect("/admin/catalogue?saved=1");
}

// ---------------------------------------------------------------- orders

export async function setOrderStatus(formData: FormData) {
  const { userId } = await requireAdmin();
  const orderId = text(formData, "order_id");
  const status = text(formData, "status");
  const back = `/admin/orders/${orderId}`;
  if (!ORDER_STATUSES.includes(status)) fail(back, "Unknown status.");

  // The database function enforces the allowed steps and ignores repeats.
  const { data, error } = await createSecretClient().rpc("set_order_status", {
    p_order_id: orderId,
    p_new: status,
    p_actor: `admin:${userId}`,
    p_note: text(formData, "note") || null,
  });
  if (error) {
    fail(back, error.message.includes("invalid_transition") ? "That status change isn't allowed from the current status." : error.message);
  }
  if (status === "cancelled") updateTag("catalog"); // stock was returned
  revalidatePath("/admin/orders");
  revalidatePath(back);
  redirect(`${back}?${data ? "saved=1" : "nochange=1"}`);
}

// ---------------------------------------------------------------- WhatsApp hand-overs

export async function resolveHandoff(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("handoff_requests").update({ status: "resolved" }).eq("id", text(formData, "id"));
  if (error) fail("/admin/handoffs", error.message);
  revalidatePath("/admin/handoffs");
  redirect("/admin/handoffs?saved=1");
}