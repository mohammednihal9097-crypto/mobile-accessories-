// Subject and plain-text body of the admin order emails. Pure (no imports of server code) so it is easy to test.
import type { NotificationParams, TemplateName } from "../notifications/templates.ts";

export type AdminEmail = { subject: string; text: string };

const line = (label: string, value: string | null | undefined) => `${label}: ${value?.trim() || "-"}`;

export function renderAdminEmail(
  template: TemplateName,
  p: NotificationParams & { customer_email?: string | null },
  ctx: { formatMoney: (minor: number) => string; adminUrl: string | null },
): AdminEmail | null {
  const order = p.order_number || "order";
  const total = typeof p.total_minor === "number" ? ctx.formatMoney(p.total_minor) : "-";
  const items = (p.items ?? "")
    .split(", ")
    .filter(Boolean)
    .map((i) => `  - ${i}`)
    .join("\n") || "  -";

  const details = [
    line("Order", order),
    line("Customer", p.customer_name),
    line("WhatsApp", p.customer_whatsapp),
    line("Email", p.customer_email),
    "Items:",
    items,
    line("Total", total),
    line("Deliver to", p.address),
  ];
  const link = ctx.adminUrl ? ["", `Open in admin: ${ctx.adminUrl}`] : [];

  switch (template) {
    case "admin_new_order":
      return { subject: `New order ${order} - ${total}`, text: ["A new order was placed (waiting for payment).", "", ...details, ...link].join("\n") };
    case "admin_order_paid":
      return {
        subject: `Paid: order ${order} - ${total}`,
        text: ["Payment received. Please pack and ship this order.", "", ...details, line("Payment ref", p.payment_ref), ...link].join("\n"),
      };
    case "admin_order_cancelled":
      return { subject: `Cancelled: order ${order}`, text: ["This order was cancelled.", "", line("Order", order), line("Customer", p.customer_name), ...link].join("\n") };
    default:
      return null; // customer templates are not emailed
  }
}
