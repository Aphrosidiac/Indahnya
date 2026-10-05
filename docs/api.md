# API

Every route handler in `server/api` and `server/routes`, grouped by who calls
it. All bodies and answers are JSON unless noted. Bodies are validated with
zod (`server/utils/validate.ts`). A bad body is a 400, never a 500. Routes
marked *rate-limited* use `server/utils/rate.ts`, keyed on IP and, where it
makes sense, on email or guest.

Who can call what:

- **Host** routes need a session cookie (`server/utils/session.ts`) and
  membership of the event, as owner or co-host.
- **Guest** routes are public. The guest is identified by a cookie token (a
  browser, not a person), created on first need.
- **TV** routes take the event's `tvToken` as a bearer in the query.

## Auth

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/auth/magic` | Mails a one-shot sign-in link (15 minutes) to `/masuk?t=…`. *Rate-limited* per IP and per email |
| `POST` | `/api/auth/magic/verify` | Spends the token (one use), starts a session, answers `{ next }` through `safeNext`. *Rate-limited* |
| `GET` | `/api/auth/magic/[id]` | Old mailed links. Hands the token to `/masuk` and never spends it on a GET |
| `GET` | `/api/auth/google` | Starts Google sign-in |
| `GET` | `/api/auth/google/callback` | Finishes Google sign-in |
| `POST` | `/api/auth/logout` | Ends the session |
| `GET` | `/api/me` | The signed-in host, or 401 |

## Host: events

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/events` | The host's majlis, newest first. Retention-purged ones stay as history |
| `POST` | `/api/events` | The create wizard. Mints a slug from the names, with a short suffix on collision. *Rate-limited* |
| `GET` | `/api/events/[id]` | One event, with members, counts, upload cap, RSVP and ucapan totals, plan and offers |
| `PATCH` | `/api/events/[id]` | Details, venue (Waze/Maps links must be `https:`), settings, modules, slug |
| `DELETE` | `/api/events/[id]` | Frees the slug at once and leaves the list. A purge job empties the buckets |
| `POST` | `/api/events/[id]/tv-token` | Rotates the TV link. Old screens go blank on their next poll |
| `GET` | `/api/events/[id]/qr` | QR as SVG (print) or PNG. Points at the hub or the gallery. Branded by default |

## Host: media

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/events/[id]/media` | Every state except deleted, newest first, keyset-paged. Hidden items get signed private URLs |
| `PATCH` | `/api/events/[id]/media` | Bulk approve, hide, show or delete. Hiding moves the served copies to the private bucket |
| `GET` | `/api/events/[id]/media/[mid]/original` | Downloads the original photo, or the playable video, as an attachment |
| `GET` | `/api/events/[id]/download` | **Zip** of everything, streamed from the buckets: originals for photos, failed uploads under `gagal/` |

## Host: kad

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/events/[id]/kad` | The editor's view: stored fields, defaults for this type and language, preview URL |
| `PUT` | `/api/events/[id]/kad` | Saves with a row lock and the base version. A stale tab gets 409. Redraws the WhatsApp card |
| `POST` | `/api/events/[id]/kad/assets` | Signed upload slot for a couple photo, the DuitNow QR or the song (private `kad-src/`). *Rate-limited* |
| `POST` | `/api/events/[id]/kad/assets/[aid]` | Processes the landed asset into public `kad/` (WebP, lossless PNG, AAC m4a). ffprobe-sniffed |

## Host: RSVP, seating, ucapan

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/events/[id]/rsvps` | Every reply with totals and the form's rules (`?status=`, `?q=`) |
| `POST` | `/api/events/[id]/rsvps` | Adds a reply taken by phone or in person (`source: host`) |
| `PATCH` | `/api/events/[id]/rsvps/[rid]` | Edits a reply. Someone marked not coming loses their seat |
| `DELETE` | `/api/events/[id]/rsvps/[rid]` | Removes a reply |
| `GET` | `/api/events/[id]/rsvps.csv` | **CSV** for Excel and Sheets: UTF-8 with BOM, formula-safe cells |
| `GET` | `/api/events/[id]/tables` | Tables in order, with seats taken |
| `POST` | `/api/events/[id]/tables` | One table, or a batch ("30 × 10": Meja 1 … Meja 30) |
| `PATCH` | `/api/events/[id]/tables/[tid]` | Renames a table or changes its capacity or order |
| `DELETE` | `/api/events/[id]/tables/[tid]` | Removes a table. Its guests are un-seated, not deleted |
| `PATCH` | `/api/events/[id]/seating` | Seats or un-seats guests, one drag or a batch. Only replies that are coming, only at this event's tables |
| `GET` | `/api/events/[id]/ucapan` | Visible and hidden wishes. Hidden voice notes get signed URLs |
| `PATCH` | `/api/events/[id]/ucapan` | Hide, show or delete wishes. Voice notes move between buckets like photos |
| `GET` | `/api/events/[id]/ucapan.zip` | **Zip** keepsake: `ucapan.txt` plus every voice note as m4a |

## Host: payments

| Method | Path | What it does |
|---|---|---|
| `POST` | `/api/events/[id]/checkout` | A Stripe Checkout Session for one of the current offers (upgrade at the difference, or renewal) |
| `POST` | `/api/events/[id]/reconcile` | Asks Stripe about the newest open session, for when the success page beats the webhook |
| `POST` | `/api/stripe/webhook` | Signed Stripe events. Idempotent on the session id. Flips the plan and moves the clocks |

## Guest (`/api/g/[slug]`)

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/g/[slug]` | What a guest's browser needs first: title, names, date, enabled modules, upload state |
| `GET` | `/api/g/[slug]/kad` | The e-kad, only while the kad module is on |
| `GET` | `/api/g/[slug]/kad.ics` | **Calendar** entry for "Simpan tarikh" (UTC) |
| `POST` | `/api/g/[slug]/name` | The optional name on first upload. Empty clears it |
| `POST` | `/api/g/[slug]/uploads` | Step 1: checks caps and window, inserts `pending`, returns presigned PUTs (type and size signed). *Rate-limited* |
| `POST` | `/api/g/[slug]/uploads/[id]/complete` | Step 2: HEADs the object (never trusts the client), marks it `uploaded`, queues processing |
| `GET` | `/api/g/[slug]/uploads/status` | The uploader polls until each id is ready, hidden (awaiting approval) or failed |
| `GET` | `/api/g/[slug]/media` | Gallery feed: `ready` only, newest first, 40 a page, with reaction tallies |
| `POST` | `/api/g/[slug]/media/[id]/react` | One reaction per browser per photo. `null` takes it back. *Rate-limited* |
| `GET` | `/api/g/[slug]/media/[id]/download` | Downloads a photo as a real attachment (`<a download>` is ignored cross-origin) |
| `DELETE` | `/api/g/[slug]/media/[id]` | A guest takes back their own upload within the delete window (24 hours by default) |
| `GET` | `/api/g/[slug]/ucapan` | Wishes feed: visible only, 30 a page |
| `POST` | `/api/g/[slug]/ucapan` | A written wish (≤500 chars). Held for the host in approval mode. *Rate-limited* |
| `POST` | `/api/g/[slug]/ucapan/audio` | Voice wish, step 1: a pending wish and a signed slot. *Rate-limited* |
| `POST` | `/api/g/[slug]/ucapan/[id]/complete` | Voice wish, step 2: transcodes to mono AAC m4a in the request (at most two at once) |
| `DELETE` | `/api/g/[slug]/ucapan/[id]` | A guest takes back their own wish |
| `GET` | `/api/g/[slug]/rsvp` | The form's rules and this browser's own reply |
| `POST` | `/api/g/[slug]/rsvp` | Creates or updates this browser's reply, with an optional wish. *Rate-limited* |
| `GET` | `/api/g/[slug]/tempat` | Seat search (`?q=`, 3+ letters): at most 5 matches, name and table only. *Rate-limited* |

## TV and the landing sandbox

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/tv/[slug]?token=` | Slideshow feed. `since` returns only what landed after it. `live` lists every id still on show, so hidden photos drop off screens |
| `POST` | `/api/cuba` | Starts or joins a "cuba sekarang" sandbox session: own photos only, 6 at most, swept after an hour. *Rate-limited* |

## Non-API routes

| Path | What it does |
|---|---|
| `/robots.txt` | Built from `NUXT_PUBLIC_SITE_URL` |
| `/sitemap.xml` | Public pages only. A couple's pages are never listed (`noindex`) |
| `/media/[...key]` | **Dev only.** Stands in for `media.indahnya.my` and reads the public bucket. Absent from production builds |
