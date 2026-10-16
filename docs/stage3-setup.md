# Stage 3 setup: connect Supabase (you do these steps)

I have not touched any Supabase project. Until you finish these steps the site keeps showing the labelled sample products, and `/admin` sends you to the login page.

1. **Create a project** at supabase.com (free plan is fine). Pick a region near your customers. Save the database password in a password manager, not in this project.
2. **Run the migration.** Open *SQL Editor*, paste the whole of `supabase/migrations/0001_init.sql`, and click Run. Run it once only. It should finish without errors. If you see an error, send me the message (not any keys).
3. **Copy your keys** from *Project Settings > API Keys*:
   - Project URL
   - Publishable key (`sb_publishable_...`)
   - Secret key (`sb_secret_...`). Treat this like a bank password.
4. **Create `.env.local`** in the project folder (copy `.env.example`) and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   SUPABASE_SECRET_KEY=...
   ```
   `.env.local` is already ignored by git. Never paste these values into chat or screenshots.
5. **Create your admin login:** *Authentication > Users > Add user*, enter your email and a strong password, and tick "Auto confirm". In *Authentication > Providers > Email*, turn **off** "Allow new users to sign up" so nobody else can register.
6. **Make that user an admin.** In the SQL Editor run (with your email):
   ```sql
   insert into admin_users (user_id) select id from auth.users where email = 'you@example.com';
   ```
7. **Start the site:** `npm run dev`, then open http://localhost:3000/login and sign in.

## How to check it works

1. In *Admin > Categories & phones*, add a category and a couple of phone models.
2. In *Admin > Products > Add product*, create a product with a photo, a price, starting stock and some compatible phones.
3. Open the storefront. The yellow "Demo mode" banner should be gone and your product should appear with its photo, stock and fit badge.
4. Open the product in admin, add `-1` stock, and confirm the shop changes straight away. Try removing more stock than you have; it should refuse.
5. Log out, then open http://localhost:3000/admin. It should send you to the login page.

Orders are created in Stage 4. The Orders pages will be empty until then.
