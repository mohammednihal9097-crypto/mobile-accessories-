import type { Product } from "@/lib/types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildCatalogFeed(products: Product[], siteUrl: string, currency: string, storeName: string): string {
  const items = products.map((product) => {
    const link = `${siteUrl}/products/${encodeURIComponent(product.slug)}`;
    const image = product.photos[0]?.url;
    return [
      "<item>",
      `<g:id>${escapeXml(product.id)}</g:id>`,
      `<g:title>${escapeXml(product.name)}</g:title>`,
      `<g:description>${escapeXml(product.description)}</g:description>`,
      `<g:link>${escapeXml(link)}</g:link>`,
      image ? `<g:image_link>${escapeXml(image)}</g:image_link>` : "",
      `<g:availability>${product.stock > 0 ? "in stock" : "out of stock"}</g:availability>`,
      "<g:condition>new</g:condition>",
      `<g:price>${(product.price / 100).toFixed(2)} ${escapeXml(currency)}</g:price>`,
      "</item>",
    ].filter(Boolean).join("");
  }).join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    `<title>${escapeXml(storeName)}</title>`,
    `<link>${escapeXml(siteUrl)}</link>`,
    "<description>Product catalogue</description>",
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
