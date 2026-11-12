# Indahnya messaging

Checked 2026-11-12. Companion to `docs/seo/strike-plan.md`. Every page, ad, directory listing, social post and
outreach message about Indahnya follows this file.

Facts come from `research/indahnya-truth.md`. If a line needs a fact that is not there, it does not go out until the
fact is added with evidence.

Labels: **[code]** / **[doc]** this checkout · **[sourced]** a vendor's own page, dated · **[inferred]** judgement.

Sections 1–5 come from `market.md` and `competitors.md` (both checked 12 November 2026).

---

## 1. Positioning

### The line

> **Indahnya: satu link untuk seluruh majlis. Kad, RSVP, meja, ucapan dan semua gambar tetamu, disimpan setahun.**
>
> EN: **One link for the whole majlis: the invitation, RSVP, seating, wishes and every guest photo, kept for a year.**

The landing hero ("Semua gambar majlis. Satu QR.") stays as designed. The line above is for titles, meta
descriptions, `/tentang`, directory listings and the first sentence of new pages.

### In one breath

> Indahnya ialah galeri gambar majlis dengan QR untuk Malaysia. Tetamu scan QR atas meja dan upload dari browser
> phone, tanpa app atau login. Satu link yang sama bawa e-kad, RSVP, cari meja dan ucapan suara. Bayar sekali untuk
> satu majlis: percuma untuk 50 upload, RM59 simpan setahun, RM99 simpan dua tahun.

### Why this line (from the research)

- **The category has no common BM name yet** [measured: no autocomplete for "galeri gambar majlis"], while e-kad and
  RSVP are typed often. So the line leads with what people already look for (kad, RSVP) and teaches the gallery
  inside it.
- **Indahnya is not the cheapest.** Gallery-only rivals start at RM15 to RM49 [sourced, competitors.md §2a]. Price is
  never the lead.
- **The two honest edges are the bundle and retention.** RM59 holds the kad, RSVP, table finder, voice wishes and an
  uncapped gallery kept for a year. Rivals keep galleries 7 to 90 days and sell e-kad and RSVP as add-ons or separate
  products [sourced]. Say the numbers; never say "lebih murah" or "terbaik".

## 2. Message hierarchy

1. **What it is**: galeri gambar majlis dengan QR, with the kad and RSVP in the same link.
2. **How guests use it**: scan, upload, no app, no login; photos on the dewan TV with the guest's name.
3. **What the host gets**: one link for kad, RSVP totals, table finder, wishes; one zip of every original.
4. **How long and how much**: kept 1 or 2 years from the majlis day; RM0 / RM59 / RM99, paid once, no per-guest fee.
5. **Who runs it**: FF Dev Studio, Setiu, Terengganu; WhatsApp the person who built it.

## 3. The pillars

| Pillar | Claim (BM) | Proof on the page |
|---|---|---|
| Semua gambar tetamu, satu tempat | Tetamu scan QR, pilih sampai 30 gambar, terus masuk galeri dan TV dewan, dengan nama siapa yang snap. | The sample gallery (fictional, labelled); upload limits from `MEDIA_LIMITS` |
| Satu link untuk seluruh majlis | Kad, RSVP, cari meja, ucapan tulis dan suara, salam kaut DuitNow. Semua dalam pakej percuma. | The five real kad templates; the RSVP fields; the table finder demo |
| Simpan lama, bayar sekali | Simpan setahun (RM59) atau dua tahun (RM99) dari hari majlis. Tak ada subscription, tak ada caj per tetamu. | The plan table from `plans.ts`; a dated market range for retention, unnamed |

## 4. Per-segment messages

| Segment (market.md §2) | Lead with | Page |
|---|---|---|
| Couple, medium or large majlis, 1–3 months out | One link for kad + RSVP + photos; headcount before the caterer needs it | `/`, `/e-kad`, `/panduan/rsvp-dan-susun-meja` |
| Couple with two majlis (belah perempuan, belah lelaki) | How to run both (check the product's answer before writing; see strike-plan §8) | `/harga` FAQ |
| Parents hosting, child sets up | Elders don't install anything; printed QR table cards; WhatsApp a human | `/`, `/panduan/kumpul-gambar-tetamu` |
| Smaller events (tunang, akad, aqiqah, doa selamat) | Percuma is enough for a small majlis: 50 uploads, every feature | `/harga`, `/e-kad` |
| English readers (SG couples, venue managers, mixed families) | Malaysian majlis fit, ringgit, no app for guests | `/en/...` pages |

## 5. Objections and answers

| Objection | Honest answer |
|---|---|
| "Group WhatsApp kan percuma" | Betul, untuk majlis kecil memang cukup. Galeri QR membantu bila tetamu ramai dan tak kenal satu sama lain. Cuba Percuma dulu (50 upload). |
| "Mahal" | Tunjuk apa yang RM59 bawa: kad, RSVP, meja, ucapan, galeri tanpa had, simpan setahun. Never claim cheapest. |
| "Gambar hilang lepas majlis?" | Simpan 30 hari (Percuma), setahun (RM59), dua tahun (RM99), kiraan dari hari majlis. Email sebelum tamat; download semua dalam satu zip. |
| "Orang tua tak reti scan" | Admit it. Print the table card and share the link in the kad and WhatsApp; nobody needs an app. |
| "Gambar aurat / privasi" | Couple pages are hidden from search, location data is removed from shown copies, originals stay private, approval mode shows nothing until the host approves. No passcode claim. |
| "Line dewan teruk" | Upload sambung sendiri bila line kembali. Untuk TV, guna hotspot phone. |
| "Brand baru, tak kenal" | FF Dev Studio, SSM and address on every page; WhatsApp reaches the builder. No reviews or counts until real. |
| "Kad digital percuma ada kat tempat lain" | Betul. Kalau dah ada kad, guna link "gambar sahaja" Indahnya dalam kad tu. |

---

## 6. Voice guide

### Tone

- **Like a cousin who sorts things out at the majlis.** Warm, practical, a little funny. Never salesy.
- **Specific.** Say what happens ("tetamu scan, pilih sampai 30 gambar, terus masuk galeri"), not how good it is.
- **Honest in the same breath.** The limit sits next to the strength ("Percuma: 50 upload, simpan 30 hari").
- **Respectful to rivals and to WhatsApp.** A comparison says when the other option is the better choice.

### Rules

1. **Answer first.** The first 40–60 words answer the page's question and name Indahnya with its category:
   "Indahnya, galeri gambar majlis dengan QR" (EN "Indahnya, a QR photo gallery for Malaysian events"). Never open
   with "ia" or "it".
2. **The name travels with its category in titles.** Never "Indahnya" alone. Legal pages may end in "· Indahnya".
3. **Short sentences.** One idea each. At most 3 sentences per paragraph on marketing pages.
4. **Mechanism over adjective.**
5. **Numbers carry their unit and condition.** "RM59 sekali bayar, untuk satu majlis", "video sampai 60 saat",
   "simpan setahun dari hari majlis".
6. **Prices come from `server/utils/plans.ts`**, never typed by hand on a page.
7. **Every rival fact links the vendor's own page with "disemak <tarikh>" / "checked <date>".**
8. **Say what Indahnya does not do** where a buyer would look for it (no printed album, no photographer, no app).
9. **Label the sample.** Aina & Hakim and their guests are fictional; every page that shows them says so.
10. **No em dashes** in landing copy (project rule). Use a full stop, comma or colon.
11. **Headings in sentence case.** No puns that hide the meaning.

### BM voice

- Colloquial Malaysian BM, the way people talk at a majlis: "korang", "tak payah", "makcik pun boleh", "snap",
  "upload", "scan". English loanwords people actually use stay in English (QR, upload, link, RSVP, slideshow).
- Formal words only where the genre uses them: walimatulurus, aturcara majlis, salam kaut, jemputan.
- Never translate EN copy word for word. Write BM first; EN follows the meaning.
- Spell the genre's terms the way buyers search them (the keyword map records the exact spellings, e.g. "e-kad",
  "kad kahwin digital").

### EN voice

- For Malaysian English readers, Singapore couples and venue managers. Plain international English; keep Malaysian
  terms (majlis, kenduri, aqiqah, salam kaut) with a short gloss the first time on a page.

### Words and phrases to use

| Use | Rule |
|---|---|
| galeri gambar majlis dengan QR / QR photo gallery | The category. Exact anchor points only to `/` |
| sekali bayar, untuk satu majlis / paid once, for one event | The pricing unit |
| tak ada subscription, tak ada caj per tetamu | Always together with the price |
| tak payah app, tak payah login (untuk tetamu) | Guests only; hosts sign in |
| percuma untuk mula: 50 upload | Never "percuma selamanya" or "unlimited free" |
| upload tanpa had | RM59 and RM99 only |
| simpan setahun / dua tahun dari hari majlis | Retention, with its clock |
| kualiti asal | Only for the zip download |
| live atas TV dewan | With the venue-internet condition on pages about the slideshow |
| contoh (rekaan) / sample (fictional) | On every demo screen and sample link |
| disemak <tarikh> / checked <date> | After every rival fact |

### Words and phrases to ban

| Banned | Why | Say instead |
|---|---|---|
| terbaik, nombor 1, paling murah, satu-satunya, pertama di Malaysia, #1, best, cheapest, only, first | Unprovable or false | The mechanism or dated arithmetic |
| dipercayai oleh, ribuan majlis, pasangan bahagia kami, testimonials, ratings, logos | No customers yet | Show the sample |
| percuma selamanya, free forever, unlimited free | Free is 50 uploads, 30 days | "Percuma untuk mula: 50 upload" |
| FPX, kad atau e-wallet (until confirmed live) | Over-claims the CHIP methods | "Bayar melalui CHIP" or the confirmed list |
| tanpa had (alone) | Free is capped | "Upload tanpa had (RM59 dan RM99)" |
| HD, 4K, kualiti asal (for the gallery view) | Shown copies are re-encoded | "Kualiti asal dalam zip" |
| selamat 100%, dijamin, guaranteed, never lose a photo | Not measured | The mechanism (private originals, approval mode) |
| AI, pintar, smart (as a feature) | Indahnya has no AI feature | - |
| co-host / jemput pasangan urus (as a feature) | Parked | - |
| seamless, effortless, powerful, revolutionary, canggih, hebat | Filler | The mechanism |
| em dash (U+2014) in landing copy | Project rule | Full stop, comma, colon |

## 7. Numbers, money and dates

- Ringgit as "RM59", no decimals, no space. "Sekali bayar" after the price, every time.
- Retention and windows in words a host uses: "6 bulan", "setahun", "dua tahun", with "dari hari majlis".
- Dates on pages: "12 November 2026" (BM: "12 November 2026"). Every page shows "Dikemaskini <tarikh>" and the same
  date in JSON-LD `dateModified`.

## 8. Page furniture

### Look

- New pages use the landing layer (`app/assets/css/landing.css`, components in `app/components/landing/`), not the
  app's ANK Ops shell. Same Mekar mark and `<Logo>`; never a font logo.
- Imagery: real Malaysian majlis photos, credited, from `scripts/landing-photos.json`. **No suap or makan beradu
  photos. No people photos on `/tentang`.** Real people must never read as customers; the disclaimer stays.
- Motion rules from ANK: no route transitions; `.reveal` has no fill mode; the LCP element never fades in from
  opacity 0.

### What copy must not lean on

- No numbered eyebrows, no stat rows, no mono-caps labels, no arrows or chips sprinkled through copy.
- One primary action per section, labelled in words ("Buat majlis percuma", "Tengok contoh").

### What leads instead

- The product itself: the live sample (labelled fictional), the real kad templates, the real price table, the real
  print layouts.
- Short how-to steps when the order is real.

## 9. Status lines (exact wording)

| Situation | BM | EN |
|---|---|---|
| Pre-launch (until the owner opens sign-up) | Indahnya belum buka untuk umum. Tengok contoh, atau WhatsApp kami. | Indahnya isn't open to the public yet. See the sample, or WhatsApp us. |
| Payment | Bayar melalui CHIP, dalam Ringgit. Resit ke email. (+ confirmed methods) | Paid through CHIP, in Ringgit. Receipt by email. |
| Sample | Contoh rekaan. Nama dan ucapan semua rekaan. | A fictional sample. Names and wishes are made up. |

## 10. Never claim

1. Customers, couples served, events run, reviews, ratings, press, awards.
2. A launch date or "since".
3. Card or e-wallet payment before the owner confirms them live.
4. Co-host invites, vendor or photographer mode.
5. Original quality in the gallery view (only in the download).
6. That the slideshow works without internet at the venue.
7. Anything about a rival that is not on the rival's own page today.
8. That WhatsApp or Google Drive "rosakkan gambar" or similar, unless the claim is sourced to the vendor's own docs.

## 11. Rules for naming competitors

1. Rivals are named only on `/banding/*` and in the comparison section of a guide. Never on `/` or `/harga`.
2. Every fact: the vendor's own page, linked, "disemak <tarikh>", re-checked within 7 days of publishing and on
   every rival price change.
3. Every comparison page says, near the top, when the rival is the better choice.
4. Tone: factual and kind. Many rivals are small Malaysian businesses too.
