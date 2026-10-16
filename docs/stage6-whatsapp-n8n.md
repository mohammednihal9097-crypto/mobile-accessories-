# Stage 6: WhatsApp + n8n (what is built, and what YOU must set up)

**Nothing outside this project is configured.** I have not created, connected or tested any Meta, WhatsApp or n8n account. The code and the workflow files are ready. The steps below are yours.

## How it fits together

```
Customer on WhatsApp
      │
      ▼
Meta WhatsApp Cloud API ──► your website  /api/whatsapp/webhook
                              1. checks Meta's signature (rejects anything else)
                              2. ignores repeats of the same message
                              3. forwards a clean copy to n8n
                                         │
                                         ▼
                      n8n workflow 1 ──► your website  /api/bot/message
                                              (answers ONLY from the database;
                                               asks a question or hands over to a person if unsure)
                                         │
                                         ▼
                              n8n sends the reply via WhatsApp

Order status changes (admin or payment) ──► saved in the "notifications" table (once per change)
n8n workflow 2, every minute ──► asks the website for waiting updates ──► sends WhatsApp template ──► confirms back
n8n workflow 3, every hour   ──► cancels orders unpaid after 24h and returns their stock
```

Why the website sits in the middle: n8n's WhatsApp trigger does not document checking Meta's signature, so the website does that check itself first. All the "thinking" (what is in stock, what fits, order status) is in the website code, tested with `npm.cmd test`. n8n only moves messages, which keeps your prices and stock in one place.

## What the bot can do (all from your database)

| Customer says | Bot does |
|---|---|
| hi / menu | Greets and shows the 5-option menu |
| 1 / "categories" | Lists your real categories |
| "case for Samsung Galaxy A15" | Lists products listed as compatible with that exact model (plus "fits all phones" items), with price and stock |
| "will it fit?" (no phone named) | Asks which phone model |
| 3 / "where is my order" / `ORD-1001` | Shows status, **only for orders placed with the sender's own WhatsApp number** |
| 4 / "checkout" | Sends a signed website link tied to their number, valid 24 hours |
| 5 / "human" / anything it does not understand / photos or voice notes | Tells the customer a person will reply, and adds the chat to **Admin > WhatsApp chats** |

It never guesses compatibility, stock, prices or order status. If a phone model is not in your list, it says it has nothing listed.

## Your steps

### A. Database (Supabase SQL Editor)
Run [0003_whatsapp.sql](../supabase/migrations/0003_whatsapp.sql) once (after 0001, and 0002 if you ran the uncorrected 0001). If you get a "permission denied for function is_admin" error on the shop page, run 0002 first.

### B. Environment values (`.env.local`, and later Vercel)
Fill the Stage 6 section of `.env.example`. Generate long random strings for the three secrets (a password manager can do it). `ORDER_LINK_SECRET`, `N8N_API_SHARED_SECRET` already have random local values in your `.env.local`.

### C. Meta (developers.facebook.com and business.facebook.com)
1. Create a **Meta Business portfolio** and verify the business if asked.
2. Create an app of type **Business**, add the **WhatsApp** product.
3. Add a phone number. The Cloud API needs a number that is not already on the regular WhatsApp app. Start with Meta's free test number to try things.
4. Note the **Phone number ID** and create a **permanent access token** (System User) for n8n. Keep it secret.
5. Copy the **App Secret** (App settings > Basic) into `WHATSAPP_APP_SECRET`.
6. Webhook: callback URL `https://YOUR-SITE/api/whatsapp/webhook`, verify token = your `WHATSAPP_VERIFY_TOKEN`. Subscribe to the **messages** field. Your site must be public (https) for this; use the real deployed site, not localhost.
7. **Message templates** (WhatsApp Manager > Message templates), category **Utility**, language English. Names must match exactly. Each has two variables, `{{1}}` = customer name, `{{2}}` = order number. Meta must approve them (can take up to a day), and only approved templates can be sent.

   | Name | Suggested text |
   |---|---|
   | `order_received` | Hi {{1}}, we received your order {{2}}. We will confirm once payment is verified. |
   | `payment_received` | Hi {{1}}, payment for order {{2}} is confirmed. We will pack it soon. |
   | `order_processing` | Hi {{1}}, we are packing order {{2}}. |
   | `order_shipped` | Hi {{1}}, order {{2}} has been shipped. |
   | `order_delivered` | Hi {{1}}, order {{2}} was delivered. Thank you for shopping with us. |
   | `order_cancelled` | Hi {{1}}, order {{2}} was cancelled. Reply here if you have questions. |

   Why templates: Meta only lets a business start a conversation, or write after the customer's service window closes, with an approved template. Meta's rules and prices change, so check the current WhatsApp Business Platform pricing page before launch.

### D. n8n (cloud or self-hosted; it must be reachable from the internet over https)
1. Import the three files in [n8n/](../n8n/) (Workflows > Import from file).
2. Create credentials: two **Header Auth** credentials with header name `x-api-key` (one holding `N8N_INBOUND_SHARED_SECRET` for the incoming webhook, one holding `N8N_API_SHARED_SECRET` for calls to your site) and one **WhatsApp API** credential with your token and business account ID.
3. In every workflow replace `https://YOUR-SITE.example` with your real site address, and `YOUR_PHONE_NUMBER_ID` with your phone number ID, and choose the credentials on each node.
4. Activate the workflows. Copy workflow 1's **Production URL** into `N8N_INBOUND_WEBHOOK_URL`.

**Be aware:** the three workflow files are drafts I wrote by hand, validated as JSON only. I could not open them in n8n, so node settings (especially the WhatsApp template node) may need a small adjustment in n8n's editor. Run each workflow once manually and check the result.

### E. Try it safely
1. With Meta's test number, add your own phone as a test recipient and send `hi`.
2. In admin, change an order's status. Within a minute you should receive the matching template.
3. Send `5`. The chat should appear in **Admin > WhatsApp chats**.

## Hand-over to a person
When the bot hands over, it replies once and records the chat in the admin page. It does not keep silent or loop. Answering the customer is done by you in your WhatsApp Business inbox or Meta's inbox, then mark it done in admin.

## Known limits
- n8n answers Meta's call immediately, so if a later n8n step fails a customer message can be lost; check n8n's executions list regularly.
- Only text, and button or list reply taps, are understood. Everything else goes to a person.
- No rate limit yet on messages per customer. Meta applies its own limits.
