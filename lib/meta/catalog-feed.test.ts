import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalogFeed } from "./catalog-feed.ts";
import type { Product } from "@/lib/types";

const product: Product = {
  id: "product-1",
  slug: "case-blue",
  name: "Blue & Clear Case",
  description: "Fits <Model X> & more",
  categorySlug: "cases",
  price: 1299,
  stock: 3,
  compatibleModelIds: [],
  photos: [{ url: "https://images.example/photo?a=1&b=2", alt: "Case" }],
  imageTint: "#fff",
};

test("Meta catalog feed emits escaped product details and prices", () => {
  const xml = buildCatalogFeed([product], "https://shop.example", "INR", "Trio & Store");
  assert.match(xml, /<title>Trio &amp; Store<\/title>/);
  assert.match(xml, /<g:title>Blue &amp; Clear Case<\/g:title>/);
  assert.match(xml, /<g:description>Fits &lt;Model X&gt; &amp; more<\/g:description>/);
  assert.match(xml, /<g:link>https:\/\/shop\.example\/products\/case-blue<\/g:link>/);
  assert.match(xml, /<g:image_link>https:\/\/images\.example\/photo\?a=1&amp;b=2<\/g:image_link>/);
  assert.match(xml, /<g:availability>in stock<\/g:availability>/);
  assert.match(xml, /<g:price>12\.99 INR<\/g:price>/);
});

test("Meta catalog feed marks sold-out items and omits missing images", () => {
  const xml = buildCatalogFeed([{ ...product, stock: 0, photos: [] }], "https://shop.example", "INR", "Trio Store");
  assert.match(xml, /<g:availability>out of stock<\/g:availability>/);
  assert.doesNotMatch(xml, /<g:image_link>/);
});
