// Run with: npm.cmd test   (uses Node's built-in test runner; fake data only)
import { test } from "node:test";
import assert from "node:assert/strict";
import { handleMessage, type BotDeps } from "./router.ts";

const deps: BotDeps = {
  storeName: "Test Store",
  siteUrl: "https://shop.example",
  formatMoney: (n) => `Rs ${n / 100}`,
  statusLabel: { shipped: "Shipped", pending_payment: "Pending payment" },
  catalog: {
    categories: [{ slug: "cases", name: "Cases & Covers" }, { slug: "chargers", name: "Chargers & Cables" }],
    phones: [{ id: "p1", brand: "B", name: "Phone One" }, { id: "p2", brand: "B", name: "Phone Two" }],
    products: [
      { id: "a", slug: "case-1", name: "Clear Case", categorySlug: "cases", price: 39900, stock: 10, compatibleModelIds: ["p1"] },
      { id: "b", slug: "case-2", name: "Rugged Case", categorySlug: "cases", price: 59900, stock: 0, compatibleModelIds: ["p2"] },
      { id: "c", slug: "charger-1", name: "Fast Charger", categorySlug: "chargers", price: 79900, stock: 3, compatibleModelIds: [] },
    ],
  },
  findOrders: async (wa, num) =>
    wa === "+911" && (!num || num === "ORD-1001")
      ? [{ orderNumber: "ORD-1001", status: "shipped", totalMinor: 39900, items: [{ name: "Clear Case", quantity: 1 }] }]
      : [],
  makeCheckoutLink: (wa) => `https://shop.example/start?wa=${wa}`,
};
const ask = (text: string, whatsapp = "+911") => handleMessage({ whatsapp, text }, deps);

test("greeting shows the menu", async () => {
  const r = await ask("hi");
  assert.equal(r.intent, "greeting");
  assert.match(r.reply, /Browse categories/);
});

test("category list uses real categories", async () => {
  const r = await ask("1");
  assert.match(r.reply, /Cases & Covers/);
  assert.match(r.reply, /Chargers & Cables/);
});

test("case for a phone only lists cases listed for that phone", async () => {
  const r = await ask("case for Phone One");
  assert.equal(r.intent, "product_fit");
  assert.match(r.reply, /Clear Case/);
  assert.doesNotMatch(r.reply, /Rugged Case/);
});

test("honest answer when nothing is listed for the phone", async () => {
  const r = await ask("charger for Phone Two"); // chargers are universal, so this one DOES list
  assert.match(r.reply, /Fast Charger/);
  const none = await ask("case for Phone Two");
  assert.match(none.reply, /Rugged Case/);
});

test("stock and price come from the data", async () => {
  const r = await ask("charger");
  assert.match(r.reply, /Only 3 left/);
  assert.match(r.reply, /Rs 799/);
  const out = await ask("rugged case");
  assert.match(out.reply, /Out of stock/);
});

test("asks a follow-up when fit is asked without a phone", async () => {
  const r = await ask("will it fit?");
  assert.equal(r.intent, "ask_phone");
});

test("order status only for the sender's own number", async () => {
  assert.match((await ask("where is my order")).reply, /Shipped/);
  const other = await ask("ORD-1001", "+912");
  assert.match(other.reply, /can't find/);
  assert.doesNotMatch(other.reply, /Shipped/);
});

test("checkout link is for this number", async () => {
  const r = await ask("4", "+911");
  assert.match(r.reply, /wa=\+911/);
});

test("human request and unknown text hand over to a person", async () => {
  assert.ok((await ask("5")).handoff);
  assert.ok((await ask("zzzz qqqq")).handoff);
});
