# SEO acceptance: what "done" means for the public pages

The pages go to Fakhrul only when every check below passes. The standard is BayangWeb's `docs/SEO_BASELINE.md`,
as Siar adapted it in its `docs/seo/ACCEPTANCE.md`, adapted again here for a Nuxt SSR site. `strike-plan.md` decides
what the pages say; this file decides when they are finished.

Four gates. A, B and C run on `feat/seo-landing` before handover. D runs only after Fakhrul says deploy.

## Decisions taken from the baseline

- **No `FAQPage`, `HowTo` or `QAPage` markup.** Visible FAQs stay, with question-shaped headings.
- **No `AggregateRating`, `Review`, testimonials, customer counts or launch dates**, in markup or copy.
- **Schema describes only what is visible.** Every `Offer` price is on the page and comes from `plans.ts`; every
  `dateModified` matches the visible "Dikemaskini" date.
- **`lastmod` is the content date**, never the build time.
- **BM at the root, English under `/en/`.** Mirrors carry reciprocal hreflang (`ms-MY`, `en-MY`, `x-default` → BM).
  English-only and BM-only pages carry none.
- **Couple pages, `/app`, `/masuk`, `/mula`, `/tv`, `/embed` stay `noindex`** and out of the sitemap.

## Gate A: static checks on the rendered site (automatic)

Every sitemap URL, fetched from a production build (`nuxt build` + `node .output/server/index.mjs`). Zero failures.

| Rule | Check |
|---|---|
| Sitemap | Every `<loc>` is on `https://indahnya.my`, listed once, with `lastmod`, returns 200, is indexable. No `priority` or `changefreq`. Every indexable public page is in it |
| Head | One `<title>` of 25–60 characters; one meta description of 120–160; one absolute self-canonical; `lang`; viewport; `og:title`, `og:description`, `og:type`, `og:image` (a real file), `og:url` = canonical; `twitter:card` |
| Unique | Titles, descriptions and canonicals unique across the site |
| Headings | Exactly one non-empty `<h1>` whose text has no glued words; no level skipped inside `<main>` |
| JSON-LD | Parses; none of the banned types; every URL on indahnya.my resolves; BreadcrumbList on every page but `/`, last item = canonical |
| Links | Every internal `href`/`src`/`srcset` resolves; canonical form (no trailing slash, lowercase, no `?lang=`); every `#fragment` exists; descriptive anchors; the exact anchor "galeri gambar majlis dengan QR" links only to `/` |
| Orphans | Every sitemap page has an inbound internal link |
| Images | `alt` (or `alt=""`), `width`, `height` |
| Copy | No banned word from `messaging.md` §6 outside legal pages and rival tables; no em dash on marketing pages; no `{{`, TODO, TBD, lorem, `undefined`, `NaN`; HTML under 1 MB |
| Truth | Every RM figure and limit on a page matches `plans.ts` / `MEDIA_LIMITS`; every rival cell has a URL and a checked date ≤ 30 days old |
| Files | `/robots.txt` (`Allow: /`, absolute Sitemap); `/favicon.ico`; unknown URL → 404 with `noindex` |
| Redirects | `/harga/`, `/HARGA`, `/?lang=en`, `/harga?lang=en` → one 301 to the clean URL |

## Gate B: Lighthouse 100 on every sitemap page (automatic)

Mobile and desktop: Performance, Accessibility, Best Practices and SEO each **100**; Performance is the median of
three runs. The LCP element never fades in from opacity 0; the landing's vine and Lenis must not cost the score.

## Gate C: what a reviewer reads (by hand, every new or changed page)

1. **Answer first.** The first 40–60 words answer the page's question and name Indahnya with its category.
2. **Every claim about Indahnya is true today** against `research/indahnya-truth.md` and the code it cites.
3. **Every rival fact** links the vendor's own page and says "Disemak <tarikh>"; "where they win" is on the page.
4. **No JavaScript needed:** `curl` each page; the answer, tables and links are in the HTML.
5. **The browser at Fakhrul's sizes:** 1920 × 1080 at DPR 1, a phone at 390 × 844, and dark mode where the page has
   one. Nothing overlaps, clips or scrolls sideways. Landing look, Mekar mark, no vibe-coded patterns, image rules
   (no suap photos; no people on `/tentang`; the disclaimer stays).
6. **Rich results:** each template passes a schema.org validator with zero errors.

## Gate D: live, only after Fakhrul says deploy

- `http://`, `www.`, `indahnya.ffdev.studio`, trailing slash, uppercase and `?lang=en` each reach the clean
  `https://indahnya.my/...` URL in **one 301**.
- Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Applebot and
  CCBot get 200 with no challenge. HSTS on. Cloudflare Email Obfuscation off.
- A live re-run of Gates A and B finds nothing new.
- Search Console (Domain property, in the studio's account): sitemap submitted, URL Inspection live test per template,
  indexing requested for the money pages.
- Bing Webmaster: verified by DNS CNAME, sitemap submitted, AI Performance on. IndexNow pinged for every URL.
- Recorded in `docs/seo/LAUNCH.md`.

## How to run A and B

The gate script lives in the repo as `scripts/seo-gate.mjs` (cheerio, lighthouse, chrome-launcher as dev
dependencies), ported from Siar's: `node scripts/seo-gate.mjs` (A + B), `--no-lh` (A only),
`--only=/harga,/e-kad`. It exits 0 only with zero failures and writes `report.md` next to itself.
