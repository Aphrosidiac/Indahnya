import { describe, it, expect, beforeAll } from 'vitest';
import { parseUa, isScannerPath } from '../server/utils/traffic/agents';
import { useNetwork, parseCidr, inRanges, cidrsFrom } from '../server/utils/traffic/ipranges';
import { kindOf, groupOf, normPath, hostKind } from '../server/utils/traffic/paths';
import { prepare, myDay, visitorOf, type ClassifyContext, type LogLine } from '../server/utils/traffic/classify';
import { channelOf, firstTouch, signupFields } from '../server/utils/traffic/channel';
import { parseEmails, isStaffEmail, trafficConfigFromEnv } from '../server/utils/traffic/config';

/** Real-looking lines of deploy/nginx.conf's `indahnya_json`, parsed the way the ingest job parses them. */
const line = (o: Record<string, unknown>): LogLine => JSON.parse(JSON.stringify({
  t: '2026-11-12T14:03:05+08:00', h: 'indahnya.my', ip: '175.139.12.34', m: 'GET', u: '/harga', s: 200, b: 18234, rt: 0.043,
  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', r: '', c: 'MY', q: '', ...o,
}));
const raw = '{"t":"2026-11-12T14:03:05+08:00","h":"indahnya.my","ip":"175.139.12.34","m":"GET","u":"/harga","s":200,"b":18234,"rt":0.043,"ua":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36","r":"www.google.com","c":"MY","q":""}';

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
/** The fake iPhone the scanners send: an iOS 13.2.3 Safari that nobody runs any more. */
const FAKE_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const GPTBOT = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)';
const CLAUDEBOT = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)';

const LISTS: Record<string, string> = {
  'https://developers.google.com/static/search/apis/ipranges/googlebot.json': JSON.stringify({ prefixes: [{ ipv4Prefix: '66.249.64.0/19' }, { ipv6Prefix: '2001:4860:4801::/48' }] }),
  'https://developers.google.com/static/search/apis/ipranges/special-crawlers.json': JSON.stringify({ prefixes: [{ ipv4Prefix: '66.249.90.0/24' }] }),
  'https://openai.com/gptbot.json': JSON.stringify({ prefixes: [{ ipv4Prefix: '20.171.206.0/24' }] }),
  'https://ip-ranges.amazonaws.com/ip-ranges.json': JSON.stringify({ prefixes: [{ ip_prefix: '3.120.0.0/14' }] }),
  'https://www.gstatic.com/ipranges/cloud.json': JSON.stringify({ prefixes: [{ ipv4Prefix: '34.64.0.0/10' }] }),
  'https://www.digitalocean.com/geo/google.csv': '134.209.0.0/16,SG,SG-SG,Singapore,\n',
  'https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json': JSON.stringify({ regions: [{ cidrs: [{ cidr: '129.150.0.0/16' }] }] }),
};
const PTR: Record<string, string[]> = { '66.249.66.1': ['crawl-66-249-66-1.googlebot.com.'] };

const ctx = (over: Partial<ClassifyContext> = {}): ClassifyContext => ({
  siteUrl: 'https://indahnya.my', staffIps: new Set(['203.0.113.7']), cache: new Map(), salt: async day => `salt-${day}`, ...over,
});

beforeAll(() => {
  useNetwork(
    async (url) => { const b = LISTS[url]; if (b === undefined) throw new Error(`404 ${url}`); return b; },
    { reverse: async ip => { const p = PTR[ip]; if (!p) throw new Error('ENOTFOUND'); return p; }, lookup: async host => (host.startsWith('crawl-66-249-66-1') ? ['66.249.66.1'] : []) },
  );
});

describe('log lines', () => {
  it('parses a real nginx line and keeps what the report needs', async () => {
    const l = JSON.parse(raw) as LogLine;
    const p = (await prepare(l, ctx()))!;
    expect(p.daily).toEqual({ date: '2026-11-12', host: 'site', grp: 'marketing', class: 'unconfirmed' });
    expect(p.hit).toMatchObject({ path: '/harga', status: 200, country: 'MY', refHost: 'www.google.com', kind: 'page', grp: 'marketing', ms: 43 });
  });
  it('skips lines missing a host, ip or a valid time', async () => {
    expect(await prepare({ ...line({}), h: '' }, ctx())).toBeNull();
    expect(await prepare({ ...line({}), ip: '' }, ctx())).toBeNull();
    expect(await prepare(line({ t: 'yesterday' }), ctx())).toBeNull();
  });
  it('counts a Malaysia day, whatever offset the box logs in', () => {
    expect(myDay(new Date('2026-11-12T23:30:00+08:00'))).toBe('2026-11-12');
    expect(myDay(new Date('2026-11-12T17:00:00+00:00'))).toBe('2026-11-13');
    expect(myDay(new Date('2026-11-12T15:59:00Z'))).toBe('2026-11-12');
  });
  it('paths: query stripped, trailing slash folded, root kept', () => {
    expect(normPath('/harga/?utm_source=x')).toBe('/harga');
    expect(normPath('/')).toBe('/');
    expect(normPath('')).toBe('/');
  });
  it('knows its own hosts', () => {
    expect(hostKind('indahnya.my', 'https://indahnya.my')).toBe('site');
    expect(hostKind('WWW.indahnya.my', 'https://indahnya.my')).toBe('www');
    expect(hostKind('example.com', 'https://indahnya.my')).toBe('other');
  });
});

describe('kinds and groups', () => {
  it('splits the site into what people and bots are counted on', () => {
    expect(groupOf('/')).toBe('marketing');
    expect(groupOf('/harga')).toBe('marketing');
    expect(groupOf('/en/pricing')).toBe('marketing');
    expect(groupOf('/contoh/cuba')).toBe('marketing');
    expect(groupOf('/aina-hakim')).toBe('couple');
    expect(groupOf('/aina-hakim/rsvp')).toBe('couple');
    expect(groupOf('/app/01JABC/gambar')).toBe('app');
    expect(groupOf('/masuk')).toBe('app');
    expect(groupOf('/tv/aina-hakim')).toBe('tv');
    expect(groupOf('/embed/aina-hakim')).toBe('embed');
    expect(kindOf('/api/health')).toBe('api');
    expect(kindOf('/_e')).toBe('beacon');
    expect(kindOf('/robots.txt')).toBe('file');
    expect(kindOf('/sitemap.xml')).toBe('file');
    expect(kindOf('/_nuxt/entry.abc.js')).toBe('asset');
    expect(kindOf('/landing/hero.webp')).toBe('asset');
    expect(kindOf('/harga')).toBe('page');
  });
  it('never mistakes the site itself for a scanner', () => {
    for (const p of ['/', '/harga', '/en/pricing', '/aina-hakim', '/app/01JABC/qr', '/api/health', '/_nuxt/a.js', '/.well-known/security.txt', '/sitemap.xml', '/_e'])
      expect(isScannerPath(p), p).toBe(false);
  });
});

describe('user agents', () => {
  it('reads crawlers, tools, monitors and browsers', () => {
    expect(parseUa(GOOGLEBOT)).toMatchObject({ kind: 'bot', bot: { name: 'Googlebot', category: 'search-bot' } });
    expect(parseUa(GPTBOT)).toMatchObject({ kind: 'bot', bot: { name: 'GPTBot', category: 'ai-bot', purpose: 'training' } });
    expect(parseUa(CLAUDEBOT)).toMatchObject({ kind: 'bot', bot: { name: 'ClaudeBot' } });
    expect(parseUa('curl/8.7.1')).toMatchObject({ kind: 'tool', name: 'curl' });
    expect(parseUa('python-requests/2.32.3')).toMatchObject({ kind: 'tool', name: 'Python' });
    expect(parseUa('Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)')).toMatchObject({ kind: 'monitor' });
    expect(parseUa(CHROME)).toMatchObject({ kind: 'browser', name: 'Chrome' });
    expect(parseUa(IPHONE)).toMatchObject({ kind: 'browser', name: 'Safari' });
    expect(parseUa('')).toMatchObject({ kind: 'tool', name: 'No user agent' });
  });
});

describe('classification', () => {
  const cls = async (o: Record<string, unknown>, c = ctx()) => (await prepare(line(o), c))!;

  it('a browser page view is unconfirmed until its beacon arrives', async () => {
    expect((await cls({})).hit!.class).toBe('unconfirmed');
  });
  it('a beacon from a browser makes it human', async () => {
    const b = await cls({ u: '/_e', s: 204, q: 'p=%2Fharga&r=www.google.com&w=1280&wd=0&e=i' });
    expect(b.hit).toMatchObject({ kind: 'beacon', class: 'human' });
    expect(b.hit!.data).toMatchObject({ p: '/harga', r: 'www.google.com', wd: false, device: 'desktop' });
  });
  it('a beacon that says webdriver is automation, not human', async () => {
    const b = await cls({ u: '/_e', s: 204, q: 'p=%2F&w=1280&wd=1&e=t' });
    expect(b.hit).toMatchObject({ class: 'automation' });
  });
  it('a beacon for a couple page or the app is noise: counted, not stored', async () => {
    expect((await cls({ u: '/_e', s: 204, q: 'p=%2Faina-hakim&wd=0' })).hit).toBeNull();
    expect((await cls({ u: '/_e', s: 204, q: 'p=%2Fapp&wd=0' })).hit).toBeNull();
  });
  it('the fake iPhone OS 13_2_3 browser probing wp-admin is a scanner', async () => {
    for (const u of ['/wp-admin/setup-config.php', '/wp-login.php', '/xmlrpc.php', '/.env', '/phpmyadmin/', '/vendor/phpunit/phpunit/eval-stdin.php']) {
      const p = await cls({ ua: FAKE_IPHONE, ip: '45.148.10.20', u, s: 404 });
      expect(p.hit, u).toMatchObject({ class: 'scanner', ip: '45.148.10.20' });
    }
  });
  it('the same fake iPhone reading a normal page is only unconfirmed (the 404 probe check decides the rest)', async () => {
    expect((await cls({ ua: FAKE_IPHONE, ip: '45.148.10.21' })).hit!.class).toBe('unconfirmed');
  });
  it('a real Googlebot from a Google address is verified', async () => {
    const p = await cls({ ua: GOOGLEBOT, ip: '66.249.66.1', u: '/' });
    expect(p.hit).toMatchObject({ class: 'search-bot', agent: 'Googlebot', verified: 'verified' });
  });
  it('a Googlebot User-Agent from a non-Google address is an impostor', async () => {
    const p = await cls({ ua: GOOGLEBOT, ip: '198.51.100.23', u: '/harga' });
    expect(p.hit).toMatchObject({ class: 'impostor', agent: 'Googlebot', verified: 'failed', ip: '198.51.100.23' });
  });
  it('GPTBot is verified by OpenAI\'s list and an impostor outside it', async () => {
    expect((await cls({ ua: GPTBOT, ip: '20.171.206.14' })).hit).toMatchObject({ class: 'ai-bot', verified: 'verified' });
    expect((await cls({ ua: GPTBOT, ip: '198.51.100.99' })).hit).toMatchObject({ class: 'impostor', verified: 'failed' });
  });
  it('a crawler with nothing to verify against is counted under its name, unverifiable', async () => {
    expect((await cls({ ua: CLAUDEBOT, ip: '160.79.104.10' })).hit).toMatchObject({ class: 'ai-bot', agent: 'ClaudeBot', verified: 'unverifiable' });
  });
  it('a browser from a cloud range is a datacenter, not a person', async () => {
    expect((await cls({ ip: '3.121.5.6' })).hit).toMatchObject({ class: 'datacenter', ip: '3.121.5.6' });
    expect((await cls({ ip: '129.150.4.4' })).hit!.class).toBe('datacenter');
  });
  it('monitors and tools are named; a tool on the API is counted, not stored', async () => {
    expect((await cls({ ua: 'Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)', u: '/' })).hit).toMatchObject({ class: 'monitor' });
    expect((await cls({ ua: 'curl/8.7.1', u: '/api/health' })).hit).toBeNull();
    expect((await cls({ ua: 'curl/8.7.1', u: '/' })).hit).toMatchObject({ class: 'tool' });
  });
  it('a visit from a staff sign-in IP is staff; their curl is internal; a verified crawler stays a crawler', async () => {
    expect((await cls({ ip: '203.0.113.7' })).hit).toMatchObject({ class: 'staff', ip: null });
    expect((await cls({ ip: '203.0.113.7', ua: 'curl/8.7.1', u: '/' })).hit).toMatchObject({ class: 'internal' });
  });
  it('loopback is internal', async () => {
    expect((await cls({ ip: '127.0.0.1', ua: 'curl/8.7.1', u: '/api/health' })).daily.class).toBe('internal');
  });
});

describe('what is stored and what is only counted', () => {
  const cls = async (o: Record<string, unknown>) => (await prepare(line(o), ctx()))!;
  it('stores marketing pages, beacons, robots and sitemap; counts assets and a guest\'s pages', async () => {
    expect((await cls({ u: '/harga' })).hit).not.toBeNull();
    expect((await cls({ u: '/robots.txt', ua: GOOGLEBOT, ip: '66.249.66.1' })).hit).not.toBeNull();
    expect((await cls({ u: '/landing/hero.webp' })).hit).toBeNull();
    expect((await cls({ u: '/aina-hakim', ip: '175.139.9.9' })).hit).toBeNull();
    expect((await cls({ u: '/app/01JABC' })).hit).toBeNull();
    expect((await cls({ u: '/_nuxt/a.js', ua: GPTBOT, ip: '20.171.206.14' })).hit).toBeNull();
  });
  it('stores every bot, even on a couple page, and every 404 (the probe check needs them)', async () => {
    expect((await cls({ u: '/aina-hakim', ua: GPTBOT, ip: '20.171.206.14' })).hit).not.toBeNull();
    expect((await cls({ u: '/tidak-ada', s: 404 })).hit).not.toBeNull();
  });
  it('never stores a person\'s IP, and keys the day\'s hash by a salt', async () => {
    const person = (await cls({ u: '/harga' })).hit!;
    expect(person.ip).toBeNull();
    expect(JSON.stringify(person)).not.toContain('175.139.12.34');
    const bot = (await cls({ u: '/harga', ua: GPTBOT, ip: '198.51.100.99' })).hit!;
    expect(bot.ip).toBe('198.51.100.99');
  });
  it('visitor ids: same person same day match; another day or salt do not', () => {
    const a = visitorOf('salt-2026-11-12', '1.2.3.4', CHROME);
    expect(a).toBe(visitorOf('salt-2026-11-12', '1.2.3.4', CHROME));
    expect(a).not.toBe(visitorOf('salt-2026-11-13', '1.2.3.4', CHROME));
    expect(a).not.toBe(visitorOf('salt-2026-11-12', '1.2.3.5', CHROME));
    expect(a).toHaveLength(20);
  });
});

describe('IP ranges', () => {
  it('matches IPv4 and IPv6 prefixes', () => {
    const r = [parseCidr('66.249.64.0/19')!, parseCidr('2001:4860:4801::/48')!];
    expect(inRanges('66.249.66.1', r)).toBe(true);
    expect(inRanges('66.249.96.1', r)).toBe(false);
    expect(inRanges('2001:4860:4801:10::1', r)).toBe(true);
    expect(inRanges('2001:4860:4802::1', r)).toBe(false);
    expect(inRanges('not an ip', r)).toBe(false);
  });
  it('reads every published list format', () => {
    expect(cidrsFrom('{"prefixes":[{"ipv4Prefix":"1.2.3.0/24"},{"ip_prefix":"4.5.6.0/24"}]}')).toEqual(['1.2.3.0/24', '4.5.6.0/24']);
    expect(cidrsFrom('1.2.3.0/24,SG,x\n5.6.0.0/16,MY,y\n')).toEqual(['1.2.3.0/24', '5.6.0.0/16']);
  });
});

describe('channels and the first-visit cookie', () => {
  it('names where a visit came from', () => {
    expect(channelOf('www.google.com')).toBe('Google');
    expect(channelOf('www.bing.com')).toBe('Bing');
    expect(channelOf('chatgpt.com')).toBe('AI assistant');
    expect(channelOf('l.instagram.com')).toBe('Social');
    expect(channelOf('duckduckgo.com')).toBe('Other search');
    expect(channelOf('someblog.my')).toBe('Referral');
    expect(channelOf('')).toBe('Direct');
    expect(channelOf('indahnya.my')).toBe('Internal');
    expect(channelOf('www.google.com', 'tiktok')).toBe('Social');
    expect(channelOf('', 'newsletter')).toBe('Campaign');
  });
  const ck = (o: object) => encodeURIComponent(JSON.stringify(o));
  it('reads the cookie, decoded or not, and checks every field', () => {
    const t = Date.now() - 1000;
    expect(firstTouch(ck({ r: 'www.google.com', s: '', p: '/harga', t }))).toMatchObject({ refHost: 'www.google.com', landing: '/harga' });
    expect(firstTouch(JSON.stringify({ r: 'chatgpt.com', p: '/a%20b', t }))).toMatchObject({ refHost: 'chatgpt.com', landing: '/a%20b' });
    expect(firstTouch(ck({ r: '<script>', p: 'javascript:1', t: 5 }))).toMatchObject({ refHost: null, landing: null, firstSeenAt: null });
    expect(firstTouch('%%%')).toBeNull();
    expect(firstTouch(undefined)).toBeNull();
  });
  it('turns it into the user columns, or nothing', () => {
    expect(signupFields(ck({ r: 'chatgpt.com', p: '/', t: Date.now() }))).toMatchObject({ signupChannel: 'AI assistant', signupRefHost: 'chatgpt.com', signupLanding: '/' });
    expect(signupFields(undefined)).toBeNull();
  });
});

describe('staff', () => {
  it('is a list of emails, compared lower-case, and nothing else', () => {
    expect(parseEmails(' Fakhrul@FFDev.studio, ,noel@ffdev.studio;bad ')).toEqual(['fakhrul@ffdev.studio', 'noel@ffdev.studio']);
    const cfg = trafficConfigFromEnv({ NUXT_STAFF_EMAILS: 'fakhrul@ffdev.studio' });
    expect(isStaffEmail(cfg, 'Fakhrul@ffdev.studio')).toBe(true);
    expect(isStaffEmail(cfg, 'fakhrul@ffdev.studio.evil.com')).toBe(false);
    expect(isStaffEmail(cfg, null)).toBe(false);
    expect(isStaffEmail(trafficConfigFromEnv({}), 'fakhrul@ffdev.studio')).toBe(false);
  });
});
