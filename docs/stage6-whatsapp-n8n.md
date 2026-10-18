> **n8n is optional.** The website can answer customers and send receipts and alerts by itself. See [whatsapp-without-n8n.md](whatsapp-without-n8n.md). This page describes the n8n route.

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
n8n workflow 2, every minute ──► asks the website for waiting messages ──► sends each as a WhatsApp template ──► confirms back
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
7. **Message templates** (WhatsApp Manager > Message templates), category **Utility**, language **English** (code `en`). Names must match exactly, and the `{{1}}`, `{{2}}`... numbering must match the table, because the website fills them in that order. Meta must approve each template (can take up to a day), and only approved templates can be sent. When creating each one Meta asks for an example value per variable; any realistic example works.

   **Customer messages (receipt and delivery details):**

   | Name | Text (copy exactly) | What fills the variables |
   |---|---|---|
   | `order_received` | Hi {{1}}, thank you for your order {{2}}. Items: {{3}}. Total: {{4}}. Delivering to: {{5}}. We will confirm once your payment is verified. View your order: {{6}} | name, order number, items, total, address, private order link |
   | `payment_received` | Hi {{1}}, we received your payment for order {{2}}. Receipt - items: {{3}}. Amount paid: {{4}}. Payment reference: {{5}}. We will pack your order soon. View your order: {{6}} | name, order number, items, total, payment reference, order link |
   | `order_processing` | Hi {{1}}, we are packing your order {{2}}. | name, order number |
   | `order_shipped` | Hi {{1}}, your order {{2}} has been shipped. Courier: {{3}}. Tracking number: {{4}}. Track it here: {{5}} | name, order number, courier, tracking number, tracking link (or order link) |
   | `order_delivered` | Hi {{1}}, your order {{2}} was delivered. Thank you for shopping with us. | name, order number |
   | `order_cancelled` | Hi {{1}}, your order {{2}} was cancelled. Reply here if you have questions. | name, order number |

   **Admin alerts (sent to the numbers you list in Admin > WhatsApp alerts):**

   | Name | Text (copy exactly) | What fills the variables |
   |---|---|---|
   | `admin_new_order` | New order {{1}} from {{2}} ({{3}}). Items: {{4}}. Total: {{5}}. Deliver to: {{6}}. Status: waiting for payment. | order number, customer name, customer WhatsApp, items, total, address |
   | `admin_order_paid` | Order {{1}} is PAID: {{2}} from {{3}}. Items: {{4}}. Deliver to: {{5}}. Please pack and ship. | order number, total, customer name, items, address |
   | `admin_order_cancelled` | Order {{1}} from {{2}} was cancelled. | order number, customer name |

   The website cleans every value: line breaks and tabs become " | ", long space runs are collapsed, and empty values become "-". Meta's current docs do not spell out these formatting limits, so this is a safe default. Message bodies are limited to 1024 characters, and a very long item list is cut to 900 characters.
   Why templates: Meta only lets a business start a conversation, or write after the customer's service window closes, with an approved template. Meta's rules and prices change, so check the current WhatsApp Business Platform pricing page before launch.

### D. n8n (cloud or self-hosted; it must be reachable from the internet over https)
1. Import the three files in [n8n/](../n8n/) (Workflows > Import from file).
2. Create credentials (all **Header Auth**): (a) header name `x-api-key`, value = `N8N_INBOUND_SHARED_SECRET`, for the incoming webhook; (b) header name `x-api-key`, value = `N8N_API_SHARED_SECRET`, for calls to your site; (c) header name `Authorization`, value = `Bearer ` followed by your WhatsApp access token, for the calls to Meta's Cloud API (`graph.facebook.com`). The workflows send through the Cloud API directly instead of the n8n WhatsApp node, so that any template and any number of variables work.
3. In every workflow replace `https://YOUR-SITE.example` with your real site address, and `YOUR_PHONE_NUMBER_ID` with your phone number ID, and choose the credentials on each node.
4. Activate the workflows. Copy workflow 1's **Production URL** into `N8N_INBOUND_WEBHOOK_URL`.

**Be aware:** the three workflow files are drafts I wrote by hand, validated as JSON only. I could not open them in n8n, so a node setting may need a small adjustment in n8n's editor. Run each workflow once manually and check the result. The Cloud API address uses version `v25.0`, which is what Meta's current examples show; if Meta retires it, change the number in the two Graph API nodes.

### E. Admin numbers and shipping details (done inside the shop admin)
1. Run [0005_whatsapp_receipts.sql](../supabase/migrations/0005_whatsapp_receipts.sql) in the Supabase SQL Editor (after 0001 to 0004).
2. In **Admin > WhatsApp alerts**, add the WhatsApp number(s) that should receive order alerts. Use the full international format, for example +91 98765 43210. This is the only place admin numbers are stored.
3. When you mark an order **shipped**, the admin order page asks for the courier and tracking number (and an optional tracking link). They are saved on the order and sent to the customer in the shipped message. At least the courier or the tracking number is required.

### F. Try it safely
1. With Meta's test number, add your own phone as a test recipient and send `hi`.
2. In admin, change an order's status. Within a minute the customer number should receive the matching template, and your admin numbers should receive the alert for new, paid and cancelled orders. **Admin > WhatsApp alerts** lists every message with its status and any error from WhatsApp.
3. Send `5`. The chat should appear in **Admin > WhatsApp chats**.

## Hand-over to a person
When the bot hands over, it replies once and records the chat in the admin page. It does not keep silent or loop. Answering the customer is done by you in your WhatsApp Business inbox or Meta's inbox, then mark it done in admin.

## Known limits
- n8n answers Meta's call immediately, so if a later n8n step fails a customer message can be lost; check n8n's executions list regularly.
- Only text, and button or list reply taps, are understood. Everything else goes to a person.
- No rate limit yet on messages per customer. Meta applies its own limits.
