# Sweep: galeri gambar tetamu (QR photo gallery)

Checked 2026-11-12. Feeds `docs/seo/keyword-map.md`. Labels: [measured] seen today, [sourced] vendor's own page fetched today,
[inferred] my judgement, [unverified] not checked. Every demand and winnability grade is [inferred]. There is no volume tool.

## How the evidence was gathered

- **AC-ms**: Google autocomplete, `hl=ms&gl=my`, via curl. **AC-en**: same with `hl=en`. "AC n" = number of completions returned (max 10 per call).
  "AC 0" means Google offered nothing for that exact phrase [measured]. Alphabet expansion (`q + " a"` to `" w"`) was used on the seeds.
- **Bing autosuggest** (`api.bing.com/osjson.aspx`, `mkt=ms-MY`) returned an empty list for every seed I tried [measured]. It gave no signal.
- **D**: DuckDuckGo html results with `kl=my-en`, top 10 in order, fetched today. DDG is not Google. Order is indicative only [measured once].
- **W**: the WebSearch tool. It is US-only and returned no Malaysian vendors for BM queries, so I did not use it for rankings. See `ai-answers.md`.
- Indahnya appears in DDG as `https://indahnya.my/` (title "Indahnya: galeri gambar majlis dengan QR"). Only the home page was seen. No other Indahnya URL showed [measured].

## Finding 1: BM demand is typed rarely; the category is sold, not searched

Google offers no autocomplete for any of these BM phrases [measured, AC 0 in both ms and en]:
`kumpul gambar tetamu`, `qr code gambar kahwin`, `galeri gambar kahwin`, `album digital kahwin`, `album kenangan majlis`, `gambar tetamu kahwin`,
`qr gambar majlis`, `cara kumpul gambar`, `photo sharing majlis kahwin`, `kongsi gambar kahwin`, `foto tetamu kahwin`, `qr majlis kahwin`, `tetamu scan qr`.
[inferred] Few people type these. Hosts find these products through TikTok, Instagram and word of mouth (TikTok videos from @momenspace.my and @dropje.my
and @kenang_my sit in DDG results for "cara kumpul gambar tetamu kahwin" [measured]). Search demand is real but small and growing.

Brand names of the local rivals also have AC 0 (`kenang my`, `kenangan majlis qr`, `momenspace`, `kad2u`) [measured].

## Finding 2: the BM result pages are already crowded with dedicated vendors

About 15 Malaysian vendors target exactly this intent [measured, DDG]: gathrly.my, momenspace.my, kenang.my, kenanganmajlis.com, lensakenangan.com,
neekahkita.com, wcdigital.my, jomgambar.my, kad.sistemkami.com / moment.sistemkami.com, tenunkenangan.com, pixovia.app (ms guides), galerilive.com,
albumkahwin.com, korundi.com, memori.majlisku.com, wed.tv/ms, gncollage.com. Plus generic QR tools (me-qr.com, giftsqr.com, sendtodrive.com, qrcode-tiger.com).

Indahnya's home page already ranks on DDG for 12 long-tail BM queries (ranks in the table). That is the one asset to protect.

## Query table

Columns: demand signal, intent, who ranks (DDG top, today), page type that ranks, winnability for a new domain.
"Home" = indahnya.my `/`.

| # | Query (verbatim) | Demand signal | Intent | Who ranks now [measured, DDG] | Page type | Winnability |
|---|---|---|---|---|---|---|
| G1 | `qr code gambar majlis kahwin` | AC 0 (ms, en) | commercial | 1 gathrly.my, 2 momenspace.my, 3 lensakenangan.com, **4 Home**, 5 kenang.my, 6 gathrly blog, 7 wcdigital.my, 8 neekahkita.com | vendor home pages | weeks to hold (already #4), months to top 3 |
| G2 | `galeri gambar kahwin qr code` | AC 0 | commercial | 1 momenspace, 2 gathrly, 3 lensakenangan, 4 neekahkita, 5 gncollage, 6 me-qr, **7 Home**, 8 kenang/kahwin | vendor | same as G1 |
| G3 | `kumpul gambar tetamu majlis kahwin` | AC 0 | informational + commercial | 1 kenanganmajlis.com/cara-kumpul-gambar-tetamu-kahwin, 2 memori.majlisku.com, 3 gathrly, 4 kenanganmajlis/panduan, 5 momenspace, 6 kenang, 7 jomgambar, 8 sistemkami, 9 TikTok @dropje.my, 10 giftsqr. Home absent | vendor guide + vendor home | months (a real guide can enter; two vendors have guides today) |
| G4 | `cara kumpul gambar tetamu kahwin` | AC 0 (prompt p002 weight 3) | how-to | 1 kenanganmajlis guide, 2 kenanganmajlis/panduan, 3 gathrly, 4 pixovia ms guide, 5 TikTok momenspace, 6 pixovia, 7 TikTok dropje, 8 kenang, 9 momenspace, 10 wcdigital | vendor guides, TikTok | months |
| G5 | `album gambar kahwin digital qr` | AC 0 (`album kahwin digital` AC 0) | commercial | sistemkami, neekahkita, sistemkami moment, lensakenangan, wcdigital, korundi, albumkahwin.com, gathrly, kenang, giftsqr. Home absent | vendor | months |
| G6 | `tetamu upload gambar tanpa download app` | AC 0 (prompt p005) | commercial | 1 jomgambar, 2 memori.majlisku, **3 Home**, 4 kenang, 5 momenspace, 6 kenanganmajlis, 7 neekahkita, 8 gathrly | vendor | weeks (already #3) |
| G7 | `cara tetamu hantar gambar majlis` | AC 0 | how-to | 1 gathrly blog "Cara Buat Tetamu...Kongsi", 2 TikTok momenspace, 3 gathrly blog vs WhatsApp, 4 kenang, 5 kenanganmajlis, 6 jomgambar, **7 Home** | vendor blog | months |
| G8 | `harga qr gambar kahwin` / `berapa harga galeri qr kahwin` | AC 0 | commercial | neekahkita, lensakenangan, kenanganmajlis/harga, kenang, gathrly, kad2u/harga, sayakahwin. Home absent | pricing page | months. Needs `/harga` retarget (see e-kad.md E-rows and the map) |
| G9 | `galeri gambar majlis percuma` | AC 0 | commercial (free) | **1 Home**, 2 neekahkita/guest-gallery, 3 galeri.rizalcipta.com, 4 gathrly | vendor | weeks (holds #1; tiny demand) |
| G10 | `cara buat qr code gambar` | AC-ms 12 (`cara buat qr code gambar`, `...untuk gambar`, `...dari gambar`, `...dari foto`) [measured] | how-to, generic (mostly Indonesian phrasing: "bikin", "berisi") | not measured for this exact query; the related `kad kahwin qr code` SERP = me-qr, qrcode-tiger ms, kongsilah.my, hellokahwin, pageloot, neekahkita, kad2u | generic QR tools, blogs | months. Real BM demand, but the searcher wants a QR for one image or file, not an event gallery. Guide must serve that honestly first |
| G11 | `cara buat qr code kehadiran` / `cara buat qr code lokasi majlis kahwin` | AC-ms 1 / seen in expansion of `cara buat qr code` (187 completions, incl. `kehadiran`, `pendaftaran`, `lokasi majlis kahwin`, `buku program`) [measured] | how-to | not measured | blogs | long tail; belongs to the same guide as G10 as secondary |
| G12 | `album digital` | AC-ms 206 but all football-sticker/Spanish/Portuguese ("panini mundial 2026") [measured] | noise | n/a | n/a | do not target |
| G13 | `qr code album wedding` | AC 130, mixed languages [measured] | EN/global | not measured | | do not target in BM; see `english-malaysia.md` |
| G14 | `kongsi gambar majlis kahwin` | AC 0 | commercial | 1 gathrly, 2 kenanganmajlis/create, 3 kenanganmajlis/tentang, 4 gathrly blog, 5 TikTok dropje, 6 momenspace, 7 pinterest, 8 memori.majlisku | vendor | months |
| G15 | `slideshow gambar tetamu live tv kahwin` | AC 0 | commercial | 1 wedavo ms, 2 gathrly blog, 3 giftsqr, 4 momenspace, 5 kenang, 6 jomgambar, 7 neekahkita, 8 wcdigital, **9 Home**, 10 gathrly | vendor | see `slideshow-tv.md` |
| G16 | `kenapa gambar whatsapp pecah` | AC-ms 3 (`whatsapp gambar pecah`, `status whatsapp gambar pecah`) [measured] | problem-aware informational | Indonesian news/tech sites only (telkomuniversity, khadera, tempo, liputan6) | news/blog | months. Real problem behind "WhatsApp group" habit. Candidate section in the WhatsApp comparison, not a page |

## What a visitor wants first (for the pages)

- G3/G4: a plain answer in the first lines: "Letak QR di meja, tetamu scan dan upload dari browser telefon, semua masuk satu galeri." (matches the truth file: no app, no sign-in).
- G8: the price, in ringgit, before anything else.
- G10: how to make a QR for a photo or album (honest), then the event gallery route.

## Competitor price points seen today (home or pricing pages, [sourced], one fetch)

| Vendor | Plans seen | URL |
|---|---|---|
| Kenangan | RM35 per majlis, 2 bulan aktif; +RM10 for e-kad + RSVP | kenanganmajlis.com/harga |
| Kenang | RM99 one majlis, RM148 two majlis (belah perempuan dan lelaki) | kenang.my |
| momenspace | RM0 (50 photos, 7 days kept), RM39 (150 photos, 14 days), RM99 (unlimited, 7 days upload) | momenspace.my/pricing |
| JomGambar | RM0 trial (20 photos), RM49 digital only (1000 photos), RM99 premium + PDF photobook | jomgambar.my |
| Neekah Kita | gallery starts free; premium +RM99; e-kad RM29 / RM49 | neekahkita.com |
| Wedibox | USD 0 / 29 / 49 / 79 one-time | wedibox.com/pricing |

Not verified: what each plan really includes beyond the lines I read. Do not copy these into a public page without a second check and a date.

## Reading for the page build

1. The home page is already the ranking asset for the BM gallery head (G1, G2, G6, G9). Do not split it into `/galeri-qr` in wave 1 (see map, decision D1).
2. The open BM gaps with a real page type are guides: G4/G3 (collect guest photos), G10 (QR for photos), and the WhatsApp comparison (G16, `alternatives-vs.md`).
3. Because AC is 0, expect Search Console impressions in single digits per query per month at first [inferred]. Success is being the cited source, not volume.
