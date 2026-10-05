import { randomBytes } from 'node:crypto';
import { and, eq, lt, inArray } from 'drizzle-orm';
import { useDb, users, events, eventMembers, guests, media, jobs } from '../db';
import { newId } from './ids';
import { defaultSettings } from './events';
import { delEverywhere, del } from './storage';

/**
 * The landing's "cuba sekarang": a visitor sends a real photo through the
 * real pipeline and watches it land on the landing's screen. It is one
 * hidden event (a slug `slugify` can never produce, so no majlis can take
 * it) that every public route refuses unless it opts in (see eventBySlug),
 * whose feed only ever shows a visitor their own photos, and which forgets
 * every photo and visitor after `ttlMs`.
 *
 * Desktop and phone are joined by the visitor's guest token: the landing
 * puts it in the QR, the phone adopts it, and both are the same guest.
 */
export const SANDBOX = { slug: '_cuba', perVisitor: 6, ttlMs: 60 * 60_000 } as const;
const OWNER = 'demo@indahnya.my';

let cached: typeof events.$inferSelect | null = null;
export async function sandboxEvent() {
  if (cached) return cached;
  const db = useDb();
  let [ev] = await db.select().from(events).where(eq(events.slug, SANDBOX.slug));
  if (!ev) {
    let [owner] = await db.select().from(users).where(eq(users.email, OWNER));
    owner ??= (await db.insert(users).values({ id: newId(), email: OWNER, name: 'Indahnya Demo' }).returning())[0]!;
    const forever = new Date('2099-12-31T00:00:00.000Z');
    const base = defaultSettings();
    [ev] = await db.insert(events).values({
      id: newId(), ownerId: owner.id, slug: SANDBOX.slug, type: 'kahwin', title: 'Cuba Indahnya', names: { a: 'Cuba' },
      date: null, venue: {}, plan: 'full', uploadWindowEndsAt: forever, storageEndsAt: forever, tvToken: randomBytes(24).toString('base64url'),
      settings: { ...base, sandbox: true, guestDeleteHours: 1, modules: { gambar: true, ucapan: false, rsvp: false, tempat: false, kad: false } },
    }).onConflictDoNothing().returning();
    if (!ev) [ev] = await db.select().from(events).where(eq(events.slug, SANDBOX.slug));
    else await db.insert(eventMembers).values({ eventId: ev.id, userId: owner.id, role: 'owner' }).onConflictDoNothing();
  }
  cached = ev!;
  return cached;
}

/** A sandbox visitor still inside its hour, by token. */
export async function sandboxGuest(token: string) {
  const ev = await sandboxEvent();
  const [g] = await useDb().select().from(guests).where(and(eq(guests.token, token), eq(guests.eventId, ev.id)));
  return g && Date.now() - g.createdAt.getTime() < SANDBOX.ttlMs ? g : null;
}

/** Every ten minutes: photos and visitors past their hour are gone, bytes first. */
export async function sweepSandbox() {
  const db = useDb();
  const [ev] = await db.select({ id: events.id }).from(events).where(eq(events.slug, SANDBOX.slug));
  if (!ev) return;
  const cut = new Date(Date.now() - SANDBOX.ttlMs);
  const old = await db.select().from(media).where(and(eq(media.eventId, ev.id), lt(media.createdAt, cut))).limit(500);
  if (old.length) {
    await delEverywhere(old.flatMap(m => [m.key, m.midKey, m.thumbKey, m.posterKey]).filter((k): k is string => !!k));
    await del(old.map(m => m.originalKey), 'private');
    await db.delete(jobs).where(inArray(jobs.ref, old.map(m => m.id)));
    await db.delete(media).where(inArray(media.id, old.map(m => m.id)));
  }
  // a visitor goes once none of their photos is left (a photo sent at minute 59 keeps its own hour)
  const stale = await db.select({ id: guests.id }).from(guests).where(and(eq(guests.eventId, ev.id), lt(guests.createdAt, cut))).limit(500);
  for (const g of stale) {
    const [left] = await db.select({ id: media.id }).from(media).where(eq(media.guestId, g.id)).limit(1);
    if (!left) await db.delete(guests).where(eq(guests.id, g.id));
  }
}
