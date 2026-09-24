// Regenerates the static brand assets from the Logo mark and the landing
// photos: favicons, the 1200x630 social card, and small WebP copies of the
// landing photos for the tiles and the film strip. Run after changing either.
//   node scripts/build-assets.mjs
import sharp from 'sharp';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';

const MARK = (s) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#7dd56f"/><g fill="#1a1a1a"><circle cx="16" cy="9.5" r="4.2"/><circle cx="16" cy="22.5" r="4.2"/><circle cx="9.5" cy="16" r="4.2"/><circle cx="22.5" cy="16" r="4.2"/></g><circle cx="16" cy="16" r="2.6" fill="#7dd56f"/></svg>`;

writeFileSync('public/favicon.svg', MARK(32));
await sharp(Buffer.from(MARK(180))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(MARK(192))).png().toFile('public/icon-192.png');
await sharp(Buffer.from(MARK(512))).png().toFile('public/icon-512.png');
// a 32px PNG inside an .ico container (PNG-in-ICO, every browser since IE11 reads it)
const png32 = await sharp(Buffer.from(MARK(32))).png().toBuffer();
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png32.length, 14); ico.writeUInt32LE(22, 18);
writeFileSync('public/favicon.ico', Buffer.concat([ico, png32]));

// the social card: a real majlis frame, the mark, one line in BM
const W = 1200, H = 630;
const photo = await sharp('public/landing/g08.jpg').resize(W, H, { fit: 'cover' }).modulate({ brightness: 0.62 }).toBuffer();
const text = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g transform="translate(72,72) scale(2.5)">${MARK(32).replace(/<\/?svg[^>]*>/g, '')}</g>
  <text x="170" y="122" font-family="Inter, Helvetica, Arial, sans-serif" font-size="46" font-weight="700" fill="#fff" letter-spacing="-1">Indahnya</text>
  <text x="72" y="470" font-family="Inter, Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#fff" letter-spacing="-2">Semua gambar majlis.</text>
  <text x="72" y="548" font-family="Inter, Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#fff" letter-spacing="-2">Satu QR.</text>
</svg>`;
await sharp(photo).composite([{ input: Buffer.from(text) }]).jpeg({ quality: 84, mozjpeg: true }).toFile('public/og.jpg');

mkdirSync('public/landing/s', { recursive: true });
for (const f of readdirSync('public/landing').filter(f => f.endsWith('.jpg'))) {
  await sharp(`public/landing/${f}`).resize({ width: 480 }).webp({ quality: 72 }).toFile(`public/landing/s/${f.replace('.jpg', '.webp')}`);
}
console.log('assets built');
