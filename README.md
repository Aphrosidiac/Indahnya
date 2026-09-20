# Indahnya

Guest photo gallery, e-kad and RSVP for Malaysian majlis — in one QR.

Guests scan, upload straight from the phone browser (no app, no sign-up),
and the photos land in one gallery and on the venue TV within seconds. The
host gets a dashboard, moderation, a zip of the originals, printable QR
sheets, and a one-time RM price. Built by [FF Dev Studio](https://ffdev.studio).

> Status: Phase A (gallery, uploads, slideshow, QR, moderation, payments,
> retention) and the landing page are built and verified locally. Phase C
> (e-kad) and Phase B (RSVP, seating, ucapan) are next. See [PLAN.md](PLAN.md)
> for every decision, the pricing table, the data model and the phase plan.

## Stack

- **Nuxt 4** (Vue 3) — SSR for the guest pages and the e-kad, client-only
  for the host dashboard
- **Postgres + Drizzle** — schema in `server/db/schema.ts`, migrations in
  `server/db/migrations`
- **S3-compatible object storage** — Cloudflare R2 in production, Garage or
  MinIO locally; the browser PUTs to presigned URLs, the app never touches
  the bytes
- **In-process worker** (`server/plugins/worker.ts`) — sharp, heic-convert,
  ffmpeg; claims jobs with `SKIP LOCKED`
- **Stripe** (MY) — one-time Checkout per event, webhook + reconcile
- **Tailwind v4** with the design system in `app/ui/` (tokens, 34
  primitives, the motion rules)

## Run it locally

Requirements: Node ≥ 22, Postgres, ffmpeg/ffprobe on PATH, and an
S3-compatible store on `:9000` (Garage: `brew install garage`, see
`PLAN.md` → Status for the config).

```bash
cp .env.example .env        # fill DATABASE_URL and the S3_* keys
createdb indahnya
npm install
npm run db:migrate
node scripts/dev-bucket.mjs # sets CORS on the dev bucket
npm run dev                 # http://localhost:3180
```

Sign-in is by magic link. Without `SMTP_URL` the link is printed to the
server log instead of mailed — copy it from there.

## Layout

```
app/
  ui/            design system: tokens.css, components/, stores
  components/    AppShell (host dashboard), GuestShell (guest pages)
  pages/
    index.vue    landing (BM default, ?lang=en)
    masuk.vue    sign-in
    app/         host dashboard: /app, /app/[id]/{gambar,slideshow,qr,tetapan,…}
    [slug]/      guest hub and gallery
    tv/          the venue slideshow
  composables/   useUploader, useGuestEvent, useT (BM/EN strings), …
server/
  api/           route handlers (auth, events, g/[slug] guest API, tv, stripe)
  worker/        media processing, purge/retention sweep, expiry mails
  utils/         storage (S3), sessions, guests, plans, slugs
  db/            Drizzle schema + migrations
public/landing/  landing photos (Unsplash-licensed stand-ins)
```

## Design

The UI follows the design language documented in `app/ui/tokens.css`: one
warm ground, white cards with a hairline and a soft lift, charcoal primary
actions, a green accent that only ever carries ink text, and one rule for
motion — an animation never owns the resting state (no route transitions,
`.reveal` keyframes with no fill mode).

## Licence

© FF Dev Studio. Source is public for reference; all rights reserved.
Photos under `public/landing/` are from Unsplash under the
[Unsplash License](https://unsplash.com/license).
