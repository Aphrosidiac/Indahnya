# Development

Everything you need to run Indahnya on your own machine, change it, and check it.

## Requirements

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 22 | Nuxt 4, `--env-file` |
| Postgres | 15+ | App data (Drizzle) |
| ffmpeg + ffprobe | on `PATH` | Video posters, durations, voice ucapan transcode |
| S3-compatible store | on `:9000` | Uploads. Garage locally, Cloudflare R2 in production |

## First run

```bash
cp .env.example .env          # set DATABASE_URL and the NUXT_S3_* values (see below)
createdb indahnya
npm install                   # also runs `nuxt prepare`
npm run db:migrate
node scripts/dev-bucket.mjs   # CORS on both dev buckets, so the browser can PUT
node --env-file=.env --import tsx scripts/seed-demo.ts   # the sample majlis at /aina-hakim
npm run dev                   # http://localhost:3180
```

The sample majlis (`/aina-hakim`, owned by `demo@indahnya.my`) is what the
landing's "Tengok contoh" links to. It has a full kad, 16 photos, RSVPs,
tables and ucapan. It never takes uploads and never expires. Re-running the
seed replaces its media.

### Local object storage (Garage)

```bash
brew install garage           # or a release binary on Linux
garage -c ~/.local/garage/config.toml server
garage bucket create indahnya-media
garage bucket create indahnya-private
garage key create indahnya-dev
garage bucket allow --read --write --owner indahnya-media --key indahnya-dev
garage bucket allow --read --write --owner indahnya-private --key indahnya-dev
```

Put the key into `.env`:

```dotenv
DATABASE_URL=postgres://localhost:5432/indahnya
NUXT_PUBLIC_SITE_URL=http://localhost:3180
NUXT_S3_ENDPOINT=http://127.0.0.1:9000
NUXT_S3_REGION=garage
NUXT_S3_BUCKET=indahnya-media
NUXT_S3_PRIVATE_BUCKET=indahnya-private
NUXT_S3_ACCESS_KEY_ID=<key id>
NUXT_S3_SECRET_ACCESS_KEY=<secret>
NUXT_S3_PUBLIC_BASE=http://localhost:3180/media
```

In dev, public reads go through the app's `/media/<key>` route, because Garage
has no bucket policies. That route doesn't exist in a production build. Any
other S3-compatible store works the same way.

### Signing in locally

Sign-in is by magic link. Without `NUXT_SMTP_URL`, dev prints the link to the
server log instead of mailing it, so copy it from there. To open the sample's
dashboard, sign in as `demo@indahnya.my`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `:3180` (the worker runs inside it) |
| `npm run build` / `npm run preview` | Production build in `.output/` and a local run of it |
| `npm test` | Vitest: clocks, prices, redirects, EXIF time, slugs, kad, RSVP rules |
| `npm run typecheck` | `vue-tsc` over the app and the server |
| `npm run db:generate` | New migration from `server/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `node scripts/dev-bucket.mjs` | CORS on the dev buckets |
| `node --env-file=.env --import tsx scripts/seed-demo.ts` | (Re)seed `/aina-hakim` |
| `python3 scripts/build-brand.py && node scripts/build-assets.mjs` | Rebuild logo SVGs, favicons, `og.jpg` |
| `node scripts/build-photos.mjs` | Rebuild the landing photo cuts from `scripts/landing-photos.json` |
| `npm run deploy:pages` | Static preview on Cloudflare Pages (see [deployment](deployment.md#static-preview-cloudflare-pages)) |

## Screenshots

The images in `docs/images/` are real captures of the app running locally
against the seeded sample, not mock-ups. They were taken in headless Chromium
at 1560 × 900 (desktop) and 390 × 844 (phone), at 2× density. The dev server
ran with `NUXT_PUBLIC_SITE_URL=https://indahnya.my`, so links and QR codes
show the real domain. The sample's guide bar was hidden on guest pages,
because real majlis don't have it. Re-take them the same way after a visible
UI change.

## Conventions

- **Copy.** Bahasa Melayu is the default, in a colloquial Malaysian register
  (tak, dah, nak, je, kat) with English trade words. English sits beside it.
  Strings live in `app/composables/useT.ts` and the per-page composables
  (`useLanding`, `useAbout`, `useLegal`).
- **UI.** Use the primitives in `app/ui/components` (Card, Field, Toggle, Tabs,
  Btn, PageHead…) before writing new markup. Follow the motion rules in
  [architecture](architecture.md#design-system).
- **Runtime config.** Read it with `useRuntimeConfig()`, never `process.env`,
  except `DATABASE_URL` and `WORKER`. See [deployment](deployment.md#environment).
- **Stores** are imported explicitly (`pinia.storesDirs: []`).
- **Drizzle.** A raw `or(...)` inside `and(...)` needs its own parentheses.
  The sweep once nulled every ready row's keys because of this.
- **S3 SDK.** Keep `requestChecksumCalculation: 'WHEN_REQUIRED'`. Otherwise the
  SDK signs a CRC32 into presigned PUTs that browsers never send, and Garage
  and R2 reject them.

## Tests

Unit tests cover the rules a regression would hurt most: plan clocks and
offers, safe redirects, EXIF time zones, slugs, kad composition and the OG
renderer, and RSVP deadlines. They need no database and no Nuxt runtime.

```bash
npm test
npm run typecheck
```
