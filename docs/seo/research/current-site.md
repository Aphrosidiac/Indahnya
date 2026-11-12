# indahnya.my: current site map for SEO

Checked 2026-11-12. Builds on `docs/geo/` (the 2026-10-04 GEO pass, commit e995b70). It re-measures the live site
against BayangWeb's `docs/SEO_BASELINE.md` and Siar's `docs/seo/ACCEPTANCE.md`, the standard this build follows.

Labels: **[measured]** = I fetched it today · **[inferred]** = my judgement.

## 1. Summary

1. **The site is small and mostly sound.** 14 sitemap URLs (7 pages × BM/EN), all 200, self-canonical, indexable,
   one H1 each, hreflang `ms-MY` / `en-MY` / `x-default` on every page, JSON-LD parses [measured].
2. **It targets almost nothing people search.** Only `/` and `/harga` aim at a real query. There is no page for
   e-kad, RSVP, table finder, slideshow, guides or comparisons. The only demo (`/aina-hakim`, `/contoh/kad`) is
   `noindex` [measured].
3. **Real visitors are near zero.** Cloudflare Web Analytics: ~140 page loads in 30 days, 100 of them on launch day
   (owner testing, inferred); one visit from Bing search. nginx logs for 14 days: ~7,500 requests, half are
   vulnerability probes, most of the rest crawlers and fake browsers [measured].
4. **No search console exists yet.** Google Search Console, Bing Webmaster Tools and IndexNow are not set up
   (`docs/geo/owner-todo.md`). Indexing could not be measured: Bing and DuckDuckGo `site:` fetches returned nothing to
   a script [measured].
5. **Crawlers get in.** Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot,
   PerplexityBot, Applebot, CCBot and Google-Extended all get 200 on `/tentang` [measured].

## 2. Inventory (live, 2026-11-12)

| URL (BM; EN = `?lang=en`) | Title (chars) | Description (chars) | H1 | JSON-LD |
|---|---|---|---|---|
| `/` | Indahnya: galeri gambar majlis dengan QR (40) | 165 / EN 166 | "Semua gambar majlis.Satu QR." | Organization, WebSite, SoftwareApplication, WebPage, FAQPage |
| `/harga` | Harga Indahnya: RM0, RM59 atau RM99 sekali bayar (48) | 159 / EN 140 | Bayar sekali. Untuk satu majlis. | same + FAQPage |
| `/tentang` | Tentang Indahnya: galeri gambar majlis dengan QR (48) | **322** / EN **341** | Tentang Indahnya | AboutPage graph |
| `/privasi` | Notis Privasi · Indahnya (**24**) | **270** / EN **248** | Notis Privasi | WebPage |
| `/terma` | Terma Perkhidmatan · Indahnya (29) | **194** / EN **183** | Terma Perkhidmatan | WebPage |
| `/bayaran-balik` | Bayaran Balik dan Pembatalan · Indahnya (39) | **204** / EN **171** | same | WebPage |
| `/penghantaran` | Penghantaran dan Pemulangan · Indahnya (38) | **260** / EN **211** | same | WebPage |
| `/aina-hakim` (+ gambar, ucapan, rsvp, tempat) | Walimatulurus · Aina & Hakim | 59 | Aina & Hakim | none, `noindex, nofollow` |
| `/contoh/kad` | Indahnya (8) | none | Aina & Hakim | none, `noindex, nofollow` |
| `/mula` | Pratonton · Indahnya | none | Indahnya belum buka untuk umum. | `noindex` |

Bold = outside the acceptance range (title 25–60, description 120–160).

## 3. Technical findings

| Check | Result | Baseline wants |
|---|---|---|
| `http://` → https | one 301 (Cloudflare) | ok |
| `https://www.` → apex | one 301 | ok |
| `http://www.` | two hops (Cloudflare to https, then nginx to apex) | one hop |
| `indahnya.ffdev.studio` | one 301 | ok |
| `/harga/` (trailing slash) | **200**, canonical `/harga` | one 301 |
| `/HARGA`, `/Harga` | **200**, canonical `/harga` | one 301, or 404 |
| `/index.html` | 404 | ok |
| `?utm_source=…&gclid=…` | keeps the clean canonical | ok |
| Unknown URL | 404, **no `noindex` meta** | 404 + `noindex` |
| `robots.txt` | `Allow: /`, disallows `/app`, `/api/`, `/tv/`, `/masuk`; absolute sitemap | ok |
| Sitemap | 14 URLs, `lastmod`; no index file | ok for now; split when it grows |
| HSTS | one year, includeSubDomains | ok |
| HTML caching | `cf-cache-status: DYNAMIC`, SSR on every request; TTFB 0.17–0.36 s from Malaysia | ok, could be cached |
| Home HTML size | 282 KB | under 1 MB |
| Cloudflare Email Obfuscation | **on**: the footer email is a `/cdn-cgi/l/email-protection` link | off (Siar turned it off: crawlers hit a 404 link) |
| `llms.txt` | 404 | optional; Siar keeps one but invests nothing |
| Cloudflare Web Analytics | on, cookieless | keep |

## 4. On-page findings

1. **Split headlines glue words in the raw HTML.** The H1 text is "Semua gambar majlis.Satu QR." (EN "Every photo from
   the day.One QR."). Siar had the same bug: Google showed the glued text as the snippet. Fix: a real space or `<br>`
   between the two spans.
2. **`FAQPage` JSON-LD on `/` and `/harga`.** The acceptance standard drops it (FAQ rich results were retired in May
   2026). Keep the visible FAQ.
3. **No BreadcrumbList** anywhere. Needed once pages nest (`/panduan/...`, `/banding/...`).
4. **No visible "Dikemaskini" date** on the landing or `/harga`; `dateModified` must match a visible date.
5. **English is a query parameter** (`?lang=en`). Google accepts it with hreflang, but every EN URL shares its path
   with BM, and any link without the parameter falls back to BM. The keyword map decides whether to move to `/en/...`.
6. **Descriptions on About and the legal pages run 180–340 characters.** Google cuts them; the gate wants 120–160.
7. **The sample is invisible to search.** `/aina-hakim` and `/contoh/kad` are the best proof of the product and are
   `noindex`. The GEO plan suggests an indexable, clearly fictional sample page.
8. **Payment-method line** over-claims (truth file rule 2).

## 5. Missing page types

- Feature pages: e-kad, galeri QR, RSVP and senarai tetamu, cari meja, ucapan suara, slideshow TV, QR poster print.
- Event pages with real substance: aqiqah, majlis syarikat, hari jadi (only if the product genuinely fits).
- Guides (`/panduan/...`): how to collect guests' photos, plan RSVP, set out QR on tables.
- Comparisons (`/banding/...`): WhatsApp group and Google Drive, and named rivals with dated facts.
- An indexable sample (fictional, labelled).

The keyword map (`docs/seo/keyword-map.md`) decides which of these become pages and in what order.

## 6. Order of work (proposal)

1. Wave 0, make the site true and clean: payment line, glued H1, FAQPage markup, descriptions, trailing-slash and
   uppercase 301s, 404 `noindex`, Email Obfuscation off.
2. New pages in the order the strike plan sets.
3. Gates A–C on the branch, then gate D after the owner says deploy.
