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
| Stack | Next.js 16 (App Router) · Postgres + Drizzle · R2 presigned direct uploads · PM2 + nginx on a VPS. |
| Hosting | VPS for app + Postgres; R2 (personal CF account, same as ffdev.studio) for media. **Which box: decide later, do not ask.** |
| Languages | BM (colloquial MY register, English trade words) + EN in v1. CN later. |
| Event types | kahwin front door; aqiqah / birthday / corporate / graduation as types with copy tweaks only. |
| Media | video ≤60 s and ≤100 MB/clip; photos stored at original res; HEIC → JPEG server-side; client resizes for preview only. |
| Retention | window ends → 30-day grace with email warnings → hard delete from R2. Extend by paying again. |
| Vendor / photographer mode | not v1. Parked. |
| Differentiators | last: face-search "cari gambar saya", WhatsApp reminders, disposable-camera mode, e-kad partner API. |

## Pricing table

| | Percuma | Indahnya RM59 | Indahnya Lengkap RM99 |
|---|---|---|---|
| Uploads | 50 | unlimited | unlimited |
| Upload window | 30 days | 6 months | 12 months |
| Storage | 30 days | 12 months | 24 months |
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
5. Delivery through a public R2 custom domain (`media.indahnya.my`) with
   unguessable keys `events/<event-ulid>/<media-ulid>.<ext>`; hidden media is
   moved under `hidden/` so old links die.

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

## Phases

- **A** — auth, event wizard, upload pipeline, gallery, reactions, moderation,
  zip download, slideshow, QR templates, Stripe upgrade, retention cron.
  Preview at `<id>.indahnya.pages.dev`-style URL or `preview.indahnya.my`.
- **C** — e-kad editor + 5 templates + OG images + salam kaut + embed link.
- **B** — RSVP, seating, ucapan text + audio.
- **Launch** — marketing site, BM/EN copy, TikTok/Lemon8 demo kad, Portal
  Kahwin outreach.
- **Later** — CN, face search, WA reminders, disposable mode, vendor credits,
  partner API for e-kad platforms.

## Open items (need Fakhrul, but not blocking A)

- VPS box (deliberately deferred).
- Stripe MY account under which entity (AP Devotion Enterprise?).
- Registrar + DNS handover for indahnya.my.
- Google OAuth client (personal GCP project).
