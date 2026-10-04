// Regenerates the static brand assets from brand/ (built by
// scripts/build-brand.py) and the landing photos: favicons, app icons, the
// 1200x630 social card.
//   python3 scripts/build-brand.py && node scripts/build-assets.mjs
import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'node:fs';

const MARK = readFileSync('brand/indahnya-mark.svg', 'utf8').replace(/<\/?svg[^>]*>/g, '');
const markInk = MARK.replaceAll('#7dd56f', '#1a1a1a').replace(/(<circle cx="47" cy="47" r="3.1" fill=")#1a1a1a/, '$1#7dd56f');
// the tab and home-screen icon: the mark in ink on the brand green (a tab bar can be dark or light)
const tile = (s, r) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64"><rect width="64" height="64" rx="${r}" fill="#7dd56f"/><g transform="translate(9 9) scale(.72)">${markInk}</g></svg>`;

writeFileSync('public/favicon.svg', tile(32, 15));
// iOS and Android mask the corners themselves: full-bleed squares, a little more air for the mask
const bleed = s => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#7dd56f"/><g transform="translate(13 13) scale(.594)">${markInk}</g></svg>`;
await sharp(Buffer.from(bleed(180))).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(tile(192, 15))).png().toFile('public/icon-192.png');
await sharp(Buffer.from(tile(512, 15))).png().toFile('public/icon-512.png');
await sharp(Buffer.from(bleed(512))).png().toFile('public/icon-maskable-512.png');
// a 32px PNG inside an .ico container (PNG-in-ICO, every browser since IE11 reads it)
const png32 = await sharp(Buffer.from(tile(32, 15))).png().toBuffer();
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico.writeUInt8(32, 6); ico.writeUInt8(32, 7); ico.writeUInt8(0, 8); ico.writeUInt8(0, 9);
ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(png32.length, 14); ico.writeUInt32LE(22, 18);
writeFileSync('public/favicon.ico', Buffer.concat([ico, png32]));

// the social card: a real majlis frame, the lockup, the hero line; all text outlined (brand/og-overlay.svg)
const W = 1200, H = 630;
const photo = await sharp('public/landing/g08.jpg').resize(W, H, { fit: 'cover' }).modulate({ brightness: 0.6 }).toBuffer();
await sharp(photo).composite([{ input: readFileSync('brand/og-overlay.svg') }]).jpeg({ quality: 84, mozjpeg: true }).toFile('public/og.jpg');

// the landing photos themselves are built by scripts/build-photos.mjs
console.log('assets built');
