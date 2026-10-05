# Deployment

Indahnya runs on a self-hosted VPS: PM2 runs the Nuxt server, nginx sits in
front of it, Postgres is on the same box, and media is on Cloudflare R2.
**Nothing is deployed yet.** This page is the launch checklist and the
reference for the configuration.

## Checklist

- [ ] Domain `indahnya.my` registered. `indahnya.ffdev.studio` redirects to it with a 301.
- [ ] Postgres database created, `npm run db:migrate` applied.
- [ ] R2: two buckets, a custom domain on the public one only, CORS on the private one (below).
- [ ] Stripe MY account (FPX, cards, GrabPay), two prices, webhook endpoint.
- [ ] SMTP for sign-in links and expiry mail.
- [ ] Google OAuth client (optional, for "Log masuk dengan Google").
- [ ] Every value in [Environment](#environment) set in the environment PM2 **starts** with.
- [ ] nginx: TLS, HSTS, small `client_max_body_size`, `X-Forwarded-For`.
- [ ] Sample seeded once: `node --env-file=.env --import tsx scripts/seed-demo.ts`.
- [ ] SSM number added to `/privasi` and `/terma`. Refund line in `/terma` reviewed.

## Environment

Runtime config is read **when the server starts**, from `NUXT_*` variables only.
A bare `STRIPE_SECRET_KEY` is silently ignored, and nothing from the build
machine is baked into `.output`. `DATABASE_URL` is the one bare name.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `NUXT_PUBLIC_SITE_URL` | yes | `https://indahnya.my`: links, QR codes, OG, sitemap |
| `NUXT_S3_ENDPOINT` | yes | `https://<account>.r2.cloudflarestorage.com` |
| `NUXT_S3_REGION` | yes | `auto` on R2 |
| `NUXT_S3_BUCKET` | yes | Public bucket (served copies only) |
| `NUXT_S3_PRIVATE_BUCKET` | yes | Private bucket (originals, hidden media) |
| `NUXT_S3_ACCESS_KEY_ID` / `NUXT_S3_SECRET_ACCESS_KEY` | yes | R2 token with Object Read & Write on both buckets |
| `NUXT_S3_PUBLIC_BASE` | yes | `https://media.indahnya.my` |
| `NUXT_STRIPE_SECRET_KEY` | yes | Stripe secret key |
| `NUXT_STRIPE_WEBHOOK_SECRET` | yes | Signing secret of the webhook endpoint |
| `NUXT_STRIPE_PRICE_STD` / `NUXT_STRIPE_PRICE_FULL` | yes | Price IDs for RM59 and RM99 |
| `NUXT_SMTP_URL` | yes | `smtps://user:pass@host:465`. Without it, sign-in is refused |
| `NUXT_SMTP_FROM` | no | Defaults to `Indahnya <hello@indahnya.my>` |
| `NUXT_GOOGLE_CLIENT_ID` / `NUXT_GOOGLE_CLIENT_SECRET` | no | Google sign-in |
| `WORKER` | no | `0` on a web-only instance. The default runs the worker |

The template is [`.env.example`](../.env.example).

## Cloudflare R2

1. Create `indahnya-media` (public) and `indahnya-private` (private).
2. Connect the custom domain `media.indahnya.my` to **`indahnya-media` only**.
   The private bucket must never get a public domain or an `r2.dev` URL.
3. CORS on `indahnya-private`, so browsers can PUT originals:

   ```json
   [{
     "AllowedOrigins": ["https://indahnya.my"],
     "AllowedMethods": ["PUT"],
     "AllowedHeaders": ["content-type", "content-length"],
     "MaxAgeSeconds": 3600
   }]
   ```

4. Create an API token with Object Read & Write scoped to both buckets.

Data from before the two-bucket split is moved by
`scripts/migrate-split-buckets.ts`.

## Stripe

- One-time Checkout per event. Two prices: RM59 (`std`) and RM99 (`full`).
  The RM40 upgrade from `std` to `full` is computed, not a separate price.
- Webhook endpoint `https://indahnya.my/api/stripe/webhook`, subscribed to:
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.async_payment_failed`, `checkout.session.expired`.
- Returning from Checkout also runs a reconcile (`/api/events/[id]/reconcile`),
  so a late webhook doesn't leave the host waiting.
- A payment that lands on a purged or deleted event is logged as `REFUND NEEDED`.

## Build and run

```bash
npm ci
npm run build                     # .output/
npm run db:migrate                # with DATABASE_URL set
```

PM2, with the environment in a file PM2 reads at start:

```js
// ecosystem.config.cjs (example; keep it out of git if it holds values)
module.exports = {
  apps: [{
    name: 'indahnya',
    script: '.output/server/index.mjs',
    env_file: '/etc/indahnya.env',  // every NUXT_* value and DATABASE_URL
    env: { PORT: 3180, HOST: '127.0.0.1', NODE_ENV: 'production' },
    max_memory_restart: '1G',
  }],
};
```

One process serves the web app **and** runs the worker. If you add a
web-only instance, give it `WORKER=0`. Two worker processes are safe anyway,
because jobs are claimed with `SKIP LOCKED`.

The server needs `ffmpeg` and `ffprobe` on `PATH`. The kad's WhatsApp previews
are rendered with bundled fonts (`server/assets/fonts`), so the VPS needs no
system fonts.

## nginx

```nginx
server {
  listen 443 ssl http2;
  server_name indahnya.my;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  # Photos, videos, voice notes and kad assets all go straight to R2 with
  # presigned PUTs. The app only ever receives small JSON bodies.
  client_max_body_size 1m;

  location / {
    proxy_pass http://127.0.0.1:3180;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # rate limits read it
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;      # the zip download streams
    proxy_read_timeout 300s;
  }
}

server {
  listen 443 ssl http2;
  server_name indahnya.ffdev.studio;
  return 301 https://indahnya.my$request_uri;
}
```

The app sets its own `x-content-type-options`, `referrer-policy`,
`x-frame-options` and `permissions-policy`, plus `noindex` on the dashboard,
TV and API (`nuxt.config.ts`). HSTS belongs to nginx.

## Static preview (Cloudflare Pages)

`npm run deploy:pages` builds the committed `HEAD`, runs it once with
`NUXT_PUBLIC_PREVIEW=true` against local Postgres and Garage, snapshots the
public pages and the sample majlis, and uploads the result to a Pages project
(`scripts/pages/`). It's a portfolio preview, not the launch. The preview has
no server, so sign-up, the dashboard and the TV lead to `/mula`. Pushing to
git deploys nothing.
