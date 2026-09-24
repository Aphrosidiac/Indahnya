import { and, eq } from 'drizzle-orm';
import { useDb, media, guests } from '../../../../../db';
import { eventBySlug } from '../../../../../utils/public';
import { presignGet } from '../../../../../utils/storage';
import { downloadName, extOf } from '../../../../../utils/media';

/**
 * A guest's "Download" as a real attachment. `<a download>` is ignored
 * cross-origin, so without this a phone just opens the photo in a tab.
 * Guests get the served copy (EXIF-stripped), never the original.
 */
export default defineEventHandler(async (event) => {
  const ev = await eventBySlug(event);
  const [row] = await useDb().select({ m: media, guestName: guests.name }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(and(eq(media.id, getRouterParam(event, 'id')!), eq(media.eventId, ev.id), eq(media.status, 'ready')));
  if (!row?.m.key) throw createError({ statusCode: 404 });
  return sendRedirect(event, await presignGet(row.m.key, 'public', { seconds: 300, filename: downloadName(row.m, extOf(row.m.key), row.guestName) }));
});
