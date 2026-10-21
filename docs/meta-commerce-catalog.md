# Facebook and Instagram product catalog

## Website setup

Add your public social profile addresses to `.env.local` (and your deployment environment):

```dotenv
NEXT_PUBLIC_FACEBOOK_URL=https://www.facebook.com/profile.php?id=61595168145986
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/triostore_india/?hl=en
```

The footer shows whichever valid HTTPS profiles are configured.

The store exposes an RSS/XML product feed at:

```text
https://YOUR-STORE-DOMAIN/api/meta/catalog
```

The feed contains active products, current INR prices, stock availability, product pages, and the first product photo when present. It does not include sample products. `SITE_URL` must be set to the public HTTPS domain, and Supabase must be connected. Product changes appear when Meta fetches the feed again.

## Connect the catalog in Meta Commerce Manager

1. In Commerce Manager, create or open the catalog for your business.
2. Choose adding products through a data feed / scheduled feed, select the XML/RSS (Google Merchant) feed format if prompted, and use the feed URL above.
3. Set a refresh schedule and let Meta fetch the feed. Review any rejected products in Commerce Manager.
4. Connect the catalog to the Facebook Page and Instagram professional account in the business settings, then follow Meta's commerce eligibility and shop review steps.

The feed URL is public and must remain reachable for scheduled imports. This is a scheduled catalog import, not an instant Meta API sync; updates appear after Meta's next fetch. A local `localhost` address cannot be fetched by Meta. Availability of Instagram/Facebook shop features depends on Meta's current country, account, and commerce eligibility requirements.
