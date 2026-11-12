/**
 * The one analytics report (docs/ANALYTICS.md). The staff Metrics page, GET /api/internal/metrics and the CLI
 * (scripts/metrics-cli.ts) all read this, so a number means the same thing everywhere. Days are Malaysia days.
 *
 * People on the marketing pages: "human" = a page view whose beacon arrived (ran JavaScript, no webdriver);
 * "unconfirmed" = a browser User-Agent that never ran the beacon; "staff" = FF's own visits. Visitors are one id
 * per person per day, so a range's visitor count is the sum of daily visitors (a person on 3 days counts 3).
 * Sign-ups and revenue leave out staff accounts (NUXT_STAFF_EMAILS) and @ffdev.studio.
 */
import { sql, type SQL } from 'drizzle-orm';
import { useDb } from '../../db';
import { channelOf } from './channel';
import { KNOWN_BOTS } from './agents';
import type { TrafficConfig } from './config';

const TZ = 'Asia/Kuala_Lumpur';
const n = (v: unknown) => Number(v ?? 0);
/** Plain strings, not Dates: node-postgres would turn a `date` into local midnight. */
const dayOf = (col: string) => sql.raw(`to_char((${col} AT TIME ZONE '${TZ}')::date, 'YYYY-MM-DD')`);
const myDate = (d: Date) => new Date(d.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);

/** Search terms the SEO plan targets (docs/seo/keyword-map.md); the report shows their position. */
export const TRACKED_QUERIES = [
  'kad kahwin digital', 'e-kad kahwin', 'kad jemputan kahwin online', 'e-kad', 'buku tetamu digital',
  'gambar tetamu kahwin qr', 'galeri gambar majlis', 'qr gambar kahwin', 'rsvp kahwin online', 'wedibox malaysia', 'indahnya', 'indahnya.my',
];

export interface ReportOptions { days?: number; end?: Date }

export async function buildReport(cfg: TrafficConfig, opts: ReportOptions = {}) {
  const db = useDb();
  const q = async <T = Record<string, unknown>>(s: SQL) => (await db.execute(s)).rows as T[];
  const days = Math.min(Math.max(Math.round(opts.days ?? 30), 1), 400);
  const to = opts.end ?? new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const fromDay = myDate(from), toDay = myDate(to);
  const range = sql`h.at >= ${from} AND h.at < ${to}`;
  const marketing = sql`h.grp = 'marketing'`;
  const localDay = dayOf('h.at');
  const staff = cfg.staffEmails.length ? sql`lower(u.email) IN (${sql.join(cfg.staffEmails.map(e => sql`${e}`), sql`, `)})` : sql`false`;
  const INTERNAL_USER = sql`(${staff} OR u.email ILIKE '%@ffdev.studio')`;

  // ── sources ──
  const runs = await q<{ id: string; ok: boolean; ran_at: string | Date; rows: number; detail: string | null }>(sql`SELECT id, ok, ran_at, rows, detail FROM collector_runs ORDER BY id`);
  const coverage = await q<{ first: string | Date | null; last: string | Date | null }>(sql`SELECT min(at) AS first, max(at) AS last FROM traffic_hits`);

  // ── people on the marketing pages ──
  const people = await q(sql`
    SELECT h.class, count(*) AS views, count(DISTINCT (h.visitor, ${localDay})) AS visitors
    FROM traffic_hits h WHERE ${range} AND ${marketing} AND h.kind = 'page' AND h.status < 300 AND h.class IN ('human', 'unconfirmed', 'staff', 'automation')
    GROUP BY h.class`);
  const byClass = Object.fromEntries(people.map(r => [r.class as string, { views: n(r.views), visitors: n(r.visitors) }]));
  const byDay = await q(sql`
    SELECT ${localDay} AS day, h.class, count(*) AS views, count(DISTINCT h.visitor) AS visitors
    FROM traffic_hits h WHERE ${range} AND ${marketing} AND h.kind = 'page' AND h.status < 300
    GROUP BY 1, 2 ORDER BY 1, 2`);
  const topPages = await q(sql`
    SELECT h.path, count(*) AS views, count(DISTINCT (h.visitor, ${localDay})) AS visitors
    FROM traffic_hits h WHERE ${range} AND ${marketing} AND h.kind = 'page' AND h.class = 'human' AND h.status < 300
    GROUP BY 1 ORDER BY 2 DESC LIMIT 25`);
  // a visit's source: the first beacon of each visitor-day (it carries the referrer host and utm source)
  const entries = await q<{ r: string | null; us: string | null; p: string | null; device: string | null; country: string | null; agent: string | null }>(sql`
    SELECT DISTINCT ON (h.visitor, ${localDay}) h.data->>'r' AS r, h.data->>'us' AS us, h.data->>'p' AS p, h.data->>'device' AS device, h.country, h.agent
    FROM traffic_hits h WHERE ${range} AND h.kind = 'beacon' AND h.class = 'human'
    ORDER BY h.visitor, ${localDay}, h.at`);
  const tally = (pick: (e: (typeof entries)[number]) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const e of entries) { const k = pick(e) || 'Unknown'; m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m].sort((a, b) => b[1] - a[1]).map(([name, visits]) => ({ name, visits }));
  };
  const unconfirmedPages = await q(sql`
    SELECT h.path, h.agent, count(*) AS views FROM traffic_hits h
    WHERE ${range} AND ${marketing} AND h.kind = 'page' AND h.class = 'unconfirmed' AND h.status < 300 GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 15`);
  const humanErrors = await q(sql`
    SELECT h.path, h.status, count(*) AS hits FROM traffic_hits h
    WHERE ${range} AND h.kind = 'page' AND h.class IN ('human', 'unconfirmed') AND h.status >= 400 GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 15`);

  // ── bots, everywhere ──
  const botClasses = await q(sql`
    SELECT h.class, count(*) AS requests, count(*) FILTER (WHERE h.kind = 'page') AS pages, count(DISTINCT h.ip) AS ips
    FROM traffic_hits h WHERE ${range} AND h.class NOT IN ('human', 'unconfirmed', 'staff', 'internal') GROUP BY 1 ORDER BY 2 DESC`);
  const botAgents = await q(sql`
    SELECT h.agent, h.class, h.verified, count(*) AS requests, count(*) FILTER (WHERE h.kind = 'page') AS pages,
      count(*) FILTER (WHERE h.kind = 'file') AS files, count(DISTINCT h.path) AS distinct_paths, max(h.at) AS last_seen
    FROM traffic_hits h WHERE ${range} AND h.class IN ('search-bot', 'ai-bot', 'other-bot', 'impostor', 'monitor', 'tool', 'automation', 'datacenter')
    GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 60`);
  const crawled = await q(sql`
    SELECT h.agent, h.path, count(*) AS hits FROM traffic_hits h
    WHERE ${range} AND h.class IN ('ai-bot', 'search-bot') AND h.kind IN ('page', 'file') GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 80`);
  const impostors = await q(sql`
    SELECT h.agent, count(*) AS requests, count(DISTINCT h.ip) AS ips, (array_agg(DISTINCT h.ip))[1:5] AS sample_ips
    FROM traffic_hits h WHERE ${range} AND h.class = 'impostor' GROUP BY 1 ORDER BY 2 DESC LIMIT 20`);
  const scanners = await q(sql`
    SELECT h.path, count(*) AS hits, count(DISTINCT h.ip) AS ips FROM traffic_hits h
    WHERE ${range} AND h.class = 'scanner' GROUP BY 1 ORDER BY 2 DESC LIMIT 15`);
  const crawlErrors = await q(sql`
    SELECT h.path, h.status, count(*) AS hits FROM traffic_hits h
    WHERE ${range} AND h.class IN ('search-bot', 'ai-bot') AND h.status >= 400 GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 15`);
  const volume = await q(sql`
    SELECT grp, class, sum(requests) AS requests FROM traffic_daily
    WHERE date >= ${fromDay} AND date <= ${toDay} GROUP BY 1, 2 ORDER BY 1, 3 DESC`);

  // ── sign-ups to a paid majlis (customers only) ──
  const signupDaily = await q(sql`
    SELECT to_char((u.created_at AT TIME ZONE '${sql.raw(TZ)}')::date, 'YYYY-MM-DD') AS day, count(*) AS signups
    FROM users u WHERE u.created_at >= ${from} AND u.created_at < ${to} AND u.deleted_at IS NULL AND NOT ${INTERNAL_USER}
    GROUP BY 1 ORDER BY 1`);
  const cohort = await q<{ channel: string | null; landing: string | null; ref: string | null; majlis: boolean; paid: boolean }>(sql`
    SELECT u.signup_channel AS channel, u.signup_landing AS landing, u.signup_ref_host AS ref,
      EXISTS (SELECT 1 FROM events e WHERE e.owner_id = u.id AND e.deleted_at IS NULL) AS majlis,
      EXISTS (SELECT 1 FROM payments p WHERE p.user_id = u.id AND p.status = 'paid') AS paid
    FROM users u WHERE u.created_at >= ${from} AND u.created_at < ${to} AND u.deleted_at IS NULL AND NOT ${INTERNAL_USER}`);
  const allTime = await q(sql`SELECT count(*) AS users FROM users u WHERE u.deleted_at IS NULL AND NOT ${INTERNAL_USER}`);
  const by = (key: 'channel' | 'landing' | 'ref') => {
    const m = new Map<string, { signups: number; majlis: number; paid: number }>();
    for (const c of cohort) {
      const k = c[key] ?? 'Unknown (no first-visit cookie)';
      const v = m.get(k) ?? { signups: 0, majlis: 0, paid: 0 };
      v.signups++; if (c.majlis) v.majlis++; if (c.paid) v.paid++;
      m.set(k, v);
    }
    return [...m].sort((a, b) => b[1].signups - a[1].signups).map(([name, v]) => ({ name, ...v }));
  };

  // ── revenue (CHIP payments: one-time, in sen) ──
  const payRange = sql`p.status = 'paid' AND p.paid_at >= ${from} AND p.paid_at < ${to} AND NOT ${INTERNAL_USER}`;
  const byPlan = await q(sql`
    SELECT p.plan, p.kind, count(*) AS payments, sum(p.amount_cents) AS amount_cents
    FROM payments p JOIN users u ON u.id = p.user_id WHERE ${payRange} GROUP BY 1, 2 ORDER BY 1, 2`);
  const byMethod = await q(sql`
    SELECT coalesce(p.method, 'unknown') AS method, count(*) AS payments, sum(p.amount_cents) AS amount_cents
    FROM payments p JOIN users u ON u.id = p.user_id WHERE ${payRange} GROUP BY 1 ORDER BY 3 DESC`);
  const payDaily = await q(sql`
    SELECT to_char((p.paid_at AT TIME ZONE '${sql.raw(TZ)}')::date, 'YYYY-MM-DD') AS day, count(*) AS payments, sum(p.amount_cents) AS amount_cents
    FROM payments p JOIN users u ON u.id = p.user_id WHERE ${payRange} GROUP BY 1 ORDER BY 1`);
  const flags = await q(sql`
    SELECT count(*) FILTER (WHERE p.status = 'refunded' AND p.created_at >= ${from}) AS refunded,
      count(*) FILTER (WHERE p.needs_refund) AS needs_refund,
      coalesce(sum(p.amount_cents) FILTER (WHERE p.status = 'paid'), 0) AS lifetime_cents
    FROM payments p JOIN users u ON u.id = p.user_id WHERE NOT ${INTERNAL_USER}`);

  // ── search ──
  const search = async (engine: string) => {
    const totals = await q(sql`SELECT date, clicks, impressions, position FROM search_daily WHERE engine = ${engine} AND query = '*' AND page = '*' AND date >= ${fromDay} ORDER BY date`);
    const queries = await q(sql`
      SELECT query, sum(clicks) AS clicks, sum(impressions) AS impressions, sum(position * impressions) / nullif(sum(impressions), 0) AS position
      FROM search_daily WHERE engine = ${engine} AND query <> '*' AND date >= ${fromDay} GROUP BY 1 ORDER BY 3 DESC LIMIT 30`);
    const pages = await q(sql`
      SELECT page, sum(clicks) AS clicks, sum(impressions) AS impressions, sum(position * impressions) / nullif(sum(impressions), 0) AS position
      FROM search_daily WHERE engine = ${engine} AND query = '*' AND page <> '*' AND date >= ${fromDay} GROUP BY 1 ORDER BY 3 DESC LIMIT 30`);
    const tracked = await q(sql`
      SELECT lower(query) AS query, sum(clicks) AS clicks, sum(impressions) AS impressions, sum(position * impressions) / nullif(sum(impressions), 0) AS position
      FROM search_daily WHERE engine = ${engine} AND lower(query) IN (${sql.join(TRACKED_QUERIES.map(t => sql`${t}`), sql`, `)}) AND date >= ${fromDay} GROUP BY 1`);
    const sum = (k: string) => totals.reduce((a, r) => a + n(r[k]), 0);
    const impressions = sum('impressions');
    const pos = (v: unknown) => (v == null ? null : +n(v).toFixed(1));
    return {
      clicks: sum('clicks'), impressions, ctr: impressions ? sum('clicks') / impressions : 0,
      position: engine === 'google' && impressions ? totals.reduce((a, r) => a + n(r.position) * n(r.impressions), 0) / impressions : null,
      daily: totals.map(r => ({ day: String(r.date), clicks: n(r.clicks), impressions: n(r.impressions) })),
      queries: queries.map(r => ({ query: String(r.query), clicks: n(r.clicks), impressions: n(r.impressions), position: pos(r.position) })),
      pages: pages.map(r => ({ page: String(r.page), clicks: n(r.clicks), impressions: n(r.impressions), position: pos(r.position) })),
      tracked: TRACKED_QUERIES.map((t) => { const r = tracked.find(x => x.query === t); return { query: t, clicks: n(r?.clicks), impressions: n(r?.impressions), position: pos(r?.position) }; }),
    };
  };

  const purposeOf = (agent: unknown) => KNOWN_BOTS.find(b => b.name === agent)?.purpose ?? null;
  const ownerOf = (agent: unknown) => KNOWN_BOTS.find(b => b.name === agent)?.owner ?? null;
  const visitsFrom = tally(e => channelOf(e.r, e.us));
  /** drizzle's raw queries hand timestamps back as strings, node-postgres' own as Dates: take both. */
  const iso = (d: unknown) => (d == null ? null : new Date(d as string | Date).toISOString());
  const aiRefs = tally(e => (channelOf(e.r, e.us) === 'AI assistant' ? (e.r || e.us) : null)).filter(x => x.name !== 'Unknown');

  return {
    range: { from: from.toISOString(), to: to.toISOString(), days, timezone: TZ },
    generatedAt: new Date().toISOString(),
    sources: {
      trafficLogFrom: iso(coverage[0]?.first), trafficLogTo: iso(coverage[0]?.last),
      staffConfigured: cfg.staffEmails.length,
      collectors: runs.map(r => ({ id: r.id, ok: r.ok, ranAt: iso(r.ran_at)!, rows: r.rows, detail: r.detail })),
    },
    people: {
      human: byClass.human ?? { views: 0, visitors: 0 },
      unconfirmed: byClass.unconfirmed ?? { views: 0, visitors: 0 },
      staff: byClass.staff ?? { views: 0, visitors: 0 },
      automation: byClass.automation ?? { views: 0, visitors: 0 },
      /** Marketing page views per day and class (everything stored, bots included). */
      byDay: byDay.map(r => ({ day: String(r.day), class: String(r.class), views: n(r.views), visitors: n(r.visitors) })),
      topPages: topPages.map(r => ({ path: String(r.path), views: n(r.views), visitors: n(r.visitors) })),
      channels: visitsFrom,
      referrers: tally(e => e.r || null).filter(r => r.name !== 'Unknown'),
      landingPages: tally(e => e.p),
      countries: tally(e => e.country),
      devices: tally(e => e.device),
      browsers: tally(e => e.agent),
      unconfirmedPages: unconfirmedPages.map(r => ({ path: String(r.path), agent: r.agent as string | null, views: n(r.views) })),
      errors: humanErrors.map(r => ({ path: String(r.path), status: n(r.status), hits: n(r.hits) })),
    },
    bots: {
      byClass: botClasses.map(r => ({ class: String(r.class), requests: n(r.requests), pages: n(r.pages), ips: n(r.ips) })),
      agents: botAgents.map(r => ({ agent: r.agent as string | null, owner: ownerOf(r.agent), purpose: purposeOf(r.agent), class: String(r.class), verified: String(r.verified), requests: n(r.requests), pages: n(r.pages), files: n(r.files), distinctPaths: n(r.distinct_paths), lastSeen: iso(r.last_seen) })),
      crawledPaths: crawled.map(r => ({ agent: r.agent as string | null, path: String(r.path), hits: n(r.hits) })),
      impostors: impostors.map(r => ({ claimed: r.agent as string | null, requests: n(r.requests), ips: n(r.ips), sampleIps: (r.sample_ips as string[] | null) ?? [] })),
      scannerPaths: scanners.map(r => ({ path: String(r.path), hits: n(r.hits), ips: n(r.ips) })),
      crawlErrors: crawlErrors.map(r => ({ path: String(r.path), status: n(r.status), hits: n(r.hits) })),
      /** Every request by group and class, from the daily counters (assets and app traffic included). */
      volume: volume.map(r => ({ group: String(r.grp), class: String(r.class), requests: n(r.requests) })),
    },
    funnel: {
      allTimeCustomers: n(allTime[0]?.users),
      signups: cohort.length,
      createdMajlis: cohort.filter(c => c.majlis).length,
      paid: cohort.filter(c => c.paid).length,
      daily: signupDaily.map(r => ({ day: String(r.day), signups: n(r.signups) })),
      byChannel: by('channel'),
      byLanding: by('landing'),
      byReferrer: by('ref'),
    },
    revenue: {
      /** Sen. Totals leave out staff and @ffdev.studio accounts. */
      totalCents: byPlan.reduce((a, r) => a + n(r.amount_cents), 0),
      payments: byPlan.reduce((a, r) => a + n(r.payments), 0),
      byPlan: byPlan.map(r => ({ plan: String(r.plan), kind: (r.kind as string | null) ?? 'upgrade', payments: n(r.payments), amountCents: n(r.amount_cents) })),
      byMethod: byMethod.map(r => ({ method: String(r.method), payments: n(r.payments), amountCents: n(r.amount_cents) })),
      daily: payDaily.map(r => ({ day: String(r.day), payments: n(r.payments), amountCents: n(r.amount_cents) })),
      refunded: n(flags[0]?.refunded), needsRefund: n(flags[0]?.needs_refund), lifetimeCents: n(flags[0]?.lifetime_cents),
    },
    search: { google: await search('google'), bing: await search('bing') },
    ai: {
      crawlers: botAgents.filter(r => r.class === 'ai-bot').map(r => ({ agent: r.agent as string | null, owner: ownerOf(r.agent), purpose: purposeOf(r.agent), verified: String(r.verified), requests: n(r.requests), pages: n(r.pages) })),
      visitsFromAssistants: visitsFrom.find(c => c.name === 'AI assistant')?.visits ?? 0,
      assistantReferrers: aiRefs,
      signupsFromAssistants: cohort.filter(c => c.channel === 'AI assistant').length,
      note: 'Copilot and Bing AI citations: Bing Webmaster Tools → AI Performance (no API).',
    },
  };
}

export type Report = Awaited<ReturnType<typeof buildReport>>;

// ── markdown, for reading in a terminal or a chat ──
const fmt = (v: number) => v.toLocaleString('en-US');
export const rm = (cents: number) => `RM${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const table = (head: string[], rows: (string | number | null | undefined)[][]) =>
  rows.length ? [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.map(c => (c == null ? '' : typeof c === 'number' ? fmt(c) : String(c).replace(/\|/g, '/'))).join(' | ')} |`)].join('\n') : '_none_';

export function reportMarkdown(r: Report) {
  const p = r.people;
  const L: string[] = [];
  L.push(`# Indahnya metrics: last ${r.range.days} days`, '', `${r.range.from.slice(0, 10)} to ${r.range.to.slice(0, 16).replace('T', ' ')} UTC, days in ${r.range.timezone}. Generated ${r.generatedAt.slice(0, 16).replace('T', ' ')} UTC.`, '');
  L.push('## Sources', '', `Traffic log covers ${r.sources.trafficLogFrom?.slice(0, 16) ?? 'nothing yet'} to ${r.sources.trafficLogTo?.slice(0, 16) ?? '-'}. Staff emails configured: ${r.sources.staffConfigured}.`, '',
    table(['Collector', 'OK', 'Last run (UTC)', 'Rows', 'Detail'], r.sources.collectors.map(c => [c.id, c.ok ? 'yes' : 'NO', c.ranAt.slice(0, 16), c.rows, (c.detail ?? '').slice(0, 120)])), '');
  const classes = [...new Set(p.byDay.map(d => d.class))].sort();
  const days = [...new Set(p.byDay.map(d => d.day))].sort();
  const cell = (day: string, c: string) => p.byDay.find(d => d.day === day && d.class === c)?.views ?? 0;
  L.push('## People on the marketing pages', '',
    table(['Who', 'Page views', 'Visitors (daily, summed)'], [
      ['Humans (ran the beacon)', p.human.views, p.human.visitors], ['Unconfirmed browsers (no JS ran)', p.unconfirmed.views, p.unconfirmed.visitors],
      ['Automation (webdriver or page flood)', p.automation.views, p.automation.visitors], ['Staff (FF)', p.staff.views, p.staff.visitors]]), '',
    '### Page views per day and class', '', table(['Day', ...classes], days.map(d => [d, ...classes.map(c => cell(d, c))])), '',
    '### Top pages (humans)', '', table(['Page', 'Views', 'Visitors'], p.topPages.map(x => [x.path, x.views, x.visitors])), '',
    '### Where visits came from', '', table(['Channel', 'Visits'], p.channels.map(x => [x.name, x.visits])), '',
    '### Referrers', '', table(['Site', 'Visits'], p.referrers.slice(0, 15).map(x => [x.name, x.visits])), '',
    '### Landing pages', '', table(['Page', 'Visits'], p.landingPages.slice(0, 15).map(x => [x.name, x.visits])), '',
    '### Countries, devices, browsers', '', table(['Country', 'Visits'], p.countries.slice(0, 10).map(x => [x.name, x.visits])), '', table(['Device', 'Visits'], p.devices.map(x => [x.name, x.visits])), '', table(['Browser', 'Visits'], p.browsers.slice(0, 8).map(x => [x.name, x.visits])), '',
    '### Unconfirmed browser hits (no JavaScript ran)', '', table(['Page', 'Browser claimed', 'Hits'], p.unconfirmedPages.map(x => [x.path, x.agent, x.views])), '',
    '### Errors people hit', '', table(['Page', 'Status', 'Hits'], p.errors.map(x => [x.path, x.status, x.hits])), '');
  const b = r.bots;
  L.push('## Bots (everywhere)', '', table(['Class', 'Requests', 'Page hits', 'IPs'], b.byClass.map(x => [x.class, x.requests, x.pages, x.ips])), '',
    '### By crawler', '', table(['Agent', 'Owner', 'Class', 'Purpose', 'Verified', 'Requests', 'Pages', 'robots/sitemap', 'Last seen (UTC)'], b.agents.map(x => [x.agent, x.owner, x.class, x.purpose, x.verified, x.requests, x.pages, x.files, x.lastSeen?.slice(0, 16)])), '',
    '### What search and AI crawlers read', '', table(['Agent', 'Path', 'Hits'], b.crawledPaths.slice(0, 40).map(x => [x.agent, x.path, x.hits])), '',
    '### Impostors (claimed a crawler, failed verification)', '', table(['Claimed', 'Requests', 'IPs', 'Sample IPs'], b.impostors.map(x => [x.claimed, x.requests, x.ips, x.sampleIps.join(' ')])), '',
    '### Scanner paths', '', table(['Path', 'Hits', 'IPs'], b.scannerPaths.map(x => [x.path, x.hits, x.ips])), '',
    '### Errors crawlers hit', '', table(['Path', 'Status', 'Hits'], b.crawlErrors.map(x => [x.path, x.status, x.hits])), '',
    '### All requests by group and class (daily counters)', '', table(['Group', 'Class', 'Requests'], b.volume.map(x => [x.group, x.class, x.requests])), '');
  const f = r.funnel;
  const pct = (a: number, z: number) => (z ? `${Math.round((a / z) * 100)}%` : '-');
  L.push('## Sign-ups to a paid majlis (customers only)', '',
    table(['Step', 'People', 'Of sign-ups'], [['Signed up', f.signups, ''], ['Created a majlis', f.createdMajlis, pct(f.createdMajlis, f.signups)], ['Paid', f.paid, pct(f.paid, f.signups)]]),
    '', `All-time customer accounts: ${fmt(f.allTimeCustomers)}.`, '',
    '### Sign-ups by channel', '', table(['Channel', 'Sign-ups', 'Created a majlis', 'Paid'], f.byChannel.map(x => [x.name, x.signups, x.majlis, x.paid])), '',
    '### Sign-ups by first landing page', '', table(['Landing page', 'Sign-ups', 'Created a majlis', 'Paid'], f.byLanding.map(x => [x.name, x.signups, x.majlis, x.paid])), '',
    '### Sign-ups by referrer', '', table(['Referrer', 'Sign-ups', 'Created a majlis', 'Paid'], f.byReferrer.map(x => [x.name, x.signups, x.majlis, x.paid])), '');
  const rv = r.revenue;
  L.push('## Revenue (CHIP, staff and @ffdev.studio left out)', '', `Collected in range: ${rm(rv.totalCents)} from ${rv.payments} payments. All time: ${rm(rv.lifetimeCents)}. Refunded in range: ${rv.refunded}. Waiting for a refund: ${rv.needsRefund}.`, '',
    table(['Plan', 'Kind', 'Payments', 'Collected'], rv.byPlan.map(x => [x.plan, x.kind, x.payments, rm(x.amountCents)])), '',
    table(['Method', 'Payments', 'Collected'], rv.byMethod.map(x => [x.method, x.payments, rm(x.amountCents)])), '',
    table(['Day', 'Payments', 'Collected'], rv.daily.map(x => [x.day, x.payments, rm(x.amountCents)])), '');
  for (const [name, s] of [['Google', r.search.google], ['Bing', r.search.bing]] as const) {
    L.push(`## ${name} search`, '', `Clicks ${fmt(s.clicks)}, impressions ${fmt(s.impressions)}, CTR ${(s.ctr * 100).toFixed(1)}%${s.position ? `, average position ${s.position.toFixed(1)}` : ''}.`, '',
      '### Queries', '', table(['Query', 'Clicks', 'Impressions', 'Position'], s.queries.slice(0, 20).map(x => [x.query, x.clicks, x.impressions, x.position])), '',
      '### Pages', '', table(['Page', 'Clicks', 'Impressions', 'Position'], s.pages.slice(0, 20).map(x => [x.page.replace('https://indahnya.my', ''), x.clicks, x.impressions, x.position])), '',
      '### Target keywords', '', table(['Query', 'Clicks', 'Impressions', 'Position'], s.tracked.map(x => [x.query, x.clicks, x.impressions, x.position ?? 'not ranking'])), '');
  }
  L.push('## AI', '', `Visits from AI assistants: ${r.ai.visitsFromAssistants}. Sign-ups from AI assistants: ${r.ai.signupsFromAssistants}. ${r.ai.note}`, '',
    table(['Assistant', 'Visits'], r.ai.assistantReferrers.map(x => [x.name, x.visits])), '',
    table(['Crawler', 'Owner', 'Purpose', 'Verified', 'Requests', 'Pages'], r.ai.crawlers.map(x => [x.agent, x.owner, x.purpose, x.verified, x.requests, x.pages])), '');
  return L.join('\n');
}
