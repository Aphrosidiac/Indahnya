# GEO / AEO / SEO audit — http://localhost:3182

Run 2026-10-04 21:31 · 12 pages sampled of 8 in sitemaps · raw HTML only (no JavaScript)

Scores are a triage aid for ordering work, not a KPI. The KPI is measured citation/mention rate (ai_visibility.py).

| Area | Score |
|---|---|
| AI crawler access | 83 |
| Rendering (raw HTML) | 92 |
| Indexability & canonicals | 97 |
| Structured data & entity | 90 |
| Content extractability (AEO) | 88 |
| Trust & E-E-A-T signals | 48 |
| Delivery & performance | 100 |
| Agent operability | 99 |
| International | 100 |
| **Overall** | **49** |

Overall is capped at 49 while any critical finding exists and at 79 while any high finding exists.

## AI crawler access (robots.txt, path `/`)

| Crawler | Purpose | Named in robots.txt | Allowed | Deciding rule |
|---|---|---|---|---|
| Googlebot | search | no | ✅ | `Allow: /` |
| Google-Extended | control | no | ✅ | `Allow: /` |
| Bingbot | search | no | ✅ | `Allow: /` |
| OAI-SearchBot | search | no | ✅ | `Allow: /` |
| ChatGPT-User | user | no | ✅ | `Allow: /` |
| GPTBot | training | no | ✅ | `Allow: /` |
| Claude-SearchBot | search | no | ✅ | `Allow: /` |
| Claude-User | user | no | ✅ | `Allow: /` |
| ClaudeBot | training | no | ✅ | `Allow: /` |
| PerplexityBot | search | no | ✅ | `Allow: /` |
| Perplexity-User | user | no | ✅ | `Allow: /` |
| Applebot | search | no | ✅ | `Allow: /` |
| Applebot-Extended | control | no | ✅ | `Allow: /` |
| meta-webindexer | search | no | ✅ | `Allow: /` |

robots.txt is only the first gate: a CDN/WAF can still 403 these bots. Run `bot_access.py`.

## Findings

### CRITICAL

- **[Rendering (raw HTML)]** Client-rendered shell: only 0 words in the server HTML. Non-JS AI crawlers see an empty page — 2 page(s): http://localhost:3182/masuk, http://localhost:3182/app?new=1
  - Fix: SSR/SSG/prerender this route (references/implementation.md)
- **[Trust & E-E-A-T signals]** Site is served over plain HTTP — 1 page(s): http://localhost:3182
  - Fix: Serve over HTTPS with a valid certificate

### HIGH

- **[Structured data & entity]** price 0 is in JSON-LD but not visible on the page — live-fetching AI tools read only visible text, and hidden-only markup breaks Google policy — 2 page(s): http://localhost:3182/tentang, http://localhost:3182/tentang?lang=en
- **[AI crawler access]** Googlebot is disallowed from this URL (Disallow: /masuk) — 1 page(s): http://localhost:3182/masuk
- **[AI crawler access]** OAI-SearchBot is disallowed from this URL (Disallow: /masuk) — 1 page(s): http://localhost:3182/masuk
- **[AI crawler access]** PerplexityBot is disallowed from this URL (Disallow: /masuk) — 1 page(s): http://localhost:3182/masuk
- **[AI crawler access]** Claude-SearchBot is disallowed from this URL (Disallow: /masuk) — 1 page(s): http://localhost:3182/masuk
- **[AI crawler access]** Bingbot is disallowed from this URL (Disallow: /masuk) — 1 page(s): http://localhost:3182/masuk
- **[AI crawler access]** Googlebot is disallowed from this URL (Disallow: /app) — 1 page(s): http://localhost:3182/app?new=1
- **[AI crawler access]** OAI-SearchBot is disallowed from this URL (Disallow: /app) — 1 page(s): http://localhost:3182/app?new=1
- **[AI crawler access]** PerplexityBot is disallowed from this URL (Disallow: /app) — 1 page(s): http://localhost:3182/app?new=1
- **[AI crawler access]** Claude-SearchBot is disallowed from this URL (Disallow: /app) — 1 page(s): http://localhost:3182/app?new=1
- **[AI crawler access]** Bingbot is disallowed from this URL (Disallow: /app) — 1 page(s): http://localhost:3182/app?new=1

### MEDIUM

- **[Indexability & canonicals]** No rel=canonical — 4 page(s): http://localhost:3182/aina-hakim, http://localhost:3182/masuk, http://localhost:3182/app?new=1 …
  - Fix: Self-referencing absolute canonical on every indexable page
- **[Structured data & entity]** No structured data — 4 page(s): http://localhost:3182/aina-hakim, http://localhost:3182/masuk, http://localhost:3182/app?new=1 …
  - Fix: Add JSON-LD appropriate to a page page (assets/schema/)
- **[Content extractability (AEO)]** No <h1> in the server HTML — 2 page(s): http://localhost:3182/masuk, http://localhost:3182/app?new=1
- **[Content extractability (AEO)]** 2 pages share a duplicate title
- **[Content extractability (AEO)]** Thin server HTML: 47 words — 1 page(s): http://localhost:3182/aina-hakim/gambar
  - Fix: Add substantive, self-contained content or noindex/merge
- **[Content extractability (AEO)]** 1 run(s) of text split into single-character elements — text extractors read 'S M O O T H' — 1 page(s): http://localhost:3182/aina-hakim/gambar
  - Fix: Keep real words in the server HTML; split letters at runtime in JS (after load) for the animation

### LOW

- **[Structured data & entity]** No BreadcrumbList — 10 page(s): http://localhost:3182/tentang, http://localhost:3182/privasi?lang=en, http://localhost:3182/terma …
- **[Structured data & entity]** Organization could add: logo, sameAs, legalName — 4 page(s): http://localhost:3182/, http://localhost:3182/?lang=en, http://localhost:3182/tentang …
- **[Structured data & entity]** SoftwareApplication could add: aggregateRating, review — 4 page(s): http://localhost:3182/, http://localhost:3182/?lang=en, http://localhost:3182/tentang …
- **[Structured data & entity]** WebPage could add: about, dateModified, primaryImageOfPage, breadcrumb — 4 page(s): http://localhost:3182/privasi?lang=en, http://localhost:3182/terma, http://localhost:3182/privasi …
- **[Agent operability]** 1 form field(s) without a label; browser agents cannot fill what they cannot name — 3 page(s): http://localhost:3182/, http://localhost:3182/?lang=en, http://localhost:3182/aina-hakim/gambar
- **[Structured data & entity]** WebPage could add: dateModified, primaryImageOfPage, breadcrumb — 2 page(s): http://localhost:3182/, http://localhost:3182/?lang=en
- **[Content extractability (AEO)]** Title is only 8 chars: 'Indahnya' — 2 page(s): http://localhost:3182/masuk, http://localhost:3182/app?new=1
- **[Content extractability (AEO)]** No meta description (engines will pick their own snippet) — 2 page(s): http://localhost:3182/masuk, http://localhost:3182/app?new=1
- **[Content extractability (AEO)]** Missing og:title/og:image (link previews in chat apps and some AI surfaces use them) — 2 page(s): http://localhost:3182/masuk, http://localhost:3182/app?new=1
- **[Agent operability]** No <main>/<article> landmark; agents and extractors use it to find the content — 2 page(s): http://localhost:3182/masuk, http://localhost:3182/app?new=1
- **[Indexability & canonicals]** Fewer than 3 internal links out of this page — 2 page(s): http://localhost:3182/masuk, http://localhost:3182/app?new=1
- **[Trust & E-E-A-T signals]** No dedicated Contact page (email/phone/WhatsApp links exist) — a page with full NAP, hours and registration number is still the canonical contact source — 1 page(s): http://localhost:3182
- **[Content extractability (AEO)]** Title is only 14 chars: 'About Indahnya' — 1 page(s): http://localhost:3182/tentang?lang=en

### INFO

- **[Indexability & canonicals]** noindex — 4 page(s): http://localhost:3182/aina-hakim, http://localhost:3182/masuk, http://localhost:3182/app?new=1 …
- **[AI crawler access]** No /llms.txt. Optional: no major engine has confirmed using it; cheap to add for agents and dev-tool readers — 1 page(s): http://localhost:3182/llms.txt
  - Fix: scripts/llms_txt.py drafts one

### Duplicates

- Duplicate title (2×): `Indahnya` — http://localhost:3182/masuk, http://localhost:3182/app?new=1

## Pages

| URL | Type | Status | Words | H2/H3 | Schema | Q-heads | Author | Dates | Issues |
|---|---|---|---|---|---|---|---|---|---|
| http://localhost:3182/ | home | 200 | 1069 | 31 | FAQPage, Organization, SoftwareApplication, WebPage, WebSite | 10 |  |  | 4 |
| http://localhost:3182/?lang=en | home | 200 | 1231 | 31 | FAQPage, Organization, SoftwareApplication, WebPage, WebSite | 11 |  |  | 4 |
| http://localhost:3182/tentang | about | 200 | 360 | 6 | AboutPage, Organization, SoftwareApplication, WebSite | 2 |  | ✓ | 4 |
| http://localhost:3182/privasi?lang=en | page | 200 | 662 | 10 | WebPage | 4 |  | ✓ | 2 |
| http://localhost:3182/terma | page | 200 | 443 | 9 | WebPage | 0 |  | ✓ | 2 |
| http://localhost:3182/aina-hakim | page | 200 | 231 | 8 |  | 1 |  |  | 4 |
| http://localhost:3182/masuk | page | 200 | 0 | 0 |  | 0 |  |  | 16 |
| http://localhost:3182/app?new=1 | page | 200 | 0 | 0 |  | 0 |  |  | 16 |
| http://localhost:3182/tentang?lang=en | about | 200 | 389 | 6 | AboutPage, Organization, SoftwareApplication, WebSite | 3 |  | ✓ | 5 |
| http://localhost:3182/privasi | page | 200 | 633 | 10 | WebPage | 3 |  | ✓ | 2 |
| http://localhost:3182/terma?lang=en | page | 200 | 475 | 9 | WebPage | 0 |  | ✓ | 2 |
| http://localhost:3182/aina-hakim/gambar | page | 200 | 47 | 0 |  | 0 |  |  | 7 |

## Site facts

- home_final: `"http://localhost:3182/"`
- http_redirect: `null`
- alt_host: `{"host": "www.localhost", "status": 0, "final": "http://www.localhost/", "error": "URLError: <urlopen error [Errno 61] Connection refused>"}`
- soft404_status: `404`
- markdown_negotiation: `false`
- llms.txt: `{"status": 404, "content_type": "text/html;charset=utf-8", "bytes": 129050}`
- llms-full.txt: `{"status": 404, "content_type": "text/html;charset=utf-8", "bytes": 129059}`
- sitemap_url_count: `8`

## Not measured here

- JavaScript-rendered content → `node scripts/render_diff.mjs <url>`
- CDN/WAF blocking of AI bots → `python3 scripts/bot_access.py <url>`
- Core Web Vitals field data → PageSpeed Insights / CrUX (references/seo-foundations.md)
- What AI engines actually say about the brand → `python3 scripts/ai_visibility.py`
- Off-site authority (mentions, reviews, Wikipedia/Wikidata, Reddit, YouTube) → references/offsite-authority.md
