# Stage 8: Review, launch checklist and deployment

Nothing has been published, deployed or connected to a paid service. Everything below is for you to do when you decide.

## 1. What I checked, and the result

| Check | Result |
|---|---|
| Typecheck, lint, production build | Pass |
| Unit tests (`npm.cmd test`): chat logic, translation safety | 11 of 11 pass |
| Dependency audit, production packages | 0 known vulnerabilities |
| Dependency audit, developer tools | 5 "high" warnings in ESLint tooling only. They are not shipped to customers. The automatic fix would downgrade Next.js, so I left it. |
| Secrets in code or example files | None. Real values live only in `.env.local`, which git ignores. `.env.example` holds placeholders. |
| `/admin` while logged out | Redirects to login |
| Bot endpoints with no or wrong key | Refused (401) |
| WhatsApp webhook with a bad signature | Refused (401) |
| Payment webhook with the placeholder provider | Refused (400): no order can be marked paid |
| Order page with a wrong token | Shows "not found", reveals nothing |
| Security headers (no framing, no sniffing, referrer, permissions) | Set |

## 2. What I could NOT verify (please test these yourself)

These need your real Supabase project and accounts, and I did not place test orders in your database.

1. **Placing an order end to end.** Run migrations 0002 and 0003 first. Then add a product with stock 2 and order it from the shop. Check that stock drops and the order shows in **Admin > Orders**.
2. **Double-click safety.** Press "Place order" twice quickly: you should get one order, not two.
3. **Last item race.** With stock 1, open the checkout in two browser windows and submit both. Exactly one should succeed and the other should say there isn't enough stock.
4. **Cancel returns stock once.** Cancel an order in admin: stock goes back up. Cancelling again must not add it twice (the button disappears; the database also refuses).
5. **A non-admin login.** Create a second Supabase user without adding it to `admin_users`. It must be refused at `/admin`.
6. **The three n8n workflows and the Meta setup.** They are drafts that have never run (see `docs/stage6-whatsapp-n8n.md`).

## 3. Known gaps and risks (honest list)

- **No payment provider yet** (needs your country and provider decision). Until then orders sit as "Pending payment" and expire after 24 hours if the n8n expiry workflow is active. **You cannot take real orders without this.**
- **Admin can mark an order "paid" by hand.** That is intended for money you have confirmed yourself, and it is recorded in the order history with the admin's ID. Only admins can do it.
- **No rate limiting on checkout.** A honeypot field stops simple bots, and unpaid orders expire to free stock. For heavier protection add Vercel's firewall rate limits or a CAPTCHA before launch (I will not bypass or build around CAPTCHAs myself).
- **No staff roles.** All admins can do everything, as you asked.
- **Delivery area, tax and shipping fees are placeholders** in `lib/config.ts` (flat fee and free-over amount are made-up numbers). Prices are shown in INR as a placeholder.
- **Store name** is still "Your Store Name" (`lib/config.ts`).
- **Legal pages** are missing: privacy policy, terms, refund and shipping policy, contact details. Most countries and payment providers require them. Collecting names, phone numbers and addresses also carries data-protection duties in your country (for example India's DPDP Act). Please get advice.
- **Customer order link** contains a secret token. Anyone with the link can see that one order. Customers are told to keep it private.
- **Content Security Policy** is not set. The basic headers are. A CSP can be added after you pick your final scripts and fonts.
- **Backups:** the free Supabase plan has limited backup options. Check the plan before holding real orders.
- **Photos** go to a public bucket. Only upload product photos you own.
- **Emails:** there are none. Customers hear from you via WhatsApp only.

## 4. Decisions still open (from the start of the project)

Selling country and currency, payment provider, delivery area and fees, cash on delivery or not, languages, store name and logo, real product data, and legal text.

## 5. Launch checklist

**Accounts and setup**
- [ ] Supabase: migrations 0001, 0002 and 0003 run in order; admin user created and added to `admin_users`; "Allow new users to sign up" turned **off**
- [ ] Supabase: upgrade the plan if you need backups; note the project region
- [ ] Meta Business verified, WhatsApp number added, six templates approved (`docs/stage6-whatsapp-n8n.md`)
- [ ] n8n running on https with the three workflows imported, credentials set, activated
- [ ] Payment provider chosen, account verified, test mode working (Stage 5 work on my side once you choose)
- [ ] Sarvam only if you want it (`docs/stage7-sarvam.md`)

**Content**
- [ ] Real categories, phone models and products with photos and correct stock
- [ ] Remove or hide nothing called "Sample" (it disappears automatically once Supabase is connected)
- [ ] Store name, logo, colours, delivery rules and fees in `lib/config.ts`
- [ ] Privacy policy, terms, refund and shipping policy pages and contact details

**Security**
- [ ] All values in `.env.local` copied to Vercel's environment settings (never into the code or chat)
- [ ] New random values for `ORDER_LINK_SECRET`, `N8N_API_SHARED_SECRET`, `N8N_INBOUND_SHARED_SECRET` in production (do not reuse your local ones)
- [ ] Rotate any key that was ever pasted into chat, email or a screenshot
- [ ] Admin password is strong and unique; turn on multi-factor authentication in Supabase if offered
- [ ] Test points 1 to 5 in section 2

**Dry run before opening to customers**
- [ ] Place a test order with the provider's test mode and confirm it becomes "Paid" only after the provider's confirmation
- [ ] Walk every status in admin (paid, processing, shipped, delivered) and confirm each WhatsApp message arrives once
- [ ] Message the bot: hi, categories, a phone-fit question, order status, checkout link, "5"
- [ ] View the shop on a real phone

## 6. How to deploy (Vercel), when you are ready

1. Install Git, put the project in a GitHub repository (private). `.env.local` is already excluded. Check with `git status` that it is not listed.
2. In Vercel, **Add New > Project**, import the repository. The framework is detected as Next.js.
3. Under **Environment Variables** add every name from `.env.example` with real production values. Set `SITE_URL` to your final address, for example `https://yourstore.com`.
4. Deploy. Open the Vercel address and check the shop, `/login`, and an order.
5. Add your own domain in Vercel (Settings > Domains) and follow its DNS instructions.
6. In Supabase **Authentication > URL Configuration** set the Site URL to your domain.
7. Update the webhook addresses: Meta (`https://YOUR-SITE/api/whatsapp/webhook`), the payment provider (`https://YOUR-SITE/api/payments/webhook`), and the n8n workflows (`YOUR-SITE` placeholders).
8. Vercel's free Hobby plan is for non-commercial use. A real shop needs a paid plan. Check their current terms and prices before you launch.

I will not deploy, publish or connect any paid service until you tell me to.
