# Building the SEO pages: the brief every builder follows

Branch `feat/seo-landing` in `/Users/fakhrul/Desktop/dev/Indahnya` (Nuxt 4). Dev server: `http://localhost:3182`
(already running; Vite hot-reloads your files). Several builders share this checkout at once.

## Read first

- `docs/seo/strike-plan.md` §0, §3.0 (rules for every page), §3.2–3.3 (your pages' rows), §4 (linking).
- `docs/seo/keyword-map.md` §3 "New pages: detail" for your pages (queries, answer first, sections) and §7 (dedup).
- `docs/seo/messaging.md` all of it: the line, pillars, objections, voice, banned words, never-claim list.
- `docs/seo/research/indahnya-truth.md`: every fact about Indahnya. If a fact is not there, do not write it.
- For comparison pages: `docs/seo/competitors.md` §5–§6 and `app/data/rivals.ts`.
- `docs/seo/ACCEPTANCE.md` Gates A and C: these decide "done".

## Building blocks

- **Every page uses `app/components/landing/LArticle.vue`**: props `title` (25–60 chars), `description` (120–160),
  `h1`, `lead` (the 40–60 word answer that names "Indahnya, galeri gambar majlis dengan QR"), `modified`
  (`'2026-11-12'`), `crumbs` (trail after Home, last = this page), optional `kicker`, `faq` (visible Q&A),
  `type`. Body goes in the default slot as plain HTML: `h2`, `h3`, `p`, `ul`, `ol`, and tables wrapped in
  `<div class="l-table">`. `.l-note` for small print, `.l-callout` for a boxed aside. The template already renders
  the breadcrumb, H1, lead, "Dikemas kini" date, FAQ, the honest CTA and the footer, and sets every head tag and
  JSON-LD. Do not add `useHead`/`useSeoMeta`/JSON-LD yourself.
- Page file: `definePageMeta({ layout: 'bare' })`, `const lang = useLang()` if the page needs it.
- Look at `/tentang` (`app/pages/tentang.vue`) for the landing's look. Real product pieces you may embed:
  `KadView` (`app/components/kad/KadView.vue`, see how `app/components/landing/LKad.vue` frames it),
  `QrStand` (`app/components/print/QrStand.vue`, used on `/tentang`). Sample data: the fictional
  Aina & Hakim majlis (`/aina-hakim`, seeded by `scripts/seed-demo.ts`).
- Prices: read the numbers from the truth file's plan table (they mirror `server/utils/plans.ts`); write them
  exactly as `/harga` does. Link `/harga` rather than repeating the plan table (keyword-map D9).
- Rival facts only from `app/data/rivals.ts` (import `RIVALS`, `rival`, `longDate`). Print "Disemak
  <longDate(checked)>" and link `url` beside them. Never type a rival fact into a page by hand. If you need a fact
  that is not in the file, read the vendor's own page today and add it there with the URL and date.
- Links: `linkIn(path, lang)` from `~~/shared/utils/site-pages` for pages with a twin; plain paths otherwise.
  Canonical form only: no trailing slash, lowercase, no `?lang=`.

## Rules

1. BM pages are written in BM first (colloquial Malaysian, `messaging.md` §6 "BM voice"); English pages in
   English for English queries, not translated sentences.
2. Answer first. Short sentences, one idea each, at most 3 sentences a paragraph.
3. No em dashes (U+2014) anywhere in page copy. No banned words (`messaging.md` §6). No customer counts, reviews,
   launch dates, "terbaik", "paling murah", "satu-satunya".
4. Say what Indahnya does not do where a reader would look (no app for guests, but hosts sign in; the TV needs
   internet; one event = one date and one venue; no printed album; no co-host invites).
5. The sample is fictional: every mention of Aina & Hakim says so.
6. Headings in sentence case, no skipped levels (the template's H1, then your `h2`, then `h3`).
7. No images unless they are real product pieces (components) or the existing credited landing photos with
   their `alt`, `width`, `height`; never a suap or makan beradu photo.
8. Comparison pages: near the top, say when the other option is the better choice (`wins` in `rivals.ts`).

## Working together

Create or edit only the files your brief names. Do not touch `shared/utils/site-pages.ts`, `LFinal.vue`,
`LNav.vue`, `LArticle.vue`, `usePublicSeo.ts`, `app/data/rivals.ts` (except adding a vendor fact with source),
the analytics files, or anyone else's page. Do not commit or run state-changing git. When done, `curl` each page
from the dev server and check: 200, one H1, title and description lengths, no em dash, every internal link
returns 200.
