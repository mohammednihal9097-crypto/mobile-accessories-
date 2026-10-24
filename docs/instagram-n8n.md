# Instagram Auto-Reply Automation with n8n

This document explains how to set up the **n8n workflow** for automating your Instagram DMs (`@triostore_india`).

---

## 1. How It Works

```
Customer DMs @triostore_india on Instagram
            │
            ▼
Meta Instagram Webhook ──► Your Website (/api/instagram/webhook)
                                 │ (verifies Meta signature & drops repeats)
                                 ▼
                     n8n Workflow (Webhook Node)
                                 │
                                 ▼
                     Ask the store bot (/api/bot/instagram)
                        - Queries live products & stock
                        - Returns prices in INR & direct product links
                        - Gives INSTA10 discount code
                        - Checks order tracking
                                 │
                                 ▼
                     Meta Graph API (/me/messages)
                                 │
                                 ▼
                     Customer receives reply in Instagram DM
```

---

## 2. Setup in n8n (Step-by-Step)

### Step 1: Import the Workflow
1. Open your **n8n** instance.
2. Go to **Workflows** &rarr; click **Import from File**.
3. Select the file: `n8n/4-instagram-inbound-bot.json` from this repository.

### Step 2: Configure Credentials in n8n
The workflow uses 3 credentials (all **Header Auth** type):

1. **Incoming Webhook Auth**:
   - Header name: `x-api-key`
   - Value: Your `N8N_INBOUND_SHARED_SECRET`
2. **Website Store Bot Auth**:
   - Header name: `x-api-key`
   - Value: Your `N8N_API_SHARED_SECRET`
3. **Meta Instagram Graph API Auth**:
   - Header name: `Authorization`
   - Value: `Bearer <YOUR_META_PAGE_ACCESS_TOKEN>`

### Step 3: Replace Website URL
In the **"Ask the store bot"** node:
- Replace `https://YOUR-SITE.example` with your real deployed URL:
  `https://triostore-india.vercel.app/api/bot/instagram`

### Step 4: Activate and Connect to Website
1. Turn the toggle to **Active** (green) in the top-right of the n8n workflow.
2. Copy the **Production URL** of the **"Verified Instagram Message"** Webhook node (e.g. `https://your-n8n.com/webhook/instagram-inbound`).
3. In your Vercel Dashboard, add this environment variable:
   - `N8N_INSTAGRAM_WEBHOOK_URL` = `<your_n8n_production_webhook_url>`
4. Redeploy or restart Vercel.

---

## 3. Testing Your Workflow
1. In n8n, click **"Test step"** or open the Webhook node and click **"Listen for test event"**.
2. Send a test POST request to your webhook or DM `@triostore_india` from a separate Instagram account with:
   - `hi` &rarr; bot responds with welcome menu and options
   - `cases` &rarr; bot responds with popular cases and prices in INR
   - `discount` &rarr; bot shares the `INSTA10` voucher
   - `track` &rarr; bot sends the order tracking link
