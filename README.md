# Branch Visitor Feedback Dashboard

Full-stack visitor & feedback analytics dashboard — Next.js (frontend + API)
+ PostgreSQL (Neon, free) + NextAuth (multi-admin login), deployable free on
Vercel.

## What changed in this version

1. **Percentages everywhere, with the raw count in brackets.** Charts that
   show a breakdown (feedback categories, branch/division share of
   visitors, gender split, positive vs. unsatisfaction) now show e.g.
   `62.3% (1,234)` on tooltip/hover/touch instead of just a raw number.
2. **New "Overall Satisfaction Summary" chart on Overview** — three slices
   (Positive / Unsatisfaction / Not Rated) that always add up to exactly
   100%. Positive here = Excellent + Good + Normal + Satisfaction (the
   inverse of Unsatisfaction and Not Rated). This is separate from the
   existing "Positive Feedback" KPI, which uses a stricter definition
   (Excellent + Good + Satisfaction only, no Normal) — both are kept because
   they answer different questions.
3. **Removed the "Yearly Comparison of Total Visitors" chart from the
   Visitors page** (the dedicated Yearly Comparison page in the sidebar is
   unchanged).
4. **Multi-admin login.** Login is no longer a single shared
   username/password from `.env`. Admin accounts now live in the database
   (`AdminUser` table), so any number of teammates can have their own
   login and be signed in and editing data at the same time. Manage
   accounts from **Manage Data → Admin Users**, or from the command line
   with `npm run create-admin -- "Full Name" username password`.
5. **Yearly Comparison now compares years fairly.** Each `Year` has a new
   `monthsCovered` field (12 for a full past year, fewer for a year still
   in progress — e.g. 6 or 7 for 2026 right now). A new top chart, "Monthly
   Average Visitors by Year (normalized)", divides each year's total by its
   `monthsCovered` and shows each year's % share of the combined monthly
   average — so a 6-month year is compared on equal footing with a 12-month
   year, not penalized for having a smaller raw total. Year-over-year %
   change is now computed on this monthly average too. Edit `monthsCovered`
   any time from **Manage Data → Years**.
6. **Male/female and branch/division ratios are now visible as
   percentages** on the Visitors page (KPI cards + Gender Split chart +
   Division-wise Visitors chart), using the same "percent (count)" format.
   The underlying male/female and division split is still placeholder/
   estimated data (flagged with a "Sample data" badge) until you enter real
   numbers via Manage Data.

## Pages

1. **Overview** — year picker, KPI cards, Overall Satisfaction Summary
   (100%-sum pie), detailed feedback category breakdown, total visitors by
   branch (with % share), top 3 performing branches.
2. **Visitors** — branch-wise and division-wise visitor volumes (with %
   share) and gender split (with % + count) for a chosen year.
3. **Feedback** — branch-wise positive vs. unsatisfied feedback (with %),
   division-wise feedback rates, company-wide category totals (with %), and
   a single-branch category breakdown (with %).
4. **Yearly Comparison** — normalized monthly-average comparison (top
   chart), raw total visitor trend, positive/unsatisfaction rate trend,
   year-over-year % change cards (monthly-average based), and a summary
   table.
5. **Manage Data** *(admin login required)* — add/edit/delete branch
   records; add/remove years and set each year's `monthsCovered`; manage
   admin user accounts.

Every chart type (bar/line/pie, where applicable) is switchable, printable
(Print/Export button strips the UI chrome), and has a dark mode toggle.

## Tech stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- PostgreSQL via Prisma (Neon free tier recommended)
- NextAuth (credentials provider, JWT sessions) backed by an `AdminUser`
  table for multi-admin login
- Recharts for all charts

## Setting up your new repo

```bash
# 1. Create a new empty GitHub repo, then locally:
cd branch-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/<new-repo>.git
git push -u origin main
```

### Local development

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate deploy
npm run seed              # loads the real 2024/2025/2026 branch data
npm run create-admin -- "Your Name" yourusername YourPassword123
npm run dev
```

Open http://localhost:3000, then sign in from the sidebar with the account
you just created and go to **Manage Data → Years** to set `monthsCovered`
for the current year (e.g. how many months of 2026 you actually have data
for).

### Deploying to Vercel

1. Import the new GitHub repo into Vercel.
2. Add environment variables in Vercel → Settings → Environment Variables:
   - `DATABASE_URL` — your Neon connection string
   - `NEXTAUTH_SECRET` — a fresh random string (do **not** reuse an old one)
   - `NEXTAUTH_URL` — your production URL, e.g. `https://yourapp.vercel.app`
3. Deploy. Vercel runs `prisma generate && next build` automatically
   (see `package.json` → `build`).
4. Run migrations against the production database once:
   ```bash
   DATABASE_URL="<your neon url>" npx prisma migrate deploy
   ```
5. Seed data and create admin accounts against production the same way,
   pointing `DATABASE_URL` at the Neon URL:
   ```bash
   DATABASE_URL="<your neon url>" npm run seed
   DATABASE_URL="<your neon url>" npm run create-admin -- "Name" user pass
   ```

## ⚠️ Important: rotate your database credentials

The `.env` file from the old project (with your live Neon `DATABASE_URL`
and `NEXTAUTH_SECRET`) is **not** included in this rebuild — it's
git-ignored and was stripped out on purpose. But since those values were
shared earlier, you should still:

1. Go to your Neon project → reset/rotate the database password.
2. Generate a brand-new `NEXTAUTH_SECRET` (`openssl rand -base64 32`).
3. Put the new values only in `.env` (local) and Vercel's environment
   variables (production) — never commit `.env` or paste real secrets into
   chat, docs, or screenshots again.

## Admin accounts

- Old setup: one shared username/password from `ADMIN_USERNAME` /
  `ADMIN_PASSWORD_HASH` in `.env`.
- New setup: any number of named accounts in the `AdminUser` table.
  Add people from **Manage Data → Admin Users** (once you're logged in
  yourself) or via:
  ```bash
  npm run create-admin -- "Full Name" username Password123
  ```
  Everyone can be signed in and editing data at the same time — sessions
  are independent per account.

## Data model notes

- `Branch` rows are per (year, division, branch). `total` is
  auto-calculated as the sum of the six response categories.
- `isPlaceholder = true` means the division split and/or male/female split
  for that row was generated (not entered manually) — replace with real
  numbers via Manage Data whenever you have them.
- `Year.monthsCovered` (new) drives the normalized Yearly Comparison chart.
