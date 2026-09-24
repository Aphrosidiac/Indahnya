import { and, eq, inArray } from 'drizzle-orm';
import { useDb, media } from '../../../../db';
import { eventBySlug } from '../../../../utils/public';
import { currentGuest } from '../../../../utils/guest';
import { mediaUrls } from '../../../../utils/media';

/** The uploader polls this until each of its ids is ready, hidden (awaiting the host) or failed. */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const me = await currentGuest(event, ev.id);
  const ids = String(getQuery(event).ids || '').split(',').filter(Boolean).slice(0, 60);
  if (!me || !ids.length) return { items: [] };
  const rows = await useDb().select().from(media).where(and(eq(media.eventId, ev.id), eq(media.guestId, me.id), inArray(media.id, ids)));
  return {
    items: await Promise.all(rows.map(async (m) => {
      const u = await mediaUrls(m);
      return { id: m.id, status: m.status, kind: m.kind, error: m.error, width: m.width, height: m.height, thumb: u.thumb, url: u.url };
    })),
  };
});
