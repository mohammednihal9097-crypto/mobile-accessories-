import { test } from "node:test";
import assert from "node:assert/strict";
import { renderAdminEmail } from "./admin-order.ts";

const ctx = { formatMoney: (n: number) => `Rs ${n / 100}`, adminUrl: "https://shop.example/admin/orders/abc" };
const order = {
  customer_name: "Asha", customer_whatsapp: "+919876543210", customer_email: "asha@example.com",
  order_number: "ORD-1001", items: "Clear Case x2 @ INR 499.00 each = INR 998.00, Charger x1 @ INR 699.00 each = INR 699.00",
  total_minor: 159700, address: "12 MG Road, Pune, 411001", payment_ref: "pay_123",
};

test("new order email has the order number, total, each item on its own line and the admin link", () => {
  const m = renderAdminEmail("admin_new_order", order, ctx)!;
  assert.equal(m.subject, "New order ORD-1001 - Rs 1597");
  assert.match(m.text, /Customer: Asha/);
  assert.match(m.text, /  - Clear Case x2/);
  assert.match(m.text, /  - Charger x1/);
  assert.match(m.text, /Open in admin: https:\/\/shop\.example\/admin\/orders\/abc/);
});

test("paid email carries the payment reference", () => {
  const m = renderAdminEmail("admin_order_paid", order, ctx)!;
  assert.match(m.subject, /^Paid: order ORD-1001/);
  assert.match(m.text, /Payment ref: pay_123/);
});

test("cancelled email is short; missing details show a dash", () => {
  const m = renderAdminEmail("admin_order_cancelled", { order_number: "ORD-1" }, { ...ctx, adminUrl: null })!;
  assert.equal(m.subject, "Cancelled: order ORD-1");
  assert.match(m.text, /Customer: -/);
  assert.doesNotMatch(m.text, /Open in admin/);
});

test("customer templates are not emailed", () => {
  assert.equal(renderAdminEmail("order_shipped", order, ctx), null);
});
