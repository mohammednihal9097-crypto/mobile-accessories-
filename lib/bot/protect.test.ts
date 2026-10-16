import { test } from "node:test";
import assert from "node:assert/strict";
import { protect, restore } from "./protect.ts";

const reply = "*Clear Case*: ₹399 (In stock)\nhttps://shop.example/products/clear-case\nOrder ORD-1001 total Rs 1,299.50";

test("facts are swapped out and restored exactly", () => {
  const p = protect(reply);
  assert.doesNotMatch(p.text, /₹399|ORD-1001|https:/);
  // pretend a translator only changed the surrounding words
  const fake = p.text.replace("In stock", "STOCK-TRANSLATED").replace("total", "TOTAL-TRANSLATED");
  const back = restore(fake, p.tokens);
  assert.ok(back);
  assert.match(back!, /\*Clear Case\*/);
  assert.match(back!, /₹399/);
  assert.match(back!, /ORD-1001/);
  assert.match(back!, /https:\/\/shop\.example\/products\/clear-case/);
  assert.match(back!, /Rs 1,299\.50/);
});

test("a damaged marker means the translation is rejected", () => {
  const p = protect(reply);
  assert.equal(restore(p.text.replace("QQ0QQ", "QQ 0 QQ"), p.tokens), null);
  assert.equal(restore(p.text.replace(/QQ1QQ/, ""), p.tokens), null);
});
