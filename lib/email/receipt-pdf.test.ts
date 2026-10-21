import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReceiptPdf, type ReceiptData } from "./receipt-pdf.ts";

const base: ReceiptData = {
  storeName: "Trio Store", storeAddress: "Kerala, India", storeEmail: "help@example.com", storePhone: "+91 75111 18549",
  storeWebsite: "shop.example", gstin: "32ABCDE1234F1Z5", orderNumber: "ORD-1001", paidAt: new Date("2026-10-21T10:00:00Z"),
  customerName: "Asha", customerEmail: "asha@example.com", address: "12 MG Road, Pune, 411001",
  items: [{ name: "Retractable car charger", quantity: 2, unitMinor: 49900 }],
  subtotalMinor: 99800, shippingMinor: 0, totalMinor: 99800, currency: "INR", paymentRef: "pay_123",
};

test("builds a real PDF", async () => {
  const bytes = await buildReceiptPdf(base);
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-");
  assert.ok(bytes.length > 1500);
});

test("copes with non-Latin names, very long names and many items", async () => {
  const items = Array.from({ length: 60 }, (_, i) => ({ name: `Charger ${i} ${"x".repeat(120)} മലയാളം ₹`, quantity: 1, unitMinor: 1000 }));
  const bytes = await buildReceiptPdf({ ...base, customerName: "ആശ", items, gstin: undefined, shippingMinor: 4900 });
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), "%PDF-");
});
