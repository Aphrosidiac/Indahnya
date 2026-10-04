# Baseline, 2026-10-04 (local, pre-launch)

All measurements are against the local dev server `http://localhost:3182`; the
production domain does not resolve yet. Each line says how it is known.

## audit.py (measured, `audit-baseline/` then `audit-after/`)

| Area | Before | After |
|---|---|---|
| AI crawler access | 75 | 83 |
| Rendering (raw HTML) | 88 | 92 |
| Indexability & canonicals | 76 | 97 |
| Structured data & entity | 90 | 90 |
| Content extractability (AEO) | 86 | 88 |
| Trust & E-E-A-T | 40 | 48 |
| Overall (capped) | 49 | 49 |

The overall stays capped at 49 by findings that are local or intentional:

- **Plain HTTP**: localhost. Production is HTTPS behind nginx (HSTS in nginx).
- **`/masuk` and `/app` are client-rendered and disallowed**: the sign-in page and
  the host dashboard are apps, not documents. They are disallowed in robots.txt and
  send `X-Robots-Tag: noindex`. Intentional; they should never be indexed.
- **Couple pages (`/aina-hakim…`) noindex, no canonical/schema**: intentional. A
  couple's names, date and venue are personal data (see `useGuestEvent`).

Fixed in this pass (commit `e995b70`): sitemap now readable on every host
(robots.txt from the runtime site URL), both language URLs listed with
reciprocal `ms-MY`/`en-MY`/`x-default`, honest `lastmod` from the visible
"Dikemas kini" dates; About page; WebSite + Organization + SoftwareApplication
graph shared by every public page; WebPage JSON-LD on the legal pages; RM0 price
visible to match the schema.

## render_diff.mjs (measured, `render.json`)

| URL | Words no-JS / rendered | Missing without JS | Head tags |
|---|---|---|---|
| `/` | 782 / 895 | 13.5% | identical |
| `/?lang=en` | 928 / 1042 | 11.7% | identical |
| `/privasi` | 629 / 629 | 0% | identical |

The JS-only words are the live demos (sample wishes fetched on mount, RSVP replies
"arriving", seat results), not product facts. Title, canonical, H1, meta and JSON-LD
are in the server HTML. GPTBot UA acceptance test: title, canonical, JSON-LD, H1 all
present.

## Not measured (and why)

- **bot_access.py / CDN-WAF blocks**: no live host or CDN yet. Run on launch day.
- **ai_visibility.py**: no API keys. Manual logged-out sheet written to
  `visibility/manual-wave0/manual.csv` (40 prompts × ChatGPT, Perplexity, Gemini,
  AI Mode). Before launch every answer will be "not mentioned"; the value of wave 0
  is the list of domains engines cite for the category.
- **presence.py, log_bots.py, GSC, Bing Webmaster Tools, GA4**: site not live.
- **Core Web Vitals field data**: no traffic. Lab: hero CLS ~0 and 60fps on phones
  were measured during the landing build.
