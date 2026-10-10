# API

Every route handler in `server/api` and `server/routes`, grouped by who calls
it. All bodies and answers are JSON unless noted. Bodies are validated with
zod (`server/utils/validate.ts`). A bad body is a 400, never a 500. Routes
marked *rate-limited* use `server/utils/rate.ts`: counters in Postgres, keyed on
the client address (`X-Real-IP` from nginx, trusted from loopback only) and,
where it makes sense, on email or guest.

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
| `POST` | `/api/auth/magic/verify` | Spends the token (one use, looked up by its hash) when the host taps "Log masuk", starts a session, answers `{ next }` through `safeNext`. JSON bodies only (415 otherwise). *Rate-limited* |
| `GET` | `/api/auth/magic/[id]` | Old mailed links. Hands the token to `/masuk` and never spends it on a GET |
| `GET` | `/api/auth/google` | Starts Google sign-in |
| `GET` | `/api/auth/google/callback` | Finishes Google sign-in |
| `POST` | `/api/auth/logout` | Ends the session |
| `GET` | `/api/me` | The signed-in host (or `user: null`) and whether Google sign-in is on |
| `DELETE` | `/api/me` | Deletes the account (`{ confirm: "PADAM" }`): every owned majlis is deleted and purged at once, co-hosting ends, the email and name are removed |

## Host: events

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/events` | The host's majlis, newest first. Retention-purged ones stay as history |
| `GET` | `/api/trash` | The owner's majlis deleted in the last 7 days, still restorable |
| `POST` | `/api/events` | The create wizard. Mints a slug from the names, with a short suffix when it is taken, reserved, or was ever given up by another event. *Rate-limited* |
| `GET` | `/api/events/[id]` | One event, with members, counts, upload cap, RSVP and ucapan totals, plan, offers, and the zip's size and part count |
| `PATCH` | `/api/events/[id]` | Details, venue (Waze/Maps links must be `https:`), settings (merged in the database, per section), modules, slug (paid plans; the old one is kept in `slug_history` and redirects) |
| `DELETE` | `/api/events/[id]` | Owner only. Gone from guests and the list at once; purged after 7 days. The slug stays with the event |
| `POST` | `/api/events/[id]/restore` | Owner only. Undoes a delete inside its 7 days, before the purge begins |
| `POST` | `/api/events/[id]/tv-token` | Rotates the TV link. Old screens go blank on their next poll |
| `GET` | `/api/events/[id]/qr` | QR as SVG (print) or PNG. Points at the hub or the gallery. Branded by default |

## Host: media

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/events/[id]/media` | Every state except deleted, newest first, keyset-paged. Hidden items get signed private URLs |
| `PATCH` | `/api/events/[id]/media` | Bulk approve, hide, show or delete. Hiding moves the served copies to the private bucket and purges them from the CDN when configured |
| `GET` | `/api/events/[id]/media/[mid]/original` | Downloads the original, photo or video, as an attachment (RFC 5987 filename) |
| `GET` | `/api/events/[id]/download?part=n` | **Zip** of the originals (photos and videos), streamed, in ~2 GB parts; hidden under `disembunyikan/`, failed uploads under `gagal/` |

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
| `POST` | `/api/events/[id]/checkout` | A CHIP purchase (payable 1 hour) for one of the current offers (upgrade at the difference, or renewal). Records the plan, kind and amount priced; returns CHIP's checkout URL |
| `POST` | `/api/events/[id]/reconcile` | Asks CHIP about the event's open purchases, for when the return page beats the callback. Marks lapsed ones expired |
| `POST` | `/api/chip/webhook` | CHIP success callbacks and account webhook events, RSA-signed (`X-Signature`). Idempotent on the purchase id. Applies exactly what was priced, or flags `needs_refund` and alerts. Cancels the event's other open purchases. Records refunds (full or partial), alerts on chargebacks and failed refunds. Purchases that are not ours change nothing |

## Guest (`/api/g/[slug]`)

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/g/[slug]` | What a guest's browser needs first: title, names, date, enabled modules, upload state |
| `GET` | `/api/g/[slug]/kad` | The e-kad, only while the kad module is on |
| `GET` | `/api/g/[slug]/kad.ics` | **Calendar** entry for "Simpan tarikh" (UTC) |
| `POST` | `/api/g/[slug]/name` | The optional name on first upload. Empty clears it |
| `POST` | `/api/g/[slug]/uploads` | Step 1: checks caps and window, inserts `pending`, returns presigned PUTs (type and size signed), or per-part URLs for files over 16 MB. In a free gallery a slot holds its place 20 minutes. *Rate-limited* |
| `POST` | `/api/g/[slug]/uploads/[id]/complete` | Step 2: assembles a multipart upload (`{ parts }`), HEADs the object (never trusts the client), marks it `uploaded` and queues processing in one transaction |
| `GET` | `/api/g/[slug]/uploads/status` | The uploader polls until each id is ready, hidden (awaiting approval) or failed |
| `GET` | `/api/g/[slug]/media` | Gallery feed: `ready` only, newest first, 40 a page, with reaction tallies |
| `POST` | `/api/g/[slug]/media/[id]/react` | One reaction per browser per photo. `null` takes it back. *Rate-limited* |
| `GET` | `/api/g/[slug]/media/[id]/download` | Downloads a photo as a real attachment (`<a download>` is ignored cross-origin) |
| `DELETE` | `/api/g/[slug]/media/[id]` | A guest takes back their own upload within the delete window (24 hours by default), or releases an unsent slot at any time |
| `GET` | `/api/g/[slug]/ucapan` | Wishes feed: visible only, 30 a page |
| `POST` | `/api/g/[slug]/ucapan` | A written wish (≤500 chars). Held for the host in approval mode. *Rate-limited* |
| `POST` | `/api/g/[slug]/ucapan/audio` | Voice wish, step 1: a pending wish and a signed slot. *Rate-limited* |
| `POST` | `/api/g/[slug]/ucapan/[id]/complete` | Voice wish, step 2: transcodes to mono AAC m4a in the request, metadata stripped (at most two at once per process; a busy server answers 503 and the wish stays retryable) |
| `DELETE` | `/api/g/[slug]/ucapan/[id]` | A guest takes back their own wish |
| `GET` | `/api/g/[slug]/rsvp` | The form's rules and this browser's own reply |
| `POST` | `/api/g/[slug]/rsvp` | Creates or updates this browser's reply, with an optional wish. *Rate-limited* |
| `GET` | `/api/g/[slug]/tempat` | Seat search (`?q=`, 3+ letters): at most 5 matches, name and table only. *Rate-limited* |

## TV and the landing sandbox

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/tv/[slug]?token=` | Slideshow feed. `since` returns only what landed after it. `live` lists every id still on show, so hidden photos drop off screens; it is sent only when it changed (`liveTag`). An old slug still works |
| `POST` | `/api/cuba` | Starts or joins a "cuba sekarang" sandbox session: own photos only, 6 at most (15 MB each), low priority in the queue, swept after an hour. *Rate-limited* |
| `GET` | `/api/health` | For an uptime monitor: 200 when the database, the worker heartbeat and the photo queue are well, 503 otherwise |

## Non-API routes

| Path | What it does |
|---|---|
| `/robots.txt` | Built from `NUXT_PUBLIC_SITE_URL` |
| `/sitemap.xml` | Public pages only. A couple's pages are never listed (`noindex`) |
| `/media/[...key]` | **Dev only.** Stands in for `media.indahnya.my` and reads the public bucket. Answers 404 in a production build |
| `/<old-slug>[/…]` | A slug an event gave up redirects (301) to the event's current address (`server/middleware/old-slug.ts`) |
