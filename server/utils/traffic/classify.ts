/**
 * Turns one nginx log line into a classified row. Pure apart from the published-list and DNS lookups behind
 * verifyClaim/datacenterOf (ipranges.ts), which tests stub. The database side is ingest.ts.
 *
 * How a request becomes "human" (docs/ANALYTICS.md):
 * 1. Not a claimed crawler, monitor, tool, scanner or scanner path, not from a datacenter range, not loopback.
 * 2. Its page view is matched by the page's beacon (/_e) from the same visitor within 30 minutes, and the beacon
 *    reports navigator.webdriver = false. Until then it is "unconfirmed" (no JS ran: a fast bounce, a blocker, or a
 *    scraper with a browser User-Agent). A visitor that pulls more than 60 pages in 10 minutes is "automation".
 * 3. Visits from an IP a staff account signed in from in the last 30 days are "staff", not customers.
 */
import { createHash } from 'node:crypto';
import { parseUa, isScannerPath, deviceOf } from './agents';
import { verifyClaim, datacenterOf, type Verdict } from './ipranges';
import { hostKind, kindOf, groupOf, normPath, type Group, type Kind } from './paths';
import { newId } from '../ids';

/** One line of deploy/nginx.conf's `indahnya_json`. */
export interface LogLine { t: string; h: string; ip: string; m: string; u: string; s: number; b?: number; rt?: number; ua?: string; r?: string; c?: string; q?: string }

export interface Classified { class: string; agent: string | null; verified: Verdict | 'n/a' }

export interface ClassifyContext {
  siteUrl: string;
  staffIps: Set<string>;
  cache: Map<string, Classified>;
  /** The day's random salt for the visitor hash. */
  salt: (day: string) => Promise<string>;
}

const PEOPLE = new Set(['human', 'unconfirmed', 'staff']);
export const isPersonClass = (c: string) => PEOPLE.has(c);

/** The Malaysia day (UTC+8) of an instant, as YYYY-MM-DD. */
export const myDay = (at: Date) => new Date(at.getTime() + 8 * 3_600_000).toISOString().slice(0, 10);

/** One id per person per Malaysia day. The IP itself is never kept for people. */
export const visitorOf = (salt: string, ip: string, ua: string) => createHash('sha256').update(`${salt}|${ip}|${ua}`).digest('hex').slice(0, 20);

export async function classify(l: LogLine, path: string, ctx: ClassifyContext): Promise<Classified> {
  const ua = l.ua ?? '';
  if (l.ip === '127.0.0.1' || l.ip === '::1') return { class: 'internal', agent: 'Indahnya server', verified: 'n/a' };
  const key = `${l.ip}|${ua}`;
  const scanPath = isScannerPath(path);
  const cached = ctx.cache.get(key);
  if (cached && !scanPath) return cached;
  const p = parseUa(ua);
  const staff = ctx.staffIps.has(l.ip);
  let out: Classified;
  if (p.kind === 'bot') {
    const v = await verifyClaim(l.ip, p.bot.verify);
    out = v === 'failed' ? { class: 'impostor', agent: p.bot.name, verified: v } : { class: p.bot.category, agent: p.bot.name, verified: v };
  } else if (p.kind === 'monitor') out = { class: 'monitor', agent: p.name, verified: 'n/a' };
  else if (p.kind === 'scanner') out = { class: 'scanner', agent: p.name, verified: 'n/a' };
  else if (p.kind === 'tool') out = { class: p.name === 'Indahnya check' ? 'internal' : 'tool', agent: p.name, verified: 'n/a' };
  else if (p.kind === 'unknown-bot') out = { class: 'other-bot', agent: p.name, verified: 'unverifiable' };
  else if (p.kind === 'browser') {
    const dc = staff ? null : await datacenterOf(l.ip);
    out = staff ? { class: 'staff', agent: p.name, verified: 'n/a' }
      : dc ? { class: 'datacenter', agent: `${p.name} on ${dc}`, verified: 'n/a' }
      : { class: 'unconfirmed', agent: p.name, verified: 'n/a' };
  } else out = { class: 'other-bot', agent: p.name || 'No user agent', verified: 'unverifiable' };
  // FF's own requests (tests, audits, curl) from a staff sign-in IP are internal, not bots; real crawlers stay crawlers
  if (staff && out.class !== 'staff' && out.verified !== 'verified') out = { ...out, class: 'internal' };
  ctx.cache.set(key, out);
  if (scanPath && (out.class === 'unconfirmed' || out.class === 'datacenter' || out.class === 'other-bot')) return { ...out, class: 'scanner' };
  return out;
}

function beaconData(q: string | undefined) {
  const sp = new URLSearchParams(q ?? '');
  const g = (k: string, n = 200) => (sp.get(k) ?? '').slice(0, n) || undefined;
  const r = g('r', 120)?.toLowerCase();
  return { p: normPath(g('p') ?? '/'), r, us: g('us', 80), w: Number(sp.get('w')) || undefined, wd: sp.get('wd') === '1', e: g('e', 4), device: undefined as string | undefined };
}

export interface HitRow {
  id: string; at: Date; host: string; grp: Group; method: string; path: string; status: number; bytes: number; ms: number;
  country: string | null; refHost: string | null; kind: Kind; class: string; agent: string | null; verified: string;
  visitor: string; ip: string | null; ua: string; beacon: boolean; data: Record<string, unknown> | null;
}
export interface Prepared { hit: HitRow | null; daily: { date: string; host: string; grp: Group; class: string } }

/** One log line → a row to store (or null: counted only) and its daily counter key. */
export async function prepare(l: LogLine, ctx: ClassifyContext): Promise<Prepared | null> {
  if (!l || !l.t || !l.h || !l.ip) return null;
  const at = new Date(l.t);
  if (Number.isNaN(at.getTime())) return null;
  const host = hostKind(l.h, ctx.siteUrl);
  const path = normPath(l.u);
  const kind = kindOf(path);
  let grp = groupOf(path, kind);
  const ua = (l.ua ?? '').slice(0, 400);
  let c = await classify(l, path, ctx);
  let data: ReturnType<typeof beaconData> | null = null;
  if (kind === 'beacon') {
    data = beaconData(l.q);
    // a beacon only speaks for a marketing page; one for a couple page or the app is noise
    if (groupOf(data.p) !== 'marketing') return { hit: null, daily: { date: myDay(at), host, grp, class: c.class } };
    if (data.wd && isPersonClass(c.class)) c = { ...c, class: 'automation', agent: `${c.agent ?? 'Browser'} (webdriver)` };
    else if (c.class === 'unconfirmed') c = { ...c, class: 'human' };
    if (data.w) data.device = deviceOf(ua, data.w);
  }
  // a probe for /wp-login.php is not a visit to any majlis
  if (c.class === 'scanner' && grp === 'couple') grp = 'other';
  const date = myDay(at);
  const daily = { date, host, grp, class: c.class };
  const person = isPersonClass(c.class);
  const status = Number(l.s) || 0;
  // kept: marketing page views, beacons, robots/sitemap, every non-human request (but not assets or our own tools), and every 404 (the probe check below reads them)
  const store = kind === 'beacon' || kind === 'file' || (kind === 'page' && grp === 'marketing')
    || (kind !== 'asset' && !person && c.class !== 'tool' && c.class !== 'internal')
    || (kind === 'page' && status === 404);
  if (!store) return { hit: null, daily };
  return {
    daily,
    hit: {
      id: newId(), at, host, grp, method: (l.m ?? 'GET').slice(0, 10), path: path.slice(0, 300), status, bytes: Number(l.b) || 0,
      ms: Math.round((Number(l.rt) || 0) * 1000), country: l.c && l.c !== 'XX' && l.c !== 'T1' ? l.c.slice(0, 2) : null,
      refHost: l.r ? l.r.toLowerCase().slice(0, 120) : null, kind, class: c.class, agent: c.agent?.slice(0, 80) ?? null,
      verified: c.verified, visitor: visitorOf(await ctx.salt(date), l.ip, ua), ip: person ? null : l.ip, ua,
      beacon: false, data: data as Record<string, unknown> | null,
    },
  };
}
