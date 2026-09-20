import { and, desc, eq, gt } from 'drizzle-orm';
import { useDb, events, media, guests } from '../../db';
import { publicUrl } from '../../utils/storage';

/**
 * The slideshow feed. Bearer is the event's tvToken (in the URL the host
 * copies to the venue laptop). `since` returns only what landed after that
 * id, so the screen polls cheaply every few seconds and new photos join the
 * rotation as they arrive.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!.toLowerCase();
  const q = getQuery(event);
  const [ev] = await useDb().select().from(events).where(eq(events.slug, slug));
  if (!ev || ev.purgedAt || !q.token || q.token !== ev.tvToken) throw createError({ statusCode: 404 });
  const where = [eq(media.eventId, ev.id), eq(media.status, 'ready')];
  if (typeof q.since === 'string' && q.since) where.push(gt(media.id, q.since));
  const rows = await useDb().select({ m: media, guestName: guests.name }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(and(...where)).orderBy(desc(media.id)).limit(500);
  return {
    event: { title: ev.title, names: ev.names, type: ev.type, slug: ev.slug, settings: ev.settings.slideshow },
    items: rows.map(({ m, guestName }) => ({
      id: m.id, kind: m.kind, width: m.width, height: m.height, guestName,
      url: publicUrl(m.key!), poster: m.posterKey ? publicUrl(m.posterKey) : null,
    })),
  };
});
