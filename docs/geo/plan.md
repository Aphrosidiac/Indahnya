# GEO / AEO / SEO plan: indahnya.my, 2026-10-04

Business: QR guest photo gallery + e-kad + RSVP for Malaysian events, RM0/59/99 one-time.
Vertical: consumer SaaS · Stack: Nuxt 4 SSR, VPS + nginx, R2 · Languages: BM (default) + EN.
Brand: Indahnya (by FF Dev Studio) · Competitors: see brief.md (unverified until wave 0).
Owner decisions open: training crawlers, SSM/legal name on pages, founder naming, deploy.

## Baseline

See `baseline.md`. audit.py 49 (capped by local/intentional findings), render diff fine,
engine visibility not measured (no keys, not live).

## Work, in priority order

Each row: what · why · who · effort · verify. Evidence tags refer to the skill's
`references/evidence.md`. **Done** = in commit `e995b70`.

### P0 Access & eligibility

| What | Why | Who | Effort | Verify |
|---|---|---|---|---|
| **Done**: robots.txt served from the runtime site URL | the static file named prod's sitemap on every host [proven: sitemaps feed discovery] | agent | S | `curl /robots.txt` on each host |
| **Done**: sitemap lists `/`, `/tentang`, `/privasi`, `/terma` in both languages with reciprocal hreflang and honest lastmod | each language is its own URL; lastmod must not be build time | agent | S | audit.py sitemap checks |
| On launch: run `bot_access.py` against indahnya.my and every Cloudflare setting | a CDN can 403 OAI-SearchBot even with robots allowing it | agent + owner | S | bot_access.py all ✅ |
| On launch: confirm `www` and `http` 301 to `https://indahnya.my` in one hop; `indahnya.ffdev.studio` 301 | single canonical host | owner (nginx) | S | audit.py host checks |
| Keep `/app`, `/masuk`, `/tv`, `/api`, couple pages out of the index | apps and personal data, not documents | — | — | already noindex/disallowed |

### P1 Entity foundation & trust

| What | Why | Who | Effort | Verify |
|---|---|---|---|---|
| **Done**: `/tentang` (BM+EN) facts page: what, for whom, prices, payment, maker, contact, privacy | engines and people verify who is behind a site; one canonical fact set | agent | M | audit "about" type, facts.md parity |
| **Done**: one `@graph` (Organization FF Dev Studio, WebSite, SoftwareApplication with named offers) from `useSiteGraph`, on landing and About; WebPage on legal pages | stable @ids, one description everywhere | agent | S | audit lint clean; Rich Results Test on launch |
| Add SSM number + legal name to `/tentang` facts and Organization `legalName`/`identifier` | Malaysian trust signal; disambiguation | **owner decides** | S | visible + schema match |
| Organization `sameAs` + `logo` once FF Dev Studio / Indahnya profiles exist (Instagram, TikTok, Facebook, LinkedIn) | reciprocal identity links | owner creates, agent wires | S | links resolve and link back |

### P2 Page extractability

| What | Why | Who | Effort | Verify |
|---|---|---|---|---|
| **Done**: FAQ opens with answer-first capsules: "Apa itu Indahnya?", "Berapa harga Indahnya?", "Apa beza dengan group WhatsApp atau Google Drive?" (+EN) | engines lift definitions, prices and comparisons; the hero line is a feeling, not a definition | agent | S | answers in server HTML (checked) |
| **Done**: meta description is a definition with who/what/price | it is often the snippet | agent | S | audit |
| Landing stays as designed: no wholesale rewrite | the page is new and design-led; changes stay surgical | — | — | — |

### P3 Coverage (pages the fan-out needs; not built yet)

Each is a real page with true, sourced content; none is a keyword variant.

| Page | Question it answers | Notes |
|---|---|---|
| `/harga` (pricing) | "Indahnya harga", "QR wedding gallery under RM100" | the table already exists on the landing; give it its own URL with the full plan comparison and FAQ |
| `/panduan/kumpul-gambar-tetamu` | "cara kumpul gambar tetamu masa majlis kahwin" | how-to: QR, table cards, TV, download; honest about WhatsApp/Drive trade-offs |
| `/banding/whatsapp-google-drive` | "WhatsApp group atau app galeri", "Google Drive vs QR gallery" | comparison with a decision rule; facts about WhatsApp/Drive need sources [NEEDS SOURCE] |
| `/banding/kenangan` (and Wedibox) | "Indahnya vs Kenangan", "Wedibox alternative Malaysia" | only with verified, dated competitor facts and a disclosure |
| `/e-kad` | "e-kad kahwin digital dengan RSVP" | the kad templates, RSVP, table finder |
| `/contoh` or a public sample page that is indexable | the demo is noindex today | consider an indexable, fictional sample page with clear labelling |

### P4 Technical SEO polish

- IndexNow ping on deploy for changed public URLs (Bing/Copilot). Owner: key file on launch.
- Bing Webmaster Tools + Google Search Console verification on launch.
- BreadcrumbList is optional on a flat site; skip until P3 pages exist.

### P5 Agent readiness

- Forms already have labels (one unlabelled field flagged on the landing: the hidden
  file input of the "cuba sekarang" demo; harmless).
- llms.txt: see "Not doing".

### P6 Off-site program

See `offsite-plan.md`. Mostly owner work, after launch.

### P7 Measurement cadence

Wave 0 on launch week with the manual sheet (or API keys), then every 3–4 weeks on the
frozen `prompts_v1.csv`. Report mention and citation rates with Wilson CIs; "no detectable
change" is a valid result. Expected lags: Bing/Perplexity days to weeks, Google AI
surfaces 2–8 weeks, model memory months.

## Deliberately NOT doing (and why)

- **llms.txt as a lever**: no major engine has confirmed using it [myth as a ranking lever].
- **FAQ schema for rich results**: FAQ rich results were retired 2026-05-07; the FAQPage
  markup stays only because the FAQ is real and visible.
- **AggregateRating / reviews**: there are no customers yet. Never invent them.
- **City doorway pages** ("QR gallery Shah Alam", "… Johor Bahru"): no local substance.
- **Indexing couple pages or the demo gallery**: personal data; the demo is fictional.
- **Rewriting the landing for "AI"**: changes stay surgical and must help a human reader.

## Intervention log

| Date | Commit | Change |
|---|---|---|
| 2026-10-04 | e995b70 | About page, site graph, FAQ capsules, meta description, hreflang ms-MY/en-MY, sitemap, robots from runtime URL |
