# Deployment

The runbook for one VPS (PM2 + nginx + Postgres), Cloudflare R2 for media,
and indahnya.my on Cloudflare DNS. Nothing deploys on push; CI only checks.
`deploy/deploy.sh` is the one way code reaches the server.

## What runs where

| Piece | Where | Notes |
|---|---|---|
| `indahnya-web` | PM2, cluster, `127.0.0.1:3250` | Site + API. `WORKER=0`. |
| `indahnya-worker` | PM2, fork, `127.0.0.1:3251` | Photos, videos, purges, mails. Nothing proxies to it. |
| Postgres 16 | same box | Nightly `scripts/backup-db.sh`, copied off the box. |
| nginx | same box | `deploy/nginx.conf`: origin TLS, HSTS, Cloudflare real IP, `X-Real-IP`, zip streaming. |
| R2 `indahnya-media` | Cloudflare | Public, custom domain `media.indahnya.my`. Served copies only. |
| R2 `indahnya-private` | Cloudflare | No public access. Originals and hidden media. |
| R2 `indahnya-backups` | Cloudflare | Database dumps, with a 30-day lifecycle rule. |

Both processes are started from `ecosystem.config.cjs` and read
`/etc/indahnya/env`. That file follows `.env.example` and is mode 600, owned
by the app user.

### The box today

`43.134.29.203` (Tencent, Ubuntu 24.04, 2 vCPU / 4 GB), shared with other
apps: provisioned with `setup-server.sh --shared`. Indahnya has its own user,
Node 22 (`/opt/node22`), PM2 daemon (`pm2-indahnya.service`, CPU weight 50,
memory capped at 2 GB), database, nginx site and ports; nothing global on the
box was changed. The ssh alias is `indahnya` (user `ubuntu`, passwordless sudo).

### Cloudflare does the heavy lifting

| On Cloudflare | On the VPS |
|---|---|
| DNS, TLS, DDoS/WAF, caching of `/_nuxt/` chunks, fonts and images | Server-rendered pages and the API (small requests) |
| Every photo and video, stored in R2 | Postgres (events, guests, RSVPs, wishes) |
| Guests' uploads, straight from the phone to R2 (presigned) | The worker: thumbnails, HEIC to JPEG, video encodes |
| Delivery of media: `media.indahnya.my`, signed R2 links for private files | Zip downloads, streamed from R2 through the app |
| `hello@` inbound (Email Routing) | Nightly database dump, copied to R2 |

Outbound mail is Resend. The large bytes (uploads, gallery views, videos)
never pass through the box; the zips are the one exception.

### Pre-launch mode

Until Stripe and the legal address are settled, the server runs with
`NUXT_PUBLIC_PREVIEW=true`: the landing and the sample majlis work, the host
side leads to `/mula`, and `server/middleware/preview.ts` closes sign-in, the
TV try upload and the Stripe routes. The startup config check is skipped in
this mode. To open: set the Stripe and `NUXT_PUBLIC_LEGAL_*` keys in
`production.env`, change it to `NUXT_PUBLIC_PREVIEW=false` (deleting the
line would not reach the server: a push never removes keys) and run
`deploy/env.sh push --reload`.

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

## The deploy system

Four scripts in `deploy/`, all run from the Mac. Secrets never enter the repo
(it is public): they live in `~/.config/indahnya/` (mode 600) and on the
server in `/etc/indahnya/env`.

| Script | Does |
|---|---|
| `deploy/setup-server.sh` | Provisions a fresh Ubuntu 24.04 box, as root, idempotent: Node 22, Postgres 16 (database + generated password), nginx, ffmpeg + native HEIC, AWS CLI, PM2 + logrotate + boot start, 2 GB swap, ufw, fail2ban, unattended upgrades, Cloudflare real-IP list (weekly refresh), nightly backup cron, `/srv/indahnya` layout |
| `node deploy/cloudflare.mjs` | Sets up Cloudflare through the API, idempotent: DNS, SSL Full (strict), origin certificate, R2 buckets + CORS + lifecycle + `media.indahnya.my`, Email Routing (`hello@` → your inbox), indahnya.my on Resend + its DKIM/SPF records, DMARC, `indahnya.ffdev.studio`, and writes the server's credentials (three narrow Cloudflare tokens, one send-only Resend key) into `production.env` |
| `deploy/env.sh push \| check` | Merges `~/.config/indahnya/production.env` into `/etc/indahnya/env` (blank values never overwrite), installs the origin certificate, lists missing keys by name |
| `deploy/deploy.sh [--first \| --rollback \| --status]` | Pushes `main`, builds that commit on the server in `releases/<sha>`, migrates, switches `current`, reloads PM2, health-checks, and switches back automatically if the new release is unhealthy |

### Server layout

```
/srv/indahnya/repo             clone of the repo; releases are cut from it with git archive
/srv/indahnya/releases/<sha>   one build per deploy, newest 3 kept
/srv/indahnya/current          symlink to the live release (PM2 runs this path)
/srv/indahnya/shared/_nuxt     hashed assets of recent releases (old tabs keep working)
/srv/indahnya/deploys.log      what went live when
/etc/indahnya/env              runtime config, 600, owner indahnya
/etc/ssl/cloudflare/           origin certificate (Cloudflare → box is TLS too)
/var/backups/indahnya          nightly dumps, 14 days; copies in R2 indahnya-backups, 30 days
```

### TLS and the edge

Every hostname is proxied by Cloudflare. The visitor gets Cloudflare's edge
certificate; Cloudflare reaches the box over TLS with a 15-year Cloudflare
origin certificate, verified (SSL mode Full strict). No certbot, nothing to
renew. nginx takes the visitor's address from `CF-Connecting-IP`, trusted from
Cloudflare's published ranges only.

### Mail

Outbound (sign-in links, retention warnings, alerts) goes through Resend over
SMTP: `smtps://resend:<key>@smtp.resend.com:465`, from `hello@indahnya.my`,
region Tokyo. DKIM is on `resend._domainkey`, the bounce MX and SPF on
`send.indahnya.my`, so nothing collides with Email Routing's records at the
apex. The server's key is send-only and limited to indahnya.my. Resend's free
plan is 3,000 mails a month and **100 a day**; move to Pro before a launch day
could pass that. Inbound `hello@indahnya.my` is forwarded by Cloudflare Email
Routing to the address in `FORWARD_TO`.

## First launch

1. **Server.** An Ubuntu 24.04 VPS (2 vCPU / 4 GB is the floor: the worker
   encodes video). Add an ssh alias `indahnya` (root) to `~/.ssh/config`, then:
   ```bash
   ssh indahnya 'sudo bash -s' < deploy/setup-server.sh
   ```
   On a box that already runs other apps, add `-- --shared` after `bash -s`.
2. **Cloudflare bootstrap token.** Personal account → My Profile → API Tokens →
   Create Token → Custom token. Permissions:
   - Account · Account API Tokens · Edit (to mint the app's narrow tokens)
   - Account · Workers R2 Storage · Edit (enable R2 on the account first)
   - Account · Email Routing Addresses · Edit
   - Zone (indahnya.my) · DNS · Edit, Zone Settings · Edit, SSL and Certificates · Edit, Email Routing Rules · Edit
   Then write `~/.config/indahnya/cloudflare.env`:
   ```
   CF_API_TOKEN=…
   CF_ACCOUNT_ID=…
   VPS_IP=…
   FORWARD_TO=you@example.com
   RESEND_API_KEY=re_…   # Resend → API Keys → Full access; used by the script only
   ```
   and run `node deploy/cloudflare.mjs`. It lists anything still open (for
   example, clicking the verification mail for `FORWARD_TO`). The bootstrap
   token can be deleted afterwards; the app never uses it.
3. **The rest of `production.env`** (`~/.config/indahnya/production.env`):
   `NUXT_STRIPE_SECRET_KEY`, `NUXT_STRIPE_WEBHOOK_SECRET`,
   `NUXT_PUBLIC_LEGAL_NAME`, `NUXT_PUBLIC_LEGAL_REG`, `NUXT_PUBLIC_LEGAL_ADDRESS`,
   `NUXT_ALERT_EMAIL`, and optionally `NUXT_GOOGLE_CLIENT_ID` / `_SECRET`.
4. **Stripe (MY, live):**
   - Enable FPX, cards and GrabPay. Turn on **email receipts** (`/terma` promises one).
   - Webhook to `https://indahnya.my/api/stripe/webhook` with `checkout.session.completed`,
     `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
     `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`.
5. **Push the config and go live:**
   ```bash
   deploy/env.sh push
   deploy/deploy.sh --first
   ```
6. **After:** uptime check on `https://indahnya.my/api/health` (the `Uptime`
   GitHub workflow does it every 10 minutes once the repo variable `UPTIME_URL`
   is set); one test restore of a backup into a scratch database; Google Search
   Console + Bing for the domain (docs/geo/owner-todo.md).

## Each deploy

```bash
deploy/deploy.sh
```

It refuses to run off `main`, with uncommitted changes, or behind
`origin/main`. On the server: `git archive` the commit into
`releases/<sha>`, `npm ci`, `nuxt build` (the live release keeps serving),
migrations, nginx config if it changed (`nginx -t` first), switch `current`,
`pm2 reload`, health check. `pm2 reload` replaces processes gracefully:

- The web side finishes open requests.
- The worker stops claiming new jobs and waits up to 25 s for running ones.
- A job cut off mid-way is picked up again by the next worker after 5 minutes.

## Rollback

```bash
deploy/deploy.sh --rollback
```

Switches `current` to the previous release (still built on disk) and reloads;
no build. Migrations only add things and never drop them, so the previous
build runs against the new schema. A deploy whose health check fails rolls
itself back the same way.

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
