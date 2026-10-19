import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLinkPaid } from "./razorpay-check.ts";

const order = { id: "11111111-1111-1111-1111-111111111111", orderNumber: "ORD-1010", totalMinor: 59900, currency: "INR" };
const goodLink = () => ({
  id: "plink_abc", status: "paid", reference_id: "ORD-1010", currency: "INR",
  notes: { order_id: order.id },
  payments: [{ payment_id: "pay_1", status: "captured", amount: 59900 }],
});

test("a fully matching paid link proves payment", () => {
  assert.deepEqual(checkLinkPaid(goodLink(), order), { ok: true, paymentId: "pay_1", amountMinor: 59900, linkId: "plink_abc" });
});

test("anything that does not match is refused", () => {
  const bad = (patch: object) => checkLinkPaid({ ...goodLink(), ...patch }, order);
  assert.equal(bad({ status: "created" }).ok, false);
  assert.equal(bad({ reference_id: "ORD-1011" }).ok, false);
  assert.equal(bad({ notes: { order_id: "22222222-2222-2222-2222-222222222222" } }).ok, false);
  assert.equal(bad({ notes: null }).ok, false);
  assert.equal(bad({ currency: "USD" }).ok, false);
  assert.equal(bad({ payments: [] }).ok, false);
  assert.equal(bad({ payments: [{ payment_id: "pay_1", status: "authorized", amount: 59900 }] }).ok, false);
  assert.equal(bad({ payments: [{ payment_id: "pay_1", status: "captured", amount: 100 }] }).ok, false);
  assert.equal(checkLinkPaid(null, order).ok, false);
  assert.equal(checkLinkPaid(undefined, order).ok, false);
});
