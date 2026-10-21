import "server-only";
import { siteUrl } from "@/lib/bot/data";
import { STORE } from "@/lib/config";
import { createSecretClient } from "@/lib/supabase/admin";
import type { EmailAttachment } from "./resend";
import { buildReceiptPdf } from "./receipt-pdf";

/**
 * Builds the PDF receipt for a paid order, read straight from the database so it is exact.
 * Returns null on any problem: the payment email must still go out, just without the attachment.
 */
export async function buildPaymentReceipt(orderId: string): Promise<EmailAttachment | null> {
  try {
    const db = createSecretClient();
    const [{ data: order }, { data: items }, { data: pay }] = await Promise.all([
      db.from("orders").select("order_number, customer_name, email, shipping_address, currency, subtotal_minor, shipping_minor, total_minor")
        .eq("id", orderId).single(),
      db.from("order_items").select("product_name, quantity, unit_price_minor").eq("order_id", orderId).order("product_name"),
      db.from("payments").select("provider_reference, created_at").eq("order_id", orderId).eq("verified", true)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!order || !items?.length) return null;
    const a = (order.shipping_address ?? {}) as { address?: string; city?: string; postal_code?: string };
    const bytes = await buildReceiptPdf({
      storeName: STORE.legal.businessName || STORE.name,
      storeAddress: STORE.legal.address,
      storeEmail: STORE.legal.email,
      storePhone: STORE.legal.phone,
      storeWebsite: siteUrl().replace(/^https?:\/\//, ""),
      gstin: STORE.legal.gstin || undefined,
      orderNumber: order.order_number,
      paidAt: new Date(pay?.created_at ?? Date.now()),
      customerName: order.customer_name,
      customerEmail: order.email ?? "",
      address: [a.address, a.city, a.postal_code].filter(Boolean).join(", "),
      items: items.map((i) => ({ name: i.product_name, quantity: i.quantity, unitMinor: i.unit_price_minor })),
      subtotalMinor: order.subtotal_minor,
      shippingMinor: order.shipping_minor,
      totalMinor: order.total_minor,
      currency: order.currency,
      paymentRef: pay?.provider_reference ?? "confirmed by the store",
    });
    return { filename: `Receipt-${order.order_number}.pdf`, content: bytes };
  } catch (e) {
    console.error("buildPaymentReceipt failed", e);
    return null;
  }
}
