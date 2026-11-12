# Indahnya truth inventory (checked 2026-11-12)

Every page, ad, comparison table, FAQ answer and social post about Indahnya must agree with this file.
If copy needs a fact that is not here, it does not go out until the fact is added with evidence.

Labels:

- **[live]**: fetched from https://indahnya.my on 2026-11-12.
- **[code]**: read in this checkout (`feat/seo-landing`, branched from main @ 5745735, which is the live release).
- **[doc]**: the repo's own docs or the AP project state. Owner records, not independent proof.
- **[inferred]**: my reading. Not proven.

Builds on `docs/geo/facts.md` (2026-10-04). Section 6 lists where that file is now out of date.

---

## 0. The rules that catch most mistakes

1. **The site is live but closed.** indahnya.my has served the public pages since 2026-10-10, in pre-launch mode
   (`NUXT_PUBLIC_PREVIEW`). Sign-in, `/app/**`, `/tv/**` and the checkout API are closed: `/masuk` and `/app` send
   visitors to `/mula` ("Indahnya belum buka untuk umum") [live][code `middleware/preview.global.ts`,
   `server/middleware/preview.ts`]. Until sign-up opens, a page may describe the product but its sign-up button lands
   on `/mula`. Never write "sign up now and your QR is ready" as if it works today without that in mind.
2. **Payment methods are not "FPX, kad atau e-wallet" yet.** The landing, `/harga` and `/terma` say so
   [code `useLanding.ts` `pricing.note`]. The last recorded CHIP state (2026-10-14) is **FPX, FPX B2B1 and DuitNow
   QR only** [doc: project state]. Until the owner confirms cards and e-wallets are live, new copy says "FPX dan
   DuitNow QR" or just "bayar melalui CHIP", and the existing line is fixed before release (section 5).
3. **No customers, reviews, counts or launch date exist.** Never write "dipercayai oleh", "ribuan majlis", star
   ratings or "since 2026" [doc: facts.md "Not published"].
4. **The people in the landing photos are not customers.** They are credited Unsplash photos with a disclaimer
   [code `scripts/landing-photos.json`, footer copy]. The sample majlis Aina & Hakim is fictional.

## 1. Claimable now (in the code and on the live site)

### What it is

| Fact | Value | Source |
|---|---|---|
| Definition (BM) | Indahnya ialah galeri gambar majlis dengan QR untuk Malaysia. | [code `useLanding.ts` FAQ][live] |
| Definition (EN) | Indahnya is a QR photo gallery for Malaysian events. | [code][live] |
| Modules, all built | `kad` (e-kad), `gambar` (photo gallery), `ucapan` (wishes), `rsvp`, `tempat` (table finder) | [code `shared/utils/modules.ts` `BUILT_MODULES`] |
| Events named on the site | kahwin, aqiqah, birthday, majlis syarikat | [code hero eyebrow] |
| Operator | FF DEV STUDIO, SSM 202603234793, No 15982 B, Kampung Selamat, Sungai Tong, 21500 Setiu, Terengganu | [code `shared/company.ts`][live footer] |
| Contact | hello@ffdev.studio, WhatsApp +60 13 907 8719 | [code `shared/company.ts`] |

### Plans (`server/utils/plans.ts` `PLANS`; never type a price by hand on a page, read it from there)

| Plan | Price | Uploads | Upload window | Kept | Co-hosts | Own link | Badge on kad |
|---|---|---|---|---|---|---|---|
| Percuma | RM0 | 50 | 30 days | 30 days | 0 | no | shown |
| Indahnya | RM59 once | unlimited | 183 days ("6 bulan") | 365 days | 1 | yes | shown |
| Indahnya Lengkap | RM99 once | unlimited | 365 days | 730 days | 5 | yes | removed |

- Both clocks start at the **later** of payment/creation and the end of the majlis day, capped at 540 days ahead
  [code `clockAnchor`]. Copy: "kiraan bermula dari hari majlis, bukan hari korang buat akaun" is true.
- Upgrades charge only the difference (RM40 from RM59 to RM99) and keep the original anchor; renewals are offered in
  the last 30 days of storage and the grace month [code `offers`, `clocksAfterPayment`].
- "Semua ciri ada dalam pakej percuma" is true: free is limited by count and time, not features [code comment].
- **Co-hosts:** the numbers exist in code but invites are parked; the UI shows members only [doc: project state].
  Do not claim co-host invites.

### Guest side (no sign-in, no app) [code + landing copy]

| Fact | Value | Source |
|---|---|---|
| Upload | Phone browser, up to 30 files per batch | [code `MEDIA_LIMITS.filesPerBatch`] |
| Photo size | up to 40 MB each | [code `photoBytes`] |
| Video | up to 60 s and 100 MB, transcoded to play on every phone | [code `videoSec`, `videoBytes`; worker] |
| HEIC | converted for viewing and download | [code `server/utils/heic.ts`] |
| Poor signal | uploads resume when the connection returns | [code `useUploader.ts`; FAQ] |
| Name on photos | guests give a name; the gallery and TV show it | [code `api/g/[slug]/name.post.ts`] |
| Voice wishes | recorded in the browser, up to 60 s / 10 MB | [code `audioSec`, `audioBytes`] |
| RSVP | name, phone, attending or not, pax, side (lelaki / perempuan / rakan / lain), meal, note; one reply per browser; the host can add replies taken by phone and assign a table; host sees totals; CSV export | [code `server/db/schema.ts` `rsvps`, `api/g/[slug]/rsvp.*`, `rsvps.csv.get.ts`] |
| Table finder | guest types at least 3 letters of a name and gets the table; only for replies marked hadir and already seated | [code `api/g/[slug]/tempat.get.ts`] |
| Seating (host) | host makes tables with a name and capacity and moves hadir replies onto them; over capacity shows red but is allowed | [code `api/events/[id]/seating.patch.ts`, `tables/*`] |
| Wishes zip | `ucapan.txt` with every written wish, and the voice notes as `.m4a` files in `suara/` | [code `api/events/[id]/ucapan.zip.get.ts`] |
| TV slideshow | a secret link the host can rotate; default 7 s per photo, guest names on, shuffle off (all settable) | [code `server/utils/events.ts` defaults, `app/pages/tv/[slug].vue`, `tv-token.post.ts`] |

### Host side [code]

| Fact | Source |
|---|---|
| Approval mode, hide, delete | landing copy; event settings |
| Download all as one zip in time order, original quality | `api/events/[id]/download.get.ts` |
| Wishes zip download | `api/events/[id]/ucapan.zip.get.ts` |
| TV slideshow from one link, new photos join live | `api/tv/[slug].get.ts`, `tv-token.post.ts` |
| Print: A5 poster, A4 poster, folded table card, in the kad's template, BM or EN | `app/components/print/QrStand.vue`; landing |
| "Photos only" QR and link for couples with an e-kad elsewhere | FAQ; `api/events/[id]/qr.get.ts` |
| Sign-in: magic link and Google | `server/api/auth/magic`, `auth/google` |

### E-kad [code `shared/utils/kad-templates.ts`, `app/components/kad/KadView.vue`]

- **Five templates:** Garden, Klasik, Moden, Emas, Minimal.
- Sections: both families, date/time/venue, Waze and Google Maps, countdown, aturcara, doa, tema pakaian,
  salam kaut (DuitNow QR, "scan dengan mana-mana app bank"), contact (WhatsApp/call), background song, photos,
  RSVP, ucapan, table finder, a button to the gallery, "Simpan tarikh" (Google Calendar and `.ics`).
- WhatsApp link preview: a rendered OG image per kad [code `server/utils/kad-og.ts`].

### Privacy [code + /privasi]

- Couple pages are `noindex, nofollow` [live `/aina-hakim`].
- Shown copies are re-encoded with sharp (`.rotate()` without `withMetadata`), which drops EXIF/GPS
  [code `server/worker/process-media.ts`]. Originals are kept in a private bucket [doc].
- PDPA 2010 notice in BM and EN [live `/privasi`].

### One event = one date and one venue [code `server/db/schema.ts` `events.date`, `events.venue`]

A couple with two majlis (belah perempuan and belah lelaki, or nikah and sanding on different days) makes two events,
each with its own plan. There is no two-majlis bundle. Copy must not suggest one link covers both.

## 2. Built but NOT claimable yet

| Thing | Why not |
|---|---|
| Sign-up / "buat majlis sekarang" working end to end | pre-launch mode; opens on the owner's word |
| Card and e-wallet payment | last known CHIP approval is FPX, FPX B2B1, DuitNow QR (2026-10-14) |
| Co-host invites | parked; UI shows members only |
| Vendor / photographer mode | parked |
| "hello@indahnya.my" as a working inbox | may not receive mail; `/privasi` and `/terma` still show it (owner's call) |

## 3. Wording rules that follow from the code

- "Sekali bayar, untuk satu majlis. Tak ada subscription, tak ada caj per tetamu." True.
- "Upload tanpa had" only for RM59 and RM99. Percuma is "50 upload".
- "Simpan setahun / dua tahun" counts from the majlis day (or payment if later).
- "Tak payah app, tak payah login" is true for guests only. Hosts sign in.
- "Live atas TV dewan" needs a laptop or smart TV browser and an internet connection at the venue. The FAQ already
  says to use a phone hotspot.
- "Kualiti asal" is true for the zip download (originals), not for what the gallery shows (re-encoded copies).

## 4. Differentiators that are true in code

1. Photo gallery, e-kad, RSVP, table finder and voice wishes in one link, one price.
2. Guests never sign in or install anything.
3. One-time price per event in ringgit; no per-guest fee.
4. Retention clock from the majlis day, so early set-up doesn't lose time.
5. Live TV slideshow with guest names, no refresh.
6. Print-ready QR posters and table cards in the kad's design.
7. Built and answered by a Malaysian studio; WhatsApp support from the builder.

Whether these beat specific rivals is for `competitors.md`, with dated sources.

## 5. Live copy that over-claims or needs a fix before release

| Where | What | Fix |
|---|---|---|
| `useLanding.ts` `pricing.note` (BM+EN), `/harga`, `/terma` | "FPX, kad atau e-wallet" | match the methods CHIP has live at release |
| `/privasi`, `/terma` | hello@indahnya.my | owner's call (see project state) |
| Every page's `FAQPage` JSON-LD | FAQ rich results were retired in May 2026 | drop the markup, keep the visible FAQ (ACCEPTANCE decision) |

## 6. Where `docs/geo/facts.md` is out of date

- "indahnya.my (not yet registered or live)": it is registered and live in pre-launch since 2026-10-10.
- "Payment: CHIP: FPX, card, e-wallet": see rule 2.
- "SSM number not published": it is in every footer and `/tentang` since 5745735 (2026-10-14).
- Contact row: unchanged and still correct.
