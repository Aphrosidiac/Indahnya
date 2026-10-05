import { eq } from 'drizzle-orm';
import type { H3Event } from 'h3';
import { useDb, events, slugHistory } from '../db';

/** A slug to its event, live or not: the current slug first, then any slug the event gave up (old QR codes keep working). */
export async function eventRowBySlug(slug: string) {
  const db = useDb();
  const [ev] = await db.select().from(events).where(eq(events.slug, slug));
  if (ev) return ev;
  const [old] = await db.select({ ev: events }).from(slugHistory).innerJoin(events, eq(events.id, slugHistory.eventId)).where(eq(slugHistory.slug, slug));
  return old?.ev;
}

/**
 * Resolve a public slug to a live event, or 404. Purged and deleted events are gone to guests.
 * The landing's sandbox is invisible to every route that does not opt in with `{ sandbox: true }`
 * (upload, status, own feed, name): it has no kad, no gallery page, no TV, no RSVP.
 */
export async function eventBySlug(event: H3Event, opts: { sandbox?: boolean } = {}) {
  const slug = getRouterParam(event, 'slug')!.toLowerCase();
  const ev = await eventRowBySlug(slug);
  if (!ev || ev.purgedAt || ev.deletedAt || (ev.settings.sandbox && !opts.sandbox)) throw createError({ statusCode: 404, statusMessage: 'Majlis tak jumpa' });
  return ev;
}
