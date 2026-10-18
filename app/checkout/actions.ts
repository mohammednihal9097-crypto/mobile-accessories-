"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { flushNotifications } from "@/lib/notifications/flush";
import { updateTag } from "next/cache";
import { shippingFor, STORE } from "@/lib/config";
import { hashToken, tokenFor, verifyWaLink } from "@/lib/order-token";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSecretClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(message: string): never {
  redirect(`/checkout?error=${encodeURIComponent(message)}`);
}

function text(fd: FormData, key: string, max = 200): string {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

/**
 * Places an order. Nothing the browser sends is trusted for money:
 * prices come from the database, shipping is recalculated here, and stock is checked and
 * subtracted inside one database function (so two buyers can't both get the last item).
 */
export async function placeOrder(formData: FormData) {
  if (!isSupabaseConfigured()) fail("The shop is in demo mode, so orders can't be placed yet.");
  if (text(formData, "website")) redirect("/"); // hidden field: only bots fill it in

  // --- cart lines
  let lines: { productId: string; quantity: number }[] = [];
  try {
    lines = JSON.parse(text(formData, "cart", 5000));
  } catch {
    fail("Your cart could not be read. Please try again.");
  }
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 30) fail("Your cart is empty.");
  const merged = new Map<string, number>();
  for (const l of lines) {
    if (!l || typeof l.productId !== "string" || !UUID.test(l.productId)) fail("Your cart has an item we don't recognise.");
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 99) fail("Quantities must be between 1 and 99.");
    merged.set(l.productId, (merged.get(l.productId) ?? 0) + l.quantity);
  }

  // --- customer details
  const name = text(formData, "name", 120);
  const whatsappRaw = text(formData, "whatsapp", 30).replace(/[\s()-]/g, "");
  const email = text(formData, "email", 200);
  const address = text(formData, "address", 400);
  const city = text(formData, "city", 100);
  const postalCode = text(formData, "postal_code", 20);
  if (name.length < 2) fail("Please enter your name.");
  if (!/^\+[1-9]\d{7,14}$/.test(whatsappRaw)) fail("Enter your WhatsApp number with country code, like +91 98765 43210.");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail("That email address doesn't look right.");
  if (address.length < 5 || !city || !postalCode) fail("Please fill in your full delivery address.");

  // If the customer arrived through a signed WhatsApp link, the number must be the one in the link.
  const wa = text(formData, "wa"), exp = text(formData, "exp"), sig = text(formData, "sig");
  if (wa && !(verifyWaLink(wa, exp, sig) && wa === whatsappRaw)) fail("This WhatsApp link has expired. Ask for a new one in the chat.");

  const idempotencyKey = text(formData, "idempotency_key", 60);
  if (!UUID.test(idempotencyKey)) fail("Something went wrong. Please reload the page and try again.");

  // --- prices from the database, never from the browser
  const db = createSecretClient();
  const { data: products, error: pErr } = await db
    .from("products")
    .select("id, name, price_minor, is_active")
    .in("id", [...merged.keys()]);
  if (pErr) fail("We couldn't check prices. Please try again.");
  let subtotal = 0;
  for (const [id, qty] of merged) {
    const p = products?.find((x) => x.id === id);
    if (!p || !p.is_active) fail("An item in your cart is no longer sold. Please update your cart.");
    subtotal += p.price_minor * qty;
  }
  const shipping = shippingFor(subtotal);

  const token = tokenFor(idempotencyKey);
  const { data, error } = await db.rpc("create_order", {
    p_items: [...merged].map(([product_id, quantity]) => ({ product_id, quantity })),
    p_customer: { name, whatsapp: whatsappRaw, email, address: { address, city, postal_code: postalCode } },
    p_idempotency_key: idempotencyKey,
    p_token_hash: hashToken(token),
    p_currency: STORE.currency,
    p_shipping_minor: shipping,
  });

  if (error) {
    const m = /^(insufficient_stock|product_unavailable):([0-9a-f-]{36})/i.exec(error.message);
    if (m) {
      const name = products?.find((x) => x.id === m[2])?.name ?? "An item";
      fail(m[1] === "insufficient_stock" ? `Sorry, ${name} doesn't have enough stock left. Please lower the quantity.` : `${name} is no longer available.`);
    }
    console.error("create_order failed", error.message);
    fail("We couldn't place your order. Nothing was charged. Please try again.");
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.o_number) fail("We couldn't place your order. Please try again.");

  updateTag("catalog"); // stock numbers on the shop update straight away
  after(() => flushNotifications()); // customer receipt and admin alert go out now (does nothing until WhatsApp sending is set up)
  redirect(`/order/${row.o_number}?t=${token}&placed=1`);
}
