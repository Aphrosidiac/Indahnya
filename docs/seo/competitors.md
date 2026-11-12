# Indahnya competitor teardown: synthesis

Checked 12 November 2026. This file pulls together the nine teardowns in `docs/seo/research/competitors/` (about 20 vendors) and the market research next to them. It does not redo them. Indahnya facts come only from `docs/seo/research/indahnya-truth.md` (the truth file, checked 12 November 2026; it supersedes the stale `docs/geo/facts.md`) and the code it cites (`server/utils/plans.ts`). Where unsure: check against the truth file.

**Labels.** Every claim carries one:
- [measured]: I fetched it, or counted it, on 12 November 2026.
- [sourced]: the vendor's own page, URL in the teardown, checked 12 November 2026.
- [third-party]: someone else's page (often a rival's). A claim, not proof.
- [inferred]: my reading or arithmetic.
- [unverified]: could not confirm.

**Evidence limits.**
1. Rankings were not measured. "Footprint" means pages a vendor publishes, from its own sitemap and titles.
2. Trustpilot, Reddit and Capterra returned 403 or were not fetchable. Complaints about rivals could not be read. "Weaknesses" are from the rivals' own policies and pages, plus a few search summaries marked [third-party].
3. Facebook, Instagram and TikTok were login-walled. No social follower counts were recorded.
4. Proof numbers (customers, weddings, ratings) are the vendors' own claims. None was verified.
5. Prices change quickly. Rival promos moved while I worked (povkita promo, Kenang struck price, Wedibox holiday sale). Every cell below carries the date.
6. Jemputan.me per-tier feature icons and Kululu prices did not come through as text. Marked [unverified].
7. Payment methods of several rivals were not stated on the pages read.

## 0. The short version

1. **The brief is out of date.** It names Kenangan as "the only local QR-gallery rival seen". I found at least six more Malaysian galleries (Kenang, momenspace, povkita, Gathrly, JomGambar, Neekah Kita) plus tetamu.me and Raikad with photo features [measured]. Wedibox is not Malaysian: English and French, USD, no MYR [measured]. KadKami is "Coming Soon", not a live competitor [sourced].
2. **Four groups.**
   - Malaysian QR galleries, gallery-first: Kenangan, Kenang, momenspace, povkita, Gathrly, JomGambar.
   - Malaysian invitation-first with a gallery add-on: Neekah Kita, tetamu.me, Raikad; Kenangan also sells e-kad + RSVP at +RM30.
   - Malaysian e-kad only: Tuan Majlis, EkadInvite, Nak Jemput, Jemputan.me, KadKami.
   - Global QR apps: Wedibox, GuestPix, POV, GuestCam, Kululu.
   - Plus the free options: WhatsApp, Google Drive, Google Photos, photographer only.
3. **Indahnya's honest edges** (all confirmed in the truth file): retention (kept 1 or 2 years against 7 to 90 days, and Kenangan's 2 months), no photo cap on paid plans, one plan that holds e-kad, RSVP, table finder and voice wishes on every tier including Percuma (the truth file notes free is limited by count and time, not features), BM-first with ringgit, a real free plan. No Malaysian rival page I read shows both a table finder and voice wishes.
4. **Indahnya is not the cheapest at the bottom.** Gallery entry prices: povkita RM15 promo, momenspace RM39, Kenangan RM35, Gathrly RM49, JomGambar RM49, all below RM59 [sourced]. E-kad entry: Raikad RM0, Nak Jemput RM27.90, EkadInvite RM29, Neekah Kita RM29 [sourced].
5. **Kenangan is the SEO rival.** 28 unique pages, 7 comparison pages, bilingual, structured data, dated sources, same payment gateway (CHIP) [measured, sourced]. Neekah Kita (347 URLs) and Raikad (247) have bigger footprints but in invitations, not galleries.
6. **Wedibox's price ladder mirrors Indahnya's** ($0 / $49 / $79 with a 6 month window and 1 year storage at the middle tier, against Indahnya's RM0 / RM59 / RM99 with 6 months open and 1 year kept) [sourced: wedibox.com/pricing; facts.md]. Do not accuse anyone of copying. Differentiate on language, ringgit and Malaysian majlis fit.
7. **Do not ship a comparison page before the rules in section 6.**

## 1. Who is in the field

| Group | Vendors | Notes |
|---|---|---|
| Malaysian gallery-first | Kenangan, Kenang (kenang.my), momenspace, povkita, Gathrly, JomGambar | Mostly 2026 launches [inferred]. Gallery caps and short retention |
| Malaysian invitation-first with gallery | Neekah Kita, tetamu.me, Raikad; Kenangan (+RM30 e-kad and RSVP) | Closest to Indahnya's bundle |
| Malaysian e-kad only | Tuan Majlis, EkadInvite, Nak Jemput, Jemputan.me, KadKami (coming soon) | Cheap, commoditised, big SEO lane |
| Global | Wedibox, GuestPix, POV, GuestCam, Kululu | USD, English; Wedibox and GuestPix mirror Indahnya's feature list best |
| Free defaults | WhatsApp, Google Drive, Google Photos, photographer only | The real competitor for many couples |

## 2. Comparison tables

All cells [sourced], vendor's own page, checked 12 November 2026, URL in the last column. "Not seen" is [measured] (searched the pages I read) and does not mean the feature does not exist ([unverified]). The Indahnya row comes from facts.md and the code and is marked [truth file] where it is not a vendor page. Prices in RM unless USD is stated; I did not convert dollars.

### 2a. Guest-photo galleries

| Vendor | Free tier | Paid price (one time per event) | Retention / window | Photo cap | Source |
|---|---|---|---|---|---|
| Indahnya [truth file] | RM0: 50 uploads, upload window 30 days, kept 30 days | RM59, RM99 | RM59: open 183 days, kept 365 days. RM99: open 365 days, kept 730 days (clocks start at the majlis day) | none on paid plans | indahnya-truth.md section 1; `server/utils/plans.ts` |
| Kenangan | none | RM35 base; +RM10 video; +RM30 e-kad and RSVP; +RM5 per month | 2 months from gallery opening | unlimited (fair use) | https://kenanganmajlis.com/harga |
| Kenang | none | RM99 (struck from RM149); RM148 for two majlis | 3 months after the majlis | 20 shots per guest | https://kenang.my/ |
| momenspace | RM0: 50 photos, 1 day upload, 7 day gallery | RM39 (150 files, 3 days upload, 14 days); RM99 (unlimited fair use, 7 days upload, 30 days) | 7 to 30 days | 50 / 150 / unlimited | https://momenspace.my/pricing |
| povkita | none | RM15 promo (RM20 normal): 30 photos; RM25 promo (RM40 normal): 500 photos plus video | 1 month / 6 months | 30 / 500 | https://www.povkita.com/ |
| Gathrly | RM0: 100 photos, 7 days | RM49 (1,000, 30 days); RM149 (5,000, 60 days); RM299 (10,000, 60 days); +RM29 for 30 days | 7 to 60 days | 100 to 10,000 | https://gathrly.my/pricing |
| JomGambar | RM0 trial: 20 photos, 7 days | RM49 (1,000, 60 days); RM99 (4,000, 90 days) | 7 to 90 days | 20 to 4,000 | https://www.jomgambar.my/ |
| Neekah Kita | RM0: 50 photos, 7 days | RM99 (500 photos, video, 90 days) | 7 to 90 days | 50 / 500 | https://neekahkita.com/guest-gallery |
| tetamu.me | not seen | RM99 per album | not seen | not seen | https://tetamu.me/album |
| Wedibox | $0: 50 uploads | $29 embed; $49; $79 (USD) | $49: 6 months upload, 1 year storage. $79: 1 year upload, 2 years storage | unlimited | https://www.wedibox.com/pricing |
| GuestPix | $0: 50 photos, 30 day window | $49; $89; $119 (USD) | 3 to 12 months upload; 12 to 24 months hosting | unlimited (fair use) | https://guestpix.com/weddings-pricing/ |
| POV | free up to 10 guests | $34.99 USD up to 100 guests (+$20 business essentials) | not captured | shot-limited | https://pov.camera/pricing |
| GuestCam | not seen | $49 and $97 (USD, struck from $55 and $110) | 6 months upload, 12 months storage (Standard) | unlimited | https://guestcam.co/pricing |

### 2b. Features beyond photos

| Vendor | e-kad | RSVP | Seat finder | Voice wishes | Live TV | Payment methods stated | Language |
|---|---|---|---|---|---|---|---|
| Indahnya [truth file] | yes, 5 templates, salam kaut DuitNow QR | yes, with side, meal, pax, CSV | yes | yes, up to 60 s | yes, needs internet at the venue | CHIP: FPX and DuitNow QR are the last confirmed methods; card and e-wallet are not claimable yet | BM, EN |
| Kenangan | +RM30 | +RM30 | not seen | own table says not available | yes (projector mode) | CHIP, FPX in page | BM, EN |
| Kenang | not seen | not seen | not seen | yes (30 s) | live gallery view; TV not stated | FPX, DuitNow QR | BM, EN |
| momenspace | not seen | not seen | not seen | not seen | Live Wall on all plans | not stated | BM, EN |
| povkita | not seen | not seen | not seen | not seen | not seen | WhatsApp enquiry, no payment on page | BM, EN |
| Gathrly | not seen | not seen | not seen | not seen | Live Wall | Apple in-app purchase (iOS app) | BM, EN |
| JomGambar | not seen | not seen | not seen | not seen | live projection | not stated | BM |
| Neekah Kita | yes (RM29, RM49) | yes | not seen | not seen | Live Wall | FPX, card, DuitNow QR | BM, EN |
| tetamu.me | yes (RM39, RM59, RM89) | RM59 and up | not seen | yes (album) | not seen | not stated | BM |
| Wedibox | wedding website, not a Malay e-kad [inferred] | $79 | $79 | yes | yes | not stated | EN, FR |
| GuestPix | invites with RSVPs | yes | not listed (Wedibox's claim) | not offered (Wedibox's claim) | yes (Wedibox's claim) | not stated | 6 languages, no BM |

Sources for 2b: the same URLs as 2a plus the vendor teardowns. Wedibox's statements about GuestPix are [third-party], from https://www.wedibox.com/compare/guestpix (28 July 2026).

### 2c. e-kad only

| Vendor | Price | Source |
|---|---|---|
| Raikad | RM0 "buat masa ini", 100 designs | https://raikad.com/ |
| Nak Jemput | RM27.90 Basic; RM57.90 Premium | https://nakjemput.com/pakej |
| EkadInvite | RM29 Gold; RM69 Diamond; 48 hour refund | https://ekadinvite.my/harga |
| Neekah Kita | RM29 Basic; RM49 Premium | https://neekahkita.com/ |
| Jemputan.me | RM30 / RM40 / RM60 per card | https://jemputan.me/packages |
| tetamu.me | RM39 / RM59 / RM89 | https://tetamu.me/packages |
| Tuan Majlis | RM59.90 one package | https://tuanmajlis.com/ |
| KadKami | coming soon, custom requests by email | https://kadkami.com/ |

## 3. Positioning lines (hero or title, verbatim)

| Vendor | Line | Source |
|---|---|---|
| Kenangan | "Kumpulkan gambar tetamu dengan satu kod QR" / "Gambar dan video tetamu tak patut hilang dalam WhatsApp." | https://kenanganmajlis.com/ |
| Kenang | "Setiap tetamu anda ialah photographer." | https://kenang.my/ |
| momenspace | "Satukan momen daripada tetamu." | https://momenspace.my/ |
| povkita | "YOUR WEDDING. EVERY POINT OF VIEW." | https://www.povkita.com/ |
| Gathrly | "Setiap tetamu jadi jurugambar anda" | https://gathrly.my/ |
| JomGambar | "Guestbook & Live Gallery #1 di Malaysia" (self-description) | https://www.jomgambar.my/ |
| Neekah Kita | "Kad Kahwin Digital, Fizikal & Welcome Board" | https://neekahkita.com/ |
| Tuan Majlis | "Kad kahwin digital seindah hari bahagia anda." | https://tuanmajlis.com/ |
| EkadInvite | "Kad jemputan digital yang beritahu siapa akan datang." | https://ekadinvite.my/ |
| Wedibox | "One Wedding QR Code. Every Photo Your Guests Take." | https://www.wedibox.com/ |

Pattern [inferred]: the gallery lane all says "guest = photographer". The invitation lane says "siap dalam 10 minit". Nobody leads with retention ("gambar kekal bertahun-tahun") or with "satu link untuk semua". That space is open, but only the retention part is backed by numbers today.

## 4. SEO footprint

All [measured] 12 November 2026 from each vendor's sitemap.xml and robots.txt.

| Vendor | Sitemap URLs | Page types | Comparison pages | Languages |
|---|---|---|---|---|
| Kenangan | 56 (28 unique) | home, harga, ciri, artikel, panduan, FAQ, legal, affiliates | 7 (vs Kenang, Gathrly, povkita, momenspace; vs WhatsApp, Google Photos, photographer) | BM, EN |
| Neekah Kita | 347 | 66 design catalogue pages, about 270 sample invitations, guest-gallery, vendor | none seen | BM, EN |
| Raikad | 247 | about 200 templates, 10 panduan, 8 ciri, event-photo-sharing | 4 (SayaKahwin, KahwinNow, Canva, Google Form) | BM, EN |
| EkadInvite | 116 | 28 design pages by event type, 16 guides, harga, reviews | none seen | BM, EN |
| Wedibox | 237 | 140 help, 25 French, drops, embed, features, blog, tools | 7 (GuestPix, GuestCam, Kululu, RSVPify, best apps, pricing) | EN, FR |
| GuestPix | about 250 (WordPress, 6 sub-sitemaps) | pages, 75 posts, 59 landing pages, gift guides | not checked | 6 |
| GuestCam | 52 | 27 blog, 6 photo-sharing, 3 versus, audio guestbook | 3 (GuestPix, Kululu) | EN |
| Gathrly | 40 | blog in BM and EN, pricing, demo | none seen | BM, EN |
| Kululu | 41 | 8 blog, alternative page, wedding page | 1 | EN |
| POV | 29 | 14 use-cases, 7 blog, pricing | none seen | EN |
| Tuan Majlis | 18 | catalog, 8 blog posts, 2 landing pages | none seen | BM |
| Kenang | 18 | per event type (kahwin, tunang, aqiqah, konvokesyen, korporat) | none seen | BM, EN |
| Jemputan.me | 10 | catalog, packages, studio, tutorial, FAQ | none seen | BM, EN |
| momenspace | 7 | features, pricing, faq, legal | none seen | BM, EN |
| povkita | 6 | sample, themes, invite, legal | none seen | BM, EN |
| tetamu.me | 8 | catalog, packages, album | none seen | BM |
| Nak Jemput | 2 | home and terms only | none seen | BM |
| JomGambar | 0 (empty sitemap) | single page | none seen | BM |

Reading [inferred]:
- Kenangan is the only Malaysian gallery player investing in comparison and how-to content, in BM and EN.
- Big footprints are in invitation templates (Neekah Kita, Raikad, EkadInvite), a different search lane from the gallery.
- No Malaysian rival has a page for "majlis bertandang", "belah lelaki", aqiqah galleries or seat finder content [measured: none in the sitemaps' page names].

## 5. Per competitor: where Indahnya wins honestly, and where it does not

Details are in each teardown. Indahnya's side of each row is backed by the truth file; re-check it on the day a page ships.

| Competitor | Where Indahnya can honestly win | Where it cannot claim a win |
|---|---|---|
| Kenangan | Retention (1 to 2 years against 2 months). One plan holds e-kad, RSVP, table finder and voice wishes; Kenangan sells e-kad and RSVP as +RM30. A real free plan | Cheaper gallery-only (RM35). More content, comparison pages, structured data |
| Kenang | No 20-shot cap; e-kad and RSVP included; longer retention | Film-filter concept, voice notes, price anchored at the same RM99 |
| momenspace | Retention (7 to 30 days) and a stated unlimited paid plan | Cheaper tier (RM39); Live Wall on every plan |
| povkita | Self-serve checkout, no WhatsApp setup; approval mode and noindex (confirm); retention | Price (RM15 or RM25 promo) |
| Gathrly | Retention (7 to 60 days); no caps | Price (RM49); iOS app; blog |
| JomGambar | Retention (up to 90 days), caps, bundle | Price (RM49); live projection and photobook PDF |
| Neekah Kita | Same RM99 gallery price but unlimited and longer; table finder and voice wishes | Cheaper e-kad (RM29); printed cards and welcome boards; 347-page footprint |
| tetamu.me | Stated numbers, bundle | Cheaper cards; RM99 gallery with voice |
| Tuan Majlis | The whole gallery half of the product | Designs, custom artwork, blog |
| EkadInvite | Everything after the invitation | Price (RM29), design count (325+), 48 hour refund, SEO |
| Nak Jemput, Jemputan.me, KadKami | The gallery half | Price (RM27.90, RM30) |
| Raikad | Everything beyond free e-kad | The RM0 anchor |
| Wedibox | BM, ringgit, local fit; Malay e-kad features | Maturity (100,000+ weddings claim), tools, 237 pages |
| GuestPix, POV, GuestCam, Kululu | BM, ringgit, local fit | Maturity and review volume; POV $34.99 for 100 guests |
| WhatsApp, Drive, Photos | Dedicated majlis flow, QR on table, no sign-in | Free, familiar; fine for small gatherings |
| Photographer only | Second-camera role; photographers as partners | Replaces nothing; do not claim it does |

## 6. Before any comparison page ships (rules)

1. **Vendor facts only from the vendor's own page.** Not from a blog, a listicle, a review or a rival's "vs" page. Kenangan's page about povkita is [third-party] for us.
2. **Fetch the page on the day of publishing and print the date** on the page: "Disemak pada [date]". Rival prices moved this week (promo tags, struck prices, holiday codes). Refresh monthly, or pull the page.
3. **Unknown is not absent.** Write "tidak disahkan" for anything the vendor page does not say, as Kenangan and Wedibox both do on their own pages.
4. **No "cheapest", "best", "#1", "ramai pasangan".** No customer counts, ratings or reviews until real. No self-ranked "best of" lists (see `docs/geo/offsite-plan.md`).
5. **Indahnya cells come from the truth file and the code.** Known drift it lists: the site is live but closed (pre-launch, sign-up lands on `/mula`), so a comparison page cannot say "buat sekarang" until it opens; the page line "FPX, kad atau e-wallet" over-claims against the last CHIP state (FPX and DuitNow QR); `/privasi` and `/terma` still show hello@indahnya.my.
6. **Include a "where they win" row** on every comparison. Honest tables are what Kenangan and Wedibox publish too.
7. **Show promo and normal prices with their dates**, and say when a promo has no stated end.
8. **USD vendors stay in USD.** No conversion without a dated exchange rate.
9. **No rival logos, screenshots or copy.** Plain names, no suggestion of affiliation, quote under 15 words. This is a drafting rule, not legal advice.
10. **Fix Indahnya's own pages first.** A comparison page next to a page that over-claims is worse than no page (the Siar lesson).
11. **Owner decides who is named.** The smaller rivals (KadKami, Nak Jemput, Jemputan.me) add little and invite disputes.
12. **WhatsApp and Google claims need their own sources.** WhatsApp HD per send is [sourced]; "WhatsApp compresses photos" is the safe phrasing only if tied to that page. Whether signed-out visitors can upload to a Drive folder is still [unverified]; test it in a signed-out browser before writing it.

## 7. Suggested comparison and alternative pages

Ordered by evidence and risk. All [inferred].

| # | Page | Why | Needs first |
|---|---|---|---|
| 1 | Galeri QR vs WhatsApp group (BM, EN) | Biggest "competitor" is free; Kenangan has this page, but no one has the "when WhatsApp is enough" honest angle. Prompts p007, p019 | WhatsApp help source (have) |
| 2 | Galeri QR vs Google Drive and Google Photos | Prompt p018. Google can already make album QR codes | Test signed-out Drive upload |
| 3 | Galeri tetamu vs jurugambar kahwin (partner angle) | Evidence of public interest (SAYS clip); vendors as a channel | Vendor mode is parked per the truth file; keep the partner angle to editorial, not a product claim |
| 4 | Berapa lama gambar disimpan: retention in the market | The clearest edge. Dated table of retention ranges | Verify Indahnya retention in code and copy |
| 5 | Indahnya vs Kenangan | Prompts p021, p022. Direct rival, same gateway | Rules 1 to 7; Kenangan page re-fetched same day |
| 6 | Alternatif Wedibox untuk majlis di Malaysia | Prompts p020, p023. Wedibox is the English default name | Dated USD cells; no conversion |
| 7 | Kad kahwin digital + galeri QR dalam satu link | Targets the e-kad lane with the bundle; no rival named | Sign-up open, so the page can link to a working start |
| 8 | Perbandingan galeri QR majlis di Malaysia (neutral dated table, no ranking) | Gives engines a citable table; Kenang and Kenangan already publish partial ones | Rules 1 to 11; owner agrees to name rivals |

Pages 5, 6 and 8 are the risky ones. 1 to 4 and 7 do not need to name a rival.

## Sources

Teardowns (all written 12 November 2026), in `docs/seo/research/competitors/`: kenangan.md, wedibox.md, global-qr-guest-photo-apps.md, my-qr-gallery-challengers.md, neekah-kita.md, tuan-majlis.md, ekadinvite.md, other-my-ekad-platforms.md, do-nothing-alternatives.md. Market research: `docs/seo/research/market/couples-and-hosts.md`.

Vendor pages fetched on 12 November 2026 [sourced, measured]:
- https://kenanganmajlis.com/ (and /harga, /ciri, /tentang, /soalan-lazim, /polisi-bayaran-balik, /robots.txt, /sitemap.xml)
- https://kenang.my/ (and /refund, /sitemap.xml)
- https://momenspace.my/pricing (and /features, /terms, /sitemap.xml)
- https://www.povkita.com/ , https://gathrly.my/pricing , https://www.jomgambar.my/
- https://neekahkita.com/ (and /guest-gallery, /sitemap.xml)
- https://tuanmajlis.com/ , https://ekadinvite.my/harga , https://nakjemput.com/pakej , https://jemputan.me/packages , https://kadkami.com/ , https://tetamu.me/packages , https://raikad.com/
- https://www.wedibox.com/pricing , https://guestpix.com/weddings-pricing/ , https://pov.camera/pricing , https://guestcam.co/pricing , https://www.kululu.com/pricing

Other:
- https://www.wedibox.com/compare/guestpix [third-party claims about GuestPix, 28 July 2026]
- https://faq.whatsapp.com/759301289012856/ and https://support.google.com/photos/answer/9789702 [sourced]
- `docs/seo/research/indahnya-truth.md` [truth file]
- `docs/geo/facts.md`, `docs/geo/brief.md`, `docs/geo/owner-todo.md`, `docs/geo/prompts_v1.csv`; `server/utils/plans.ts`, `app/composables/usePricing.ts` [code]
