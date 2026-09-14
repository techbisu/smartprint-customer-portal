# SmartPrint Customer Portal

The mobile-first page customers land on after scanning a shop's counter QR
code: pick a service, upload a file, see the live price, and pay — either
via UPI right away, or at the counter when they collect the print. The
moment a job is created, the shop's desktop agent (built separately) is
notified over Pusher and starts printing.

Live route: `yourdomain.com/print/<shop-slug>`

This project's build was verified end-to-end in a real Node environment:
`npm install`, `npx tsc --noEmit`, and `npm run build` all pass cleanly
against the actual dependency versions pinned in `package.json` — this
isn't just reviewed code, it genuinely compiles.

## What's in this folder

```
app/
  layout.tsx                     Root layout, loads the Manrope font
  globals.css                    Tailwind + the one custom visual motif
  print/[shopSlug]/page.tsx      Server component: fetches shop + rate card
  print/[shopSlug]/UploadFlow.tsx Client component: the whole interactive flow
  print/[shopSlug]/not-found.tsx Shown for an unknown/invalid shop slug
  api/jobs/route.ts              Records a job, triggers the shop's Pusher channel
  api/pusher/auth/route.ts       Signs private-channel auth for the desktop agent
lib/
  types.ts                       Shared types matching the Supabase schema
  pricing.ts                     Price calculation (unit-testable, no UI dependency)
  supabaseBrowser.ts             Anon-key client (rate card reads, file uploads)
  supabaseAdmin.ts               Service-role client (server-only, API routes only)
  pusherTrigger.ts               Hand-signed Pusher REST calls (Web Crypto + js-md5)
  pdfPageCount.ts                Client-side PDF page counting via pdfjs-dist
components/                      ServiceSelector, UploadDropzone, JobOptions, PriceBar, ConfirmationScreen
supabase/schema.sql              Full DB schema, RLS policies, storage bucket setup
open-next.config.ts              OpenNext Cloudflare adapter config
wrangler.jsonc                   Cloudflare Workers deployment config
```

## How the pieces fit together

1. Customer scans the shop's QR code → lands on `/print/<shop-slug>`.
2. The page server-fetches the shop and its active rate card from Supabase.
3. Customer picks a service, uploads a file (page count is read client-side
   via `pdfjs-dist` for accurate per-page pricing), adjusts copies/color/duplex.
4. On "Pay via UPI" or "Pay at counter": the file uploads directly from the
   browser to Supabase Storage (never touches your server), then the
   browser calls `POST /api/jobs` with just the metadata.
5. `/api/jobs` looks up the shop, inserts the job row, and triggers a
   `new-print-job` Pusher event to `private-shop-<shopId>` — the same
   channel the desktop agent is listening on.
6. For UPI payments, the browser is redirected to a `upi://pay?...` deep
   link pointing straight at the shop's own UPI ID — no payment gateway,
   no commission. **Be aware**: this means there's no automatic payment
   confirmation webhook. The shopkeeper verifies payment the same way they
   would for any UPI counter sale (their own UPI app shows the credit).
   For "Pay at counter," the print starts immediately and cash changes
   hands at pickup — the same trust model small shops already use.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is
   fine to start).
2. Go to the **SQL Editor** and run the entire contents of
   `supabase/schema.sql`. This creates the tables, enables Row Level
   Security with the correct public/private split, and creates the
   `print-uploads` storage bucket.
3. Add at least one shop and rate card row — the commented example at the
   bottom of `schema.sql` shows the shape, or use the Table Editor UI.
   Generate `agent_auth_token` with something like `openssl rand -hex 32`
   — this is the value you'll paste into that shop's desktop agent
   Settings tab as "Auth Token."
4. From **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret —
     never put it in a `NEXT_PUBLIC_` variable or client code)

## 2. Set up Pusher

1. Create a free app at [pusher.com](https://pusher.com) under **Channels**.
2. From the app's **App Keys** page, copy `app_id`, `key`, `secret`, and
   `cluster` into `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`,
   `PUSHER_CLUSTER`.
3. Nothing else to configure — this app talks to Pusher's plain REST API
   directly (see `lib/pusherTrigger.ts`), no dashboard-side channel setup
   needed.

## 3. Local development

```bash
npm install
cp .env.example .env.local   # fill in the values from steps 1-2
npm run dev
```

Visit `http://localhost:3000/print/<your-shop-slug>`.

## 4. Deploy to Cloudflare (Workers, via OpenNext)

This project deploys using **`@opennextjs/cloudflare`**, the adapter
Cloudflare and the OpenNext project currently maintain for running full
Next.js apps (including dynamic routes and API routes) on Cloudflare
Workers using Next's standard **Node.js runtime** — not the older,
now-deprecated `@cloudflare/next-on-pages`, which only supported the more
limited Edge runtime. Every route in this app uses the default Node.js
runtime, which is what this adapter expects.

### One-time setup

```bash
npm install -g wrangler
wrangler login
```

### Deploy

```bash
npm install
npm run deploy
```

This runs `opennextjs-cloudflare build` (bundles your Next.js app for
Workers) followed by `opennextjs-cloudflare deploy` (pushes it live via
Wrangler), using the `wrangler.jsonc` already in this folder.

### Environment variables

Set these once via the Cloudflare dashboard (**Workers & Pages → your
project → Settings → Variables and Secrets**) — `wrangler` does not read
your local `.env.local` for deployed environments:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — plain variables
- `SUPABASE_SERVICE_ROLE_KEY`, `PUSHER_SECRET` — mark these as **secrets**,
  not plain variables, since they must never be readable from the
  dashboard UI after being set
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_CLUSTER` — plain variables

Alternatively, set secrets from the CLI:
```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put PUSHER_SECRET
```

### Local preview against the Workers runtime

```bash
npm run preview
```

This builds and runs the app locally through Wrangler's Workers
simulator — closer to production than `next dev`, useful for catching
Workers-specific issues before deploying.

### After deploying

- Your customer-facing URL becomes `https://<your-worker>.<your-subdomain>.workers.dev/print/<shop-slug>`,
  or your custom domain once attached in the Cloudflare dashboard.
- Give each shop their `/api/pusher/auth` URL — it's the same domain, so
  it's `https://<your-domain>/api/pusher/auth` for every shop. Paste that
  into the desktop agent's Settings tab.
- Generate the actual QR code image for each shop's counter standee
  pointing at their `/print/<slug>` URL — any QR generator works; this
  repo doesn't include one since it's a one-time print job per shop, not
  a runtime feature.

## Notes on scope and honest limitations

- **No shopkeeper dashboard yet** — adding/editing rate card items and
  toggling `is_online` currently means editing rows directly in Supabase's
  Table Editor. A proper `/dashboard` for shopkeepers is a natural next
  build, not included here.
- **No image/ID-card cropping flow** — this build treats any uploaded
  image as a single page, same as a one-page PDF. The ID-card composite
  (crop front + back onto one sheet) from the original spec isn't built
  here; flag if you want it added.
- **Duplex pricing** bills per physical sheet (`ceil(pages / 2)`), not per
  printed side — this matches how print shops actually charge duplex, but
  double-check it matches your shop owners' expectations before launch.
- **UPI payment has no confirmation webhook**, as noted above. If you
  later want automatic payment verification, that requires a real payment
  gateway (Razorpay/Cashfree UPI intent + webhook) instead of a raw
  `upi://` deep link — a bigger change with transaction fees attached.
- **`@opennextjs/cloudflare` is under active development** (currently
  v1.20.x). It's well past its early pre-1.0 state and used in production
  by real Cloudflare customers, but it's still evolving faster than a
  fully mature tool — worth checking its changelog when you upgrade it.
- **npm audit** currently flags two dependency-chain issues, checked and
  found low-relevance here: a `postcss` advisory nested inside Next.js's
  own build tooling (build-time only, not a runtime attack surface for a
  deployed app), and a `tar` advisory in `canvas`, an optional dependency
  of `pdfjs-dist` used only for server-side PDF rendering — a code path
  this app never calls (we only read page counts in the browser), and
  which didn't even install in testing. Worth revisiting on future
  `npm install` runs regardless.
