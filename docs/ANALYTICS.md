# Analytics: how Indahnya counts visitors, crawlers, sign-ups, revenue and search

Everything lands in Indahnya's own Postgres and comes out of one report
(`server/utils/traffic/report.ts`). It is ported from Siar's analytics system, re-expressed for Nuxt, Nitro and
Drizzle. You can read it in four places:

- **`/app/metrics`**: a staff-only page in the dashboard (tables, no charts).
- **`GET /api/internal/metrics?days=30`**: JSON, or `&format=md` for markdown. Staff session only.
- **`scripts/metrics.sh report 7`** from the Mac (`json 30`, `ingest`, `search`, `sql "SELECT …"`). It runs
  `scripts/metrics-cli.ts` on the box over `ssh indahnya`, as the app user. This is the route for an AI assistant.
- **SQL** on the tables below, read-only through `scripts/metrics.sh sql`.

Days are Malaysia days (UTC+8). Staff accounts and `@ffdev.studio` accounts are left out of sign-ups and revenue.

## Staff

Indahnya has no roles. **Staff = the emails in `NUXT_STAFF_EMAILS`** (comma-separated, compared lower-case).
Both sign-in methods prove the mailbox (a spent magic link; Google's `email_verified`), so a match on the stored
email is enough, and nothing the browser sends is consulted (`server/utils/traffic/auth.ts`). Signed out gets 401;
signed in but not staff gets 404, so the endpoint and the page do not announce themselves.

When a staff user signs in, their IP is saved in `traffic_staff_ips` (staff only, never anyone else's). Visits from
that IP in the next 30 days are class `staff`. Without `NUXT_STAFF_EMAILS` nobody is staff and the report is closed.

## 1. Traffic: who asked for each page

nginx writes one JSON line per request to `/var/log/indahnya/traffic.log` (`deploy/nginx.conf`, format
`indahnya_json`: time, host, client IP, method, path, status, bytes, request time, User-Agent, referrer host,
`CF-IPCountry`, and the beacon's query). The paths are always `$uri`, never the query (sign-in `?t=` and TV `?token=`
links are secrets); only `/_e` logs its query. The existing `indahnya.access.log` line is kept.

The worker process reads new lines every 10 minutes (`server/worker/traffic.ts`, `server/utils/traffic/ingest.ts`)
from a saved position (`traffic_cursor`: inode and byte offset), following logrotate's rename to `traffic.log.1`. A
Postgres advisory lock means a manual `scripts/metrics.sh ingest` and the worker never double-count.

What is stored and what is only counted:

| Request | Stored per request (`traffic_hits`, 120 days) | Counted per day (`traffic_daily`) |
|---|---|---|
| Marketing pages, the beacon, robots.txt and sitemaps | yes | yes |
| Anything non-human, on any path (crawlers, scanners, impostors, datacenters) | yes | yes |
| Any 404 (the probe check reads them) | yes | yes |
| Static assets; people and API clients on couple pages, `/app`, `/tv`, `/embed`, `/api` | no | yes |

Request groups (`grp`), from the path (`server/utils/traffic/paths.ts`): `marketing` (the public pages: `/`, `/harga`,
`/en/…`, guides; any first segment in `RESERVED` in `server/utils/slug.ts` that is not a system path), `couple`
(`/<slug>` and below: the guests), `app`, `tv`, `embed`, `api`, `file`, `beacon`, `asset`, `other` (scanner probes,
reserved system paths). **A new marketing page only has to be a reserved word in `RESERVED`**, which it must be anyway
so a majlis can never take it; then it is counted as marketing and gets the beacon.

Each request gets exactly one class:

| Class | Meaning | How it is decided |
|---|---|---|
| `human` | A person, confirmed | A browser User-Agent whose page view was followed, within 30 minutes, by the page's beacon (`/_e`) from the same visitor, with `navigator.webdriver` false |
| `unconfirmed` | A browser that never ran the page's JavaScript | A browser User-Agent with no beacon. It could be a bounce under 3 seconds, a blocker, or a scraper using a browser User-Agent. Shown separately, never added to humans. On couple, app, tv, embed and api paths no beacon is expected, so `unconfirmed` there only means "a browser"; those rows are counted, not reported as people |
| `staff` | FF's own browsing | An IP a staff account signed in from in the last 30 days |
| `automation` | A browser that admits it is automated, or behaves like it | The beacon reported `webdriver`, or the visitor pulled more than 60 marketing pages in 10 minutes |
| `search-bot`, `ai-bot`, `other-bot` | A named crawler | Its User-Agent matches the catalogue in `server/utils/traffic/agents.ts` |
| `impostor` | Claims to be a crawler and isn't | A catalogue crawler whose IP is in neither its owner's published list nor its forward-confirmed reverse DNS |
| `datacenter` | A browser User-Agent from a cloud server | The IP is in AWS, Google Cloud, DigitalOcean or Oracle Cloud's published ranges |
| `tool` | An HTTP library, CLI or headless browser | curl, Python, Go, Node, HeadlessChrome, Lighthouse, Playwright, … |
| `monitor` | Uptime checks | UptimeRobot, Pingdom, … |
| `scanner` | Probing for vulnerabilities | A scanner User-Agent, a path nobody asks Indahnya for (`.php`, `/.env`, `/wp-…`, dot-files, `vendor/`), or 10 or more 404s from one visitor in 10 minutes |
| `internal` | Indahnya itself | Loopback, FF's own audit tools, and non-browser requests from a staff IP |

**Crawler verification.** The `verified` column is one of:

- `verified`: the IP is in the owner's published list, or reverse DNS gives the owner's domain and that name resolves
  back to the same IP.
- `failed`: the class becomes `impostor`.
- `unverifiable`: the owner publishes no list, or it can't be loaded right now.

Lists checked: Google (googlebot, special-crawlers, user-triggered-fetchers), Bing, OpenAI (GPTBot, OAI-SearchBot,
ChatGPT-User), Perplexity, DuckDuckGo. Reverse DNS: Google, Bing, Apple, Yandex, Baidu, Amazon, Petal, Seznam,
Naver. Anthropic, Meta, Common Crawl and ByteDance publish nothing to check against, so their crawlers are counted
under the name they give and marked `unverifiable`. The box fetches the published lists itself (daily, kept in
memory); a list that will not load leaves its crawler `unverifiable`, never `verified`.

**Visitors.** A visitor is a hash of the IP and User-Agent with a **random salt per Malaysia day**
(`traffic_salts`, deleted after 3 days, so an old id cannot be tied back to an IP by guessing). The same person on
three days counts three times in a range ("visitors, daily, summed"). People's IPs are never stored; IPs are kept
only for non-human classes, so a claim can be audited.

**Known limits.**
- Requests Cloudflare answers from its edge cache never reach nginx and are not in the log. HTML is not cached by
  default, so page views are complete; `/_nuxt` and media are not logged on purpose.
- The beacon fires once per full page load. Moving between marketing pages inside the app (client-side navigation)
  makes no new page request, so it adds no view. Page views are therefore "landings", which is what the report calls
  them.
- Azure, Hetzner and OVH publish no stable ranges, so a browser User-Agent from them passes as a browser. The beacon
  is the second check.
- A scraper that runs JavaScript, hides `webdriver` and pages slowly can pass as human. Expect that to be rare here.
- Visitors with JavaScript off, or a blocker that stops `/_e`, show as `unconfirmed`.
- Guests on a couple's pages are deliberately not tracked: no beacon, no cookie, only counted by the log.

## 2. The beacon and the first-visit cookie

`app/plugins/traffic-beacon.client.ts`, on the **public marketing pages only**. It does nothing on a couple's pages
(route `slug*`), `/app`, `/tv`, `/embed` or `/masuk`, and on `*.pages.dev` (the static preview has no server).

- **First visit:** sets `indahnya_ft` (first-party, `Path=/`, `SameSite=Lax`, `Secure` on https, 180 days, not
  HttpOnly because the page sets it) holding: the referrer host, the `utm_source`, the landing path and the time.
- **After the first interaction, or 3 s with the tab visible:** `POST /_e?p=<path>&r=<referrer host>&us=<utm source>&w=<width>&wd=<webdriver>&e=<i|t>`.
  nginx logs it and answers 204, never cached (`location = /_e` in `deploy/nginx.conf`); `server/routes/_e.ts` gives the
  same answer where that rule is absent (dev). It is a same-origin request, so the CSP needs no change.

At sign-up (magic link or Google) `afterSignIn` copies the cookie onto the new user: `signup_landing`,
`signup_ref_host`, `signup_utm_source`, `signup_channel`, `first_seen_at` (all nullable; a sign-up with no cookie
stays unknown). The cookie is a browser string and every field is clipped and validated; it is used for reporting
only.

Channels (`server/utils/traffic/channel.ts`): UTM source decides first; then the referrer: Google, Bing, AI assistant
(ChatGPT, Perplexity, Claude, Gemini, Copilot, …), Other search, Social, Referral. No referrer is Direct.

### Needed on /privasi (not edited here)

The privacy page says there are no analytics cookies. It now needs to say, in its Cookies section:
- a small first-party cookie, `indahnya_ft`, set on the public pages (not on a majlis' pages), holds the page and the
  site the visitor first came from, lasts 180 days, and is copied onto the account only if they sign up;
- the server log keeps the visitor's IP address, browser and the page for 14 days (nginx, rotated), and the analytics
  database keeps a one-way daily hash of IP and browser (never the IP) for people, and the IP only for automated
  traffic, for 120 days;
- the page sends one request on load so the visit can be told apart from crawlers; no third party gets it.

## 3. Search

`pullSearchIfDue` runs from the same 10-minute tick and pulls when the last run is over 12 hours old (so about twice
a day); `scripts/metrics.sh search` forces it. It fills `search_daily`:

| Row | Meaning |
|---|---|
| query `*`, page `*` | That day's total |
| query `*`, a page | That page |
| a query, page `*` | That query (Bing) |
| a query and a page | That pair (Google) |

Google hides rare queries in per-query rows, so totals always come from the total rows.

- **Google Search Console** needs `NUXT_GSC_SERVICE_ACCOUNT_JSON` (raw JSON or base64) and `NUXT_GSC_PROPERTY`
  (default `sc-domain:indahnya.my`). Each run re-reads the last 16 days, because Google revises recent days.
- **Bing Webmaster** needs `NUXT_BING_API_KEY` (and `NUXT_BING_SITE_URL`, default `https://indahnya.my/`). It reads
  GetRankAndTrafficStats (daily totals), GetQueryStats and GetPageStats, which Bing updates weekly.

Setting up the keys (Fakhrul), then add them to `production.env` and `deploy/env.sh push --reload`:

1. Google Cloud: IAM → Service accounts → Create (for example `indahnya-metrics`, no roles) → Keys → Add key → JSON.
   Search Console → indahnya.my → Settings → Users and permissions → Add user → the service account's email,
   permission **Restricted**. Put the JSON (one line, or base64) in `NUXT_GSC_SERVICE_ACCOUNT_JSON`.
2. Bing Webmaster Tools → Settings → API access → Generate API key → `NUXT_BING_API_KEY`.

Until a key is set, the report lists that collector as "not configured". The report also tracks the keyword map's
target queries (`TRACKED_QUERIES` in `report.ts`).

## 4. Sign-ups and revenue

Read live from the product tables:
- sign-ups from `users`, minus staff and `@ffdev.studio` accounts and deleted accounts;
- "created a majlis": an `events` row owned by the user, not deleted;
- "paid": a `payments` row with status `paid` for the user;
- revenue: `payments` with status `paid`, by `paid_at`, in sen (shown as RM), by plan, kind (upgrade or renew) and
  CHIP method; plus refunded and `needs_refund` counts and the lifetime total.

## 5. Operations

- **Log file and rotation:** `/var/log/indahnya/` is `root:indahnya 0750`, the file `0640` with the same owner, so the
  app user can read it and nobody else. It has its own logrotate rule, `/etc/logrotate.d/indahnya-traffic`: daily,
  14 kept, `delaycompress` (so `traffic.log.1` stays readable for the ingest to finish the old file), `create 0640 root
  indahnya`, nginx sent USR1. `deploy/setup-server.sh` and `deploy/remote.sh` install the directory and the rule
  (idempotent); nginx's own rule for `/var/log/nginx/*.log` is untouched.
- **Collector status:** in the report's Sources section (`collector_runs`: `traffic`, `search:google`, `search:bing`).
- **Retention:** the hourly housekeeping deletes `traffic_hits` older than 120 days, salts older than 3 days and staff
  IPs older than 60 days. `traffic_daily` is tiny and kept.
- **Tests:** `npx vitest run tests/traffic.test.ts` covers User-Agents, IP ranges, verification, classification,
  groups, channels and the cookie, with the network stubbed.
- **Local run:** the worker ingests only if the log file exists (`NUXT_TRAFFIC_LOG_PATH`, default
  `/var/log/indahnya/traffic.log`). To try it: write a few JSON lines in the format above to a file and run
  `node --import tsx scripts/metrics-cli.ts ingest --file <path>`, then `report --days 7`. (In `nuxt dev` the
  server has no client address, so staff IPs are not recorded there.)

Useful queries (`scripts/metrics.sh sql "…"`):

```sql
-- people vs everything else on the marketing pages, per day
SELECT (at AT TIME ZONE 'Asia/Kuala_Lumpur')::date d, class, count(*) FROM traffic_hits WHERE grp = 'marketing' AND kind = 'page' GROUP BY 1, 2 ORDER BY 1, 3 DESC;
-- what GPTBot and OAI-SearchBot read this week
SELECT agent, path, count(*) FROM traffic_hits WHERE (agent LIKE '%GPT%' OR agent LIKE 'OAI%') AND at > now() - interval '7 days' GROUP BY 1, 2 ORDER BY 3 DESC;
-- sign-ups with their source
SELECT email, created_at, signup_channel, signup_landing, signup_ref_host FROM users ORDER BY created_at DESC LIMIT 20;
```
