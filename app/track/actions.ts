"use server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSecretClient } from "@/lib/supabase/admin";

export type TrackedOrder = {
  orderNumber: string;
  status: string;
  placedAt: string;
  items: { name: string; quantity: number }[];
  courier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  history: { status: string; at: string }[];
};
export type TrackState = { error?: string; order?: TrackedOrder } | null;

const NOT_FOUND = "We couldn't find an order with those details. Check the order number and the WhatsApp number you used at checkout.";

/**
 * Lets a customer check an order with its order number AND the WhatsApp number it was placed with.
 * It never returns the delivery address, and a wrong number gets the same answer as a wrong order,
 * so it can't be used to find out which orders or numbers exist.
 */
export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  if (!isSupabaseConfigured()) return { error: "Order tracking is not available right now." };
  if (String(formData.get("website") ?? "").trim()) return { error: NOT_FOUND }; // honeypot

  const rawOrder = String(formData.get("order_number") ?? "").trim().toUpperCase().replace(/\s+/g, "");
  const m = /^(?:ORD-?)?(\d{3,12})$/.exec(rawOrder);
  const digits = String(formData.get("whatsapp") ?? "").replace(/[^\d]/g, "");
  if (!m || !/^[1-9]\d{7,14}$/.test(digits)) {
    return { error: "Enter your order number (like ORD-1001) and your WhatsApp number with country code." };
  }
  const orderNumber = `ORD-${m[1]}`;
  const whatsapp = `+${digits}`;

  const db = createSecretClient();
  const { data: order } = await db
    .from("orders")
    .select("id, order_number, status, created_at, courier_name, tracking_number, tracking_url")
    .eq("order_number", orderNumber)
    .eq("whatsapp_number", whatsapp)
    .maybeSingle();

  if (!order) {
    await new Promise((r) => setTimeout(r, 500)); // slows down guessing
    return { error: NOT_FOUND };
  }

  const [{ data: items }, { data: events }] = await Promise.all([
    db.from("order_items").select("product_name, quantity").eq("order_id", order.id),
    db.from("order_events").select("to_status, created_at").eq("order_id", order.id).order("created_at"),
  ]);

  const shipped = order.status === "shipped" || order.status === "delivered";
  return {
    order: {
      orderNumber: order.order_number,
      status: order.status,
      placedAt: order.created_at,
      items: (items ?? []).map((i) => ({ name: i.product_name, quantity: i.quantity })),
      courier: shipped ? order.courier_name : null,
      trackingNumber: shipped ? order.tracking_number : null,
      trackingUrl: shipped ? order.tracking_url : null,
      history: (events ?? []).map((e) => ({ status: e.to_status, at: e.created_at })),
    },
  };
}
