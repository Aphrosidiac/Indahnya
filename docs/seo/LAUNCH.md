# SEO launch record

The SEO build (`docs/seo/strike-plan.md`) went live on **13 November 2026**, on Fakhrul's word ("Yes, release").
The site stays in pre-launch mode (`NUXT_PUBLIC_PREVIEW=true`): sign-up still leads to `/mula`.

## What shipped

| Release | Commit | What |
|---|---|---|
| 1 | `73b0d4c` | The SEO build: 28 sitemap pages (BM at the root, English under `/en`), guides, comparisons, e-kad, own analytics (migration `0008_analytics`, nginx JSON log, beacon), the mobile performance pass |
| 2 | `a332480` | IndexNow key file (`public/<key>.txt`) and `scripts/indexnow.mjs` |

Cloudflare: Email Obfuscation turned **off** (it rewrote the emails in every page into a script-decoded link).

## Gate D (live checks, 13 Nov)

| Check | Result |
|---|---|
| Static gate on the live site (`node scripts/seo-gate.mjs --url=https://indahnya.my --no-lh`) | 0 failures on all 28 pages |
| Lighthouse mobile on live (real network): `/`, `/harga`, `/panduan/kumpul-gambar-tetamu`, `/privasi` | 98, 100, 100, 100; Accessibility, Best Practices and SEO 100 on all four |
| `http://`, `https://www.`, `indahnya.ffdev.studio`, trailing slash, uppercase, `?lang=en` | One 301 to the clean URL |
| `http://www.indahnya.my/…` | **Two hops** (Cloudflare's Always Use HTTPS, then the origin's `www` redirect). Fix: a Cloudflare Redirect Rule for `www.indahnya.my` → `https://indahnya.my${path}`. The bootstrap token cannot edit rules. Minor: almost nothing links to `http://www` |
| Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Applebot, CCBot | 200, no challenge |
| HSTS | `max-age=31536000; includeSubDomains` |
| `robots.txt`, couple pages `noindex, nofollow`, 404 page, beacon `/_e` 204, CHIP checkout still 403 | As expected |
| Analytics log | `/var/log/indahnya/traffic.log` written with the visitor's real IP and country; logrotate rule installed |

## Search engines

- **Google Search Console:** Domain property `indahnya.my`, verified by DNS TXT (added with the Cloudflare API, keep
  the record). Sitemap submitted: 28 pages discovered. Indexing requested on 13 Nov for `/`, `/harga`, `/e-kad`,
  `/panduan/kumpul-gambar-tetamu`, `/en`, `/buku-tetamu-digital`.
  Next requests (about 10 a day are allowed): `/contoh`, `/panduan`, `/banding`,
  `/banding/alternatif-wedibox-malaysia`, `/en/wedding-photo-sharing-malaysia`, `/en/pricing`.
- **Bing Webmaster Tools:** site added manually and verified by DNS CNAME (keep the record). Sitemap submitted. AI
  Performance is on (it is on for every site): 0 citations on day one.
- **IndexNow:** all 28 URLs submitted, answer 202 (key check pending, normal on first use).

## After every deploy that adds or changes public pages

1. `node scripts/seo-gate.mjs` before merging (Gates A and B; mobile 96–100 accepted, see ACCEPTANCE.md).
2. `deploy/deploy.sh`, then `node scripts/seo-gate.mjs --url=https://indahnya.my --no-lh`.
3. `node scripts/indexnow.mjs /changed-path …` (or no arguments for the whole sitemap).
4. Search Console URL Inspection → Request indexing for new pages.

## Still open

- **AI visibility baseline:** the 40-prompt run (`docs/geo/prompts_v1.csv`) needs an answer-engine API key or a
  manual pass; not run yet. Bing AI Performance (0 citations) is the day-one number.
- `NUXT_STAFF_EMAILS` is not set in production. It only matters once sign-in opens (staff are left out of the
  numbers and can open `/app/metrics`).
- Search pulls for `scripts/metrics.sh`: `NUXT_GSC_SERVICE_ACCOUNT_JSON` and `NUXT_BING_API_KEY` (docs/ANALYTICS.md §3).
- The `http://www` one-hop redirect rule (above).
