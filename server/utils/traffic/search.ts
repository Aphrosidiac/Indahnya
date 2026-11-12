/**
 * Search performance from Google Search Console and Bing Webmaster Tools into search_daily (docs/ANALYTICS.md).
 * Rows: query '*' + page '*' = the day's total; query '*' + a page = that page; a query + page '*' = that query
 * (Bing) or a query + page pair (Google). Google hides rare queries in per-query rows, so totals come from their
 * own request and never from summing queries.
 *
 * Google: a service account with read access to the property (NUXT_GSC_SERVICE_ACCOUNT_JSON), the Search Analytics
 * API, the last 16 days re-read every run (fresh days are revised). Bing: an API key (NUXT_BING_API_KEY),
 * GetRankAndTrafficStats (daily totals), GetQueryStats and GetPageStats (Bing updates these weekly).
 * Without credentials a pull records "not configured" and does nothing else.
 */
import { createSign } from 'node:crypto';
import { sql, eq } from 'drizzle-orm';
import { useDb, searchDaily, collectorRuns } from '../../db';
import { recordRun } from './ingest';
import type { TrafficConfig } from './config';

const day = (d: Date) => d.toISOString().slice(0, 10);

interface Row { date: string; query: string; page: string; clicks: number; impressions: number; position: number }

async function upsertRows(engine: string, rows: Row[]) {
  const db = useDb();
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000).map(r => ({
      engine, date: r.date, query: r.query.slice(0, 300), page: r.page.slice(0, 500),
      clicks: Math.round(r.clicks), impressions: Math.round(r.impressions), position: r.position,
    }));
    await db.insert(searchDaily).values(chunk).onConflictDoUpdate({
      target: [searchDaily.engine, searchDaily.date, searchDaily.query, searchDaily.page],
      set: { clicks: sql`excluded.clicks`, impressions: sql`excluded.impressions`, position: sql`excluded.position` },
    });
  }
  return rows.length;
}

// ── Google ────────────────────────────────────────────────────────────────

function serviceAccount(cfg: TrafficConfig) {
  const raw = cfg.gscServiceAccountJson.trim();
  if (!raw) return null;
  const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const j = JSON.parse(json);
  return { email: j.client_email as string, key: j.private_key as string };
}

async function googleToken(sa: { email: string; key: string }) {
  const b64 = (o: object | string) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: sa.email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }) });
  const j = await r.json() as { access_token?: string; error?: string; error_description?: string };
  if (!r.ok || !j.access_token) throw new Error(`google token ${r.status}: ${j.error_description ?? j.error ?? ''}`);
  return j.access_token;
}

interface GscRow { keys: string[]; clicks: number; impressions: number; position: number }

async function gscQuery(cfg: TrafficConfig, token: string, body: object) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(cfg.gscProperty)}/searchAnalytics/query`;
  const out: GscRow[] = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ ...body, rowLimit: 25000, startRow, dataState: 'all' }) });
    const j = await r.json() as { rows?: GscRow[]; error?: { message?: string } };
    if (!r.ok) throw new Error(`search console ${r.status}: ${j.error?.message ?? ''}`);
    out.push(...(j.rows ?? []));
    if ((j.rows ?? []).length < 25000) return out;
  }
}

export async function pullGoogle(cfg: TrafficConfig, days = 16) {
  const db = useDb();
  let sa: ReturnType<typeof serviceAccount>;
  try { sa = serviceAccount(cfg); } catch (err) { await recordRun(db, 'search:google', false, 0, `bad NUXT_GSC_SERVICE_ACCOUNT_JSON: ${(err as Error).message}`); return { error: 'bad service account json' }; }
  if (!sa) { await recordRun(db, 'search:google', false, 0, 'not configured: set NUXT_GSC_SERVICE_ACCOUNT_JSON'); return { skipped: 'not configured' }; }
  try {
    const token = await googleToken(sa);
    const endDate = day(new Date());
    const startDate = day(new Date(Date.now() - days * 86_400_000));
    const base = { startDate, endDate, type: 'web' };
    const [totals, pages, pairs] = await Promise.all([
      gscQuery(cfg, token, { ...base, dimensions: ['date'] }),
      gscQuery(cfg, token, { ...base, dimensions: ['date', 'page'] }),
      gscQuery(cfg, token, { ...base, dimensions: ['date', 'query', 'page'] }),
    ]);
    const m = (r: GscRow, query: string, page: string): Row => ({ date: r.keys[0]!, query, page, clicks: r.clicks, impressions: r.impressions, position: r.position });
    const n = await upsertRows('google', [
      ...totals.map(r => m(r, '*', '*')),
      ...pages.map(r => m(r, '*', r.keys[1]!)),
      ...pairs.map(r => m(r, r.keys[1]!, r.keys[2]!)),
    ]);
    await recordRun(db, 'search:google', true, n, `${startDate}..${endDate}`);
    return { rows: n };
  } catch (err) {
    console.warn('[search] google pull failed:', (err as Error).message);
    await recordRun(db, 'search:google', false, 0, String(err));
    return { error: String(err) };
  }
}

// ── Bing ──────────────────────────────────────────────────────────────────

/** Bing's WCF JSON dates: "/Date(1316156400000-0700)/". */
const bingDate = (v: string) => { const ms = Number(String(v).match(/\/Date\((-?\d+)/)?.[1]); return Number.isFinite(ms) ? day(new Date(ms)) : null; };

interface BingRow { Date: string; Clicks?: number; Impressions?: number; Query?: string; Page?: string; AvgImpressionPosition?: number }

async function bing(cfg: TrafficConfig, method: string) {
  const url = `https://ssl.bing.com/webmaster/api.svc/json/${method}?siteUrl=${encodeURIComponent(cfg.bingSiteUrl)}&apikey=${encodeURIComponent(cfg.bingApiKey)}`;
  const r = await fetch(url, { headers: { 'content-type': 'application/json; charset=utf-8' } });
  const text = await r.text();
  if (!r.ok) throw new Error(`bing ${method} ${r.status}: ${text.slice(0, 200)}`);
  return (JSON.parse(text).d ?? []) as BingRow[];
}

export async function pullBing(cfg: TrafficConfig) {
  const db = useDb();
  if (!cfg.bingApiKey) { await recordRun(db, 'search:bing', false, 0, 'not configured: set NUXT_BING_API_KEY'); return { skipped: 'not configured' }; }
  try {
    const [traffic, queries, pages] = await Promise.all([bing(cfg, 'GetRankAndTrafficStats'), bing(cfg, 'GetQueryStats'), bing(cfg, 'GetPageStats')]);
    const rows: Row[] = [];
    for (const r of traffic) { const d = bingDate(r.Date); if (d) rows.push({ date: d, query: '*', page: '*', clicks: r.Clicks ?? 0, impressions: r.Impressions ?? 0, position: 0 }); }
    for (const r of queries) { const d = bingDate(r.Date); if (d && r.Query) rows.push({ date: d, query: r.Query, page: '*', clicks: r.Clicks ?? 0, impressions: r.Impressions ?? 0, position: r.AvgImpressionPosition ?? 0 }); }
    for (const r of pages) { const d = bingDate(r.Date); const page = r.Page ?? r.Query; if (d && page) rows.push({ date: d, query: '*', page, clicks: r.Clicks ?? 0, impressions: r.Impressions ?? 0, position: r.AvgImpressionPosition ?? 0 }); }
    const n = await upsertRows('bing', rows);
    await recordRun(db, 'search:bing', true, n, `${traffic.length} days, ${queries.length} query rows, ${pages.length} page rows`);
    return { rows: n };
  } catch (err) {
    console.warn('[search] bing pull failed:', (err as Error).message);
    await recordRun(db, 'search:bing', false, 0, String(err));
    return { error: String(err) };
  }
}

export const pullSearch = async (cfg: TrafficConfig, days = 16) => ({ google: await pullGoogle(cfg, days), bing: await pullBing(cfg) });

/** Twice a day is enough: pull when the last run (ok or "not configured") is more than 12 hours old. */
export async function pullSearchIfDue(cfg: TrafficConfig) {
  const [last] = await useDb().select({ ranAt: collectorRuns.ranAt }).from(collectorRuns).where(eq(collectorRuns.id, 'search:google'));
  if (last && Date.now() - last.ranAt.getTime() < 12 * 3_600_000) return { skipped: 'ran recently' };
  return pullSearch(cfg);
}
