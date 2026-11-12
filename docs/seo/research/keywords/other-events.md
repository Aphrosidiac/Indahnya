# Sweep: aqiqah, hari jadi, konvo, majlis syarikat, tunang, nikah, bertandang

Checked 2026-11-12. Labels and method as in `galeri-gambar-tetamu.md`. Every demand and winnability grade is [inferred].

## Summary

1. **Typed demand for other events is for the card, not the photo gallery.** `kad jemputan aqiqah` 48 completions, `kad jemputan hari jadi` 24, `kad tunang digital` 13, `kad jemputan tunang` 15,
   `kad konvokesyen` 8 [measured]. For the gallery: `aqiqah gambar qr`, `konvo qr code`, `qr majlis kahwin`, `dinner syarikat photo`, `annual dinner qr photo`: AC 0 [measured].
2. **Several of these queries are not about invitations at all.** `majlis konvo` (31) is university convocation schedules (UiTM, UPM, UKM ...). `majlis bertandang` (50) is "what does it mean / what to bring / aturcara". `kad nikah digital` (13) is the official marriage certificate card from JAIS/JPN. `dinner syarikat` (3) is tema and tentatif [measured].
3. **A competitor already has per-event pages**: kenang.my has `/konvokesyen`, `/tunang`, `/korporat` and ranks #1 or #2 on the gallery-for-that-event queries (below) [measured, D]. Indahnya's home page is #3 to #7 on those same queries, so the home page already carries the event signal.
4. **Indahnya supports these event types in the product**: kahwin, aqiqah, birthday, corporate, graduation, lain (`typeName` in `app/composables/useFormat.ts`) [code]. The landing eyebrow names kahwin, aqiqah, birthday and majlis syarikat (truth file).
   Tunang, nikah and bertandang are not separate types; they would be "kahwin" or "lain" [inferred]. Whether the five e-kad templates read well for aqiqah or birthday is [unverified] (the sample kad is a walimatulurus).
5. [inferred] No event page has enough typed demand or a distinct truth to justify its own URL yet. Hold them as sections and FAQ answers on pages that exist, and re-test after Search Console data.

## Query table

| # | Query (verbatim) | Demand signal | Intent | Who ranks now [measured, D] | Page type | Winnability |
|---|---|---|---|---|---|---|
| O1 | `kad jemputan aqiqah digital` | AC 48 for `kad jemputan aqiqah`; `kad aqiqah digital` AC 11 | commercial (card) | jemputt.my/kad-aqiqah, jemputanmajlis.com, kunjung.my/kad-aqiqah-digital, jemputan.me, e-jemputan.my, ekadinvite.my, crazyartzone, aqiqahcentre.com, jemputku.my | vendor landing | long-term |
| O2 | `kad jemputan aqiqah dan gambar tetamu` (probe) | n/a | mixed | aqiqahcentre.com, raikad/kad-jemputan-aqiqah, majliskita blog, jemputanmajlis, canva, thekahwin blog, scribd | blogs, templates | no gallery-for-aqiqah page exists [measured]; no typed demand either |
| O3 | `kad jemputan hari jadi digital` | AC 24 | commercial (card) | e-jemputan.my, ekadinvite.my/kad-hari-jadi-digital, ekadku.com, Shopee, canva x2, inviting2u, kunjung.my | vendor + Canva | long-term |
| O4 | `birthday party photo sharing qr code malaysia` | AC 0 for `qr gambar hari jadi` | commercial EN | eventoly.com, gathrly.my/en blog, myphotoqr.com, giftsqr, moments.photos, knipsmig | global tools; gathrly MY guide | months. Weak local competition but no BM demand |
| O5 | `qr gambar hari jadi` | AC 0 | commercial | giftsqr ms (2), get-qr.com, pixovia ms guide, generic image sites | generic | months |
| O6 | `majlis konvokesyen qr gambar` | AC 0 | commercial | 1 kenang.my, 2 kenang.my/konvokesyen, upm.edu.my official photos, gathrly blog (konvo tips), photos.utm.my, kpypj.edu.my, **7 Home** | vendor + universities | months. Universities own official photos; the family-photo angle is open |
| O7 | `kad jemputan konvokesyen digital` | AC 8 | commercial | canva, UPM/UiTM/UMS/UTHM guest-card pages, ekadinvite, e-jemputan, e-card.my | vendor + universities | unlikely |
| O8 | `dinner syarikat galeri gambar qr` | AC 0 | commercial | 1 kenang.my/korporat, 2 kenang.my/en/corporate, **3 Home**, 4 sistemkami moment, 5 lensakenangan, 6 kenanganmajlis, 7 galerilive | vendor | weeks to months. Small field |
| O9 | `company dinner photo sharing qr` | AC 0 | commercial EN | kenang.my/en/corporate, fotify.app, pixovia annual-dinner guide, guestsnap, kamero, event.pics, snapdini | vendor | months |
| O10 | `majlis tunang qr gambar` | AC 0 | commercial | 1 kenang.my/tunang, 2 kenang.my, **3 Home**, 4 kenanganmajlis, 5 jemputanmajlis (kad tunang), 6 TikTok kenang_my | vendor | weeks to months |
| O11 | `kad tunang digital` | AC 13 | commercial (card) | jemputt.my blog, jemputanmajlis x2, canva, jemputan.me, e-card.my, nakjemput, kenang.co, Shopee | vendor + Canva | long-term |
| O12 | `kad jemputan bertandang` / `majlis bertandang kad digital` | AC 5 / AC 50 for `majlis bertandang` | informational (meaning, aturcara, what to bring) | ajakme blog (panduan majlis bertandang), mymawaddah, e-card.my, jemputanmajlis, kadmajlis, jdinvite | blogs + vendors | months for an informational guide, but the product fit is weak: it is an e-kad topic, not a gallery topic |
| O13 | `kad jemputan majlis doa selamat` / `kad jemputan khatam quran` / `kad kesyukuran digital` | AC 10 / 6 / 2 | commercial (card) | not measured | | long tail; templates only |
| O14 | `aqiqah invitation` / `aqiqah invitation card maker free` | AC 106, Indian-subcontinent and Indonesian variants ("in urdu", "khmer") | noise for Malaysia | n/a | | do not target in English |
| O15 | `kad nikah digital` | AC 13 | **official certificate card** (JAIS, JPN) | gov pages | gov | do not target |
| O16 | `majlis konvo` | AC 31 | **university convocation info** | n/a | | do not target |

## Verdicts

| Event | Page? | Why |
|---|---|---|
| Aqiqah | No page now. FAQ answer on the gallery and e-kad pages ("Boleh guna untuk aqiqah?") | Demand is for the card; 48 completions but a field of dedicated vendors. Template fit unverified |
| Hari jadi | No page | Same. English birthday QR queries are global-tool territory |
| Konvokesyen | No page. One FAQ line on the home page | Universities control guest cards; photo demand not typed. Kenang already holds the pages |
| Majlis syarikat | Re-test. If Search Console shows impressions for "dinner syarikat" or "annual dinner" queries, build one page with real corporate content (approval mode, many uploaders, branding) | O8 and O9 have a thin field, but zero typed demand and no corporate-specific facts in the truth file yet (e.g. no logo or brand option is listed) |
| Tunang, nikah, bertandang | No pages | Not product types; the same QR works for "kahwin" or "lain". A sentence on the gallery page covers them |

Per the GEO plan: no city pages and no pages without substance. A page for each event name with the word swapped is the doorway pattern the plan rules out.

## Reading for the page build

- Put an "Untuk majlis apa?" section (aqiqah, hari jadi, graduasi, majlis syarikat, tunang) on the home page or the gallery guide. It needs to be a real section with one honest sentence each, taken from the event types in code.
- Check one aqiqah kad render before saying the templates suit aqiqah: [unverified].
