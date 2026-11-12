/**
 * Proof behind a crawler's claim, and datacenter detection for browser-looking traffic.
 *
 * - A claimed crawler is "verified" when its IP is in the vendor's published list, or when reverse DNS gives a
 *   host under the vendor's domain AND that host resolves back to the same IP (forward-confirmed, as Google and
 *   Bing document). Otherwise it "failed": something is pretending to be that crawler (an impostor).
 * - "unverifiable": the vendor publishes no list or rule, or the list could not be loaded right now.
 * - Datacenter: the IP is in AWS, Google Cloud, DigitalOcean or Oracle Cloud's published ranges. A browser
 *   User-Agent from a datacenter is almost always automation. Azure, Hetzner and OVH publish no stable list,
 *   so their traffic can still pass as browsers; the beacon check in ingest.ts is the second line.
 */
import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';

interface Range { v6: boolean; base: bigint; mask: bigint }

function toBig(ip: string): { v6: boolean; n: bigint } | null {
  const kind = isIP(ip);
  if (kind === 4) return { v6: false, n: ip.split('.').reduce((a, p) => (a << BigInt(8)) + BigInt(Number(p)), BigInt(0)) };
  if (kind !== 6) return null;
  // expand :: and an embedded IPv4 tail
  let s = ip.toLowerCase();
  const v4 = s.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) { const tail4 = v4[1]!; const b = toBig(tail4)!.n; s = s.replace(tail4, `${(b >> BigInt(16)).toString(16)}:${(b & BigInt(0xffff)).toString(16)}`); }
  const [head, tail] = s.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined ? (tail ? tail.split(':') : []) : [];
  const parts = tail !== undefined ? [...h, ...Array(8 - h.length - t.length).fill('0'), ...t] : h;
  if (parts.length !== 8) return null;
  return { v6: true, n: parts.reduce((a, p) => (a << BigInt(16)) + BigInt(parseInt(p || '0', 16)), BigInt(0)) };
}

export function parseCidr(cidr: string): Range | null {
  const [ip, bitsRaw] = cidr.trim().split('/');
  const b = toBig(ip ?? '');
  if (!b) return null;
  const width = b.v6 ? 128 : 32;
  const bits = bitsRaw === undefined ? width : Number(bitsRaw);
  if (!(bits >= 0 && bits <= width)) return null;
  const mask = bits === 0 ? BigInt(0) : ((BigInt(1) << BigInt(bits)) - BigInt(1)) << BigInt(width - bits);
  return { v6: b.v6, base: b.n & mask, mask };
}

export function inRanges(ip: string, ranges: Range[]) {
  const b = toBig(ip);
  if (!b) return false;
  for (const r of ranges) if (r.v6 === b.v6 && (b.n & r.mask) === r.base) return true;
  return false;
}

/** Every published format we read: Google/Bing/OpenAI/Perplexity/DuckDuckGo, AWS, Oracle, DigitalOcean CSV. */
export function cidrsFrom(body: string): string[] {
  const t = body.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return t.split(/\r?\n/).map((l) => (l.split(',')[0] ?? '').trim()).filter((c) => c.includes('/'));
  const j = JSON.parse(t);
  const out: string[] = [];
  for (const p of j.prefixes ?? []) { const c = p.ipv4Prefix ?? p.ipv6Prefix ?? p.ip_prefix ?? p.ipv6_prefix; if (c) out.push(c); }
  for (const p of j.ipv6_prefixes ?? []) if (p.ipv6_prefix) out.push(p.ipv6_prefix);
  for (const r of j.regions ?? []) for (const c of r.cidrs ?? []) if (c.cidr) out.push(c.cidr);
  return out;
}

export const DATACENTER_LISTS: Record<string, string> = {
  AWS: 'https://ip-ranges.amazonaws.com/ip-ranges.json',
  'Google Cloud': 'https://www.gstatic.com/ipranges/cloud.json',
  DigitalOcean: 'https://www.digitalocean.com/geo/google.csv',
  'Oracle Cloud': 'https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json',
};

const DAY = 86_400_000;
const lists = new Map<string, { ranges: Range[]; at: number; ok: boolean }>();
type Fetcher = (url: string) => Promise<string>;
let fetcher: Fetcher = async (url) => {
  const r = await fetch(url, { headers: { 'user-agent': 'indahnya-metrics/1.0 (+https://indahnya.my)' }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
};
type Resolver = { reverse: (ip: string) => Promise<string[]>; lookup: (host: string) => Promise<string[]> };
let resolver: Resolver = {
  reverse: (ip) => dns.reverse(ip),
  lookup: async (host) => (await dns.lookup(host, { all: true })).map((a) => a.address),
};
/** Tests swap the network out. */
export function useNetwork(f: Fetcher, r: Resolver) { fetcher = f; resolver = r; lists.clear(); rdnsCache.clear(); }

/** A published list, refreshed daily. A failed refresh keeps the last good copy; never loaded = null. */
export async function list(url: string): Promise<Range[] | null> {
  const cur = lists.get(url);
  if (cur && Date.now() - cur.at < DAY) return cur.ok ? cur.ranges : null;
  try {
    const ranges = cidrsFrom(await fetcher(url)).map(parseCidr).filter((r): r is Range => !!r);
    if (!ranges.length) throw new Error(`no ranges in ${url}`);
    lists.set(url, { ranges, at: Date.now(), ok: true });
    return ranges;
  } catch (err) {
    console.warn('[traffic] ip list unavailable', url, String(err));
    if (cur?.ok) { lists.set(url, { ...cur, at: Date.now() - DAY + 3_600_000 }); return cur.ranges; } // retry in an hour
    lists.set(url, { ranges: [], at: Date.now() - DAY + 3_600_000, ok: false });
    return null;
  }
}

const rdnsCache = new Map<string, { hosts: string[]; at: number }>();
/** Forward-confirmed reverse DNS: PTR names whose own A/AAAA records include the IP. */
export async function confirmedNames(ip: string): Promise<string[]> {
  const c = rdnsCache.get(ip);
  if (c && Date.now() - c.at < 7 * DAY) return c.hosts;
  const withTimeout = <T,>(p: Promise<T>) => Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
  let hosts: string[] = [];
  try {
    const names = await withTimeout(resolver.reverse(ip));
    for (const n of names.slice(0, 4)) {
      const back = await withTimeout(resolver.lookup(n)).catch(() => [] as string[]);
      if (back.includes(ip)) hosts.push(n.toLowerCase().replace(/\.$/, ''));
    }
  } catch { hosts = []; }
  rdnsCache.set(ip, { hosts, at: Date.now() });
  return hosts;
}

export type Verdict = 'verified' | 'failed' | 'unverifiable';

export async function verifyClaim(ip: string, v: { lists?: string[]; rdns?: string[] } | undefined): Promise<Verdict> {
  if (!v || (!v.lists?.length && !v.rdns?.length)) return 'unverifiable';
  let anyListLoaded = false;
  for (const url of v.lists ?? []) {
    const r = await list(url);
    if (r) { anyListLoaded = true; if (inRanges(ip, r)) return 'verified'; }
  }
  if (v.rdns?.length) {
    const names = await confirmedNames(ip);
    if (names.some((n) => v.rdns!.some((suf) => n.endsWith(suf)))) return 'verified';
    return 'failed';
  }
  return anyListLoaded ? 'failed' : 'unverifiable';
}

/** Which cloud an IP belongs to, if any of the published lists has it. */
export async function datacenterOf(ip: string): Promise<string | null> {
  for (const [name, url] of Object.entries(DATACENTER_LISTS)) {
    const r = await list(url);
    if (r && inRanges(ip, r)) return name;
  }
  return null;
}
