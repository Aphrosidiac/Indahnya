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
- **S3-compatible object storage, two buckets** — Cloudflare R2 in
  production, Garage locally. The *public* bucket holds only the served
  copies of visible media and sits behind `media.indahnya.my`; the *private*
  bucket holds originals (full EXIF, GPS included) and hidden media and has
  no public access at all. The browser PUTs originals to presigned URLs
  (type and exact size signed); the app never touches the bytes
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
cp .env.example .env        # fill DATABASE_URL and the NUXT_S3_* keys
createdb indahnya
npm install
npm run db:migrate
node scripts/dev-bucket.mjs # sets CORS on both dev buckets
node --env-file=.env --import tsx scripts/seed-demo.ts   # the landing's sample gallery at /aina-hakim
npm run dev                 # http://localhost:3180
npm test                    # unit tests: clocks, prices, redirects, EXIF time, slugs
```

Garage needs both buckets and one key with read/write on each:
`garage bucket create indahnya-media`, `garage bucket create indahnya-private`,
`garage bucket allow --read --write --owner <bucket> --key <key>`.

Sign-in is by magic link. In dev, without `NUXT_SMTP_URL`, the link is printed to
the server log instead of mailed — copy it from there. In production a
missing `NUXT_SMTP_URL` is an error: sign-in links never go to a log.

## Production checklist

- **R2**: two buckets. Custom domain (`media.indahnya.my`) on the public one
  ONLY. CORS on the private bucket: `PUT` from `https://indahnya.my` with
  headers `content-type, content-length`. The dev `/media` route does not
  exist in a production build.
- **Env**: everything in `.env.example`, set in the environment the server
  STARTS with (PM2 `env`/`env_file`). Runtime config is only read from
  `NUXT_*` names at startup — a bare `STRIPE_SECRET_KEY` is ignored, and
  nothing is taken from the build machine. Needs `NUXT_SMTP_URL`, the Stripe
  keys and webhook secret (`checkout.session.completed`,
  `checkout.session.async_payment_succeeded`, `…async_payment_failed`,
  `…expired` → `/api/stripe/webhook`).
- **nginx**: HSTS, `client_max_body_size` small (uploads never pass through
  the app), `X-Forwarded-For` set (rate limits read it).
- **Demo**: run `scripts/seed-demo.ts` once so `/aina-hakim` exists.
- One PM2 process runs the web app *and* the worker; set `WORKER=0` on any
  extra web-only instance.

## Layout

```
app/
  ui/            design system: tokens.css, components/, stores
  components/    AppShell (host dashboard), GuestShell (guest pages)
  pages/
    index.vue    landing (BM default, ?lang=en)
    privasi.vue  privacy notice, terma.vue terms (BM + EN)
    masuk.vue    sign-in (also spends the emailed token)
    app/         host dashboard: /app, /app/[id]/{gambar,slideshow,qr,tetapan,…}
    [slug]/      guest hub and gallery
    tv/          the venue slideshow
  composables/   useUploader, useGuestEvent, useT (BM/EN strings), …
server/
  api/           route handlers (auth, events, g/[slug] guest API, tv, stripe)
  worker/        media processing, purge/retention sweep, expiry mails
  utils/         storage (two buckets), sessions, guests, plans + clocks,
                 validation, rate limits, slugs
shared/utils/    code both sides use: safeNext (redirects), built modules
tests/           vitest unit tests
  db/            Drizzle schema + migrations
public/landing/  landing photos (Unsplash-licensed stand-ins); s/ = WebP copies
scripts/         dev-bucket (CORS), seed-demo, build-assets (icons, og.jpg)
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
