import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { parsePaymentLinkPaid, signatureIsValid, whyIgnored } from "./razorpay-webhook.ts";

const secret = "test-webhook-secret-123";
const body = JSON.stringify({
  event: "payment_link.paid",
  payload: {
    payment_link: { entity: { notes: { order_id: "11111111-1111-1111-1111-111111111111" }, status: "paid" } },
    payment: { entity: { id: "pay_abc", amount: 39900, currency: "INR", status: "captured" } },
  },
});
const sign = (b: string, s = secret) => createHmac("sha256", s).update(b).digest("hex");

test("a correctly signed body is accepted", () => {
  assert.equal(signatureIsValid(body, sign(body), secret), true);
});

test("wrong secret, edited body, missing or empty signature are rejected", () => {
  assert.equal(signatureIsValid(body, sign(body, "other-secret"), secret), false);
  assert.equal(signatureIsValid(body + " ", sign(body), secret), false);
  assert.equal(signatureIsValid(body, null, secret), false);
  assert.equal(signatureIsValid(body, "", secret), false);
  assert.equal(signatureIsValid(body, sign(body), ""), false);
});

test("paid event yields order id, payment id, amount and currency", () => {
  assert.deepEqual(parsePaymentLinkPaid(JSON.parse(body)), {
    orderId: "11111111-1111-1111-1111-111111111111", reference: "pay_abc", amountMinor: 39900, currency: "INR",
  });
});

test("other events and uncaptured or malformed payments are ignored", () => {
  assert.equal(parsePaymentLinkPaid({ event: "payment.failed" }), null);
  const notCaptured = JSON.parse(body);
  notCaptured.payload.payment.entity.status = "authorized";
  assert.equal(parsePaymentLinkPaid(notCaptured), null);
  const noOrder = JSON.parse(body);
  noOrder.payload.payment_link.entity.notes = null;
  assert.equal(parsePaymentLinkPaid(noOrder), null);
  assert.equal(parsePaymentLinkPaid(null), null);
});

test("ignored events explain themselves without exposing data", () => {
  assert.match(whyIgnored({ event: "order.paid" }), /order\.paid, not payment_link\.paid/);
  const noOrder = JSON.parse(body);
  noOrder.payload.payment_link.entity.notes = null;
  assert.match(whyIgnored(noOrder), /no order_id/);
  const auth = JSON.parse(body);
  auth.payload.payment.entity.status = "authorized";
  assert.match(whyIgnored(auth), /authorized, not captured/);
});