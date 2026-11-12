// IndexNow: tell Bing, Yandex, Seznam and Naver (and through them Copilot and ChatGPT search) which pages changed.
// Run after a deploy that adds or changes public pages (docs/seo/LAUNCH.md).
//
//   node scripts/indexnow.mjs                  every URL in the live sitemap
//   node scripts/indexnow.mjs /harga /e-kad    just these paths
//   node scripts/indexnow.mjs --dry-run        print what would be sent
//
// The key is public by design: public/<32 hex>.txt holds it and is served at https://indahnya.my/<key>.txt, which is
// how the engines check that the submitter owns the host. Google does not use IndexNow (Search Console does that).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://indahnya.my';
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const file = fs.readdirSync(path.join(ROOT, 'public')).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!file) { console.error('no IndexNow key in public/'); process.exit(1); }
const key = file.slice(0, -4);

const live = await fetch(`${SITE}/${file}`);
if (!live.ok || (await live.text()).trim() !== key) { console.error(`${SITE}/${file} does not serve the key: deploy first`); process.exit(1); }

let urls = args.filter((a) => a.startsWith('/')).map((p) => SITE + (p === '/' ? '/' : p));
if (!urls.length) {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const body = { host: 'indahnya.my', key, keyLocation: `${SITE}/${file}`, urlList: urls };
console.log(`${urls.length} URLs${dry ? ' (dry run)' : ''}`);
if (dry) { console.log(urls.join('\n')); process.exit(0); }
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
// 200 = accepted, 202 = accepted, key check pending; 403 = key not found/valid; 422 = URLs not on this host; 429 = too often
console.log(`IndexNow: ${r.status} ${r.statusText}`, (await r.text()).slice(0, 300));
process.exit(r.status === 200 || r.status === 202 ? 0 : 1);
