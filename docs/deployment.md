# Deployment

The runbook for one VPS (PM2 + nginx + Postgres), Cloudflare R2 for media,
and indahnya.my on Cloudflare DNS. Nothing in the repo deploys by itself;
CI only checks. **Nothing is deployed yet.**

## What runs where

| Piece | Where | Notes |
|---|---|---|
| `indahnya-web` | PM2, cluster, `127.0.0.1:3000` | Site + API. `WORKER=0`. |
| `indahnya-worker` | PM2, fork, `127.0.0.1:3001` | Photos, videos, purges, mails. Nothing proxies to it. |
| Postgres 16 | same box | Nightly `scripts/backup-db.sh`, copied off the box. |
| nginx | same box | `deploy/nginx.conf`: TLS, HSTS, `X-Real-IP`, zip streaming. |
| R2 `indahnya-media` | Cloudflare | Public, custom domain `media.indahnya.my`. Served copies only. |
| R2 `indahnya-private` | Cloudflare | No public access. Originals and hidden media. |
| R2 `indahnya-backups` | Cloudflare | Database dumps, with a 30-day lifecycle rule. |

Both processes are started from `ecosystem.config.cjs` and read
`/etc/indahnya/env`. That file follows `.env.example` and is mode 600, owned
by the app user.

## Environment

Runtime config is read **when the server starts**, from `NUXT_*` variables
only. A bare `STRIPE_SECRET_KEY` is silently ignored, and nothing from the
build machine is baked into `.output`. `DATABASE_URL` and the process-role
variables are the bare names. A production server checks the required values
at start and refuses to run, listing what is missing
(`server/plugins/00.config-check.ts`).

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `NUXT_PUBLIC_SITE_URL` | yes | `https://indahnya.my`: links, mails, Stripe return, printed QR codes, OG, sitemap |
| `NUXT_S3_ENDPOINT` | yes | `https://<account>.r2.cloudflarestorage.com` |
| `NUXT_S3_REGION` | yes | `auto` on R2 |
| `NUXT_S3_BUCKET` | yes | Public bucket (served copies only) |
| `NUXT_S3_PRIVATE_BUCKET` | yes | Private bucket (originals, hidden media). Must differ from the public one |
| `NUXT_S3_ACCESS_KEY_ID` / `NUXT_S3_SECRET_ACCESS_KEY` | yes | R2 token with Object Read & Write on both buckets |
| `NUXT_S3_PUBLIC_BASE` | yes | `https://media.indahnya.my` |
| `NUXT_STRIPE_SECRET_KEY` | yes | Secret or restricted key (`sk_live_…` / `rk_live_…`) |
| `NUXT_STRIPE_WEBHOOK_SECRET` | yes | Signing secret of the webhook endpoint |
| `NUXT_STRIPE_PRICE_STD` / `NUXT_STRIPE_PRICE_FULL` | no | Price IDs for full-price RM59 / RM99. Without them prices are created inline |
| `NUXT_SMTP_URL` | yes | `smtps://user:pass@host:465`. Sign-in is by emailed link |
| `NUXT_SMTP_FROM` | no | Defaults to `Indahnya <hello@indahnya.my>` |
| `NUXT_PUBLIC_LEGAL_NAME` / `_REG` / `_ADDRESS` | yes | Registered name, SSM number and address, shown on `/privasi` and `/terma` |
| `NUXT_ALERT_EMAIL` | strongly advised | Where alerts go: refunds needed, jobs given up, mail failures |
| `NUXT_CLOUDFLARE_ZONE_ID` / `NUXT_CLOUDFLARE_API_TOKEN` | no | Purge hidden/deleted media from the edge at once (token: Zone → Cache Purge) |
| `NUXT_GOOGLE_CLIENT_ID` / `NUXT_GOOGLE_CLIENT_SECRET` | no | Google sign-in |
| `DB_POOL_MAX` | no | Postgres connections per process (default 10) |
| `WORKER` | per process | `0` on the web processes, `1` on the worker (set in `ecosystem.config.cjs`) |
| `WORKER_PHOTO_CONCURRENCY` / `WORKER_VIDEO_CONCURRENCY` / `FFMPEG_THREADS` | no | Worker lanes (default 2 / 1) and threads per encode (default 2) |
| `INDAHNYA_LOCAL_PROD` | never in production | Lets a production build run on localhost addresses for a smoke test |

The template is [`.env.example`](../.env.example).

## Checklist (one-time setup)

1. **Packages:**
   - Node 22
   - `postgresql-16`
   - `nginx`
   - `certbot`
   - `ffmpeg`
   - `libheif-examples` and `libheif-plugin-libde265`: HEIC is decoded natively, ~2.5× faster than the bundled fallback, outside Node
   - `awscli` (for backups)

   The server refuses to start without ffmpeg and ffprobe.
2. **Database:** create the `indahnya` database and user, and put the URL in `DATABASE_URL`.
3. **R2:**
   - Create three buckets: media, private and backups.
   - Use one API token with Object Read & Write on media and private. Use a separate token for backups.
   - Put the custom domain `media.indahnya.my` on the media bucket only.
   - CORS on the private bucket:
     - origin `https://indahnya.my`
     - methods `PUT, GET, HEAD`
     - allowed headers `content-type, content-length`
     - **exposed header `ETag`**: large uploads go up in parts, and the browser reads each part's ETag
   - Add a lifecycle rule on the private bucket: abort incomplete multipart uploads after 1 day.
   - Add a Cloudflare Cache Rule for `media.indahnya.my`: respect origin cache headers. Objects carry `max-age=3600`, so a hidden photo leaves every cache within the hour.
   - For it to leave at once, set `NUXT_CLOUDFLARE_ZONE_ID` and `NUXT_CLOUDFLARE_API_TOKEN` (permission: Zone → Cache Purge).
4. **DNS and TLS:**
   - `indahnya.my` and `www` point at the VPS. If they are proxied through Cloudflare, enable the real-IP lines in `deploy/nginx.conf`.
   - Run `certbot --nginx -d indahnya.my -d www.indahnya.my`.
5. **Mail:**
   - The SMTP provider goes in `NUXT_SMTP_URL`.
   - Add SPF, DKIM and DMARC records for indahnya.my.
   - `hello@indahnya.my` needs an inbox: it is the published contact.
6. **Stripe (MY, live):**
   - Enable FPX, cards and GrabPay.
   - Turn on **email receipts** for successful payments (`/terma` promises one).
   - Add a webhook to `https://indahnya.my/api/stripe/webhook` with these events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
     - `checkout.session.expired`
     - `charge.refunded`
     - `charge.dispute.created`
7. **Env:** fill `/etc/indahnya/env` from `.env.example`, including:
   - `NUXT_PUBLIC_LEGAL_*` (registered name, SSM number, address)
   - `NUXT_ALERT_EMAIL`
8. **nginx:** install `deploy/nginx.conf`, then run `nginx -t && systemctl reload nginx`.
9. **PM2:**
   - `npm i -g pm2`, then `pm2 install pm2-logrotate`: logs rotate, the disk does not fill.
   - `pm2 start ecosystem.config.cjs && pm2 save && pm2 startup`: the processes come back after a reboot.
10. **Monitoring:** point an external uptime check at `https://indahnya.my/api/health`. It returns 503 when the database, the worker or the photo queue is unwell.
11. **Backups:** add the cron line from `scripts/backup-db.sh`. Do **one test restore** into a scratch database before launch.

## Each deploy

Build on the box, never on a Mac: sharp's native binary must match Linux.

```bash
cd /srv/indahnya
git fetch && git checkout <tag-or-sha>
npm ci
npx nuxt build
node --env-file=/etc/indahnya/env scripts/migrate.mjs
pm2 reload ecosystem.config.cjs
curl -fsS https://indahnya.my/api/health
```

- `pm2 reload` replaces processes gracefully:
  - The web side finishes open requests.
  - The worker stops claiming new jobs and waits up to 25 s for running ones.
  - A job cut off mid-way is picked up again by the next worker after 5 minutes.
- First deploy only: seed the landing's sample gallery with `node --env-file=/etc/indahnya/env --import tsx scripts/seed-demo.ts`.

## Rollback

Migrations only add things and never drop them, so the previous build runs
against the new schema. To roll back:

1. `git checkout <previous>`.
2. `npm ci && npx nuxt build`.
3. `pm2 reload ecosystem.config.cjs`.

Restore the database only for data damage, never for a code rollback.

## Restore the database

```bash
pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" /var/backups/indahnya/indahnya-<stamp>.dump
```

A restored database can point at media objects deleted after the dump was
taken. Those show as missing files and the zip skips them. It also lacks rows
for uploads made since the dump, whose objects stay in the private bucket.
Run the restore with the worker stopped, then start it.

## What alerts look like

With `NUXT_ALERT_EMAIL` set, these arrive by mail, at most once per 15 minutes per subject:

- **Payment needs a refund:** the payment was recorded, flagged `needs_refund`, and nothing was applied. Refund it in Stripe; the `charge.refunded` webhook then marks it refunded.
- **Payment refunded / Payment disputed:** the event keeps its plan until someone decides otherwise.
- **Worker gave up / Worker abandoned jobs:** a photo, purge or clean-up failed three times or crashed its process.
- **Retention mail failed:** the purge waits until the final warning has been out for 7 days, with a hard stop 45 days after storage ends (alerted).
- **Purge without a final warning.**

Without `NUXT_ALERT_EMAIL`, they appear only in `pm2 logs` with the prefix `[alert]`.

## Static preview (Cloudflare Pages)

`npm run deploy:pages` builds the committed `HEAD`, runs it once with
`NUXT_PUBLIC_PREVIEW=true` against local Postgres and Garage, snapshots the
public pages and the sample majlis, and uploads the result to a Pages project
(`scripts/pages/`). It's a portfolio preview, not the launch. The preview has
no server, so sign-up, the dashboard and the TV lead to `/mula`. Pushing to
git deploys nothing.
