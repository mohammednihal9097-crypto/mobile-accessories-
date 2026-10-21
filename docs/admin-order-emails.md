# Order emails (admin and customer)

**Admin** (triostoreindia@gmail.com) gets an email for every new, paid and cancelled order: order number, customer, items with prices, total, address and a link to the order in admin.

**Customers** get emails at their checkout address: order confirmation (products and total), **payment receipt** (amount paid and payment reference), then packing, shipped (courier and tracking), delivered and cancelled updates.

Emails use the same outbox as WhatsApp, so failures are retried (up to 5 times, and again by the daily job). Checkout now **requires** an email address.

## Set up (about 5 minutes)
1. Sign up at **resend.com** using **triostoreindia@gmail.com**.
2. **API Keys > Create API Key**, copy it.
3. Vercel > Settings > Environment Variables: add `RESEND_API_KEY`, then redeploy.
4. Supabase > SQL Editor: run `supabase/migrations/0007_admin_email_alerts.sql` (after 0001 to 0006). It adds the `admin_emails` list (with triostoreindia@gmail.com) and starts queueing emails.

Until step 3 nothing is sent and nothing is used up; emails wait in the outbox.

## Important: sending to customers needs your own domain
Resend's free test sender (`onboarding@resend.dev`) delivers **only to the address you signed up with**. That is fine for admin emails, but customers will not receive anything until you:
1. Add and verify your domain in Resend (**Domains**; add the DNS records it shows).
2. Set `EMAIL_FROM` in Vercel, for example `Trio Store <orders@yourdomain.com>`, and redeploy.

Gmail addresses (like @gmail.com) cannot be used as the sender domain.

## Good to know
- Add another admin address: `insert into admin_emails (email) values ('someone@example.com');` in Supabase.
- Sent emails and any errors appear in **Admin > WhatsApp alerts** (recipient shown as `email:address`).
- WhatsApp messages still go out as before. Orders placed before the migration only get WhatsApp.
