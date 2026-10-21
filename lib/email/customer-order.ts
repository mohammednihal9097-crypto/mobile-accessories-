// Subject and plain-text body of the customer order emails (order details, payment receipt, delivery updates).
// Pure so it is easy to test.
import type { NotificationParams, TemplateName } from "../notifications/templates.ts";
import type { AdminEmail } from "./admin-order.ts";

type Ctx = { formatMoney: (minor: number) => string; orderLink: string | null; storeName: string; supportEmail: string };

export function renderCustomerEmail(template: TemplateName, p: NotificationParams, ctx: Ctx): AdminEmail | null {
  const name = p.customer_name?.trim() || "there";
  const order = p.order_number || "your order";
  const total = typeof p.total_minor === "number" ? ctx.formatMoney(p.total_minor) : "-";
  const items = (p.items ?? "").split(", ").filter(Boolean).map((i) => `  - ${i}`).join("\n") || "  -";
  const track = ctx.orderLink ? `\nView your order any time: ${ctx.orderLink}` : "";
  const sign = `\nThank you for shopping with ${ctx.storeName}.\nQuestions? Write to ${ctx.supportEmail}.`;
  const summary = [`Order: ${order}`, "Items:", items, `Total: ${total}`, `Delivery address: ${p.address?.trim() || "-"}`].join("\n");

  switch (template) {
    case "order_received":
      return {
        subject: `We received your order ${order}`,
        text: [`Hi ${name},`, "", "Thanks for your order. We have it, and it will be processed once payment is confirmed.", "", summary, track, sign].join("\n"),
      };
    case "payment_received":
      return {
        subject: `Payment receipt for order ${order}`,
        text: [
          `Hi ${name},`, "", "We received your payment. This email is your receipt.", "", summary,
          `Amount paid: ${total}`, `Payment reference: ${p.payment_ref?.trim() || "confirmed by the store"}`, track, sign,
        ].join("\n"),
      };
    case "order_processing":
      return { subject: `Your order ${order} is being packed`, text: [`Hi ${name},`, "", `We are packing order ${order} now.`, track, sign].join("\n") };
    case "order_shipped":
      return {
        subject: `Your order ${order} has shipped`,
        text: [
          `Hi ${name},`, "", `Order ${order} is on its way.`,
          `Courier: ${p.courier?.trim() || "our courier partner"}`, `Tracking number: ${p.tracking_number?.trim() || "not provided"}`,
          ...(p.tracking_url ? [`Track it here: ${p.tracking_url}`] : []), track, sign,
        ].join("\n"),
      };
    case "order_delivered":
      return { subject: `Your order ${order} was delivered`, text: [`Hi ${name},`, "", `Order ${order} has been delivered. We hope you enjoy it.`, track, sign].join("\n") };
    case "order_cancelled":
      return { subject: `Your order ${order} was cancelled`, text: [`Hi ${name},`, "", `Order ${order} has been cancelled.`, "If you already paid, we will contact you about your refund.", sign].join("\n") };
    default:
      return null; // admin templates are rendered elsewhere
  }
}
