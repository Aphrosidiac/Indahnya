import { and, eq } from 'drizzle-orm';
import { useDb, media, guests } from '../../../../../db';
import { requireEventAccess } from '../../../../../utils/session';
import { presignGet } from '../../../../../utils/storage';
import { downloadName, extOf } from '../../../../../utils/media';

/** The host's "Download": the original, photo or video, exactly as the guest sent it, as an attachment. */
export default defineEventHandler(async (event) => {
  const { ev } = await requireEventAccess(event, getRouterParam(event, 'id')!);
  const [row] = await useDb().select({ m: media, guestName: guests.name }).from(media)
    .leftJoin(guests, eq(guests.id, media.guestId))
    .where(and(eq(media.id, getRouterParam(event, 'mid')!), eq(media.eventId, ev.id)));
  if (!row || !['ready', 'hidden'].includes(row.m.status)) throw createError({ statusCode: 404 });
  const { m } = row;
  return sendRedirect(event, await presignGet(m.originalKey, 'private', { seconds: 300, filename: downloadName(m, extOf(m.originalKey), row.guestName) }));
});
