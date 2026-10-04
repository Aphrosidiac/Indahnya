#!/usr/bin/env node
/**
 * Snapshot the public site into a static folder for Cloudflare Pages.
 *
 *   node scripts/pages/snapshot.mjs <server-origin> <site-url> <out-dir>
 *
 * The server is a production build of this repo running with
 * NUXT_PUBLIC_PREVIEW=true and NUXT_PUBLIC_SITE_URL=<site-url> (deploy.sh
 * starts it). What it writes:
 *
 *   <out>/dist         .output/public + every page as HTML (BM at its path,
 *                      ?lang=en under __en/), the sample's media, robots, sitemap
 *   <out>/functions    the Pages Function (from scripts/pages/functions) and
 *                      _data.json: the sample event's API answers it replays
 *
 * Only the sample event (aina-hakim) is captured. Nothing private leaves:
 * the API answers are the same ones any guest's browser gets.
 */
import { mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const [origin, site, out] = process.argv.slice(2);
if (!origin || !site || !out) { console.error('usage: snapshot.mjs <server-origin> <site-url> <out-dir>'); process.exit(1); }
const here = dirname(fileURLToPath(import.meta.url));
const dist = join(out, 'dist');
const SLUG = 'aina-hakim';

const PAGES = ['/', '/tentang', '/privasi', '/terma', '/mula', '/contoh/kad', '/masuk', '/app',
  `/${SLUG}`, `/${SLUG}/gambar`, `/${SLUG}/ucapan`, `/${SLUG}/rsvp`, `/${SLUG}/tempat`];

const texts = [];
async function get(path, { ok = [200] } = {}) {
  const r = await fetch(origin + path, { redirect: 'manual', headers: { accept: path.startsWith('/api/') ? 'application/json' : 'text/html' } });
  if (!ok.includes(r.status)) throw new Error(`${path} → ${r.status}`);
  return r;
}
async function save(file, body) { await mkdir(dirname(file), { recursive: true }); await writeFile(file, body); }
const fileFor = (p) => (p === '/' ? 'index.html' : `${p.slice(1)}.html`);

// 1. the build's own static files
await cp('.output/public', dist, { recursive: true });

// 2. pages, both languages
for (const p of PAGES) {
  for (const en of [false, true]) {
    const html = await (await get(en ? `${p}${p.includes('?') ? '&' : '?'}lang=en` : p)).text();
    texts.push(html);
    await save(join(dist, en ? join('__en', fileFor(p)) : fileFor(p)), html);
  }
}
const nf = await (await get('/__not-a-page__', { ok: [404] })).text();
texts.push(nf);
await save(join(dist, '404.html'), nf);
for (const f of ['robots.txt', 'sitemap.xml']) await save(join(dist, f), await (await get(`/${f}`)).text());

// 3. the sample's API answers
async function json(path) { const t = await (await get(path)).text(); texts.push(t); return JSON.parse(t); }
async function all(path) {
  const items = []; let cursor = '';
  for (;;) {
    const r = await json(`${path}?limit=60${cursor ? `&cursor=${cursor}` : ''}`);
    items.push(...r.items);
    if (!r.next) return items;
    cursor = r.next;
  }
}
const base = `/api/g/${SLUG}`;
const ics = await (await get(`${base}/kad.ics`)).text();
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const { rows: seats } = await db.query(
  `select r.name, t.name as "table" from rsvps r join tables t on t.id = r.table_id join events e on e.id = r.event_id
   where e.slug = $1 and r.attending and r.table_id is not null order by r.name`, [SLUG]);
await db.end();
const data = {
  slug: SLUG,
  event: await json(base),
  kad: await json(`${base}/kad`),
  ics,
  rsvp: await json(`${base}/rsvp`),
  media: await all(`${base}/media`),
  ucapan: await all(`${base}/ucapan`),
  seats,
};
await mkdir(join(out, 'functions'), { recursive: true });
await cp(join(here, 'functions'), join(out, 'functions'), { recursive: true });
await writeFile(join(out, 'functions', '_data.json'), JSON.stringify(data));

// 4. every media file any of that points at, served as plain files
const mediaBase = `${site}/media/`;
const keys = new Set();
const re = new RegExp(`${mediaBase.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}([^"'\\s)\\\\?#]+)`, 'g');
for (const t of texts) for (const m of t.matchAll(re)) keys.add(m[1]);
// read from the PUBLIC bucket only (the production build has no /media route), with the app's own env
const s3 = new S3Client({
  endpoint: process.env.NUXT_S3_ENDPOINT, region: process.env.NUXT_S3_REGION || 'auto', forcePathStyle: true,
  credentials: { accessKeyId: process.env.NUXT_S3_ACCESS_KEY_ID, secretAccessKey: process.env.NUXT_S3_SECRET_ACCESS_KEY },
});
for (const k of keys) {
  const o = await s3.send(new GetObjectCommand({ Bucket: process.env.NUXT_S3_BUCKET, Key: decodeURIComponent(k) }));
  await save(join(dist, 'media', k), Buffer.from(await o.Body.transformToByteArray()));
}

// 5. headers: the app's baseline, and kept out of search while indahnya.my is not live
await save(join(dist, '_headers'), await readFile(join(here, '_headers')));
await save(join(dist, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: ['/_nuxt/*', '/media/*', '/landing/*', '/robots.txt', '/sitemap.xml', '/og.jpg', '/site.webmanifest', '/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png'] }));

// nothing pointing back at this machine
const leaks = texts.filter(t => /localhost|127\.0\.0\.1/.test(t)).length;
console.log(`pages ${PAGES.length * 2 + 1} · media ${keys.size} · photos ${data.media.length} · ucapan ${data.ucapan.length} · seats ${seats.length} · localhost refs ${leaks}`);
if (leaks) process.exit(2);
