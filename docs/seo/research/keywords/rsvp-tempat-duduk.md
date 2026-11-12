# Sweep: RSVP, senarai tetamu, cari meja / seating, buku tetamu, ucapan

Checked 2026-11-12. Labels and method as in `galeri-gambar-tetamu.md`. Every demand and winnability grade is [inferred].

## Summary

1. **RSVP has solid BM demand, mostly bundled with the kad.** `rsvp kahwin` gave 13 completions; `kad kahwin digital rsvp` is in the top 10 of the biggest e-kad head [measured].
   The informational slice is "how do I do RSVP": `cara buat rsvp kahwin`, `rsvp kahwin google form`, `contoh rsvp kahwin`, `soalan rsvp kahwin` [measured].
2. **Seating and table finder have almost no typed BM demand.** `seating plan kahwin`, `cari meja tetamu`, `nombor meja kahwin`, `senarai tetamu kahwin`: AC 0. `susun meja kahwin`: 1 completion (`susun atur meja kenduri kahwin`) [measured].
   The result pages still hold guides (ajakme, sweetseat, congak, gotchaa-lab), so the intent exists but is small.
3. **`ucapan kahwin` is a trap.** AC 104 completions, but the intent is wording to congratulate a friend (`ucapan kahwin untuk kawan`, `barakallah`, `dalam arab`) [measured]. It is not "guests leave wishes on the couple's page".
   Do not target it. The Indahnya meaning of ucapan (guests write or record a wish) has no typed BM phrase of its own.
4. **Digital guestbook is an English-led term.** `digital guest book` 46 completions, `wedibox digital guest book` among them [measured]. BM `buku tetamu digital`, `buku ucapan digital`, `guestbook kahwin`: AC 0 or 1.
5. **The BM result pages for guestbook and ucapan are thin and vendor-owned** (raikanmomen.my, sedetik.com, wed.tv/ms, postererpictures.com, kadistimewa) [measured, D]. A real page with a real example can enter.

## Query table

| # | Query (verbatim) | Demand signal | Intent | Who ranks now [measured, D] | Page type | Winnability |
|---|---|---|---|---|---|---|
| R1 | `rsvp kahwin` | AC 13: google form; kad kahwin; contoh; jemputan kahwin; cara buat; soalan | mixed | not measured as a bare head | | n/a, use R2/R3 |
| R2 | `cara buat rsvp kad kahwin` | AC 2 (`cara buat rsvp kahwin`, `cara buat rsvp kad kahwin`) | how-to | rsvpkahwin.com, raikad x2, sayakahwin, reception.my/ms/panduan, hellokahwin, akad.com.my blog "RSVP dalam E-kad Kahwin", YouTube, kahwinstudio blog, reception.my panduan | vendor guides | months. Vendors write these to sell their own kad; a neutral guide with a decision rule is possible |
| R3 | `rsvp kahwin google form` | AC 3 variants (`contoh rsvp kahwin google form`) | how-to / DIY | kahwinstudio.com/blog (12 soalan), formuiz, templateradar, studiocreativethings, wedd.ai, spreadsheetpoint, formmaker, usecarly, qualtir, geeksforgeeks | English template blogs; one BM blog | months. The honest answer is "Google Form works; here is when it stops working". Indahnya's RSVP is one option, not the only |
| R4 | `soalan rsvp kahwin` / `contoh rsvp kahwin` | AC 1 each | informational | not measured | | long tail inside R2/R3 guide |
| R5 | `rsvp online kahwin` | AC (`rsvp online` 159, generic and global) | commercial | rsvpkahwin.com, kunjung.my (home + /rsvp-kahwin-online), raikan, rsvpkahwin login, thekahwin, myeka | vendor | long-term |
| R6 | `senarai tetamu kahwin excel` | AC 0 for `senarai tetamu kahwin` | template | kahwinstudio checklist, jemput.rsvp/ms/senarai-tetamu-kahwin (Excel template), chungdoi.com/ms/guest-list, sistemguru, scribd | template pages | months, but Indahnya has no guest-list tool (see Not claimable). Skip |
| R7 | `seating plan kahwin malaysia` | AC 0 | informational | ajakme.com/blogs (susunan meja VIP), sweetseat.com.my guide (RSVP + susunan meja), gotchaa-lab.com blog (2026-10-15), planivia.net, myweddingplanner.com.my, congak.my calculator, apersonalwedding | guides, calculators | months for a BM guide with a practical table layout |
| R8 | `susun atur meja kenduri kahwin` | AC 1 | informational | ajakme guide, kerusimeja.my, canopy2u.com.my x2, TikTok, emceekahwin, undangankahwin blog | rental-vendor blogs | months |
| R9 | `cari meja tetamu kahwin digital` / `nombor meja kahwin` | AC 0 | commercial | tetamu.me, jemputan.me, jemputanmajlis.com, ekadinvite.my, wedinstudio, myeka, jemputlah.online, sejiwa.my, raikad; Indahnya #2 on the near-variant `cari nombor meja tetamu kad digital` | e-kad vendors | weeks (see E10) |
| R10 | `wedding seating chart app free` | AC 15 | commercial EN | wedding.studio, seatplan.io, weddingcharts.com, wedgenerator, weddingseatplan, seatisfy, seatedly, lovelyseating, weddingseatingchart.app | global free tools | unlikely. Those are planners for the host. Indahnya's table finder is for the guest ("taip nama, dapat nombor meja") |
| R11 | `buku tetamu digital kahwin` | AC 0 | commercial | raikanmomen.my, gathrly blog (idea buku tetamu digital), sedetik.com, kadistimewa, ekadinvite, wed.tv/ms, jemputan.me | vendor | weeks to months |
| R12 | `guestbook digital kahwin malaysia` | AC 0 | commercial | printlab.com.my x2 (physical product), postererpictures.com, kahwinstudio, sedetik, kad2u, majliskahwin.com/guestbook | vendor + print shop | months |
| R13 | `ucapan tetamu digital kahwin` / `ucapan suara kahwin digital` | AC 0 / AC 0 | commercial | e-kad vendors only (kadistimewa, chungdoi.com/ms buku ucapan, walimatul.my, ajakme, kahwinnow, undangankahwin, djemput, jomrsvp, urusinvite) | e-kad vendor home pages | weeks. No page is dedicated to voice wishes in BM [measured]. A BM page that shows a real voice wish can be the only one |
| R14 | `digital guestbook malaysia wedding` | AC 7 (`digital guestbook wedding`) | commercial EN | gathrly.my/en/blog, printlab x2, polaroidku, gathrly BM blog, galerilive, sedetik | vendor | months |
| R15 | `digital guest book qr code malaysia` | AC 46 for `guest book digital` | commercial EN | guestbookqr.com x2, gathrly blog, guestqr.app x2, guestbooks.site, qrmerkez, easyweddingalbum, galerilive, sedetik | global tools + 2 MY | months for a Malaysia-specific page |
| R16 | `voice wishes wedding guestbook audio` | n/a | commercial EN | pix.wedding, audioguestbook.app, ourweddingvoices, well-wishes, weddingsnap, guestwishesco, wedibox | global | unlikely in English; BM gap (R13) is the opening |
| R17 | `ucapan kahwin` | AC 104 | **congratulation wording** | not measured | | do not target (wrong intent) |

## What Indahnya can honestly say (truth file)

- RSVP: guest says hadir or tak, bilangan orang, pihak; host sees totals and exports CSV. Wording for other fields (food choice, phone) differs between the legal page text and the product notes: verify in `/[slug]/rsvp.vue` before naming them on a page.
- Table finder: the guest types a name and gets a table number. There is no seating-planner or guest-list builder for the host in the truth file. Do not write "susun meja dalam app".
- Ucapan: written wishes and voice wishes (browser recording, up to 60 s, 10 MB). The host can download them as a zip.
- All of these are on the couple's page and the kad; guests do not sign in.

## Reading for the page build

1. One guide covers R2, R3, R7, R8 and the table finder: `/panduan/rsvp-dan-susun-meja` (see map). RSVP is the primary; seating is a section. Two pages would split two small intents.
2. One feature page for the guest-facing wish book: `/buku-tetamu-digital` (R11, R12, R13, R14). BM first, with a real sample ucapan. The fictional sample majlis exists (`/aina-hakim/ucapan`, noindex): a screenshot or an indexable sample copy is the proof.
3. Do not build a "senarai tetamu" template page (R6): Indahnya has no such tool, and giving away an Excel template is a different business.
