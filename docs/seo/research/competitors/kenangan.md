# Teardown: Kenangan (kenanganmajlis.com)

Checked 12 November 2026. The closest Malaysian rival: same category, same payment gateway, BM-first, and the only rival with a full comparison-page set.

**Labels.** [measured] I fetched it today. [sourced] The vendor's own page, URL given, checked 12 November 2026. [third-party] Someone else's claim. [inferred] My reading. [unverified] Could not confirm.

## What they sell

- A QR guest gallery per majlis. Guests scan, no app, no account. [sourced: https://kenanganmajlis.com/]
- An optional e-kad + RSVP add-on, and an optional guest-video add-on. [sourced: https://kenanganmajlis.com/harga]
- Operator: TRLABS TECHNOLOGIES (202603175570), Malaysia. Support by WhatsApp. [sourced: https://kenanganmajlis.com/tentang]
- Pay once per majlis, no subscription, no account to manage. [sourced: https://kenanganmajlis.com/]

## Prices (own page, checked 12 November 2026)

Source: https://kenanganmajlis.com/harga and https://kenanganmajlis.com/ciri [sourced]

| Item | Price | What it includes |
|---|---|---|
| Galeri QR | RM35 per majlis | Unlimited photos (fair use), 2 months active, ZIP download, TV screen display, Salam Kaut QR, print-ready QR design, 15 IG Story frame templates, filters and reactions, names and wishes on photos, passcode option, host controls |
| Video add-on | +RM10 | Guest video, each clip up to 30 seconds |
| e-Kad + RSVP add-on | +RM30 | e-kad themes, RSVP, headcount per invite, wishes, CSV export |
| Extra month | +RM5 per month | After the 2 included months |
| Combined | RM65 (gallery + e-kad + RSVP), RM75 (plus video) | Shown on https://kenanganmajlis.com/ciri |
| Free plan | None found. A guest demo exists ("Cuba sebagai tetamu") | [measured] |

- The 2 months start when the host opens the gallery, or when the system opens it on the event date. [sourced: https://kenanganmajlis.com/soalan-lazim]
- After expiry, media "mungkin dipadam" (may be deleted). [sourced: same FAQ]
- Their own comparison page prices 3 months at +RM5 and 6 months at +RM20 on top of the base. A 12-month gallery is therefore about RM85 for photos only [inferred arithmetic from RM5 per extra month, not stated on a page].
- Refunds: "Tiada bayaran balik selepas pengaktifan pakej" (no refund after the package is activated). [sourced: https://kenanganmajlis.com/polisi-bayaran-balik, updated 1 November 2026]

## Features against Indahnya's list

Indahnya's side comes from `docs/seo/research/indahnya-truth.md` (12 November) [truth file].

| Feature | Kenangan | Note |
|---|---|---|
| QR guest gallery, no app | Yes [sourced] | |
| Guest video | Add-on, 30 s clips [sourced] | Indahnya: videos up to 60 s [truth file] |
| e-kad | Add-on RM30 [sourced] | Indahnya: built, 5 templates, on every plan including Percuma [truth file] |
| RSVP | Add-on, with headcount, side-of-couple filter, CSV [sourced] | |
| Table / seat finder | Not found on home, harga, ciri or FAQ. Zero hits for "meja" [measured] | [unverified] that it does not exist elsewhere. Indahnya has it [truth file] |
| Written wishes | Yes, name + short message on each photo [sourced] | |
| Voice wishes (ucapan suara) | Own comparison table says "Tiada / Belum tersedia" (none, not yet available). Zero hits for "suara" on home, harga, ciri [measured] | [sourced: https://kenanganmajlis.com/kenangan-majlis-vs-povkita] |
| Review before photos show (approval mode) | Own table says "Tiada": host hides or deletes after upload [sourced, same page] | Indahnya has approval mode, hide and delete [truth file] |
| Live TV slideshow | Yes: "Tayang gambar di skrin majlis", projector mode [sourced] | |
| Salam Kaut QR | Yes [sourced] | Indahnya's e-kad has salam kaut with a DuitNow QR [truth file] |
| Free tier | No [measured] | Indahnya has RM0 |
| Retention | 2 months, then paid months [sourced] | Indahnya: kept 365 days (RM59), 730 days (RM99) [truth file] |

## Positioning and hero copy

- Title tag: "Galeri Gambar Tetamu dengan Kod QR | Kenangan" [measured]
- Meta: "Kenangan mengumpulkan gambar dan video tetamu dalam satu galeri digital majlis melalui kod QR, tanpa aplikasi atau akaun." [measured]
- Hero: "3 dalam 1 / Kumpulkan gambar tetamu dengan satu kod QR". Sub: "Bermula RM35 untuk gambar tanpa had. Bayar sekali sahaja." [sourced]
- Pain line: "Gambar dan video tetamu tak patut hilang dalam WhatsApp." [sourced]
- Mock chat in the hero: "Siapa ada gambar masa akad tadi?" / "Nanti hantar dalam group ya." [sourced] This is the exact WhatsApp pain.
- Tone: mixed formal and colloquial ("Awak", "Mula dengan galeri. Tambah apa yang awak nak."). [sourced]

## SEO footprint

All [measured] 12 November 2026.

- robots.txt: allows all, blocks `/admin` and `/api/`. Social bots listed explicitly. No AI-bot blocks. https://kenanganmajlis.com/robots.txt
- sitemap.xml: 56 URLs. 28 are `/en/` mirrors, so about 28 unique pages in BM and EN.
- Page types: home, harga (pricing), ciri (features), artikel, panduan, soalan-lazim, tentang, legal pages (terma, privasi, bayaran balik, penghantaran, penggunaan), affiliates (terma, program), create flow.
- Comparison set (BM + EN): `kenangan-majlis-vs-kenang`, `-vs-gathrly`, `-vs-povkita`, `-vs-momenspace`; and `banding/galeri-qr-vs-whatsapp`, `galeri-qr-vs-google-photos`, `galeri-tetamu-vs-jurugambar-kahwin`. 7 comparison pages, 14 URLs with EN.
- Guide articles: `cara-kumpul-gambar-tetamu-kahwin`, `idea-papan-tanda-qr-gambar-kahwin`, `kod-qr-tak-boleh-scan`, `cara-buat-rsvp-kahwin`, `contoh-ayat-jemputan-kahwin-whatsapp`, `kad-kahwin-digital-vs-bercetak`.
- Titles seen: harga "Harga e-Kad Kahwin, RSVP & Galeri QR - Kenangan"; vs-povkita "Kenangan Majlis vs povkita: Harga, Video & Privasi".
- Structured data on harga: SoftwareApplication, AggregateOffer, Offer, Organization, BreadcrumbList.
- Comparison pages state "Disemak 2 November 2026", cite official sources, and mark unknowns as "Tidak disahkan" rather than "no". This is the standard Indahnya should match.
- Independent search rank: not measured. I could not run a rank check.

## Languages and payment

- BM default, EN via `/en/`. [measured]
- Payment: "Pembayaran yang selamat dengan CHIP" with FPX in the page text (12 mentions of FPX across home, ciri and harga). [measured, https://kenanganmajlis.com/harga] Same gateway as Indahnya per facts.md.

## Weaknesses and complaints

- No third-party complaints found. Trustpilot returned 403; Reddit returned 403; Facebook and Instagram pages are login-walled. Evidence limit: no buyer voice on Kenangan at all. [unverified]
- Their own policy gives no refund after activation, and the gallery lasts 2 months unless you pay RM5 per month. [sourced]
- Their own comparison page admits it "bukan pilihan paling murah" against povkita. [sourced: https://kenanganmajlis.com/kenangan-majlis-vs-povkita]
- Fair-use wording: "gambar tanpa had" carries a footnote about security limits. [sourced]
- Voice notes and pre-approval of photos: Kenangan's own comparison table says it has neither. No seat finder found. [sourced + measured]
- New company: SSM number starts 202603, so registered in 2026 [inferred from the number format]. No public customer count found. [measured: none on home page]

## Where Indahnya can honestly beat them

1. Retention: Indahnya's paid plans keep media 1 or 2 years against 2 months. Compare on the same definition: Kenangan's 2 months is the active period; Indahnya has an upload window (183 or 365 days) and a kept period (365 or 730 days).
2. One price covers the whole bundle. Kenangan needs RM65 to 75 for gallery, RSVP and video; Indahnya RM59 or RM99, with e-kad, RSVP, table finder and voice wishes on every tier [truth file].
3. Seat finder and voice wishes: not on Kenangan's pages today.
4. A real free plan (RM0, 50 uploads). Kenangan has no free plan.
5. Not honest to claim: cheaper for a photo-only gallery (RM35 vs RM59), more mature, more content, more reviews. Kenangan is ahead on content footprint and comparison pages.

## Sources

- https://kenanganmajlis.com/ , /harga , /ciri , /tentang , /soalan-lazim , /polisi-bayaran-balik , /robots.txt , /sitemap.xml [sourced, checked 12 November 2026]
- https://kenanganmajlis.com/kenangan-majlis-vs-povkita [sourced; their claims about povkita are third-party for us]
