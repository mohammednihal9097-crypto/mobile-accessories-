// Turns a stored notification into the ordered list of values for a WhatsApp template's {{1}}, {{2}}, ...
// Pure (no imports) so it is easy to test. The template TEXT lives in Meta (see docs/stage6-whatsapp-n8n.md);
// the order of values here must match the numbering in each approved template.

export const TEMPLATE_LANGUAGE = "en";

export type NotificationParams = {
  customer_name?: string;
  customer_whatsapp?: string;
  order_number?: string;
  items?: string;
  total_minor?: number;
  currency?: string;
  address?: string;
  payment_ref?: string | null;
  courier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

export type BuildContext = {
  formatMoney: (minor: number) => string;
  /** The customer's private order page link, or null if it can't be built. */
  orderLink: string | null;
};

/** WhatsApp rejects variable values with empty text, line breaks, tabs or long runs of spaces. */
export function clean(value: string | null | undefined, fallback = "-"): string {
  const s = String(value ?? "")
    .replace(/[\r\n\t]+/g, " | ")
    .replace(/ {2,}/g, " ")
    .trim()
    .slice(0, 900);
  return s || fallback;
}

export const KNOWN_TEMPLATES = [
  "order_received", "payment_received", "order_processing", "order_shipped", "order_delivered", "order_cancelled",
  "admin_new_order", "admin_order_paid", "admin_order_cancelled",
] as const;
export type TemplateName = (typeof KNOWN_TEMPLATES)[number];

export function isKnownTemplate(name: string): name is TemplateName {
  return (KNOWN_TEMPLATES as readonly string[]).includes(name);
}

export function buildBodyParams(template: TemplateName, p: NotificationParams, ctx: BuildContext): string[] {
  const name = clean(p.customer_name, "Customer");
  const order = clean(p.order_number);
  const items = clean(p.items);
  const total = clean(typeof p.total_minor === "number" ? ctx.formatMoney(p.total_minor) : "");
  const address = clean(p.address);
  const link = clean(ctx.orderLink, "your order page");

  switch (template) {
    // ---- customer
    case "order_received":    return [name, order, items, total, address, link];
    case "payment_received":  return [name, order, items, total, clean(p.payment_ref, "confirmed by the store"), link];
    case "order_processing":  return [name, order];
    case "order_shipped":     return [name, order, clean(p.courier, "our courier partner"), clean(p.tracking_number, "not provided"), clean(p.tracking_url, link)];
    case "order_delivered":   return [name, order];
    case "order_cancelled":   return [name, order];
    // ---- admin
    case "admin_new_order":       return [order, name, clean(p.customer_whatsapp), items, total, address];
    case "admin_order_paid":      return [order, total, name, items, address];
    case "admin_order_cancelled": return [order, name];
  }
}
