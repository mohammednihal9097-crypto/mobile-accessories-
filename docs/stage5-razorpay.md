# Stage 5: Razorpay payments (code is ready, switched OFF until you add keys)

Decided: India, INR, Razorpay. I have **not** created or connected any Razorpay account. The steps below are yours.

## How a payment works
1. The customer places an order. It is saved as **Pending payment** and the stock is held.
2. The order page asks Razorpay for a **hosted payment link** (card, UPI, netbanking are on Razorpay's page; their details never reach our site). We make one link per order and reuse it if the page is reloaded.
3. The customer pays on Razorpay and is sent back to their order page.
4. Razorpay sends a **signed webhook** (`payment_link.paid`) to `/api/payments/webhook`. We check the signature, ignore repeats, and check amount, currency and order. **Only then** does the order become **Paid**.
5. The customer then gets the WhatsApp "payment received" message (once Stage 6 is set up).

Coming back to the site after paying does **not** mark anything paid. If the webhook is slow, the order page keeps saying Pending payment for a minute; refreshing shows the update.

Safety rules built in: wrong or missing signature is rejected; the same event twice changes nothing; an amount or currency that doesn't match the order is refused; a payment link expires after 12 hours (before the 24-hour unpaid-order cleanup); if money still arrives for a cancelled order, it is recorded and the admin dashboard shows **Paid but cancelled: refund needed**. Refunds are done by you in the Razorpay dashboard.

## Your steps
1. **Run the migration.** In the Supabase SQL Editor, copy the contents of [0004_razorpay.sql](../supabase/migrations/0004_razorpay.sql) and run it once, after 0001 to 0003.
2. **Create a Razorpay account** at razorpay.com and stay in **Test Mode** at first. Live mode needs business verification (KYC), which can take days.
3. **API keys:** Dashboard > Account & Settings > API Keys > Generate test key. Put the Key ID and Key Secret in `.env.local` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Never paste them in chat.
4. **Webhook:** Dashboard > Account & Settings > Webhooks > Add. 
   - URL: `https://YOUR-SITE/api/payments/webhook`. Razorpay must reach it, so it has to be your deployed https address, not `localhost`. (For local testing you can use a tunnel tool such as ngrok. Ask me if you want steps.)
   - Secret: invent a long random string, put it in Razorpay, and put the same value in `.env.local` as `RAZORPAY_WEBHOOK_SECRET`.
   - Event: tick **payment_link.paid** only.
5. Set `PAYMENT_PROVIDER=razorpay` in `.env.local` and restart the site.
6. **Test:** place an order, click **Pay now**, and pay with Razorpay's test card or test UPI details (from their docs). The order should change to Paid within a minute and show the payment in **Admin > Orders**.
7. Also test: reload the order page (no second link should appear), and cancel an unpaid order in admin.
8. **Going live** later: complete KYC, generate live keys, create the webhook again in live mode, and replace the three values in Vercel. Run one real small payment yourself first.

## Things to know
- Razorpay's test mode allows up to 30 payment links, UPI payment links do not work in test mode, and the customer must re-type email and phone on Razorpay's page. These come from Razorpay's current docs; re-check before launch.
- Razorpay charges fees per payment. Check their current pricing, and GST rules for your shop with an accountant.
- Cash on delivery is not built. Say if you want it; it changes how "paid" is decided.
- If the webhook ever reports an amount mismatch, the order is **not** marked paid. The server log shows `PAYMENT AMOUNT MISMATCH`; look at it in Razorpay.
