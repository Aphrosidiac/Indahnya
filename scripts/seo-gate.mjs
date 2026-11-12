// Indahnya public pages: SEO acceptance gate (docs/seo/ACCEPTANCE.md, gates A and B).
// Ported from Siar's apps/site/scripts/seo-gate.mjs, for a Nuxt SSR site: it builds the app, starts the
// production server with the live site URL and pre-launch mode on, fetches every sitemap page over HTTP for the
// static checks, then runs Lighthouse (mobile + desktop, all four categories) on every sitemap page through a local
// HTTPS proxy that answers as indahnya.my.
//
//   node scripts/seo-gate.mjs                     build + static checks + Lighthouse on every page
//   node scripts/seo-gate.mjs --no-build          reuse .output from the last build
//   node scripts/seo-gate.mjs --no-lh             static checks only
//   node scripts/seo-gate.mjs --only=/harga,/e-kad   Lighthouse on these paths only
//   node scripts/seo-gate.mjs --url=http://127.0.0.1:3250   check a server that is already running (no build/start)
//
// Exit 0 only when there are zero failures. Report: scripts/seo-gate/report.md and report.json (git-ignored).
// Needs openssl (self-signed cert for the HTTPS proxy), Chrome, and the local Postgres in .env (the sample majlis).
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { SITE_PAGES, langOfPath, pathIn } from '../shared/utils/site-pages.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HERE = path.join(ROOT, 'scripts', 'seo-gate');
fs.mkdirSync(HERE, { recursive: true });
const ORIGIN = 'https://indahnya.my';
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = opt('only')?.split(',');

const fails = [];
const warns = [];
const fail = (where, rule, what) => fails.push({ where, rule, what });
const warn = (where, rule, what) => warns.push({ where, rule, what });

// ---------- build and start ----------
let BASE = opt('url');
let child;
if (!BASE) {
  if (!flag('--no-build')) {
    console.error('building (nuxt build) …');
    execSync('npx nuxt build', { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  }
  const port = 3290 + Math.floor(Math.random() * 400);
  BASE = `http://127.0.0.1:${port}`;
  const env = { ...process.env, PORT: String(port), HOST: '127.0.0.1', NUXT_PUBLIC_SITE_URL: ORIGIN, NUXT_PUBLIC_PREVIEW: 'true' };
  // the local DATABASE_URL etc. (the sample majlis reads Postgres)
  for (const line of (fs.existsSync(path.join(ROOT, '.env')) ? fs.readFileSync(path.join(ROOT, '.env'), 'utf8') : '').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  child = spawn('node', ['.output/server/index.mjs'], { cwd: ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] });
  for (let i = 0; ; i++) {
    try { const r = await fetch(`${BASE}/robots.txt`); if (r.ok) break; } catch {}
    if (i > 60) { console.error('server did not start'); process.exit(2); }
    await new Promise((r) => setTimeout(r, 500));
  }
}
const stop = () => child?.kill();

// ---------- fetch helpers ----------
const cache = new Map();
async function get(p, o = {}) {
  const key = p + (o.ua ?? '');
  if (!o.fresh && cache.has(key)) return cache.get(key);
  const r = await fetch(BASE + p, { redirect: 'manual', headers: { 'user-agent': o.ua ?? 'indahnya-seo-gate', 'accept-encoding': 'identity', accept: 'text/html,application/xhtml+xml,*/*;q=0.8' } });
  const out = { status: r.status, location: r.headers.get('location'), headers: r.headers, body: await r.text() };
  cache.set(key, out);
  return out;
}

// ---------- sitemap and files ----------
const sitemap = new Map(); // path -> lastmod
const sm = await get('/sitemap.xml');
if (sm.status !== 200) fail('/sitemap.xml', 'S-sitemap', `status ${sm.status}`);
if (/<priority>|<changefreq>/.test(sm.body)) fail('/sitemap.xml', 'S-sitemap', 'priority/changefreq present');
for (const m of sm.body.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = m[1].match(/<loc>([^<]+)<\/loc>/)?.[1].trim() ?? '';
  const lm = m[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null;
  if (!(loc + '/').startsWith(ORIGIN + '/')) { fail(loc, 'S-sitemap', 'loc not on https://indahnya.my'); continue; }
  const p = new URL(loc).pathname.replace(/\/$/, '') || '/';
  if (sitemap.has(p)) fail(p, 'S-sitemap', 'listed twice');
  sitemap.set(p, lm);
  if (!lm) fail(p, 'S-sitemap', 'no lastmod');
}
for (const sp of SITE_PAGES) if (!sitemap.has(sp.path)) fail(sp.path, 'S-sitemap', 'in site-pages.ts but not in the sitemap');

const robots = await get('/robots.txt');
if (robots.status !== 200) fail('/robots.txt', 'S-robots', `status ${robots.status}`);
if (/^\s*Disallow:\s*\/\s*$/m.test(robots.body)) fail('/robots.txt', 'S-robots', 'Disallow: /');
if (!/^Allow:\s*\/\s*$/m.test(robots.body)) fail('/robots.txt', 'S-robots', 'no "Allow: /"');
if (!new RegExp(`Sitemap:\\s*${ORIGIN}/sitemap.xml`).test(robots.body)) fail('/robots.txt', 'S-robots', 'no absolute Sitemap line');
if ((await get('/favicon.ico')).status !== 200) fail('/favicon.ico', 'S-files', 'missing');
const nf = await get('/tiada-halaman-ni-xyz');
if (nf.status !== 404) fail('/tiada-halaman-ni-xyz', 'S-404', `status ${nf.status}, want 404`);
if (!/noindex/i.test(cheerio.load(nf.body)('meta[name="robots"]').attr('content') ?? '')) fail('/tiada-halaman-ni-xyz', 'S-404', '404 page is not noindex');

// redirects: one 301 to the clean URL
const REDIRECTS = [
  ['/harga/', '/harga'], ['/HARGA', '/harga'], ['/Tentang', '/tentang'], ['/?lang=en', '/en'], ['/harga?lang=en', '/en/pricing'],
  ['/harga?lang=en&utm_source=x', '/en/pricing?utm_source=x'], ['/tentang/?lang=en', '/en/about'], ['/en/pricing/', '/en/pricing'],
  ['/privasi?lang=en', '/en/privacy'], ['/e-kad/', '/e-kad'],
];
for (const [from, to] of REDIRECTS) {
  const r = await get(from);
  const loc = r.location ? new URL(r.location, BASE).pathname + new URL(r.location, BASE).search : null;
  if (r.status !== 301 || loc !== to) fail(from, 'S-redirect', `${r.status} → ${loc ?? '-'}, want 301 → ${to}`);
  else if ((await get(to)).status !== 200) fail(from, 'S-redirect', `${to} is not 200 (two hops)`);
}

// ---------- per-page ----------
const BANNED = [
  // EN (messaging.md §6)
  'seamless', 'effortless', 'powerful', 'revolutionary', 'best-in-class', 'world-class', 'guaranteed', 'free forever', 'unlimited free', 'cheapest', 'trusted by', 'thousands of', '#1', 'number one', 'the only',
  // BM
  'terbaik', 'paling murah', 'termurah', 'satu-satunya', 'nombor 1', 'pertama di malaysia', 'percuma selamanya', 'dipercayai oleh', 'ribuan majlis', 'dijamin', 'selamat 100%', 'canggih', 'hebat',
];
const LEGAL = new Set(['/privasi', '/terma', '/bayaran-balik', '/penghantaran', '/en/privacy', '/en/terms', '/en/refunds', '/en/delivery']);
const LEFTOVER = [/\{\{/, /\bTODO\b/, /\blorem\b/i, /\[OWNER/, /\bundefined\b/, /\bNaN\b/, /\[object Object\]/, /\bTBD\b/];
const PRICE_OK = new Set(['RM0', 'RM59', 'RM99', 'RM40']);
const pages = new Map();
const titles = new Map(), descs = new Map(), canons = new Map();
const linkChecks = [];
const hreflangSets = new Map();

for (const p of sitemap.keys()) {
  const r = await get(p);
  if (r.status !== 200) { fail(p, 'S-status', `status ${r.status}`); continue; }
  const html = r.body;
  const $ = cheerio.load(html);
  const robotsMeta = ($('meta[name="robots"]').attr('content') ?? '') + ' ' + (r.headers.get('x-robots-tag') ?? '');
  const noindex = /noindex/i.test(robotsMeta);
  pages.set(p, { $, html, noindex });
  if (noindex) fail(p, 'S-index', 'sitemap page is noindex');
  const want = p === '/' ? `${ORIGIN}/` : ORIGIN + p;

  // head
  const t = $('title'); const d = $('meta[name="description"]'); const c = $('link[rel="canonical"]');
  if (t.length !== 1) fail(p, 'S-title', `${t.length} <title>`);
  if (d.length !== 1) fail(p, 'S-desc', `${d.length} meta descriptions`);
  if (c.length !== 1) fail(p, 'S-canonical', `${c.length} canonicals`);
  const title = t.first().text().trim(); const desc = d.attr('content')?.trim() ?? ''; const canon = c.attr('href') ?? '';
  if (canon !== want) fail(p, 'S-canonical', `canonical ${canon} ≠ ${want}`);
  if (title.length > 60 || title.length < 25) fail(p, 'S-title', `title ${title.length} chars (25–60): "${title}"`);
  if (desc.length < 120 || desc.length > 160) fail(p, 'S-desc', `description ${desc.length} chars (120–160): "${desc}"`);
  titles.set(title, [...(titles.get(title) ?? []), p]); descs.set(desc, [...(descs.get(desc) ?? []), p]); canons.set(canon, [...(canons.get(canon) ?? []), p]);
  const en = langOfPath(p) === 'en';
  const lang = $('html').attr('lang');
  if (lang !== (en ? 'en-MY' : 'ms-MY')) fail(p, 'S-lang', `html lang="${lang}", want "${en ? 'en-MY' : 'ms-MY'}"`);
  if ($('meta[property="og:locale"]').attr('content') !== (en ? 'en_MY' : 'ms_MY')) fail(p, 'S-lang', 'og:locale does not match the page language');
  if (!$('meta[name="viewport"]').length) fail(p, 'S-head', 'no viewport');
  for (const k of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image']) if (!$(`meta[property="${k}"]`).attr('content')) fail(p, 'S-og', `${k} missing`);
  if ($('meta[property="og:url"]').attr('content') !== want) fail(p, 'S-og', 'og:url ≠ canonical');
  const ogi = $('meta[property="og:image"]').attr('content') ?? '';
  if (!ogi.startsWith(ORIGIN + '/') || (await get(new URL(ogi).pathname)).status !== 200) fail(p, 'S-og', `og:image ${ogi} not a real file on indahnya.my`);
  if (!$('meta[name="twitter:card"]').length) fail(p, 'S-og', 'twitter:card missing');

  // hreflang: mirrors carry the reciprocal set, one-language pages none
  const twin = pathIn(p, en ? 'ms' : 'en');
  const hl = $('link[rel="alternate"][hreflang]').map((_, el) => `${$(el).attr('hreflang')}=${$(el).attr('href')}`).get().sort();
  if (twin) {
    const bm = en ? twin : p, enp = en ? p : twin;
    const abs = (x) => (x === '/' ? `${ORIGIN}/` : ORIGIN + x);
    const exp = [`en-MY=${abs(enp)}`, `ms-MY=${abs(bm)}`, `x-default=${abs(bm)}`].sort();
    if (hl.join() !== exp.join()) fail(p, 'S-hreflang', `hreflang ${hl.join(' ')} ≠ ${exp.join(' ')}`);
    if (!sitemap.has(twin)) fail(p, 'S-hreflang', `twin ${twin} not in the sitemap`);
  } else if (hl.length) fail(p, 'S-hreflang', 'hreflang on a page with no twin');
  hreflangSets.set(p, hl);

  // headings
  const h1 = $('h1');
  if (h1.length !== 1) fail(p, 'S-h1', `${h1.length} <h1>`);
  const h1t = h1.first().text().replace(/\s+/g, ' ').trim();
  if (!h1t) fail(p, 'S-h1', 'empty h1');
  if (/[a-z][.!?][A-Z]/.test(h1t)) fail(p, 'S-h1', `glued words in h1: "${h1t}"`);
  let prev = 1;
  $('main h1, main h2, main h3, main h4, main h5, main h6').each((_, el) => {
    const n = +el.tagName[1];
    if (!$(el).text().trim()) fail(p, 'S-headings', `empty <${el.tagName}>`);
    if (n > prev + 1) fail(p, 'S-headings', `<${el.tagName}> "${$(el).text().trim().slice(0, 50)}" skips a level after h${prev}`);
    prev = n;
  });

  // JSON-LD
  const nodes = [];
  const walkLd = (o) => { if (Array.isArray(o)) o.forEach(walkLd); else if (o && typeof o === 'object') { nodes.push(o); Object.values(o).forEach(walkLd); } };
  $('script[type="application/ld+json"]').each((_, el) => { try { walkLd(JSON.parse($(el).text())); } catch { fail(p, 'S-ld', 'JSON-LD does not parse'); } });
  const types = nodes.flatMap((n) => [].concat(n['@type'] ?? []));
  for (const bad of ['FAQPage', 'AggregateRating', 'Review', 'QAPage', 'HowTo']) if (types.includes(bad)) fail(p, 'S-ld', `${bad} markup`);
  if (nodes.some((n) => n.aggregateRating || n.review)) fail(p, 'S-ld', 'aggregateRating/review property');
  const bodyText = $('body').clone().find('script,style,noscript').remove().end().text().replace(/\s+/g, ' ');
  for (const n of nodes) {
    for (const k of ['url', 'item']) {
      const v = typeof n[k] === 'string' ? n[k] : null;
      if (v && v.startsWith(ORIGIN)) { const tp = new URL(v).pathname.replace(/\/$/, '') || '/'; if (!sitemap.has(tp) && (await get(tp)).status !== 200) fail(p, 'S-ld', `${k} ${v} does not resolve`); }
    }
    if (n['@type'] === 'Offer' && n.price != null && +n.price > 0 && !bodyText.includes(String(n.price).replace(/\.0+$/, ''))) fail(p, 'S-ld', `Offer price ${n.price} not visible on the page`);
    if (n.dateModified) {
      const iso = n.dateModified.slice(0, 10); const [y, mo, da] = iso.split('-').map(Number);
      const msM = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'][mo - 1];
      const enM = new Date(Date.UTC(y, mo - 1, da)).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
      if (![`${da} ${msM} ${y}`, `${da} ${enM} ${y}`, iso].some((v) => bodyText.includes(v))) fail(p, 'S-ld', `dateModified ${iso} not shown on the page`);
      if (sitemap.get(p) && sitemap.get(p) !== iso) fail(p, 'S-ld', `dateModified ${iso} ≠ sitemap lastmod ${sitemap.get(p)}`);
    }
  }
  const bc = nodes.find((n) => n['@type'] === 'BreadcrumbList');
  if (p !== '/' && p !== '/en') {
    if (!bc) fail(p, 'S-ld', 'no BreadcrumbList');
    else { const last = [].concat(bc.itemListElement ?? []).at(-1); const li = typeof last?.item === 'string' ? last.item : last?.item?.['@id']; if (li !== want) fail(p, 'S-ld', `breadcrumb last item ${li} ≠ canonical`); }
  }

  // body text
  const main = $('main').clone().find('script,style,noscript').remove().end();
  const prose = main.clone().find('table').remove().end().text().replace(/\s+/g, ' ');
  const tableText = main.find('table').text().replace(/\s+/g, ' ');
  for (const re of LEFTOVER) if (re.test(prose)) fail(p, 'S-leftover', `text matches ${re}`);
  if (!LEGAL.has(p) && /—/.test(main.text())) { const i = main.text().indexOf('—'); fail(p, 'S-emdash', `em dash: …${main.text().slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ')}…`); }
  const lower = ' ' + prose.toLowerCase() + ' ';
  for (const w of BANNED) {
    const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\#%]/g, '\\$&')}([^a-z]|$)`);
    if (re.test(lower)) {
      const i = lower.search(re); const ctx = prose.slice(Math.max(0, i - 40), i + w.length + 40).trim();
      const negated = /\b(not|never|no|bukan|tak|tidak|jangan)\s+$/.test(lower.slice(Math.max(0, i - 10), i + 1));
      (LEGAL.has(p) || negated ? warn : fail)(p, 'S-words', `banned "${w}": …${ctx}…`);
    }
  }
  // Indahnya prices outside rival tables must be the real ones (truth file)
  for (const m of prose.matchAll(/RM\s?(\d+(?:[.,]\d+)?)/g)) {
    const v = `RM${m[1]}`;
    if (!PRICE_OK.has(v)) warn(p, 'S-truth', `price ${v} in prose: a rival's (dated, sourced) or a mistake? …${prose.slice(Math.max(0, m.index - 50), m.index + 30).trim()}…`);
  }
  if (tableText && /RM\s?\d/.test(tableText) && !/Disemak|Checked/i.test(bodyText) && !['/harga', '/en/pricing', '/', '/en'].includes(p)) fail(p, 'S-truth', 'a table with prices but no "Disemak/Checked <date>" on the page');
  const words = prose.split(' ').filter(Boolean).length;
  if (words < 300 && !LEGAL.has(p)) warn(p, 'S-thin', `${words} words in <main>`);
  if (html.length > 1024 * 1024) fail(p, 'S-size', `${Math.round(html.length / 1024)} KB HTML`);
  else if (html.length > 400 * 1024) warn(p, 'S-size', `${Math.round(html.length / 1024)} KB HTML`);

  // anchors and images
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href'); const txt = $(el).text().replace(/\s+/g, ' ').trim();
    if (/^galeri gambar majlis dengan qr$/i.test(txt)) { const u = new URL(href, want); if (u.origin !== ORIGIN || u.pathname !== '/') fail(p, 'S-anchor', `"${txt}" links to ${href}, must only link to /`); }
    if (!txt && !$(el).attr('aria-label') && !$(el).find('img[alt]').filter((_, i) => $(i).attr('alt')).length && !$(el).find('[aria-label]').length) fail(p, 'S-anchor', `link to ${href} has no text`);
    if (/^(click here|here|read more|learn more|more|klik sini|sini|baca lagi)$/i.test(txt)) fail(p, 'S-anchor', `non-descriptive anchor "${txt}" → ${href}`);
    linkChecks.push([p, href, 'a']);
  });
  $('img').each((_, el) => {
    const s = $(el).attr('src');
    if ($(el).attr('alt') === undefined) fail(p, 'S-img', `img ${s} has no alt`);
    if (!$(el).attr('width') || !$(el).attr('height')) fail(p, 'S-img', `img ${s} has no width/height`);
    if (s && !s.startsWith('data:')) linkChecks.push([p, s, 'src']);
  });
}
for (const [m, k] of [[titles, 'title'], [descs, 'description'], [canons, 'canonical']]) for (const [v, ps] of m) if (ps.length > 1) fail(ps.join(', '), 'S-unique', `duplicate ${k}: "${v}"`);

// internal links
const seen = new Set();
for (const [from, href, kind] of linkChecks) {
  if (!href || /^(mailto:|tel:|javascript:|data:|#$)/.test(href)) continue;
  let u; try { u = new URL(href, ORIGIN + (from === '/' ? '/' : from)); } catch { fail(from, 'S-links', `bad URL ${href}`); continue; }
  if (u.origin !== ORIGIN && !u.origin.startsWith('http://127.0.0.1')) continue;
  const key = from + ' ' + href; if (seen.has(key)) continue; seen.add(key);
  const p = u.pathname;
  if (kind === 'a') {
    if (p !== '/' && p.endsWith('/')) fail(from, 'S-links', `${href}: trailing slash`);
    if (/[A-Z]/.test(p)) fail(from, 'S-links', `${href}: capitals`);
    if (u.searchParams.has('lang')) fail(from, 'S-links', `${href}: ?lang= link (use the /en path)`);
  }
  if (/^\/(app|masuk|api|tv|_e)(\/|$)/.test(p)) continue; // app routes, closed in pre-launch
  const r = await get(p + u.search);
  if (r.status >= 400) { fail(from, 'S-links', `${href} → ${r.status}`); continue; }
  if (r.status >= 300 && kind === 'a') fail(from, 'S-links', `${href} → ${r.status} redirect (link the clean URL)`);
  const tp = p.replace(/\/$/, '') || '/';
  if (kind === 'a' && u.hash && pages.get(tp)) { const id = decodeURIComponent(u.hash.slice(1)); if (id && !pages.get(tp).$(`[id="${id}"]`).length) fail(from, 'S-links', `${href}: #${id} missing on target`); }
}

// orphans
const inbound = new Map([...sitemap.keys()].map((k) => [k, 0]));
for (const [from, href, kind] of linkChecks) { if (kind !== 'a') continue; try { const u = new URL(href, ORIGIN + from); const tp = u.pathname.replace(/\/$/, '') || '/'; if (tp !== from && inbound.has(tp)) inbound.set(tp, inbound.get(tp) + 1); } catch {} }
for (const [p, n] of inbound) if (n === 0 && p !== '/') fail(p, 'S-orphan', 'no internal link from any other page');

// ---------- Lighthouse ----------
const lh = [];
if (!flag('--no-lh')) {
  // https://indahnya.my → the local server, compressed and cached the way Cloudflare + nginx serve it
  const proxy = (req, res) => {
    const up = http.request(BASE + req.url, { method: req.method, headers: { ...req.headers, host: 'indahnya.my', 'accept-encoding': 'identity', 'x-forwarded-proto': 'https' } }, (ur) => {
      const h = { ...ur.headers }; delete h['content-length']; delete h['transfer-encoding'];
      if (/^\/_nuxt\//.test(req.url)) h['cache-control'] = 'public, max-age=31536000, immutable';
      const type = h['content-type'] ?? '';
      const chunks = []; ur.on('data', (c) => chunks.push(c)); ur.on('end', () => {
        let body = Buffer.concat(chunks);
        if (/text|json|xml|svg|javascript/.test(type) && /gzip/.test(req.headers['accept-encoding'] ?? '')) { body = zlib.gzipSync(body); h['content-encoding'] = 'gzip'; }
        h['content-length'] = body.length; res.writeHead(ur.statusCode, h); res.end(body);
      });
    });
    up.on('error', () => { res.writeHead(502); res.end(); });
    req.pipe(up);
  };
  const key = path.join(HERE, 'key.pem'), cert = path.join(HERE, 'cert.pem'), spkiFile = path.join(HERE, 'spki.txt');
  if (!fs.existsSync(spkiFile)) {
    execSync(`openssl req -x509 -newkey rsa:2048 -nodes -days 30 -subj /CN=indahnya.my -addext subjectAltName=DNS:indahnya.my -keyout ${key} -out ${cert}`, { stdio: 'ignore' });
    fs.writeFileSync(spkiFile, execSync(`openssl x509 -in ${cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim());
  }
  const server = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, proxy);
  const plain = http.createServer((req, res) => { res.writeHead(301, { location: 'https://indahnya.my' + req.url }); res.end(); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  await new Promise((r) => plain.listen(0, '127.0.0.1', r));
  const spki = fs.readFileSync(spkiFile, 'utf8').trim();
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', `--host-resolver-rules=MAP indahnya.my:443 127.0.0.1:${server.address().port}, MAP indahnya.my:80 127.0.0.1:${plain.address().port}`, `--ignore-certificate-errors-spki-list=${spki}`, '--no-first-run'] });
  const desktop = (await import('lighthouse/core/config/desktop-config.js')).default;
  const run = (url, ff) => lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, ff === 'desktop' ? desktop : undefined);
  for (const p of [...sitemap.keys()].filter((x) => !only || only.includes(x))) {
    for (const ff of ['mobile', 'desktop']) {
      const url = `https://indahnya.my${p}`;
      let r;
      try { r = await run(url, ff); } catch (e) { fail(p, 'L-run', `${ff}: lighthouse error ${e.message}`); continue; }
      if (r.lhr.categories.performance.score < 1) {
        const runs = [r];
        for (let i = 0; i < 2; i++) { try { runs.push(await run(url, ff)); } catch {} }
        runs.sort((a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score);
        r = runs[Math.floor(runs.length / 2)];
      }
      const row = { p, ff };
      for (const [k, v] of Object.entries(r.lhr.categories)) {
        row[k] = Math.round(v.score * 100);
        if (v.score < 1) {
          const bad = v.auditRefs.filter((a) => a.weight > 0 && r.lhr.audits[a.id].score !== null && r.lhr.audits[a.id].score < 1).map((a) => `${a.id}${r.lhr.audits[a.id].displayValue ? ' (' + r.lhr.audits[a.id].displayValue + ')' : ''}`);
          fail(p, `L-${k}`, `${ff} ${row[k]}: ${bad.join('; ')}`);
        }
      }
      row.lcp = r.lhr.audits['largest-contentful-paint']?.displayValue; row.cls = r.lhr.audits['cumulative-layout-shift']?.displayValue; row.tbt = r.lhr.audits['total-blocking-time']?.displayValue;
      if (r.lhr.runtimeError) fail(p, 'L-run', `${ff}: ${r.lhr.runtimeError.code}`);
      lh.push(row);
      console.error(`${ff.padEnd(7)} ${p.padEnd(46)} P${row.performance} A${row.accessibility} BP${row['best-practices']} SEO${row.seo}  LCP ${row.lcp}`);
    }
  }
  await chrome.kill(); server.close(); plain.close();
}
stop();

// ---------- report ----------
const rep = path.join(HERE, 'report');
const md = [`# Indahnya SEO acceptance: ${new Date().toISOString()}`, '', `Sitemap URLs: ${sitemap.size}. Lighthouse runs: ${lh.length}.`, '', `**${fails.length} failures, ${warns.length} warnings.** Pass = 0 failures.`, '', '## Failures', '', ...fails.map((f) => `- \`${f.rule}\` ${f.where}: ${f.what}`), '', '## Warnings', '', ...warns.map((f) => `- \`${f.rule}\` ${f.where}: ${f.what}`), '', '## Lighthouse', '', '| Page | Form | Perf | A11y | BP | SEO | LCP | CLS | TBT |', '|---|---|---|---|---|---|---|---|---|', ...lh.map((r) => `| ${r.p} | ${r.ff} | ${r.performance} | ${r.accessibility} | ${r['best-practices']} | ${r.seo} | ${r.lcp} | ${r.cls} | ${r.tbt} |`)].join('\n');
fs.writeFileSync(rep + '.md', md);
fs.writeFileSync(rep + '.json', JSON.stringify({ fails, warns, lh }, null, 1));
console.log(`${fails.length} failures, ${warns.length} warnings → ${rep}.md`);
process.exit(fails.length ? 1 : 0);
