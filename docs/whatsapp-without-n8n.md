# WhatsApp without n8n

You do not need n8n. The website can answer customers and send receipts, delivery updates and admin alerts by itself.
(The n8n files in `n8n/` still work if you ever want them, but you can ignore them.)

## What the website does on its own
| Job | How it works without n8n |
|---|---|
| **Answer a customer's message** | Meta sends it to `/api/whatsapp/webhook`. The site checks Meta's signature, answers from your database, and sends the reply straight back through Meta's Cloud API. Meta gets its "OK" first, so it never waits. |
| **Customer receipt and updates** | The moment an order is placed, paid or changed in admin, the site sends the matching template message right away. |
| **Admin alerts** | Same moment, to the numbers listed in **Admin > WhatsApp alerts**. |
| **Safety net** | Once a day, Vercel runs `/api/cron/daily`. It re-sends any message that failed earlier and cancels orders left unpaid for 24 hours (returning stock). |

**Free-plan limit:** Vercel's free (Hobby) plan allows a scheduled job only **once a day**, and not at an exact time. Because messages go out immediately after each event, this only matters for retries. On a paid Vercel plan you can change `vercel.json` to run it every few minutes (for example `*/5 * * * *`).

## What you must set (Vercel > Settings > Environment Variables)
All are in your private file `.env.whatsapp`. Paste the whole file into Vercel at once.

| Setting | Where it comes from |
|---|---|
| `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | Already set. |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta app > **WhatsApp > API Setup**. A plain number. |
| `WHATSAPP_ACCESS_TOKEN` | A **permanent** token (see below). A secret. |
| `CRON_SECRET` | Already generated in the file. |

**Delete these two from Vercel if they are there:** `N8N_INBOUND_WEBHOOK_URL` and `N8N_INBOUND_SHARED_SECRET`. If they hold placeholder text the site ignores them, but remove them to keep things clean. If both are set to real values, the site forwards messages to n8n instead of answering itself.

## Get the permanent access token
The token on Meta's API Setup page expires within hours, so don't use it for the real shop.
1. Open **business.facebook.com/latest/settings** (Business settings), then **System users**, then **Add**.
2. Name it `trio-store-bot`, role **Admin**, and create it.
3. Click it, then **Assign assets**: under **Apps**, choose your app and turn on **Full control (Manage app)**. Under **WhatsApp accounts**, choose your WhatsApp account and turn on **Full control**.
4. Click **Generate token**, choose your app, set expiry to **Never** (if offered), and tick **whatsapp_business_messaging**, **whatsapp_business_management** (and **business_management** if listed).
5. Copy the token into `.env.whatsapp` on the `WHATSAPP_ACCESS_TOKEN` line. Never paste it into chat.

## Templates
Customer and admin receipts are **template messages**. Create the 9 templates in Meta with the exact texts in `docs/stage6-whatsapp-n8n.md` (section C, step 7). Meta must approve each one. Replies to a customer who just messaged you are plain text and need no template.

To enable order alerts and detailed receipts, run migrations `0005_whatsapp_receipts.sql` and `0006_whatsapp_item_prices.sql` after migrations `0001` to `0004`. Then add the admin recipient number(s) in **Admin > WhatsApp alerts**. New-order and paid-order alerts go to those admin numbers; customers receive an order confirmation when they place an order and an itemized payment receipt after payment is verified.

## Testing with Meta's free test number
- You can only message phone numbers you added as **test recipients** in API Setup.
- Template messages to other numbers fail with a clear Meta error. **Admin > WhatsApp alerts** shows each message's status and the error.
- Until your app is switched to **Live**, Meta delivers only test events from its dashboard. Customers' real messages arrive only after you publish the app.

## If something doesn't arrive
1. **Admin > WhatsApp alerts**: is the message "sent", "pending" or "failed"? A failed one shows Meta's reason.
2. Vercel > your project > **Logs**: filter on `whatsapp`.
3. Check that the template is **Approved** in Meta and the name matches exactly.
