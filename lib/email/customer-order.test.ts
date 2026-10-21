import { test } from "node:test";
import assert from "node:assert/strict";
import { renderCustomerEmail } from "./customer-order.ts";

const ctx = { formatMoney: (n: number) => `Rs ${n / 100}`, orderLink: "https://shop.example/order/ORD-1001?t=abc", storeName: "Trio Store", supportEmail: "help@example.com" };
const order = {
  customer_name: "Asha", order_number: "ORD-1001", items: "Case x2 @ INR 499.00 each = INR 998.00, Charger x1 @ INR 699.00 each = INR 699.00",
  total_minor: 159700, address: "12 MG Road, Pune, 411001", payment_ref: "pay_123",
  courier: "Delhivery", tracking_number: "DL123", tracking_url: "https://track.example/DL123",
};

test("order confirmation lists the products, total, address and order link", () => {
  const m = renderCustomerEmail("order_received", order, ctx)!;
  assert.match(m.subject, /ORD-1001/);
  assert.match(m.text, /Hi Asha/);
  assert.match(m.text, /  - Case x2/);
  assert.match(m.text, /Total: Rs 1597/);
  assert.match(m.text, /order\/ORD-1001\?t=abc/);
});

test("payment receipt shows amount paid and payment reference", () => {
  const m = renderCustomerEmail("payment_received", order, ctx)!;
  assert.match(m.subject, /^Payment receipt/);
  assert.match(m.text, /Amount paid: Rs 1597/);
  assert.match(m.text, /Payment reference: pay_123/);
});

test("shipping email carries courier and tracking", () => {
  const m = renderCustomerEmail("order_shipped", order, ctx)!;
  assert.match(m.text, /Courier: Delhivery/);
  assert.match(m.text, /Tracking number: DL123/);
});

test("admin templates are not rendered as customer emails", () => {
  assert.equal(renderCustomerEmail("admin_new_order", order, ctx), null);
});

test("receipt and shipping emails thank the customer; shipping repeats the products", () => {
  const paid = renderCustomerEmail("payment_received", order, ctx)!;
  assert.match(paid.text, /Thank you for your purchase/);
  assert.match(paid.text, /  - Case x2/);
  const shipped = renderCustomerEmail("order_shipped", order, ctx)!;
  assert.match(shipped.text, /Thank you for your purchase/);
  assert.match(shipped.text, /  - Charger x1/);
  assert.match(shipped.text, /Track it here: https:\/\/track\.example\/DL123/);
});
