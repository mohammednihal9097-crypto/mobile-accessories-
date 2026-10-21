import { STORE } from "@/lib/config";
import { buildCatalogFeed } from "@/lib/meta/catalog-feed";
import { getCatalog } from "@/lib/catalog";

export async function GET() {
  const configuredSiteUrl = process.env.SITE_URL?.trim();
  if (!configuredSiteUrl) {
    return new Response("SITE_URL must be set to your public HTTPS store domain.", { status: 503 });
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(/^https?:\/\//i.test(configuredSiteUrl) ? configuredSiteUrl : `https://${configuredSiteUrl}`);
  } catch {
    return new Response("SITE_URL is not a valid website address.", { status: 503 });
  }
  if (siteUrl.protocol !== "https:" || ["localhost", "127.0.0.1", "::1"].includes(siteUrl.hostname)) {
    return new Response("SITE_URL must be a public HTTPS store domain.", { status: 503 });
  }

  const catalog = await getCatalog();
  if (catalog.isSample) {
    return new Response("Connect Supabase and add real products before using the catalog feed.", { status: 503 });
  }

  const baseUrl = siteUrl.origin;
  const xml = buildCatalogFeed(catalog.products, baseUrl, STORE.currency, STORE.name);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
