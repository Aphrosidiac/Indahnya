/**
 * The landing's sample gallery at /aina-hakim ("Tengok galeri contoh", and
 * the QR on the print mock-ups). A real event, owned by demo@indahnya.my,
 * flagged `demo` so it never accepts uploads, never gets retention mail and
 * never expires. The photos are the landing's Unsplash-licensed frames,
 * processed the way the worker processes a guest's upload.
 *
 * Idempotent: re-running replaces the demo's media. It refuses to touch a
 * slug that belongs to anyone else.
 *
 *   node --env-file=.env --import tsx scripts/seed-demo.ts
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { ulid } from 'ulid';
import { eq, inArray } from 'drizzle-orm';
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { useDb, users, events, eventMembers, guests, media, reactions, kad } from '../server/db';

const SLUG = 'aina-hakim';
const EMAIL = 'demo@indahnya.my';
const env = process.env;
/** NUXT_S3_* (the app's names) or the bare S3_* ones. */
const v = (k: string) => env[`NUXT_${k}`] ?? env[k];
const s3 = new S3Client({
  region: v('S3_REGION') || 'auto', endpoint: v('S3_ENDPOINT'), forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: { accessKeyId: v('S3_ACCESS_KEY_ID')!, secretAccessKey: v('S3_SECRET_ACCESS_KEY')! },
});
const PUBLIC = v('S3_BUCKET') || 'indahnya-media';
const PRIVATE = v('S3_PRIVATE_BUCKET') || 'indahnya-private';
const put = (Bucket: string, Key: string, Body: Buffer, ContentType: string) =>
  s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType, CacheControl: 'public, max-age=31536000, immutable' }));

async function wipe(Bucket: string, Prefix: string) {
  const r = await s3.send(new ListObjectsV2Command({ Bucket, Prefix }));
  const keys = (r.Contents ?? []).map(o => ({ Key: o.Key! }));
  if (keys.length) await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: keys, Quiet: true } }));
}

const PHOTOS = ['g08', 'g04', 'g18', 'g11', 'g21', 'g15', 'g09', 'g20', 'g13', 'g01', 'g02', 'g17', 'g03', 'g14', 'g22', 'g10', 'g07'];
const NAMES = ['Makcik Ros', 'Aiman', 'Team Office', 'Kak Yati', 'Pak Long', 'Nadia & Irfan', 'Abang Faiz', 'Cousins', 'Uncle Lim', 'Syafiq', 'Auntie Mei', 'Hana'];

const db = useDb();
let [owner] = await db.select().from(users).where(eq(users.email, EMAIL));
owner ??= (await db.insert(users).values({ id: ulid(), email: EMAIL, name: 'Indahnya Demo' }).returning())[0]!;

let [ev] = await db.select().from(events).where(eq(events.slug, SLUG));
if (ev && ev.ownerId !== owner.id) {
  console.error(`/${SLUG} belongs to another user (${ev.ownerId}). Rename that event's slug first.`);
  process.exit(1);
}
const majlis = new Date('2026-08-15T00:00:00.000Z');
const forever = new Date('2099-12-31T00:00:00.000Z');
const settings = {
  locale: 'ms' as const, approvalMode: false, demo: true, guestDeleteHours: 0,
  modules: { gambar: true, ucapan: true, rsvp: true, tempat: false, kad: true },
  slideshow: { intervalSec: 6, showNames: true, shuffle: false },
};
const fields = {
  slug: SLUG, type: 'kahwin' as const, title: 'Aina & Hakim', names: { a: 'Aina', b: 'Hakim' }, date: majlis,
  venue: { name: 'Dewan Seri Melati, Shah Alam', address: 'Persiaran Perbandaran, Seksyen 14, 40000 Shah Alam, Selangor' },
  plan: 'std' as const, uploadWindowEndsAt: majlis, storageEndsAt: forever, settings,
};
if (!ev) {
  ev = (await db.insert(events).values({ id: ulid(), ownerId: owner.id, tvToken: randomBytes(24).toString('base64url'), ...fields }).returning())[0]!;
  await db.insert(eventMembers).values({ eventId: ev.id, userId: owner.id, role: 'owner' });
  await db.insert(kad).values({ eventId: ev.id });
} else {
  await db.update(events).set({ ...fields, purgedAt: null, deletedAt: null }).where(eq(events.id, ev.id));
}

// start over: the demo's rows and bytes
const prefix = `events/${ev.id.toLowerCase()}/`;
const old = await db.select({ id: media.id }).from(media).where(eq(media.eventId, ev.id));
if (old.length) await db.delete(reactions).where(inArray(reactions.mediaId, old.map(o => o.id)));
await db.delete(media).where(eq(media.eventId, ev.id));
await db.delete(guests).where(eq(guests.eventId, ev.id));
await Promise.all([wipe(PUBLIC, prefix), wipe(PRIVATE, prefix)]);

const guestIds: string[] = [];
for (const name of NAMES) {
  const [g] = await db.insert(guests).values({ id: ulid(), eventId: ev.id, name, token: randomBytes(24).toString('base64url') }).returning();
  guestIds.push(g!.id);
}

// oldest first, so ULIDs (the feed's order) match the story of the day
const start = majlis.getTime() + 3 * 3_600_000; // 11:00 MYT
for (const [i, id] of [...PHOTOS].reverse().entries()) {
  const src = readFileSync(`public/landing/${id}.jpg`);
  const mid = ulid(start + i * 7 * 60_000);
  const base = `${prefix}${mid.toLowerCase()}`;
  const img = sharp(src).rotate();
  const [full, thumb] = await Promise.all([
    img.clone().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86, mozjpeg: true }).toBuffer({ resolveWithObject: true }),
    img.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
  ]);
  await Promise.all([
    put(PRIVATE, `${prefix}orig/${mid.toLowerCase()}.jpg`, src, 'image/jpeg'),
    put(PUBLIC, `${base}.jpg`, full.data, 'image/jpeg'),
    put(PUBLIC, `${base}.t.webp`, thumb, 'image/webp'),
  ]);
  const at = new Date(start + i * 7 * 60_000);
  const guestId = guestIds[i % guestIds.length]!;
  await db.insert(media).values({
    id: mid, eventId: ev.id, guestId, kind: 'photo', status: 'ready',
    originalKey: `${prefix}orig/${mid.toLowerCase()}.jpg`, key: `${base}.jpg`, thumbKey: `${base}.t.webp`,
    mime: 'image/jpeg', bytes: src.length, width: full.info.width, height: full.info.height,
    takenAt: at, createdAt: at, readyAt: at,
  });
  const fans = guestIds.filter((_, k) => (k * 7 + i * 3) % 5 === 0 && guestIds[k] !== guestId);
  if (fans.length) await db.insert(reactions).values(fans.map((g, k) => ({ mediaId: mid, guestId: g, kind: (['love', 'party', 'cry'] as const)[(i + k) % 3] })));
}

console.log(`demo ready: /${SLUG} (${PHOTOS.length} photos, event ${ev.id})`);
process.exit(0);
