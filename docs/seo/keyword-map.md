# Indahnya keyword map

Checked 2026-11-12. The single map for indahnya.my: one cluster = one page. It merges the nine sweeps in `research/keywords/`, the live-site inventory
`research/current-site.md` and the truth inventory `research/indahnya-truth.md`. It builds on `docs/geo/plan.md` (P3 pages), `docs/geo/prompts_v1.csv` and
`docs/geo/facts.md`, and does not redo them. Model format: Siar's `docs/seo/keyword-map.md`.

Every page proposed here needs Fakhrul's go before it is built or deployed. Every Indahnya claim on those pages must match `research/indahnya-truth.md`.

---

## 0. How to read this

### Labels

- **[measured]**: seen on 2026-11-12 (autocomplete, a result page, a vendor page, the live site, the code).
- **[sourced]**: a vendor's or Google's own page, fetched today, named in the sweep file.
- **[inferred]**: my judgement. **Every demand grade and every winnability grade in this file is inferred.** There is no keyword-volume tool.
- **[unverified]**: could not be checked.

### Codes

| Code | Meaning |
|---|---|
| G, E, R, S, O, A, H, N n | row n of `galeri-gambar-tetamu.md`, `e-kad.md`, `rsvp-tempat-duduk.md`, `slideshow-tv.md`, `other-events.md`, `alternatives-vs.md`, `how-to-guides.md`, `english-malaysia.md` |
| p0nn | prompt id in `docs/geo/prompts_v1.csv` |
| AC n | Google autocomplete returned n completions (max 10 per call; larger numbers come from alphabet expansion), `hl=ms gl=my` unless stated |
| D | DuckDuckGo html results, `kl=my-en`, top 10, fetched today. Not Google. Indicative order |

### Demand grade (inferred, from autocomplete only)

- **High**: 40 or more completions on the head phrase.
- **Medium**: 5 to 39.
- **Low**: 1 to 4.
- **None typed**: AC 0. Demand may exist through TikTok, word of mouth or AI prompts. Search volume is probably tiny.

### Winnability for a new domain (inferred)

- **weeks**: Indahnya already ranks (DDG) or the field is thin.
- **months**: needs a real page, internal links and some off-site mentions.
- **long-term**: needs authority Indahnya does not have.
- **unlikely**: the field is global or intent does not fit.

### Limits, stated plainly

- Search results come from DuckDuckGo (`kl=my-en`), one fetch each. The WebSearch tool is US-only and returned no Malaysian vendors for BM queries, so I did not use it for ranking. Google Malaysia was not observed.
- Bing autosuggest returned empty for every seed, so autocomplete is Google only.
- No Search Console, Bing Webmaster, Trends, People Also Ask or Reddit data. No AI answer was observed (`ai-answers.md`).
- DDG `site:indahnya.my` returns only the home page [measured]. `/harga`, `/tentang` and the other pages did not appear for any query I ran.

---

## 1. Summary

1. **The site is live but closed.** Public pages since 2026-10-10; sign-up, `/app` and `/tv` are closed (`/mula`) [truth file]. Pages can describe and show the product. They cannot say "buat sekarang".
2. **E-kad has the demand, and the crowd.** `kad kahwin digital` gave 93 completions, `kad jemputan kahwin online` 87 [measured]. Every result page is 8 to 10 Malaysian e-kad vendors. Indahnya wins only the bundle angle.
3. **Photo-gallery search is thin and crowded at once.** No BM phrase for the gallery has any autocomplete (AC 0 on 13 phrases) [measured], yet about 15 vendors target it [measured, D]. Discovery runs on TikTok and word of mouth.
4. **Indahnya's home page already ranks on DDG for 12 long-tail BM queries** (rank 1 to 9) [measured, once]. It is the one asset. Splitting it into more pages could cost it (decision D1).
5. **The open gaps are guides and comparisons that are honest.** BM guides on collecting guest photos exist from only 2 to 3 vendors. No page compares Wedibox with Malaysian options (`wedibox malaysia` returns Wedibox and casino sites). No BM page is dedicated to voice wishes [measured, D].
6. **English demand is bigger but global.** Malaysia-qualified English queries have a thin local field (kenang.my/en, gathrly.my/en, galerilive, pixovia) and Indahnya is absent from it [measured]. The unqualified English field is vendor listicles.
7. **The brand word is ambiguous.** `Indahnya harga` shows Indah Water, Indonesian shops and "Indahnya Islam" pages; Indahnya.my did not appear [measured, D]. "Indahnya" is a common Malay word. Branded prompts (p024 to p032) need "Indahnya QR" or "Indahnya galeri majlis" wording and strong entity signals on `/tentang`.
8. **Many high-AC phrases are wrong-intent and must not be targeted**: `ucapan kahwin` (congratulation wording), `kad nikah digital` (the official certificate), `majlis konvo` (university schedules), `album digital` (football stickers), `photo wall wedding` (frames on a wall).
9. **Expect small numbers.** Success for most pages here is being the cited or the only honest answer, not traffic volume [inferred].

---

## 2. Wave 0: before any new page

From `research/current-site.md` and `research/indahnya-truth.md`. These are not keyword pages but every wave depends on them.

| # | Fix | Why it matters here |
|---|---|---|
| 0.1 | Verify Google Search Console and Bing Webmaster Tools, submit the sitemap, set up IndexNow | Today only the home page is indexed on DDG; no query data exists |
| 0.2 | Fix the payment line ("FPX, kad atau e-wallet") to what CHIP has live | Truth file rule 2; engines repeat it |
| 0.3 | Fix the glued H1 ("majlis.Satu") | The snippet shows the glued text |
| 0.4 | Home and `/harga` retarget (cluster P1 and P2 below) | Cheap, protects what already ranks |
| 0.5 | Pre-launch CTAs: every new page's button goes to `/mula` with honest wording | Sign-up is closed |
| 0.6 | Decide the `/en/` move before new pages ship (section 6) | Each new page doubles the URLs to migrate |
| 0.7 | Add breadcrumbs when `/panduan/` and `/banding/` exist | current-site.md section 4 |

---

## 3. Clusters: one cluster, one page

Existing pages first, then new pages by priority. "Answer first" is what the first two sentences of the page must say.

### P1. `/` (exists): brand and the BM gallery head

- **Primary**: `galeri gambar majlis dengan QR`.
- **Secondary**: `qr code gambar majlis kahwin` (G1), `galeri gambar kahwin qr code` (G2), `tetamu upload gambar tanpa download app` (G6), `galeri gambar majlis percuma` (G9), `projection gambar tetamu live dewan` (S3), `majlis tunang qr gambar` (O10), `dinner syarikat galeri gambar qr` (O8), `majlis konvokesyen qr gambar` (O6), branded: `Indahnya QR`, `Indahnya galeri majlis`.
- **Intent**: commercial.
- **Answer first**: "Indahnya ialah galeri gambar majlis dengan QR. Tetamu scan di meja, upload dari telefon, semua gambar masuk satu galeri dan TV dewan. Tak payah app, tak payah daftar." (truth file definition.)
- **Demand**: None typed (AC 0). **Winnability**: weeks (on DDG the home page already holds rank 1 to 9 for G1, G2, G6, G9, S3, O6, O8, O10) [inferred].
- **Change**: surgical. Add an "Untuk majlis apa?" section (aqiqah, hari jadi, graduasi, majlis syarikat, tunang) so the event-type queries stay on the home page. No rewrite.

### P2. `/harga` (exists): price

- **Primary**: `harga qr gambar kahwin`.
- **Secondary**: `berapa harga galeri qr kahwin` (G8), `qr code gambar majlis kahwin murah` (p008), `wedding guest photo upload QR under RM100 Malaysia` (p009), `Indahnya harga` (p025, p026), `kad kahwin digital harga` as a bundle line (E8).
- **Intent**: commercial. **Answer first**: the three plans and prices, "sekali bayar, untuk satu majlis, tiada langganan".
- **Demand**: None typed for the BM gallery price (AC 0); Medium for `kad kahwin digital harga` family. **Winnability**: months [inferred]. Pricing pages dominate this result (neekahkita, kenanganmajlis/harga, kad2u/harga, lensakenangan).
- **Change**: title suggestion "Harga galeri QR majlis: RM0, RM59, RM99 | Indahnya" (about 50 characters, within the 25 to 60 range). Read prices from `server/utils/plans.ts`; never type them by hand.

### P3. `/tentang` (exists): entity and branded facts

- **Primary**: `Indahnya galeri majlis QR` (branded). **Secondary**: `is Indahnya legit` (p027), `who makes Indahnya` (p030), `what is Indahnya` (p024).
- **Answer first**: operator, SSM number, address, contact (already there). The disambiguation matters because of finding 7.
- **Demand**: none typed. **Winnability**: weeks [inferred].

---

### Priority order for new pages

| Rank | URL | Primary query | Demand | Winnability | Page type |
|---|---|---|---|---|---|
| 1 | `/panduan/kumpul-gambar-tetamu` | `cara kumpul gambar tetamu kahwin` | None typed (p002 weight 3) | months | BM guide |
| 2 | `/banding/whatsapp-google-drive` | `google drive atau qr code gambar kahwin` | None typed | months | compare |
| 3 | `/e-kad` | `kad kahwin digital rsvp` | High (head); bundle tail Low | long-term head, months tail | feature page |
| 4 | `/banding/alternatif-wedibox-malaysia` | `wedibox alternative malaysia` | Low (head wedibox AC 75, global) | months | compare |
| 5 | `/contoh` | `contoh e kad kahwin` | Medium (`contoh e kad kahwin` is in the top 10 of `e-kad kahwin`) | months | sample page |
| 6 | `/buku-tetamu-digital` | `buku tetamu digital kahwin` | None typed (BM); Medium EN | weeks to months | feature page |
| 7 | `/panduan/rsvp-dan-susun-meja` | `cara buat rsvp kad kahwin` | Low to Medium | months | BM guide |
| 8 | `/panduan/cara-buat-qr-code-gambar-majlis` | `cara buat qr code gambar` | Medium (AC 12) | months | BM guide |
| 9 | `/en/wedding-photo-sharing-malaysia` | `wedding photo qr code malaysia` | Medium (global), thin local field | months | EN landing + guide |
| 10 | `/panduan/slideshow-tv-majlis` | `slideshow gambar tetamu live tv kahwin` | None typed | months | BM guide |
| 11 | `/en/guides/collect-guest-photos-malaysia` | `how to get guests to upload photos wedding malaysia` | Medium (global) | months | EN guide |
| 12 | `/en/digital-wedding-invitation-malaysia` | `digital wedding invitation malaysia` | Medium | long-term | EN landing |
| 13 | `/banding/kenangan` | `Indahnya vs Kenangan` | None | n/a | compare (hold) |

Ranking logic [inferred]: honest value to a reader, fit with the truth file, how open the field is, and prompt weight in `prompts_v1.csv`, in that order. Rank 3 stays high despite the crowd because the site has no e-kad page at all and e-kad is half the product.

---

### New pages: detail

#### 1. `/panduan/kumpul-gambar-tetamu`
- **Primary**: `cara kumpul gambar tetamu kahwin`. **Secondary**: `kumpul gambar tetamu majlis kahwin` (G3), `cara tetamu hantar gambar majlis` (G7), `kongsi gambar majlis kahwin` (G14), `macam mana nak dapat semua gambar yang tetamu ambil masa kenduri` (p003), `cara kumpul gambar tetamu masa majlis kahwin` (p002), the approval-mode question (H7), original quality (H8).
- **Intent**: how-to. **Answer first**: "Letak QR di setiap meja. Tetamu scan, pilih gambar dari telefon, upload. Semua masuk satu galeri; tuan majlis muat turun semuanya dalam satu zip." Then: "Kalau tetamu kurang dari kira-kira 20 orang, group WhatsApp pun cukup" [the 20 is a judgement; do not publish a number without a basis].
- **Must include**: no app, no sign-in, up to 30 files a time, videos up to 60 s, approval mode, TV, print poster, the retention clock from majlis day. All from the truth file.
- **Field**: kenanganmajlis.com has two guides, gathrly.my a blog, pixovia a BM guide [measured]. Winnable with a more honest and more complete guide [inferred].
- Links to: `/`, `/harga`, `/banding/whatsapp-google-drive`, `/panduan/slideshow-tv-majlis`.

#### 2. `/banding/whatsapp-google-drive`
- **Primary**: `google drive atau qr code gambar kahwin`. **Secondary**: `gambar kahwin tetamu whatsapp group atau qr` (A7), `WhatsApp group atau app galeri untuk gambar majlis kahwin mana lebih baik` (p019), `Google Drive vs QR photo gallery for wedding guest photos` (p018), `kenapa gambar whatsapp pecah` (H13).
- **Intent**: comparison. **Answer first**: a decision rule: who should use WhatsApp, who Google Photos, who a QR gallery, with the one thing each does badly.
- **Blocker**: WhatsApp compression and Google Drive upload facts are [unverified]; the Google Photos link-sharing note is partly sourced (`alternatives-vs.md`). Fetch and date them before writing. This is the `[NEEDS SOURCE]` from the GEO plan.
- Disclosure: Indahnya is the author and one of the options.

#### 3. `/e-kad`
- **Primary**: `kad kahwin digital rsvp`. **Secondary**: `kad kahwin qr code` (E9), `cari nombor meja tetamu kad digital` (E10, already #2 on DDG via the home page), `kad jemputan whatsapp` (E11), `e-kad kahwin dengan RSVP dan galeri gambar` (p012), `digital wedding invitation Malaysia with RSVP and table finder` (p013), `kad kahwin digital yang ada cari nombor meja tetamu` (p014).
- **Intent**: commercial. **Answer first**: "E-kad Indahnya ialah satu link dengan lima template (Garden, Klasik, Moden, Emas, Minimal), RSVP, cari meja, ucapan dan butang ke galeri gambar. Ia datang bersama pakej majlis (RM0, RM59, RM99)." No separate kad price.
- **Do not**: claim a large template catalogue, or write a Canva tutorial. Do not claim aqiqah or birthday fit until a render is checked [unverified].
- **Demand**: High head, Low tail. **Winnability**: long-term for head, months for tail [inferred]. The page is also the internal-link hub for RSVP, table finder and ucapan.
- Pre-launch: the CTA goes to `/mula`.

#### 4. `/banding/alternatif-wedibox-malaysia`
- **Primary**: `wedibox alternative malaysia`. **Secondary**: `Wedibox alternative in Malaysia` (p020), `alternatives to Kenangan majlis photo gallery` (p021), `GuestPix vs POV vs Wedibox for a Malaysian wedding` (p023) as a section.
- **Intent**: comparison. **Answer first**: a short table of Malaysian options with what each includes and the one-time price, dated, with the sources. Include Wedibox because that is who people search for.
- **Blocker**: competitor facts need a second check and a date. Price lines in `galeri-gambar-tetamu.md` came from one fetch of home or pricing pages. Disclosure at the top. Do not rank Indahnya first by default; say where each fits.
- Rule from the GEO plan: only with verified, dated facts.

#### 5. `/contoh`
- **Primary**: `contoh e kad kahwin`. **Secondary**: `contoh kad kahwin qr code` (AC 3: `contoh kad kahwin ada qr code`), `contoh galeri gambar kahwin`.
- **Intent**: see an example. **Answer first**: the working sample (fictional "Aina & Hakim") with the kad, the gallery, the RSVP and the table finder, labelled fictional.
- **Blocker**: `/aina-hakim` and `/contoh/kad` are `noindex` today because couple pages are personal data. This page needs an indexable, clearly fictional copy (the GEO plan's last P3 row). Owner decision.
- **Demand**: Medium. **Winnability**: months [inferred]. Vendors' catalogue pages (kadkawindigital/katalog, sayakahwin/templates) hold the head; a live sample with a gallery is different.

#### 6. `/buku-tetamu-digital`
- **Primary**: `buku tetamu digital kahwin`. **Secondary**: `guestbook digital majlis kahwin` (R12), `ucapan suara kahwin digital` (R13), `guestbook digital majlis kahwin ucapan suara` (p015), `digital guestbook Malaysia wedding` (N11).
- **Intent**: commercial. **Answer first**: "Tetamu tulis atau rakam ucapan (sehingga 60 saat) dari telefon, tanpa app. Tuan majlis muat turun semua dalam satu zip." Include a real voice-wish sample.
- **Never target** `ucapan kahwin` (R17).
- **Demand**: None typed BM; Medium EN. **Winnability**: weeks to months; no BM page is dedicated to voice wishes [measured, D].

#### 7. `/panduan/rsvp-dan-susun-meja`
- **Primary**: `cara buat rsvp kad kahwin`. **Secondary**: `rsvp kahwin google form` (R3), `contoh rsvp kahwin`, `soalan rsvp kahwin`, `susun atur meja kenduri kahwin` (R8), `seating plan kahwin malaysia` (R7).
- **Intent**: how-to. **Answer first**: how to collect hadir, bilangan orang and pihak, when a Google Form is enough, when it is not. Then: tell guests their table (guest types a name, gets a table number).
- **Do not**: claim a host-side seating planner or guest-list builder (not in the truth file).
- **Demand**: Low to Medium. **Winnability**: months [inferred].

#### 8. `/panduan/cara-buat-qr-code-gambar-majlis`
- **Primary**: `cara buat qr code gambar`. **Secondary**: `cara buat QR code untuk gambar majlis` (p036), `how to print a QR code table card for wedding photos` (p035, as an English section or later EN page), `cara buat qr code lokasi majlis kahwin`.
- **Intent**: how-to, generic. **Answer first**: how to make a QR for a Google Photos or Drive link, for free; then why a majlis gallery with a printed card is easier. Print sizes (A5 poster, A4 poster, folded table card) from the code.
- **Demand**: Medium (AC 12 on `cara buat qr code gambar`, but Indonesian phrasing). **Winnability**: months. Risk: searcher wants a generic QR; serve that honestly first.

#### 9. `/en/wedding-photo-sharing-malaysia`
- **Primary**: `wedding photo qr code malaysia`. **Secondary**: `malaysia wedding photo sharing app no download` (N3), `free qr photo gallery wedding malaysia` (N4, p033), `best QR code wedding photo sharing app Malaysia` (p006), `what is a QR photo gallery for weddings` (p001).
- **Intent**: commercial, English. **Answer first**: "Indahnya is a QR photo gallery for Malaysian events. Guests scan, upload from the phone browser, no app. RM0, RM59 or RM99 one time." Written for English intent, not translated.
- **Cannibalisation**: see section 6 (EN home vs this page).
- **Demand**: Medium (global); thin local field. **Winnability**: months.

#### 10. `/panduan/slideshow-tv-majlis`
- **Primary**: `slideshow gambar tetamu live tv kahwin`. **Secondary**: `live photo wall majlis` (S2), `slideshow gambar tetamu live atas TV dewan kahwin` (p010), `how to show guests photos live on a screen at a wedding reception` (p011).
- **Intent**: how-to. **Answer first**: open one link on the venue laptop or smart TV; new photos appear live with the guest's name; bring a phone hotspot. State that it needs internet (p032).
- **Demand**: None typed. **Winnability**: months. Lowest demand of the ten; build last of the ten.

#### 11 to 13 (later)
- `/en/guides/collect-guest-photos-malaysia`: only if the BM guide earns impressions (N5, p004, p007). Different intent from the EN landing page, so a separate page is justified.
- `/en/digital-wedding-invitation-malaysia`: only after `/e-kad` has data (N8, N9). Long-term field.
- `/banding/kenangan`: hold until the AI wave shows Kenangan cited for "alternatives".

---

## 4. Not building (and why)

| Idea | Reason |
|---|---|
| City pages ("e-kad Shah Alam") | Doorway pages; GEO plan rules them out |
| Vendor or photographer-mode page | Parked feature |
| `/galeri-qr` in wave 1 | See D1 |
| Per-event pages (aqiqah, hari jadi, konvo, tunang, nikah, bertandang, syarikat) | Demand is for cards or is wrong-intent; no event-specific truth; see `other-events.md` |
| Checklist, budget, Canva DIY, "ayat kad jemputan" pages | Planner and blogger territory; Indahnya adds nothing |
| Wedibox, GuestPix English "alternative" pages | Global vendor field; nothing Malaysian to add beyond cluster 4 |
| `/senarai-tetamu` template page | No guest-list tool in the product |
| `ucapan kahwin`, `kad nikah digital`, `majlis konvo`, `album digital`, `photo wall wedding` | Wrong intent (section 1, point 8) |

---

## 5. AI-answer prompt clusters: which page earns the citation

Status: **not measured** on any engine (`research/keywords/ai-answers.md`). The mapping is a plan.

| Prompts | Page |
|---|---|
| p001 | `/` (EN) and `/en/wedding-photo-sharing-malaysia` |
| p002, p003 | `/panduan/kumpul-gambar-tetamu` |
| p004, p007, p037, p038 | `/en/guides/collect-guest-photos-malaysia` (later); until then the EN version of the home FAQ |
| p005, p033, p034 | `/` |
| p006, p008, p009 | `/harga` and `/en/wedding-photo-sharing-malaysia` |
| p010, p011, p032 | `/panduan/slideshow-tv-majlis` |
| p012, p013, p014, p039 | `/e-kad` |
| p015 | `/buku-tetamu-digital` |
| p016, p017, p040 | `/` ("Untuk majlis apa?") |
| p018, p019 | `/banding/whatsapp-google-drive` |
| p020, p021, p023 | `/banding/alternatif-wedibox-malaysia` |
| p022 | `/banding/kenangan` (hold) |
| p024 to p031 | `/tentang`, `/harga`, `/` FAQ |
| p035, p036 | `/panduan/cara-buat-qr-code-gambar-majlis` |

Extra: p006, p007 and p023 ("best", "alternatives") are decided by third-party listicles, not by the brand's own pages [measured: 10 of 10 results are vendor or directory listicles]. A page cannot win them; off-site mentions (`docs/geo/offsite-plan.md`) can.

---

## 6. BM vs English URL strategy

**Today**: BM at the root, English as `?lang=en` on the same path, with reciprocal hreflang `ms-MY` / `en-MY` / `x-default` in the sitemap [current-site.md]. 14 sitemap URLs. Only the home page is indexed on DDG.

**Evidence**
- Six of eight Malaysian vendors seen use an English path: `/en` at kenang.my, gathrly.my, kenanganmajlis.com, raikad.com, ekadinvite.my; reception.my prefixes both languages [measured].
- momenspace.my uses `?lang=en`, and that URL is indexed and ranks #1 for `free qr photo gallery wedding malaysia` [measured, D]. So a parameter URL is not disqualifying.
- Google supports hreflang on any distinct URL, including parameters, but a path is easier to crawl, link, filter in Search Console, and keep apart from tracking parameters [inferred].
- Couple pages take their language from event settings, not the URL (`useGuestEvent`). The move affects the marketing pages only [code].

**Recommendation** [inferred]: BM stays at the root. English moves to `/en/...` paths, with a 301 from every `?lang=en` URL and the sitemap and hreflang updated in the same release. Do it **before** the new pages ship and before there is traffic or backlinks to the parameter URLs; it is cheapest now (7 pages x 2 and one indexed URL).

Rules:
1. **Mirror pages** (`/`, `/harga`, `/tentang`, legal): `/en/` plus the English slug (`/en/pricing`, `/en/about`), reciprocal hreflang, self-canonical.
2. **English-only pages** (`/en/wedding-photo-sharing-malaysia`, `/en/guides/...`) get no hreflang partner unless a BM page really is the same page. Do not point `x-default` at them.
3. **BM-only pages** (`/panduan/...`, `/banding/...`, `/buku-tetamu-digital`) need no English twin until data says so.
4. No automatic redirect by `Accept-Language` or IP. Keep a visible language switch.
5. English copy is written for English queries, not translated sentences.

**Cannibalisation risks**
- BM page vs its EN mirror: they share no query language except mixed-language searches. Correct hreflang handles it. Low risk.
- `/en/` home vs `/en/wedding-photo-sharing-malaysia`: the same risk as D1. Create the English page only with content the home does not have (the Malaysia-specific how-to and a comparison to local options). Otherwise do not create it.
- `/panduan/kumpul-gambar-tetamu` vs `/panduan/cara-buat-qr-code-gambar-majlis`: both mention QR on tables. Primary queries differ. If Search Console shows both ranking for `cara kumpul gambar` queries, merge (D5).
- `/e-kad` vs `/contoh`: `/contoh` owns "contoh ..." queries; `/e-kad` links to it (D7).
- Mixed Malay-English brand queries (`Indahnya QR gallery`): all route to the home page; no second page should target the brand.

---

## 7. Deduplication decisions

| # | Decision | Reason |
|---|---|---|
| D1 | No `/galeri-qr` page in wave 1. The home page owns the BM gallery head. | The home already ranks on DDG for 12 BM queries (rank 1 to 9); a second page on the same intent splits that and the field has only one Indahnya URL indexed. Re-test after Search Console data. |
| D2 | One `/e-kad` page; no per-event kad pages. | Template-swap variants are doorway pages. |
| D3 | RSVP and seating are one guide (`/panduan/rsvp-dan-susun-meja`). | Both have small typed demand; competitors combine them (sweetseat guide). |
| D4 | Slideshow is a guide, not a feature page. | Zero typed demand; the feature is covered on the home page. |
| D5 | Keep the "collect photos" guide and the "QR code how-to" guide separate; merge if Search Console shows overlap. | Different intents (event host vs generic QR user). |
| D6 | `/buku-tetamu-digital` owns guestbook and voice wishes. | Written wishes and voice wishes are one feature; `ucapan kahwin` is out of scope. |
| D7 | `/contoh` owns "contoh ..." queries; `/e-kad` links to it. | One page per intent. |
| D8 | One Wedibox comparison page that includes GuestPix and POV as a section; Kenangan page on hold. | Prompts p020, p021 and p023 share one reader. |
| D9 | `/harga` is the only page that lists the plan table. Other pages show the price once and link. | One source of truth for prices. |
| D10 | Checklist, budget, Canva and wording queries are not targeted. | No honest Indahnya answer. |
| D11 | Wrong-intent phrases are listed and excluded (section 1, point 8). | Avoids content that attracts the wrong visitors. |
| D12 | No city pages, no vendor mode page. | GEO plan; parked feature. |

---

## 8. Measurements to run later

1. **Search Console and Bing Webmaster**, as soon as verified. First questions: which URLs are indexed; which queries bring the home page impressions; whether the DDG ranks hold on Google.
2. **Re-run the DDG panel** (`q1.txt` and `q2.txt` queries in the sweeps, about 80 queries) from a Malaysian connection, and on Google by hand for the 15 most important. Compare order.
3. **Re-run autocomplete monthly** for the 10 head seeds. The BM gallery phrases (AC 0) are the leading indicator: the first one to get a completion shows demand forming.
4. **TikTok and Instagram search** for `qr gambar kahwin`, `kumpul gambar tetamu`, `galeri qr`: competitors' TikTok videos show up in Google results, so social search is probably where demand lives. Not measured here.
5. **Google Trends** for `kad kahwin digital`, `wedibox`, `qr gambar kahwin`. Not reachable from here.
6. **People Also Ask** for the 10 primary queries. Not reachable from here.
7. **AI answer wave 0** on the 40 frozen prompts (`ai-answers.md`), with the engine, the date, the cited URLs, and the pool of Malaysian sources cited.
8. **Brand collision test**: search `Indahnya QR`, `Indahnya galeri majlis`, `Indahnya majlis` weekly until the home page is in the top 3.
9. **Competitor fact refresh** before building the two comparison pages: re-fetch every price and feature, record the date and URL.
10. **Page fit check** for aqiqah and birthday on the e-kad templates, by rendering one of each.
11. **Per-page gate**: each new page, once indexed, is checked against the sweep row that justified it (is it on the first page for its primary query within 8 weeks?). If not, merge or drop.
