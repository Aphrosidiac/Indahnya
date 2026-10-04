// The landing's sample photos: real Malaysian majlis by Malaysian photographers,
// all under the free Unsplash licence (no Unsplash+), listed with credits in
// scripts/landing-photos.json. Fetches each original once (cached outside the
// repo) and writes three cuts:
//   public/landing/<id>.jpg      1600px long edge, for the seed, the OG card, the kad cover
//   public/landing/l/<id>.webp   1600px long edge, for the big frames (TV, laptop)
//   public/landing/s/<id>.webp   560px wide, for tiles, polaroids and avatars (the hero preloads all of them)
// and prints the aspect map for PHOTOS in app/composables/useLanding.ts.
//   node scripts/build-photos.mjs
import sharp from 'sharp';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';

const list = JSON.parse(readFileSync('scripts/landing-photos.json', 'utf8'));
const cache = 'node_modules/.cache/landing-photos';
for (const d of [cache, 'public/landing/l', 'public/landing/s']) mkdirSync(d, { recursive: true });

const meta = {};
for (const p of list) {
  const src = `${cache}/${p.unsplash}.jpg`;
  if (!existsSync(src)) {
    const r = await fetch(`https://unsplash.com/photos/${p.unsplash}/download?force=true&w=2400`);
    if (!r.ok) throw new Error(`${p.id}: ${r.status}`);
    writeFileSync(src, Buffer.from(await r.arrayBuffer()));
  }
  const img = () => sharp(src).rotate();
  const big = { width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true };
  await img().resize(big).jpeg({ quality: 80, mozjpeg: true }).toFile(`public/landing/${p.id}.jpg`);
  await img().resize(big).webp({ quality: 76 }).toFile(`public/landing/l/${p.id}.webp`);
  await img().resize({ width: 560 }).webp({ quality: 70 }).toFile(`public/landing/s/${p.id}.webp`);
  const { width, height } = await sharp(`public/landing/${p.id}.jpg`).metadata();
  // a photo kept for one frame (`only`) stays off the hero's wall
  if (!p.only) meta[p.id] = [900, Math.round((900 * height) / width)];
}
// drop cuts of photos no longer in the list
const ids = new Set(list.map(p => p.id));
for (const [dir, ext] of [['public/landing', '.jpg'], ['public/landing/l', '.webp'], ['public/landing/s', '.webp']]) {
  for (const f of readdirSync(dir).filter(f => f.endsWith(ext))) if (!ids.has(f.replace(ext, ''))) rmSync(`${dir}/${f}`);
}
writeFileSync('public/landing/meta.json', JSON.stringify(meta));
console.log(`export const PHOTOS: Record<string, [number, number]> = { ${Object.entries(meta).map(([k, v]) => `${k}: [${v[0]}, ${v[1]}]`).join(', ')} };`);
