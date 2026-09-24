# Indahnya — build plan

Guest photo gallery + e-kad + RSVP for Malaysian majlis, in one QR.
A side SaaS under FF Dev Studio. Reference product: Wedibox (feature parity is
the v1 target). Hyperlocal MY first, SG/ID/BN second.

Decided 2026-09-19 with Fakhrul. Anything marked *default* was proposed by AP
and accepted without discussion — change freely.

## Decisions (do not re-ask)

| Topic | Decision |
|---|---|
| Name / domain | **Indahnya**, `indahnya.my` (available on MYNIC 2026-09-19, Fakhrul registers). `indahnya.ffdev.studio` → 301. Footer: "Built by FF Dev Studio". |
| v1 scope | All three Wedibox layers: A gallery, B guestbook/RSVP/seating, C e-kad. |
| Build order | A → C → B. Preview deploy after each. |
| E-kad stance | Both: our own e-kad (compete) **and** an embeddable gallery link/widget couples can paste into a Jemputan.me/SayaKahwin card (complement). |
| Pricing | Free / RM59 / RM99, one-time per event, no subscription. |
| Payments | Stripe MY (FPX + cards + GrabPay). |
| Host auth | Email magic link + Google. Guests never sign in. |
| Stack | **Nuxt 4 (Vue 3)** · Postgres + Drizzle · R2 presigned direct uploads · PM2 + nginx on a VPS. Was Next.js; switched 2026-09-20 because the UI must be ANK Ops verbatim and ANK's design system is Vue (`app/ui/`, copied from `ANKPets/packages/ui`). |
| Hosting | VPS for app + Postgres; R2 (personal CF account, same as ffdev.studio) for media. **Which box: decide later, do not ask.** |
| Languages | BM (colloquial MY register, English trade words) + EN in v1. CN later. |
| Event types | kahwin front door; aqiqah / birthday / corporate / graduation as types with copy tweaks only. |
| Media | video ≤60 s and ≤100 MB/clip; photos stored at original res; HEIC → JPEG server-side; client resizes for preview only. |
| Retention | window ends → 30-day grace with email warnings → hard delete from R2. Extend by paying again (renewal offered in the last 30 days of storage and in the grace month). |
| Clocks | Upload + storage windows run from the LATER of payment/creation and the end of the majlis day (capped at 2 years' lead). Decided in the 2026-09-24 audit: clocks from creation expired free galleries before the wedding. |
| Upgrade price | std → full charges the difference (RM40). *default*, 2026-09-24 audit. |
| Storage split | Two buckets: public (served copies of ready media, behind media.indahnya.my) and private (originals with EXIF/GPS, hidden and approval-pending media). 2026-09-24 audit. |
| Vendor / photographer mode | not v1. Parked. |
| Differentiators | last: face-search "cari gambar saya", WhatsApp reminders, disposable-camera mode, e-kad partner API. |
| UI | **Exactly ANK Ops**: tokens, 33 primitives, transitions (veil/pop/drop/slide, `.reveal` no-fill keyframes, no route transitions), shell, composition rules. Guest pages use the same language one size warmer. |
| Landing page | **Built 2026-09-20** at `/` (BM default, `?lang=en`). Direction from the Awwwards study: Cosmos (gallery-as-hero), Opal/Polaroid (flow told visually), Daylight (warm ground + one accent), POV's section order. Photos are Unsplash-licensed (`public/landing/`) until real majlis photos exist. `/privasi` and `/terma` are still unwritten. |

## Pricing table

| | Percuma | Indahnya RM59 | Indahnya Lengkap RM99 |
|---|---|---|---|
| Uploads | 50 | unlimited | unlimited |
| Upload window | 30 days after the majlis | 6 months | 12 months |
| Storage | 30 days after the majlis | 12 months | 24 months |
| Video | ✓ (counts as upload) | ✓ | ✓ |
| Live slideshow | ✓ | ✓ | ✓ |
| E-kad + RSVP + seating + guestbook | ✓ | ✓ | ✓ |
| Co-hosts | – | 1 | 5 |
| Custom slug `indahnya.my/aina-hakim` | – | ✓ | ✓ |
| Remove "Indahnya" badge on e-kad | – | – | ✓ |

Free tier is limited by retention and count, never by features — same lever
Wedibox uses. Upgrade is a Stripe Checkout session; webhook flips `plan`.

## Guest flow (no app, no account)

1. Scan QR / open link → `indahnya.my/<slug>` (the e-kad hub) or
   `indahnya.my/<slug>/gambar` (gallery-only entry, for the "complement" case).
2. Tabs: Kad · Gambar · Ucapan · RSVP · Tempat duduk. Only enabled modules show.
3. Upload: multi-select from camera roll or shoot; progress per file; queued
   offline (Service Worker) and retried. First upload asks for a name (optional,
   stored in a cookie → "gambar saya").
4. Gallery: masonry, newest first, tap → full view, reactions (❤ / 🎉 / 🥲),
   download single. Guest can delete their own within 24 h.

## Host flow

1. Sign in (magic link / Google) → "Cipta majlis" wizard: type, names, date,
   venue → slug → done in <2 min. Free plan by default.
2. Dashboard: overview (uploads, RSVP counts), Gambar (grid, approve/hide/
   delete, bulk download as zip — server-streamed from R2), Slideshow (TV URL +
   settings), Kad (editor), RSVP (list, meal, pax, side, CSV), Tempat duduk
   (tables drag-drop), Ucapan (text/audio moderation), QR (printable templates
   A5/A4/tent card, BM/EN copy), Tetapan (co-hosts, plan, delete).
3. Upgrade → Stripe Checkout → back to dashboard.

## E-kad (layer C) — local fields

- Dual pihak: nama pengantin + ibu bapa (lelaki / perempuan), or single-side.
- Tarikh, masa, aturcara (list), alamat + Waze + Google Maps buttons.
- Countdown, doa/ayat, background music (upload or link), gallery of couple's
  own photos, dress code, contact numbers (WhatsApp deep links).
- **Salam kaut**: DuitNow QR image + account details, "Bagi hadiah" button.
- Ucapan feed embedded (from layer B). RSVP button embedded.
- OG image generated per kad for WhatsApp previews.
- Templates: 5 at launch (Garden, Klasik, Moden, Emas, Minimal). CN/Indian
  templates later.
- Badge "Indahnya · FF Dev Studio" unless RM99.

## Layer B

- **RSVP**: hadir/tidak, pax, side (lelaki/perempuan/rakan), meal, note.
  Guest search by name to find an existing entry. CSV export.
- **Tempat duduk**: tables (name, capacity) → assign RSVP entries by drag-drop;
  guest-facing "cari nama" → table number.
- **Ucapan**: text + optional photo; **audio ucapan** recorded in-browser
  (MediaRecorder, ≤60 s, webm/m4a → stored in R2, transcoded to m4a).
- All moderated from the dashboard; hidden by default only if host enables
  approval mode.

## Data model (Postgres, Drizzle)

```
users            id, email, name, google_sub?, created_at
events           id, owner_id, slug (unique), type, title, names json,
                 date, venue json, plan (free|std|full), plan_paid_at,
                 upload_window_ends_at, storage_ends_at, settings json
                 (approval_mode, modules_enabled, slideshow opts, locale)
event_members    event_id, user_id, role (owner|cohost)
guests           id, event_id, name?, cookie_token, created_at
media            id, event_id, guest_id?, kind (photo|video|audio),
                 r2_key, thumb_key?, width, height, duration?, bytes,
                 status (pending|uploaded|ready|hidden|deleted),
                 taken_at?, created_at
reactions        media_id, guest_id, kind
messages         id, event_id, guest_id, kind (text|audio), body?, media_id?,
                 status, created_at
rsvps            id, event_id, name, phone?, attending, pax, side, meal,
                 note, table_id?, created_at
tables           id, event_id, name, capacity, sort
kad              event_id, template, fields json, music_key?, og_key?
payments         id, event_id, stripe_session_id, amount, plan, status
```

## Upload pipeline

1. Client asks `POST /api/events/:id/uploads` with {name, type, bytes} →
   server validates caps, inserts `media(status=pending)`, returns R2
   presigned PUT URL (15 min).
2. Client PUTs directly to R2 (VPS never sees the bytes).
3. Client calls `POST /api/uploads/:id/complete` → server HEADs the object,
   marks `uploaded`, enqueues processing.
4. Worker (same VPS, pg-boss or a simple cron loop): HEIC→JPEG, EXIF strip +
   `taken_at`, thumb (WebP 480/1200), video poster frame + ffprobe duration,
   audio transcode → `ready`. Slideshow and gallery only show `ready`.
5. Delivery through a public R2 custom domain (`media.indahnya.my`) on the
   PUBLIC bucket only, keys `events/<event-ulid>/<media-ulid>.<ext>`.
   Originals and hidden media live in the PRIVATE bucket (no public access);
   hiding moves the served copies across buckets so old links die and cannot
   be guessed back. Hosts read private objects through short presigned GETs.

## Routes

```
/                         marketing (BM default, /en)
/harga /contoh /blog      marketing
/masuk                    host auth
/app                      dashboard (list events)
/app/[eventId]/...        overview | gambar | slideshow | kad | rsvp | tempat | ucapan | qr | tetapan
/[slug]                   e-kad hub (SSR, OG)
/[slug]/gambar            gallery + upload
/[slug]/ucapan /rsvp /tempat
/tv/[slug]?token=         slideshow (fullscreen, autoplay, reconnecting)
/api/...                  route handlers; webhooks at /api/stripe/webhook
```

## Phase C — e-kad (built 2026-09-24)

- `/[slug]` IS the e-kad when the kad module is on (default); off → the plain
  hub. Genre structure, checked against Jemputan.me: tap-to-open cover (the
  gesture that starts the song), invitation (hosts, full names), the day
  (+ Waze / Google Maps / .ics / Google Calendar), countdown, aturcara,
  couple photos, the guests' gallery (Indahnya's edge), doa, dress code +
  colours, salam kaut (accounts + DuitNow QR), and a bottom bar Hubungi ·
  Lokasi · Lagu · Salam kaut · Gambar.
- 5 templates in `shared/utils/kad-templates.ts` (Garden, Klasik, Moden,
  Emas, Minimal), all text colours ≥ 4.5:1. Fonts self-hosted (Fontsource).
- Editor `/app/[id]/kad`: ANK Ops form + a phone-frame iframe running the
  real guest component on the draft (`composeKad` shared by server + editor).
  Text equal to the default is stored as "default" so a language switch
  re-words the kad.
- Assets (cover, ≤12 photos, DuitNow QR, song) upload like guest media
  (private `kad-src/`) and are processed into public `kad/` (WebP, lossless
  PNG, AAC m4a ≤ 8 min). Save validates every key belongs to the event.
- WhatsApp preview per kad (`server/utils/kad-og.ts`): fontkit → SVG
  outlines → sharp, fonts bundled in `server/assets/fonts`, identical on a
  font-less VPS. Re-drawn on every save.
- Embed: `/embed/[slug]` widget (framing allowed only there) + gallery link,
  both on the QR page for couples whose kad lives elsewhere.
- Saves take a row lock and carry the version they were based on (a stale
  tab or a co-host gets 409, never a silent overwrite). Uploads a host never
  saves are removed by a `kad_gc` job booked a day after any kad upload.
  Audio is sniffed by ffprobe (mp3/m4a/wav/ogg only, local file only, 60 s
  timeout). Module off → the guest API returns no kad data at all.
- Demo `/aina-hakim` seeds a full kad. Not in v1 of C: music by link
  (upload only — hot-linked audio breaks), ucapan/RSVP inside the kad (Phase B).

## Audit (2026-09-24)

Full audit of Phase A + landing; everything below was fixed and verified in
the running app (curl probes + browser at 375 and desktop). The ordering is
by severity.

- **Hidden photos were still public**: hiding moved a key to `hidden/<key>`
  in the same public bucket (guessable from the old link), and the original
  (full EXIF, GPS) sat at `events/<id>/orig/<id>.<ext>` in that bucket too.
  → two buckets.
- **Free galleries expired before the wedding**: clocks ran from creation;
  a free event made 8 weeks early closed uploads 3 weeks before the day.
  → clocks from the majlis date; migration 0002 backfills.
- **Open redirect** after sign-in (`next=//evil.com`), and in the Google flow.
- **Magic link spent by mail scanners** (GET consumed it). → /masuk spends it with a POST.
- **Presigned PUT had no size bound** (5 GB into a 3 MB slot). → Content-Length signed.
- Upload cap race (check-then-insert), `javascript:` Waze/Maps links on the
  public hub, zod errors as 500s, no rate limits, sign-in links logged in
  production when SMTP is missing, HTML-unescaped titles in mails,
  nodemailer high CVEs, no security headers, guest pages indexable.
- Renewal impossible (checkout refused same/lower plan) despite the retention
  mails saying "lanjutkan"; std→full charged full price; reconcile never ran
  on the return from Stripe (event not loaded at mount); retention `notified`
  never reset after paying; deleted events stayed in the host's list.
- TV kept showing hidden photos until reloaded; rotating the TV link did not
  blank old screens; zip opened every S3 stream at once; video held whole in
  memory; EXIF time read in the server's zone (8 h off); >30 files in one
  pick failed the whole batch; files with no MIME type (Android HEIC) refused;
  "retry when back online" promised on the landing but not implemented.
- Guest tabs linked to Ucapan/RSVP pages that do not exist; /privasi and
  /terma 404'd; the landing's sample gallery 404'd without seed data;
  buttons nested in links; toggle knob overflowing its track; drawer shadow
  bleeding on phones.

- **Runtime config ignored the server's env**: nuxt.config read
  `process.env.STRIPE_SECRET_KEY` etc. at BUILD time; at runtime only `NUXT_*`
  names override. A signed Stripe webhook was rejected by a prod build. →
  every runtime value is a `NUXT_*` env var (see .env.example); nothing is
  baked into `.output`.
- Second pass (independent review of the fixes): an upgrade near expiry was
  cheaper than a renewal and restarted the clock (→ an upgrade keeps the paid
  plan's anchor); re-dating a finished event bought storage (→ only while
  the majlis is ahead; lead capped at 18 months); a transient bucket error
  failed a photo for good (→ only content errors fail; the rest retry);
  copies written for a row deleted mid-processing were orphaned; host
  delete left bytes public for up to an hour; hide/show raced (→ per-photo
  advisory lock, idempotent moves); a cancelled zip hung a socket; approved
  or re-shown photos never reached the TV (→ fetched by id from `live`);
  payments landing on purged/deleted events are logged `REFUND NEEDED`.
  Failed uploads now go in the zip under `gagal/`, as sent.
  `scripts/migrate-split-buckets.ts` moves any pre-split data.

Added: `/privasi` + `/terma` (BM/EN, PDPA), error page, demo seed, OG card +
favicons + manifest, sitemap + robots, JSON-LD, WebP landing thumbs, vitest
(29 tests), migrations 0001 (`deleted_at`) and 0002 (clock backfill).

**Needs Fakhrul before launch:** review the refund line in /terma (AP wrote
"full refund if the gallery fails on the day because of us, within 14 days")
and add the SSM number to both legal pages once FF Dev Studio's is final.

## Status (2026-09-20)

**Phase A built and verified locally** (commit 566e390): magic-link auth,
event wizard, presigned upload → worker (sharp/HEIC/ffmpeg) → gallery,
reactions, guest self-delete, host moderation (hide moves objects under
`hidden/` so copied links die), zip download, TV slideshow with live poll,
QR SVG/PNG + 3 print sheets, Stripe Checkout + webhook + reconcile,
retention sweep + 3 warning mails, approval mode. Phone width clean at 375.

**Dev rig:** Postgres `indahnya` local; **Garage** (S3-compatible, brew) on
:9000 with bucket `indahnya-media` — MinIO's brew download 410'd; dev reads
go through `/media/<key>` (dev-only Nitro route) because Garage has no bucket
policies. Config in `~/.local/garage/config.toml`; `GARAGE_CONFIG_FILE` env.
Start: `garage -c ~/.local/garage/config.toml server`.

**Blocked on Fakhrul:** an R2 API token (Object Read & Write) on the personal
CF account — the `ffdevstudio-mac` token is zone-scoped and wrangler's OAuth
login is the Lewix account, so AP could not create the bucket. Also: domain,
Stripe MY (FF entity), Google OAuth client, SMTP.

**Traps met:** AWS SDK v3 flexible checksums sign a CRC32 into presigned PUTs
that browsers never send (Garage and R2 reject) → `requestChecksumCalculation:
'WHEN_REQUIRED'`; a raw `or` inside drizzle `and()` needs its own parentheses
(the sweep once nulled every ready row's keys); `Sk` seeded widths must be
rounded or SSR/client `sin()` differ past 11 digits; head composables must
run before a top-level `await` inside a composable.

## Phases

- **A** — auth, event wizard, upload pipeline, gallery, reactions, moderation,
  zip download, slideshow, QR templates, Stripe upgrade, retention cron.
  Preview at `<id>.indahnya.pages.dev`-style URL or `preview.indahnya.my`.
- **C** — e-kad editor + 5 templates + OG images + salam kaut + embed link. **Built 2026-09-24.**
- **B** — RSVP, seating, ucapan text + audio.
- **Launch** — marketing site, BM/EN copy, TikTok/Lemon8 demo kad, Portal
  Kahwin outreach.
- **Later** — CN, face search, WA reminders, disposable mode, vendor credits,
  partner API for e-kad platforms.

## Open items (need Fakhrul, but not blocking A)

- VPS box (deliberately deferred).
- Stripe MY account under FF Dev Studio (own SSM + gateways). Fakhrul creates it.
- Registrar + DNS handover for indahnya.my.
- Google OAuth client (personal GCP project).
