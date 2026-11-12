# Indahnya strike plan

Checked 12 November 2026. Built on the research in this folder:

- `research/indahnya-truth.md`: what is true today (wins every disagreement);
- `research/current-site.md`: the live site re-measured;
- `market.md`, `competitors.md`: buyers and the field (about 20 vendors);
- `keyword-map.md`: one cluster = one page;
- `messaging.md`: the line, pillars, voice and never-claim list.

The standard is the one Siar and BayangWeb shipped against: BayangWeb `docs/SEO_BASELINE.md` and Siar
`docs/seo/ACCEPTANCE.md`, adapted here in `ACCEPTANCE.md`. Everything is built at once on `feat/seo-landing` and
goes live only when Fakhrul says deploy.

Labels: [measured] [sourced] [code] [inferred], as in the research files.

---

## 0. The call

1. **Lead with the bundle, teach the gallery inside it.** BM gallery phrases have no autocomplete; e-kad and RSVP
   phrases do [measured]. Pages that answer e-kad, RSVP and "how do I get guests' photos" questions carry the
   gallery as the answer. The home page keeps the BM gallery head it already ranks for [measured on DDG, once].
2. **Win on two true edges: one link and long retention.** RM59 holds the kad, RSVP, table finder, voice wishes and an
   uncapped gallery kept a year; the market keeps galleries 7 to 90 days and sells kad/RSVP separately [sourced].
   Never on price: rivals start at RM15 to RM49 [sourced].
3. **Guides and honest comparisons are the open ground.** Only 2 to 3 vendors have a BM guide on collecting guest
   photos; nobody writes "when WhatsApp is enough" honestly; no page compares Wedibox with Malaysian options
   [measured]. Kenangan is the SEO rival to beat: 28 pages, 7 comparisons, bilingual [measured].
4. **Make the site true first.** Payment line, glued H1, FAQPage markup, long descriptions, slash/uppercase 301s,
   Email Obfuscation. A comparison next to an over-claim is worse than no page (the Siar lesson).
5. **English moves to `/en/` now**, before new pages double the URLs to migrate. One indexed URL today [measured].
6. **Measure it ourselves.** Port Siar's analytics (verified human vs crawler traffic, landing source per sign-up,
   search data) so "is anyone coming" is answered from our own database, not guessed from noisy logs.

## 1. Corrections from this research (they change pages or docs)

| Old belief | Now | Source |
|---|---|---|
| Kenangan is the only local QR-gallery rival | At least 7 Malaysian galleries (Kenangan, Kenang, momenspace, povkita, Gathrly, JomGambar, Neekah Kita) plus tetamu.me and Raikad | competitors.md §0 |
| Wedibox is a Malaysian competitor | Global, English/French, USD only | research/competitors/wedibox.md |
| KadKami is live | "Coming Soon" | research/competitors/other-my-ekad-platforms.md |
| Payment is "FPX, kad atau e-wallet" | Last recorded: FPX, FPX B2B1, DuitNow QR | truth §0 rule 2 |
| `docs/geo/facts.md` is current | Stale on domain, payment and SSM | truth §6 |
| Plan P3 `/galeri-qr` page | Dropped for now: it would split what the home page ranks for | keyword-map D1 |

`docs/geo/facts.md` and `docs/geo/brief.md` get a header pointing to the truth file and this plan.

## 2. Where to strike, ranked

1. **Wave 0: true and clean** (section 3.1). Cheapest, protects the one ranking asset, unblocks everything.
2. **`/panduan/kumpul-gambar-tetamu`**: the core job ("cara kumpul gambar tetamu"), prompts p002–p004 (weight 3).
3. **`/banding/whatsapp-google-drive`**: the real competitor is free. Honest "when WhatsApp is enough" angle.
4. **`/e-kad`**: half the product, the busiest lane; wins only the bundle tail ("kad kahwin digital rsvp").
5. **`/contoh`**: an indexable, clearly fictional sample. Owns "contoh e kad kahwin" and is the proof every other
   page links to.
6. **`/banding/alternatif-wedibox-malaysia`**: Wedibox is the English default name; nobody answers it for Malaysia.
7. **`/buku-tetamu-digital`**: written and voice wishes; no BM page is dedicated to voice wishes [measured].
8. **`/panduan/rsvp-dan-susun-meja`**: headcount and the table finder.
9. **`/panduan/cara-buat-qr-code-gambar-majlis`**: AC 12, generic QR how-to with Indahnya as one honest route.
10. **`/en/wedding-photo-sharing-malaysia`**: English Malaysia-qualified field is thin locally.
11. **`/panduan/slideshow-tv-majlis`**: zero typed demand; prompts p010, p011, p032.
12. **`/en/guides/collect-guest-photos-malaysia`**, **`/en/digital-wedding-invitation-malaysia`**.
13. **`/banding`** hub with a neutral dated retention and price table (approved 12 Nov). **`/banding/kenangan`** stays
    on hold.

All of it is built in one pass; the order is the build and review order, not a release schedule.

## 3. Page architecture

### 3.0 Rules for every page

1. **Answer first.** The first 40–60 words answer the page's question and name "Indahnya, galeri gambar majlis dengan
   QR" (EN "Indahnya, a QR photo gallery for Malaysian events").
2. **Prices and limits from code.** `server/utils/plans.ts` (`PLANS`, `MEDIA_LIMITS`). Never typed by hand.
3. **Rival facts from one data file** (`app/data/rivals.ts`: value, url, checked date per cell), each linked with
   "Disemak <tarikh>". The build warns when a cell is older than 30 days.
4. **Visible "Dikemaskini <tarikh>"**, the same date as JSON-LD `dateModified` and sitemap `lastmod`.
5. **Schema only for what is visible.** No FAQPage, HowTo, AggregateRating, Review. BreadcrumbList on every page but
   `/`.
6. **Pre-launch honest CTAs.** The primary button reads "Tengok contoh" (to `/contoh`); the sign-up button goes to
   `/mula` until sign-up opens. One switch (`runtimeConfig.public.preview`) flips every CTA on the day.
7. **Copy follows `messaging.md`**, BM written first, no em dashes, no vibe-coded furniture, imagery rules kept.

### 3.1 Wave 0: make the live site true and clean

| # | Change | Where |
|---|---|---|
| 0.1 | Payment line → "Bayar melalui CHIP, dalam Ringgit" (no method list) on the landing, `/harga`, `/tentang`, `/terma`, and the in-app settings and checkout copy | `useLanding.ts`, `usePricing.ts`, `useAbout.ts`, `useLegal.ts`, `app/pages/app/[id]/tetapan.vue`, `server/api/events/[id]/checkout.post.ts` |
| 0.2 | Split H1 renders a real space between the two lines | `app/components/landing/LHero.vue` |
| 0.3 | Drop FAQPage JSON-LD; keep visible FAQs | `useSiteGraph.ts` |
| 0.4 | Descriptions 120–160 chars on `/tentang` and the legal pages; legal titles ≥ 25 chars | page `useSeoMeta` |
| 0.5 | Trailing slash and uppercase → one 301 to the clean lowercase URL; 404 page gets `noindex` | Nuxt server middleware or nginx |
| 0.6 | `http://www.` → one hop (Cloudflare redirect rule) | Cloudflare, at deploy |
| 0.7 | Cloudflare Email Obfuscation off (zone setting); footer email as plain `mailto:` | Cloudflare, at deploy |
| 0.8 | English to `/en/...` (`/en`, `/en/pricing`, `/en/about`, `/en/privacy`, `/en/terms`, `/en/refunds`, `/en/delivery`), 301 from every `?lang=en`, sitemap and hreflang updated, visible language switch | `useT`, routes, `sitemap.xml.ts` |
| 0.9 | Home and `/harga` retargeted per keyword-map P1/P2 (title, description, H2s), design unchanged | `useLanding.ts`, `harga.vue` |
| 0.10 | `/tentang`: entity signals for the ambiguous brand word ("Indahnya QR", "indahnya.my"), the line from messaging §1 | `useAbout.ts` |
| 0.11 | `docs/geo/facts.md` and `brief.md`: header pointing to the truth file | docs |

### 3.2 New pages (BM, at the root)

| URL | Primary query | Answer first | Links to |
|---|---|---|---|
| `/e-kad` | kad kahwin digital rsvp | One e-kad link with RSVP, Waze, countdown, salam kaut, ucapan and the photo gallery; five templates; included in Percuma | `/contoh`, `/harga`, `/panduan/rsvp-dan-susun-meja`, `/buku-tetamu-digital` |
| `/contoh` | contoh e kad kahwin | A fictional majlis (Aina & Hakim), labelled, showing kad, gallery, RSVP, meja, ucapan | every page |
| `/buku-tetamu-digital` | buku tetamu digital kahwin | Guests write or record a voice wish from the kad link; host downloads all as a zip | `/e-kad`, `/contoh` |
| `/panduan/kumpul-gambar-tetamu` | cara kumpul gambar tetamu kahwin | The honest ways (WhatsApp group, Drive/Photos album, QR gallery), when each works, step by step for a QR gallery | `/`, `/banding/whatsapp-google-drive`, `/panduan/cara-buat-qr-code-gambar-majlis` |
| `/panduan/rsvp-dan-susun-meja` | cara buat rsvp kad kahwin | Collect RSVP with pax and side, close the count for the caterer, assign tables, let guests find their table | `/e-kad`, `/contoh` |
| `/panduan/cara-buat-qr-code-gambar-majlis` | cara buat qr code gambar | Any QR generator → a shared album, or a gallery QR that needs no sign-in; printing and placement | `/panduan/kumpul-gambar-tetamu`, `/` |
| `/panduan/slideshow-tv-majlis` | slideshow gambar tetamu live tv kahwin | One link on the dewan laptop, internet needed, hotspot tip, approval mode first | `/`, `/contoh` |
| `/banding/whatsapp-google-drive` | google drive atau qr code gambar kahwin | When WhatsApp or Drive is enough, when a QR gallery helps; dated, sourced facts | `/panduan/kumpul-gambar-tetamu`, `/harga` |
| `/banding/alternatif-wedibox-malaysia` | wedibox alternative malaysia | What Wedibox does (USD, dated), what a Malaysian majlis needs, where Wedibox is the better buy | `/`, `/harga` |

| `/banding` | perbandingan galeri qr majlis malaysia | A neutral, dated table of Malaysian QR galleries and Wedibox: price, retention, caps, e-kad and RSVP; where each is the better buy; no ranking | every `/banding` page, `/harga` |

On hold: `/banding/kenangan`.

### 3.3 English pages

- Mirrors of `/`, `/harga`, `/tentang` and legal under `/en/...` (Wave 0.8), reciprocal hreflang.
- English-only, no hreflang partner: `/en/wedding-photo-sharing-malaysia`,
  `/en/guides/collect-guest-photos-malaysia`, `/en/digital-wedding-invitation-malaysia`. Each only with content the
  English home does not have (keyword-map §6 cannibalisation note).

### 3.4 Not building

From keyword-map §4: city pages, vendor/photographer mode, per-event pages (aqiqah, konvo, syarikat as their own
pages), checklist/budget/Canva/wording pages, a guest-list template page, wrong-intent phrases, `/galeri-qr` (D1).
Also no `llms.txt` work and no `FAQPage` markup.

## 4. Internal linking

- **Header**: Cara guna · Kad (`/e-kad`) · Harga · Contoh · Panduan (a small hub at `/panduan`) · Tentang.
- **Footer**: every new page, plus legal.
- **Exact anchor "galeri gambar majlis dengan QR"** points only to `/`.
- Every guide ends with one related guide and `/contoh`. Every `/banding` page links its guide and `/harga`.
- Every page has at least one inbound link from another page (Gate A orphan check).

## 5. Off-site and authority (owner work, after release)

`docs/geo/offsite-plan.md` holds, with three additions from this research:

1. Claim Instagram, TikTok and Facebook as "Indahnya QR" or "indahnya.my", never "Indahnya" alone (the word is
   ambiguous); wire them into `sameAs`.
2. One 60-second "macam mana tetamu upload" video (TikTok, YouTube, Instagram), brand said aloud. Discovery for this
   category runs on video, not search [inferred, keyword-map §1].
3. Vendors (pelamin, katering, mak andam, photographers) as editorial partners, not a product feature (vendor mode is
   parked).

## 6. AI-answer plan

- Prompt set: `docs/geo/prompts_v1.csv` (40 prompts), mapped to pages in keyword-map §5.
- Wave 0 measurement in release week (manual sheet or API keys), then every 4 weeks, Wilson intervals.
- Bing Webmaster's AI Performance report on from day one (it feeds Copilot and ChatGPT search).
- "Best X" prompts (p006, p007, p023) are won by third-party lists, not our pages; only off-site work moves them.

## 7. Measurement and analytics

### Search
- Google Search Console Domain property in the studio's account (DNS TXT via the Cloudflare API), sitemap submitted,
  URL Inspection live test per template, indexing requested for the money pages (~10 a day).
- Bing Webmaster Tools by DNS CNAME, sitemap submitted, AI Performance on.
- IndexNow key file and `scripts/indexnow.mjs`, run after every deploy.

### Our own analytics (port of Siar `docs/ANALYTICS.md`)
- nginx JSON log with referrer and host (today's format has no referrer).
- An ingest job every 10 minutes into `traffic_hits` (120 days) and `traffic_daily`, each request classed as human
  (beacon-confirmed), unconfirmed, staff, automation, search-bot / ai-bot / other-bot (verified by IP list or
  forward-confirmed reverse DNS), impostor, datacenter, tool, monitor, scanner, internal.
- A tiny first-party beacon on public pages (no cookies beyond a first-visit marker) to confirm humans.
- Events store the first landing page and referrer at sign-up; revenue from CHIP payments.
- GSC and Bing search data pulled by API once the owner adds the service account / API key.
- Staff Metrics page in the app (ANK Ops shell) and `scripts/metrics.sh report 7` for the assistant.
- Cloudflare Web Analytics stays on as the cross-check.

### Kill and fix rules
- Guide or comparison page with no impressions 8 weeks after indexing → one rewrite of title and H2s, then merge
  into its hub.
- English-only pages with no impressions in 12 weeks → fold into the English home.
- Any rival fact changes → update within 7 days or take the cell down.

## 8. Owner decisions, ranked by what they unlock

| # | Decision | Unlocks | Recommendation |
|---|---|---|---|
| 1 | Name rivals on pages? | the `/banding` hub, the Wedibox page | **Decided 12 Nov: yes** for Wedibox and the neutral hub. `/banding/kenangan` on hold |
| 2 | English to `/en/` | Wave 0.8; the English pages | **Decided 12 Nov: yes** |
| 3 | Founder name on `/tentang` | Entity trust for an ambiguous brand word | Your call |
| 4 | Training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended) | robots.txt | Keep allowed while the brand is new |
| 5 | hello@indahnya.my on `/privasi`, `/terma` | Consistency | Your call (unchanged) |
| 6 | Deploy | Gate D, search consoles, IndexNow | On your word |

Facts to check during the build (no decision needed): signed-out upload to a Google Drive folder (test in a clean
browser before the Drive comparison states it); WhatsApp HD-per-send wording tied to WhatsApp's own help page.

## 9. Done means

`ACCEPTANCE.md`: Gates A (static), B (Lighthouse 100), C (by hand) on the branch; Gate D live after deploy, with
the launch record in `LAUNCH.md`.
