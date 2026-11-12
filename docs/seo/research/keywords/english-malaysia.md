# Sweep: English queries from Malaysians

Checked 2026-11-12. Labels and method as in `galeri-gambar-tetamu.md` (AC-en = Google autocomplete hl=en gl=my). Every demand and winnability grade is [inferred].

## Summary

1. **English demand is much larger than BM demand for the photo gallery**, but almost all of it is global (UK, US, India, Australia). Autocomplete does not say who types it. `wedding qr code photo` 10, `wedding photo qr` 10, `wedding photo sharing app` 10+, `wedding qr code gallery` 15, `event photo sharing qr` 16, `collect wedding photos from guests` 10, `wedding guest photo upload` 13 [measured]. The completions carry UK and US markers ("uk", "reddit", "australia").
2. **The global English SERP is a vendor roundup market** (Wedibox, Kululu, Fotify, GuestPix, Lense, pov.camera ...). "best wedding photo sharing app" top 10 is ten vendor or directory listicles, each ranking itself or a friend [measured, D]. A new domain cannot win it.
3. **Malaysia-qualified English queries have a real, thin field.** `wedding photo qr code malaysia`: kenang.my/en/wedding, galerilive.com, gathrly.my/en, pixovia.app/guides (Malaysia + Singapore), camera.wedding, wedding.studio [measured, D]. `malaysia wedding photo sharing app no download`: kenang.my/en, pixovia, gathrly/en, galerilive, camera.wedding. `free qr photo gallery wedding malaysia`: momenspace `?lang=en` at #1, galerilive, gathrly/en, kenang/en, catchmemo, pixovia [measured]. Indahnya was absent from the English Malaysia queries I ran.
4. **For invitations**, `digital wedding invitation malaysia` AC 10 and `e-invitation malaysia` AC 8. The field is Malaysian vendors with English pages (invitee.my, raikad.com/en, evently.my, ekadinvite.my/en, reception.my/en) [measured].
5. **Many of the English queries are Malaysian-written but not Malaysia-worded**, because Malaysians search in English without "Malaysia" (`wedding qr code photo sharing`). Those go to the global field. [inferred] The Google ranking for a Malaysian searcher will favour local pages somewhat; DDG with `kl=my-en` does not show that clearly.

## Query table

| # | Query (verbatim) | Demand signal | Intent | Who ranks now [measured, D] | Page type | Winnability |
|---|---|---|---|---|---|---|
| N1 | `wedding qr code photo sharing` | AC 10 (`...free`, `...no app`, `...sign`, `...album`, `...app`) | commercial | guestpix.com, kululu, weddingqr.codes, wedding.studio, event.pics, pix.wedding, knipsmig, guestcam | global vendors | unlikely |
| N2 | `wedding photo qr code malaysia` | AC 0 (the phrase without "malaysia" has 10) | commercial local | kenang.my/en/wedding, galerilive, gathrly/en, pixovia guide, gathrly guide, camera.wedding, wedding.studio, me-qr ms | local vendors + global | months |
| N3 | `malaysia wedding photo sharing app no download` | AC 0 | commercial local | kenang.my/en x2, pixovia guide, gathrly/en, pixovia, galerilive, camera.wedding | local vendors | months |
| N4 | `free qr photo gallery wedding malaysia` (p033) | AC 0 | commercial (free) | momenspace `?lang=en`, galerilive, gathrly/en, kenang/en, catchmemo, pixovia, kenang/en/wedding | local vendors | months |
| N5 | `how to get guests to upload photos wedding malaysia` (p004) | AC 6 for `how to collect guest photos wedding` | how-to | photogala, pixovia (MY/SG guide), guestpix guide, wedding.studio, eventringo, guest-pictures | global vendor guides + 1 MY | months |
| N6 | `best wedding photo sharing app` | AC 10+ | listicle | wedibox/compare, fotify, lense, pov.camera, wedding.studio, fotasnap, knipsmig, jollypics, eventpixel, eventphoto.io | vendor listicles | unlikely |
| N7 | `best QR code wedding photo sharing app Malaysia` (p006) | AC 0 | listicle local | not measured by DDG; the WebSearch tool returned global results only, no Malaysian vendor | | months only with a listicle that states its method and lists rivals; the plan says not to rank Indahnya first by default |
| N8 | `digital wedding invitation malaysia` | AC 10 | commercial | invitee.my, raikad/en, wedding-knot.futurify.my, sayakahwin, kad-jemputan-digital.com.my, kadlah, wedinbytes, wedinstudio, aliveinvite | local vendors | long-term |
| N9 | `online wedding invitation malaysia rsvp` (p013) | AC 4 | commercial | reception.my, evently.my, invitee.my, raikad/en, inviting2u/en, ekadinvite/en, wedding-knot | local vendors | long-term |
| N10 | `malaysian wedding rsvp app` / `wedding website malaysia free rsvp` | AC 0 / AC 9 for `malaysia wedding rsvp` | commercial | invitee.my, evently.my, raikan, raikad/en, reception.my, invitecount.com, kahwinstudio, wedding-knot | local vendors | long-term |
| N11 | `digital guestbook malaysia wedding` | AC 7 | commercial | gathrly/en blog, printlab x2, polaroidku, gathrly BM blog, galerilive, sedetik | local + print | months |
| N12 | `birthday party photo sharing qr code malaysia` (p016) | AC 0 | commercial | eventoly, gathrly/en blog, myphotoqr, giftsqr, moments.photos | global + MY blog | months, but low value |
| N13 | `company event photo sharing qr code malaysia` (p017) | AC 0 | commercial | kenang.my/en/corporate, fotify, pixovia, guestsnap, kamero | vendor | months |
| N14 | `wedding planner app malaysia` (p039) | AC 1 | commercial | not measured | | skip; Indahnya is not a planner |
| N15 | `what is a QR photo gallery for weddings` (p001) | n/a | definition | not measured | | folds into N1/N2 page |
| N16 | `is Indahnya legit` / `what is Indahnya` (p024, p027) | brand, no autocomplete | branded | Home ranks for the brand | | `/tentang` + home FAQ; already built |

## Observed on how local rivals handle English

| Vendor | EN URL pattern [measured] |
|---|---|
| kenang.my | `/en`, `/en/wedding`, `/en/corporate` (BM at `/`, `/kahwin`, `/korporat`) |
| gathrly.my | `/en`, `/en/blog/...` (BM at `/`) |
| kenanganmajlis.com | `/en`, `/en/pricing` |
| raikad.com | `/en` |
| ekadinvite.my | `/en` |
| reception.my | `/ms/...` and `/en/...` (both prefixed) |
| momenspace.my | `/?lang=en` (query parameter, and it ranks #1 for N4) |
| pixovia.app | `/guides/...` EN, `/ms/guides/...` BM |

Indahnya today: `?lang=en` on every page, with reciprocal hreflang ms-MY / en-MY / x-default in the sitemap [current-site.md]. See the URL-strategy section of `docs/seo/keyword-map.md`.

## Reading for the page build

1. English pages are worth building only for the Malaysia-qualified field (N2, N3, N4, N5, N11). Those are 3 pages at most: a gallery page, a guide, and the home in English.
2. Do not build English pages for N1, N6 (global field) or invitations N8 to N10 until BM `/e-kad` has data.
3. English copy must be written for English intent ("no app, no sign-in, RM59 one time"), not translated sentence by sentence.
