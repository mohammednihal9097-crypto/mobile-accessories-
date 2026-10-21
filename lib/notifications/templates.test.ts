import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBodyParams, clean, isKnownTemplate, KNOWN_TEMPLATES } from "./templates.ts";

const ctx = { formatMoney: (n: number) => `Rs ${n / 100}`, orderLink: "https://shop.example/order/ORD-1001?t=abc" };
const order = {
  customer_name: "Asha", customer_whatsapp: "+919876543210", order_number: "ORD-1001",
  items: "Clear Case x2 @ INR 499.00 each = INR 998.00, Fast Charger x1 @ INR 699.00 each = INR 699.00",
  total_minor: 159700, currency: "INR",
  address: "12 MG Road, Pune, 411001", payment_ref: "pay_123",
  courier: "Delhivery", tracking_number: "DL123", tracking_url: "https://track.example/DL123",
};

test("customer receipt has item prices, total, address and the order link", () => {
  const v = buildBodyParams("order_received", order, ctx);
  assert.deepEqual(v, ["Asha", "ORD-1001", order.items, "Rs 1597", "12 MG Road, Pune, 411001", ctx.orderLink]);
});

test("payment receipt has item prices, amount paid and payment reference", () => {
  const v = buildBodyParams("payment_received", order, ctx);
  assert.equal(v[2], order.items);
  assert.equal(v[4], "pay_123");
  assert.equal(v[3], "Rs 1597");
});

test("shipping update carries courier and tracking", () => {
  assert.deepEqual(buildBodyParams("order_shipped", order, ctx), ["Asha", "ORD-1001", "Delhivery", "DL123", "https://track.example/DL123"]);
});

test("shipping update falls back politely when details are missing", () => {
  const v = buildBodyParams("order_shipped", { ...order, courier: null, tracking_number: null, tracking_url: null }, ctx);
  assert.deepEqual(v.slice(2), ["our courier partner", "not provided", ctx.orderLink]);
});

test("admin alerts carry the customer's number, items and address", () => {
  const v = buildBodyParams("admin_new_order", order, ctx);
  assert.deepEqual(v, ["ORD-1001", "Asha", "+919876543210", order.items, "Rs 1597", "12 MG Road, Pune, 411001"]);
  assert.equal(buildBodyParams("admin_order_paid", order, ctx)[3], order.items);
});

test("values never contain line breaks, tabs, empty text or long space runs", () => {
  assert.equal(clean("a\nb\tc    d"), "a | b | c d");
  assert.equal(clean("   "), "-");
  assert.equal(clean(null, "n/a"), "n/a");
  for (const t of KNOWN_TEMPLATES) {
    for (const v of buildBodyParams(t, { items: "x\ny" }, { formatMoney: ctx.formatMoney, orderLink: null })) {
      assert.ok(v.length > 0 && !/[\r\n\t]/.test(v) && !/ {2,}/.test(v));
    }
  }
});

test("unknown template names are recognised as unknown", () => {
  assert.equal(isKnownTemplate("order_shipped"), true);
  assert.equal(isKnownTemplate("something_else"), false);
});
